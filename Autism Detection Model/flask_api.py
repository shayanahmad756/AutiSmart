"""
flask_api.py — REST microservice wrapping the ASD classifier model.

Exposes:
    POST /predict  — accepts a multipart image file, returns JSON prediction

Usage:
    python flask_api.py

Runs on port 5001. The Node.js backend proxies requests to this service.
"""

import io
import os
import sys

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "best_model.pth")

# ── Constants (must match training config in asd_classifier.py) ───────────────
CLASS_NAMES = ["autistic", "non_autistic"]
IMG_SIZE = 224
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "bmp"}

# ── Device ────────────────────────────────────────────────────────────────────
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[INFO] Using device: {device}")

# ── Inference transform (deterministic, same as validation in training) ────────
eval_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])


def build_model(num_classes: int = 2) -> torch.nn.Module:
    """Build MobileNetV2 with custom classifier head (matches training architecture)."""
    model = models.mobilenet_v2(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    return model


def load_model() -> torch.nn.Module:
    if not os.path.exists(MODEL_PATH):
        sys.exit(
            f"[ERROR] Model file not found: {MODEL_PATH}\n"
            "Train the model first: python asd_classifier.py"
        )
    model = build_model(num_classes=len(CLASS_NAMES))
    state = torch.load(MODEL_PATH, map_location=device)
    model.load_state_dict(state)
    model = model.to(device)
    model.eval()
    print(f"[INFO] Model loaded from: {MODEL_PATH}")
    return model


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def predict_image(model: torch.nn.Module, image_bytes: bytes):
    """Run inference on raw image bytes. Returns (label, confidence)."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = eval_transform(image).unsqueeze(0).to(device)  # shape: [1, 3, 224, 224]

    with torch.no_grad():
        logits = model(tensor)                                # [1, num_classes]
        probs = torch.softmax(logits, dim=1)[0]              # [num_classes]

    pred_idx = int(probs.argmax())
    label = CLASS_NAMES[pred_idx]
    confidence = float(probs[pred_idx])
    return label, confidence


# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
# Only allow requests from the Node.js backend
CORS(app, origins=["http://localhost:5000", "http://127.0.0.1:5000"])

# Load model once at startup (singleton)
print("[INFO] Loading model at startup...")
model = load_model()
print("[INFO] Model ready. Flask API starting...")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "device": str(device)}), 200


@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file field in request. Use multipart key 'file'."}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type. Send jpg, jpeg, png, gif, webp, or bmp."}), 400

    try:
        image_bytes = file.read()
        label, confidence = predict_image(model, image_bytes)

        return jsonify({
            "label": label,
            "confidence": round(confidence, 4),
            "confidence_percent": round(confidence * 100, 2),
        }), 200

    except Exception as exc:
        print(f"[ERROR] Prediction failed: {exc}")
        return jsonify({"error": "Prediction failed. Ensure the image is a valid photo."}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
