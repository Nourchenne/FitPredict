from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import io
import os

app = FastAPI(title="Obesity Level Prediction API")

# Enable CORS (for Angular later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # later you can restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths (adapted to your project)
MODEL_PATH = "models/best_model_latest.pkl"
LABEL_ENCODER_PATH = "data/processed/label_encoder.pkl"

model = None
label_encoder = None

# Load artifacts on startup
@app.on_event("startup")
def load_artifacts():
    global model, label_encoder

    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
    else:
        model = None

    if os.path.exists(LABEL_ENCODER_PATH):
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
    else:
        label_encoder = None


# ----------- Input schema (UCI Obesity dataset) -----------
class ObesityData(BaseModel):
    Gender: str
    Age: float
    Height: float
    Weight: float
    family_history_with_overweight: str
    FAVC: str
    FCVC: float
    NCP: float
    CAEC: str
    SMOKE: str
    CH2O: float
    SCC: str
    FAF: float
    TUE: float
    CALC: str
    MTRANS: str


@app.get("/health")
def health_check():
    """
    Health check endpoint to ensure API is running and model is loaded.
    """
    return {
        "status": "ok" if model else "degraded",
        "model_loaded": bool(model),
        "label_encoder_loaded": bool(label_encoder)
    }


@app.post("/predict")
def predict_obesity(data: ObesityData):
    """
    Real-time prediction for a single person (multi-class).
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model pipeline not available")

    input_df = pd.DataFrame([data.model_dump()])

    # class id prediction (encoded)
    pred_id = int(model.predict(input_df)[0])

    # Decode to original label if possible
    if label_encoder is not None:
        pred_label = label_encoder.inverse_transform([pred_id])[0]
    else:
        pred_label = str(pred_id)

    # Probabilities (if available)
    proba = None
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(input_df)[0]
        proba = float(probs[pred_id])  # probability of predicted class

    return {
        "predicted_class": str(pred_label),
        "predicted_class_id": pred_id,
        "predicted_probability": proba
    }


@app.post("/predict_batch")
async def predict_batch(file: UploadFile = File(...)):
    """
    Batch prediction endpoint expecting a CSV file.
    Returns the input CSV with 2 new columns:
    - Predicted_Class
    - Predicted_Probability (optional)
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model pipeline not available")

    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))

        required_cols = [
            "Gender", "Age", "Height", "Weight",
            "family_history_with_overweight", "FAVC", "FCVC", "NCP", "CAEC",
            "SMOKE", "CH2O", "SCC", "FAF", "TUE", "CALC", "MTRANS"
        ]

        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"CSV missing required columns: {missing}"
            )

        # Predict
        pred_ids = model.predict(df).astype(int)

        if label_encoder is not None:
            pred_labels = label_encoder.inverse_transform(pred_ids)
        else:
            pred_labels = pred_ids.astype(str)

        df["Predicted_Class"] = pred_labels

        # Probabilities (if available)
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(df)
            df["Predicted_Probability"] = [float(probs[i, pred_ids[i]]) for i in range(len(pred_ids))]
        else:
            df["Predicted_Probability"] = None

        return df.to_dict(orient="records")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
