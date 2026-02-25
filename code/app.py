from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import io
import os
from typing import Optional, Dict, Any, List

app = FastAPI(title="Obesity Level Prediction API", version="1.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "best_model_latest.pkl")
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, "data", "processed", "label_encoder.pkl")


model = None
label_encoder = None

# Colonnes attendues
REQUIRED_COLS: List[str] = [
    "Gender", "Age", "Height", "Weight",
    "family_history_with_overweight", "FAVC", "FCVC", "NCP", "CAEC",
    "SMOKE", "CH2O", "SCC", "FAF", "TUE", "CALC", "MTRANS"
]


# Load -
@app.on_event("startup")
def load_artifacts() -> None:
    """
    Charge le modèle ML (pipeline) et le label encoder au démarrage.
    """
    global model, label_encoder

    
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
    else:
        model = None
        print(f"[WARN] Model not found at: {MODEL_PATH}")

    # Charger label encoder
    if os.path.exists(LABEL_ENCODER_PATH):
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
    else:
        label_encoder = None
        print(f"[WARN] Label encoder not found at: {LABEL_ENCODER_PATH}")



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
def health_check() -> Dict[str, Any]:
    """
    Vérifie si l'API est up et si les artefacts sont chargés.
    """
    return {
        "status": "ok" if model else "degraded",
        "model_loaded": bool(model),
        "label_encoder_loaded": bool(label_encoder),
    }



@app.get("/model_info")
def model_info() -> Dict[str, Any]:
    """
    Retourne des infos utiles sur le modèle chargé.
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")

    info: Dict[str, Any] = {
        "model_loaded": True,
        "model_type": type(model).__name__,
        "supports_predict_proba": hasattr(model, "predict_proba"),
        "label_encoder_loaded": bool(label_encoder),
        "required_columns": REQUIRED_COLS,
        "model_path": MODEL_PATH,
        "label_encoder_path": LABEL_ENCODER_PATH,
    }

    # Certains modèles sklearn exposent classes_
    if hasattr(model, "classes_"):
        try:
            classes = list(model.classes_)
            info["num_classes"] = len(classes)
            info["classes"] = classes
        except Exception:
            pass

    return info



@app.post("/predict")
def predict_obesity(data: ObesityData) -> Dict[str, Any]:
    """
    Prédiction temps réel pour une seule personne.
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model pipeline not available")

    # Convertir l'entrée en DataFrame (1 ligne)
    input_df = pd.DataFrame([data.model_dump()])

    # Vérifier que toutes les colonnes attendues sont là (sécurité)
    missing = [c for c in REQUIRED_COLS if c not in input_df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {missing}")

    # Predire classe encodée (id)
    pred_id = int(model.predict(input_df)[0])

    if label_encoder is not None:
        try:
            pred_label = label_encoder.inverse_transform([pred_id])[0]
        except Exception:
            pred_label = str(pred_id)
    else:
        pred_label = str(pred_id)

    proba: Optional[float] = None
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(input_df)[0]

        if hasattr(model, "classes_"):
            class_list = list(model.classes_)
            if pred_id in class_list:
                idx = class_list.index(pred_id)
                proba = float(probs[idx])
            else:
                if 0 <= pred_id < len(probs):
                    proba = float(probs[pred_id])
        else:
            if 0 <= pred_id < len(probs):
                proba = float(probs[pred_id])

    return {
        "prediction_id": pred_id,
        "prediction_label": str(pred_label),
        "probability": proba,
        "status": "success",
    }



@app.post("/predict_batch")
async def predict_batch(file: UploadFile = File(...)) -> List[Dict[str, Any]]:
    """
    Prédictions batch à partir d'un CSV.
    Retourne une liste d'objets JSON (une ligne = un dict) avec:
    - Predicted_Class
    - Predicted_Probability (si disponible)
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model pipeline not available")

    # Vérif type fichier (optionnel mais recommandé)
    if file.content_type not in (None, "text/csv", "application/vnd.ms-excel"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")

    try:
        content = await file.read()

        # Lire CSV depuis mémoire
        df = pd.read_csv(io.BytesIO(content))

        # Vérifier colonnes requises
        missing = [c for c in REQUIRED_COLS if c not in df.columns]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"CSV missing required columns: {missing}"
            )

        pred_ids = model.predict(df)

        try:
            pred_ids = pred_ids.astype(int)
        except Exception:
            pred_ids = pd.Series(pred_ids)

        if label_encoder is not None:
            try:
                pred_labels = label_encoder.inverse_transform(pred_ids)
            except Exception:
                pred_labels = pred_ids.astype(str)
        else:
            pred_labels = pred_ids.astype(str)

        df["Predicted_Class"] = pred_labels

        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(df)

            if hasattr(model, "classes_"):
                classes = list(model.classes_)
                proba_list = []
                for i in range(len(df)):
                    pid = int(pred_ids[i])
                    if pid in classes:
                        idx = classes.index(pid)
                        proba_list.append(float(probs[i][idx]))
                    else:
                        proba_list.append(None)
                df["Predicted_Probability"] = proba_list
            else:
                df["Predicted_Probability"] = [
                    float(probs[i, int(pred_ids[i])]) if 0 <= int(pred_ids[i]) < probs.shape[1] else None
                    for i in range(len(df))
                ]
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
