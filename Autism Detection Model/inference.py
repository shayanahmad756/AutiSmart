"""
inference.py — Load saved best_model.pth and evaluate on the test set.
No training is performed.

Usage:
    python inference.py                          # evaluate + demo prediction
    python inference.py --image path/to/img.jpg  # predict a custom image only
"""

import argparse
import os
import sys

import torch

# Reuse all helpers from the main classifier script
from asd_classifier import (
    build_dataloaders,
    build_model,
    evaluate_model,
    predict,
    visualize_gradcam,
    DATA_DIR,
    MODEL_SAVE_PATH,
    BATCH_SIZE,
    NUM_WORKERS,
    CLASS_NAMES,
    device,
)


def load_model(model_path: str) -> torch.nn.Module:
    if not os.path.exists(model_path):
        sys.exit(
            f"[ERROR] Model file not found: {model_path}\n"
            "Train the model first by running:  python asd_classifier.py"
        )

    # freeze_base=False so all parameters are created; we then load saved weights
    model = build_model(num_classes=len(CLASS_NAMES), freeze_base=False)
    state = torch.load(model_path, map_location=device)
    model.load_state_dict(state)
    model = model.to(device)
    model.eval()
    print(f"[INFO] Loaded weights from: {model_path}")
    return model


def main():
    parser = argparse.ArgumentParser(description="ASD classifier — inference only")
    parser.add_argument(
        "--image", "-i",
        type=str,
        default=None,
        help="Path to a single image file for prediction. "
             "If omitted, the full test-set evaluation is run instead.",
    )
    parser.add_argument(
        "--gradcam",
        action="store_true",
        help="Show Grad-CAM heatmap for the predicted image (requires: pip install grad-cam).",
    )
    args = parser.parse_args()

    model = load_model(MODEL_SAVE_PATH)

    # ── Single-image prediction mode ──────────────────────────────────────────
    if args.image:
        if not os.path.exists(args.image):
            sys.exit(f"[ERROR] Image not found: {args.image}")

        label, confidence = predict(args.image, model, CLASS_NAMES)
        print("\n" + "=" * 40)
        print("  Prediction Result")
        print("=" * 40)
        print(f"  Image      : {args.image}")
        print(f"  Prediction : {label}")
        print(f"  Confidence : {confidence:.2%}")
        print("=" * 40)

        if args.gradcam:
            visualize_gradcam(args.image, model, CLASS_NAMES)
        return

    # ── Full test-set evaluation mode ─────────────────────────────────────────
    print("\n[INFO] Loading test dataset...")
    dataloaders, dataset_sizes, class_names = build_dataloaders(
        DATA_DIR, BATCH_SIZE, NUM_WORKERS
    )
    print(f"[INFO] Test images: {dataset_sizes['test']}")

    evaluate_model(model, dataloaders["test"], class_names)

    # ── Demo single-image prediction ──────────────────────────────────────────
    test_autistic_dir = os.path.join(DATA_DIR, "test", "autistic")
    samples = [
        f for f in os.listdir(test_autistic_dir)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ]

    if samples:
        sample_path = os.path.join(test_autistic_dir, samples[0])
        print("\n[INFO] Demo prediction on:", samples[0])
        label, confidence = predict(sample_path, model, CLASS_NAMES)
        print(f"  Prediction : {label}")
        print(f"  Confidence : {confidence:.2%}")

        if args.gradcam:
            visualize_gradcam(sample_path, model, CLASS_NAMES)

    print("\n[DONE]")


if __name__ == "__main__":
    main()
