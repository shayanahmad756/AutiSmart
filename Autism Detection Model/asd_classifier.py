"""
ASD Facial Image Classification using Transfer Learning (MobileNetV2)
======================================================================
This script builds a binary image classifier to screen for Autism Spectrum
Disorder (ASD) based on facial images of children.

DISCLAIMER: This is a research/screening tool ONLY. It is NOT a medical
diagnosis system and should NOT replace professional clinical evaluation.

Dataset layout expected:
    train/
        autistic/
        non_autistic/
    valid/
        autistic/
        non_autistic/
    test/
        autistic/
        non_autistic/

Requirements:
    pip install torch torchvision scikit-learn matplotlib seaborn
    pip install grad-cam          # optional, for Grad-CAM visualisation
"""

# ============================================================
# SECTION 1 — Imports & Configuration
# ============================================================

import os
import copy
import time

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)

# ─── Hyper-parameters & Paths ─────────────────────────────────────────────────

# Root directory that contains train/, valid/, test/ sub-folders
DATA_DIR = os.path.dirname(os.path.abspath(__file__))

# Where the best model checkpoint will be saved
MODEL_SAVE_PATH = os.path.join(DATA_DIR, "best_model.pth")

IMG_SIZE   = 224      # MobileNetV2 expects 224×224 inputs
BATCH_SIZE = 32       # number of images processed per step
NUM_EPOCHS = 15       # training epochs
LR         = 1e-3     # Adam learning rate
NUM_WORKERS = 2       # DataLoader worker threads (set to 0 on Windows if errors appear)

# Class names must match sub-folder names (ImageFolder reads them alphabetically)
CLASS_NAMES = ["autistic", "non_autistic"]   # index 0 → autistic, 1 → non_autistic

# ImageNet normalisation statistics — required because MobileNetV2 was pre-trained on ImageNet
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

# ─── Device selection ─────────────────────────────────────────────────────────

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[INFO] Using device: {device}")


# ============================================================
# SECTION 2 — Dataset Loading & Augmentation
# ============================================================

def build_dataloaders(data_dir: str, batch_size: int, num_workers: int):
    """
    Create PyTorch DataLoaders for train, validation, and test splits.

    Training uses aggressive augmentation to improve generalisation.
    Validation and test use only deterministic pre-processing.

    Returns:
        dataloaders : dict  – keys "train", "valid", "test"
        dataset_sizes : dict – number of images per split
    """

    # ── Transforms ────────────────────────────────────────────────────────────

    train_transforms = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),         # mirror faces horizontally
        transforms.RandomRotation(degrees=15),           # slight head tilts
        transforms.ColorJitter(                          # lighting / contrast variation
            brightness=0.2, contrast=0.2, saturation=0.1
        ),
        transforms.ToTensor(),                           # HWC uint8 → CHW float [0,1]
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])

    eval_transforms = transforms.Compose([
        transforms.Resize(256),                          # slightly larger before crop
        transforms.CenterCrop(IMG_SIZE),                 # deterministic centre crop
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])

    # ── ImageFolder automatically reads sub-folder names as class labels ───────

    image_datasets = {
        "train": datasets.ImageFolder(
            root=os.path.join(data_dir, "train"), transform=train_transforms
        ),
        "valid": datasets.ImageFolder(
            root=os.path.join(data_dir, "valid"), transform=eval_transforms
        ),
        "test": datasets.ImageFolder(
            root=os.path.join(data_dir, "test"),  transform=eval_transforms
        ),
    }

    dataloaders = {
        split: DataLoader(
            ds,
            batch_size=batch_size,
            shuffle=(split == "train"),   # only shuffle training data
            num_workers=num_workers,
            pin_memory=(device.type == "cuda"),   # faster GPU transfer
        )
        for split, ds in image_datasets.items()
    }

    dataset_sizes = {split: len(ds) for split, ds in image_datasets.items()}

    # Print a quick summary
    for split, size in dataset_sizes.items():
        print(f"[INFO] {split:>6} split: {size} images  |  classes: {image_datasets[split].classes}")

    return dataloaders, dataset_sizes, image_datasets["train"].classes


# ============================================================
# SECTION 3 — Model Definition
# ============================================================

