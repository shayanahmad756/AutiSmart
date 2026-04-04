"""
Flask microservice for ViT-B/16 autism binary classification.
Matches the exact architecture and transforms used in the training notebook.

Expected model file: best_vit_b16.pth (in the same directory as this script)
Port: 5001  (matches backend FLASK_URL default: http://localhost:5001)

Response format:
    { "label": "autistic" | "non_autistic", "confidence": float }
"""

import io
import os
import sys

import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from PIL import Image
from flask import Flask, request, jsonify

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best_vit_b16.pth")
CLASS_NAMES = ["autistic", "non_autistic"]   # matches sklearn LabelEncoder alphabetical order
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
PORT = int(os.environ.get("FLASK_PORT", 5001))

# ---------------------------------------------------------------------------
# Transform – identical to val_test_transform_cnn used in the notebook
# ---------------------------------------------------------------------------
INFERENCE_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.ConvertImageDtype(torch.float),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------
def load_model(path: str) -> nn.Module:
    if not os.path.isfile(path):
        print(f"[ERROR] Model file not found: {path}", file=sys.stderr)
        print(
            "[ERROR] Download best_vit_b16.pth from your Kaggle notebook output "
            "and place it in the 'Autismart ML' folder.",
            file=sys.stderr,
        )
        sys.exit(1)

    # Rebuild the same architecture used in training
    model = models.vit_b_16(weights=None)
    num_features = model.heads.head.in_features
    model.heads.head = nn.Linear(num_features, len(CLASS_NAMES))

    # weights_only=False required for .pth files saved with PyTorch < 2.6
    state_dict = torch.load(path, map_location=DEVICE, weights_only=False)
    model.load_state_dict(state_dict)
    model.to(DEVICE)
    model.eval()
    print(f"[INFO] Loaded model from {path} on {DEVICE}")
    return model


MODEL = load_model(MODEL_PATH)

# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------
app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "device": str(DEVICE)}), 200


@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file field in request. Send the image as multipart/form-data with field name 'file'."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename. Please attach an image file."}), 400

    try:
        img_bytes = file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception:
        return jsonify({"error": "Could not decode image. Make sure you are sending a valid JPEG/PNG file."}), 400

    tensor = INFERENCE_TRANSFORM(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = MODEL(tensor)                          # shape: (1, 2)
        probabilities = torch.softmax(logits, dim=1)   # normalised to [0, 1]
        confidence, predicted_idx = torch.max(probabilities, dim=1)

    label = CLASS_NAMES[predicted_idx.item()]
    confidence_value = round(confidence.item(), 4)

    return jsonify({"label": label, "confidence": confidence_value}), 200


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print(f"[INFO] Starting Flask API on port {PORT}...")
    app.run(host="0.0.0.0", port=PORT, debug=False)