def build_model(num_classes: int = 2, freeze_base: bool = True) -> nn.Module:
    """
    Load a MobileNetV2 pre-trained on ImageNet and adapt it for binary
    ASD classification.

    Transfer learning strategy:
        - Keep the convolutional feature extractor (frozen) — it already
          understands edges, textures, and facial features.
        - Replace only the final linear layer so the network outputs
          num_classes logits.

    Args:
        num_classes  : 2 for binary (autistic / non_autistic)
        freeze_base  : if True, gradients are disabled for all but the
                       new classifier layer — speeds up training significantly.

    Returns:
        model : nn.Module ready to be moved to device
    """

    # Load pre-trained weights from torchvision model zoo
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)

    if freeze_base:
        # Freeze every parameter in the feature extractor
        for param in model.features.parameters():
            param.requires_grad = False

    # MobileNetV2's classifier is Sequential([Dropout, Linear(1280, 1000)])
    # We replace the Linear head with our own 2-class head
    in_features = model.classifier[1].in_features   # 1280
    model.classifier[1] = nn.Linear(in_features, num_classes)

    print(f"[INFO] MobileNetV2 loaded  |  head: Linear({in_features}, {num_classes})")
    print(f"[INFO] Base layers frozen : {freeze_base}")

    return model


# ============================================================
# SECTION 4 — Training Loop
# ============================================================

def train_model(
    model,
    dataloaders,
    dataset_sizes,
    criterion,
    optimizer,
    num_epochs: int,
    save_path: str,
):
    """
    Train the model and evaluate on the validation set after every epoch.
    Saves the weights that achieved the best validation accuracy.

    Returns:
        model        : the best-val-accuracy version of the model
        history      : dict containing lists of loss/accuracy per epoch
    """

    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}

    best_weights = copy.deepcopy(model.state_dict())
    best_val_acc = 0.0

    print("\n" + "=" * 60)
    print("Training started")
    print("=" * 60)

    total_start = time.time()

    for epoch in range(1, num_epochs + 1):
        epoch_start = time.time()
        print(f"\nEpoch {epoch}/{num_epochs}")
        print("-" * 40)

        # Each epoch has a training phase followed by a validation phase
        for phase in ("train", "valid"):
            if phase == "train":
                model.train()   # enable dropout / batch-norm training mode
            else:
                model.eval()    # disable dropout; use running stats for BN

            running_loss    = 0.0
            running_correct = 0

            for images, labels in dataloaders[phase]:
                images = images.to(device)
                labels = labels.to(device)

                # Zero gradients at the start of every batch
                optimizer.zero_grad()

                # Forward pass — only compute gradients during training
                with torch.set_grad_enabled(phase == "train"):
                    outputs = model(images)           # shape: (batch, 2)
                    _, preds = torch.max(outputs, 1)  # predicted class index
                    loss = criterion(outputs, labels)

                    # Backward pass and weight update only in training phase
                    if phase == "train":
                        loss.backward()
                        optimizer.step()

                running_loss    += loss.item() * images.size(0)
                running_correct += (preds == labels).sum().item()

            # Compute epoch-level metrics
            epoch_loss = running_loss    / dataset_sizes[phase]
            epoch_acc  = running_correct / dataset_sizes[phase]

            tag = "train" if phase == "train" else "val"
            history[f"{tag}_loss"].append(epoch_loss)
            history[f"{tag}_acc"].append(epoch_acc)

            print(f"  {phase:>6} | loss: {epoch_loss:.4f} | acc: {epoch_acc:.4f}")

            # Save the best model based on validation accuracy
            if phase == "valid" and epoch_acc > best_val_acc:
                best_val_acc = epoch_acc
                best_weights = copy.deepcopy(model.state_dict())
                torch.save(best_weights, save_path)
                print(f"  ✓ New best val_acc={best_val_acc:.4f} — model saved")

        elapsed = time.time() - epoch_start
        print(f"  Epoch time: {elapsed:.1f}s")

    total_elapsed = time.time() - total_start
    print("\n" + "=" * 60)
    print(f"Training complete in {total_elapsed/60:.1f} min")
    print(f"Best validation accuracy: {best_val_acc:.4f}")
    print("=" * 60)

    # Restore the best weights before returning
    model.load_state_dict(best_weights)
    return model, history


# ============================================================
# SECTION 5 — Evaluation on Test Set
# ============================================================

def evaluate_model(model, dataloader, class_names):
    """
    Run the model on the test split and print a full classification report.
    Also renders a confusion matrix heatmap.

    Args:
        model       : trained nn.Module (should already be on `device`)
        dataloader  : DataLoader for the test split
        class_names : list of string labels, e.g. ["autistic", "non_autistic"]
    """

    model.eval()

    all_preds  = []
    all_labels = []

    with torch.no_grad():
        for images, labels in dataloader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())

    all_preds  = np.array(all_preds)
    all_labels = np.array(all_labels)

    # ── Metrics ───────────────────────────────────────────────────────────────

    acc       = accuracy_score(all_labels, all_preds)
    precision = precision_score(all_labels, all_preds, average="weighted", zero_division=0)
    recall    = recall_score(all_labels, all_preds, average="weighted", zero_division=0)
    f1        = f1_score(all_labels, all_preds, average="weighted", zero_division=0)

    print("\n" + "=" * 60)
    print("Test Set Evaluation")
    print("=" * 60)
    print(f"  Accuracy  : {acc:.4f}")
    print(f"  Precision : {precision:.4f}")
    print(f"  Recall    : {recall:.4f}")
    print(f"  F1-Score  : {f1:.4f}")
    print("\nDetailed Classification Report:")
    print(classification_report(all_labels, all_preds, target_names=class_names))

    # ── Confusion Matrix ──────────────────────────────────────────────────────

    cm = confusion_matrix(all_labels, all_preds)

    plt.figure(figsize=(6, 5))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=class_names,
        yticklabels=class_names,
    )
    plt.title("Confusion Matrix — Test Set")
    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")
    plt.tight_layout()
    cm_path = os.path.join(DATA_DIR, "confusion_matrix.png")
    plt.savefig(cm_path, dpi=150)
    print(f"\n[INFO] Confusion matrix saved → {cm_path}")
    plt.show()

    return {"accuracy": acc, "precision": precision, "recall": recall, "f1": f1}


# ============================================================
# SECTION 6 — Training Curves Visualisation
# ============================================================

def plot_history(history: dict, save_dir: str):
    """
    Plot training vs. validation accuracy and loss curves side by side.
    Saves the figure to save_dir/training_curves.png.

    Args:
        history  : dict returned by train_model()
        save_dir : directory where the PNG is saved
    """

    epochs = range(1, len(history["train_acc"]) + 1)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # ── Accuracy subplot ──────────────────────────────────────────────────────
    axes[0].plot(epochs, history["train_acc"], "b-o", label="Train Accuracy")
    axes[0].plot(epochs, history["val_acc"],   "r-o", label="Val Accuracy")
    axes[0].set_title("Accuracy per Epoch")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Accuracy")
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    # ── Loss subplot ──────────────────────────────────────────────────────────
    axes[1].plot(epochs, history["train_loss"], "b-o", label="Train Loss")
    axes[1].plot(epochs, history["val_loss"],   "r-o", label="Val Loss")
    axes[1].set_title("Loss per Epoch")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Loss")
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)

    plt.suptitle("MobileNetV2 — ASD Classification Training Curves", fontsize=14)
    plt.tight_layout()

    curve_path = os.path.join(save_dir, "training_curves.png")
    plt.savefig(curve_path, dpi=150)
    print(f"[INFO] Training curves saved → {curve_path}")
    plt.show()


# ============================================================
# SECTION 7 — Prediction Function
# ============================================================

def predict(image_path: str, model: nn.Module, class_names: list) -> tuple:
    """
    Predict the class of a single facial image.

    Args:
        image_path  : absolute or relative path to the image file
        model       : trained nn.Module (weights loaded, on correct device)
        class_names : list of class label strings

    Returns:
        (predicted_label : str, confidence : float)
        e.g. ("autistic", 0.9231)
    """

    # Apply the same deterministic transforms used during validation
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])

    # Load and convert to RGB (handles PNG with alpha channels, greyscale, etc.)
    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(device)   # add batch dimension → (1, C, H, W)

    model.eval()
    with torch.no_grad():
        logits = model(tensor)                              # raw scores shape (1, 2)
        probs  = torch.softmax(logits, dim=1)               # convert to probabilities
        confidence, predicted_idx = torch.max(probs, dim=1)

    label      = class_names[predicted_idx.item()]
    confidence = confidence.item()

    return label, confidence


# ============================================================
# SECTION 8 — Grad-CAM Visualisation (Optional)
# ============================================================

def visualize_gradcam(image_path: str, model: nn.Module, class_names: list):
    """
    Overlay a Grad-CAM heatmap on the input image to show which facial
    regions most influenced the model's prediction.

    Requires:  pip install grad-cam

    Args:
        image_path  : path to the image file
        model       : trained model (on device)
        class_names : list of class label strings
    """

    try:
        from pytorch_grad_cam import GradCAM
        from pytorch_grad_cam.utils.image import show_cam_on_image
        from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
    except ImportError:
        print("[WARN] grad-cam not installed. Run: pip install grad-cam")
        return

    # ── Target layer: last convolutional block in MobileNetV2 ─────────────────
    target_layer = [model.features[-1]]

    # ── Load & pre-process image ──────────────────────────────────────────────
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])

    pil_image = Image.open(image_path).convert("RGB")
    input_tensor = transform(pil_image).unsqueeze(0).to(device)

    # RGB array in [0,1] for overlay (no normalisation, just scaled)
    raw_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(IMG_SIZE),
        transforms.ToTensor(),
    ])
    rgb_array = raw_transform(pil_image).permute(1, 2, 0).numpy()  # HWC

    # ── Compute prediction and Grad-CAM ───────────────────────────────────────
    model.eval()
    with GradCAM(model=model, target_layers=target_layer) as cam:
        # None → target the class with the highest score automatically
        grayscale_cam = cam(
            input_tensor=input_tensor,
            targets=None,
        )[0]   # shape (H, W)

    # Overlay the heatmap on the original image
    visualization = show_cam_on_image(rgb_array, grayscale_cam, use_rgb=True)

    # ── Get prediction label for the title ────────────────────────────────────
    label, confidence = predict(image_path, model, class_names)

    # ── Plot ──────────────────────────────────────────────────────────────────
    fig, axes = plt.subplots(1, 2, figsize=(10, 5))
    axes[0].imshow(pil_image.resize((IMG_SIZE, IMG_SIZE)))
    axes[0].set_title("Original Image")
    axes[0].axis("off")

    axes[1].imshow(visualization)
    axes[1].set_title(f"Grad-CAM  |  Pred: {label} ({confidence:.1%})")
    axes[1].axis("off")

    plt.suptitle("Grad-CAM — Influential Facial Regions", fontsize=13)
    plt.tight_layout()

    cam_path = os.path.join(DATA_DIR, "gradcam_output.png")
    plt.savefig(cam_path, dpi=150)
    print(f"[INFO] Grad-CAM visualisation saved → {cam_path}")
    plt.show()


# ============================================================
# SECTION 9 — Main Entry Point
# ============================================================

def main():
    # ── Step 1: Load data ─────────────────────────────────────────────────────
    print("\n[STEP 1] Loading datasets...")
    dataloaders, dataset_sizes, class_names = build_dataloaders(
        DATA_DIR, BATCH_SIZE, NUM_WORKERS
    )
    print(f"[INFO] Detected classes: {class_names}")

    # ── Step 2: Build model ───────────────────────────────────────────────────
    print("\n[STEP 2] Building model...")
    model = build_model(num_classes=len(class_names), freeze_base=True)
    model = model.to(device)

    # ── Step 3: Define loss and optimiser ────────────────────────────────────
    # CrossEntropyLoss expects integer class indices (not one-hot) and raw logits
    criterion = nn.CrossEntropyLoss()

    # Only pass parameters that require gradients (i.e. the new head)
    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = optim.Adam(trainable_params, lr=LR)

    # ── Step 4: Train ─────────────────────────────────────────────────────────
    print("\n[STEP 3] Training...")
    model, history = train_model(
        model,
        dataloaders,
        dataset_sizes,
        criterion,
        optimizer,
        num_epochs=NUM_EPOCHS,
        save_path=MODEL_SAVE_PATH,
    )

    # ── Step 5: Plot learning curves ─────────────────────────────────────────
    print("\n[STEP 4] Plotting training curves...")
    plot_history(history, DATA_DIR)

    # ── Step 6: Evaluate on test set ──────────────────────────────────────────
    print("\n[STEP 5] Evaluating on test set...")
    evaluate_model(model, dataloaders["test"], class_names)

    # ── Step 7: Example single-image prediction ───────────────────────────────
    print("\n[STEP 6] Running example prediction...")

    # Pick the first image from the test/autistic folder as a demo
    test_autistic_dir = os.path.join(DATA_DIR, "test", "autistic")
    sample_images = [
        f for f in os.listdir(test_autistic_dir)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]

    if sample_images:
        sample_path = os.path.join(test_autistic_dir, sample_images[0])
        label, confidence = predict(sample_path, model, class_names)
        print(f"  Image      : {sample_images[0]}")
        print(f"  Prediction : {label}")
        print(f"  Confidence : {confidence:.2%}")
    else:
        print("[WARN] No test images found for demo prediction.")

    # ── Step 8 (Optional): Grad-CAM ───────────────────────────────────────────
    if sample_images:
        print("\n[STEP 7] Generating Grad-CAM visualisation (requires grad-cam package)...")
        visualize_gradcam(sample_path, model, class_names)

    print("\n[DONE] All steps completed.")
    print(f"       Best model saved at: {MODEL_SAVE_PATH}")


# ============================================================
# Run
# ============================================================

if __name__ == "__main__":
    main()
