from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import io
import os
import json
import sqlite3
import hashlib
from typing import Optional, Dict, Any, List
from datetime import datetime
from contextlib import closing

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
DB_PATH = os.path.join(BASE_DIR, "data", "fitpredict.db")


model = None
label_encoder = None


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_database() -> None:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS prediction_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                data_json TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS completed_workouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                workout_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                completed_at TEXT NOT NULL,
                exercises_json TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS favorite_recipes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                recipe_id INTEGER NOT NULL,
                recipe_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(user_id, recipe_id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )

        conn.commit()


def hash_password(raw_password: str) -> str:
    return hashlib.sha256(raw_password.encode("utf-8")).hexdigest()

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

    ensure_database()

    
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


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class PredictionHistoryRequest(BaseModel):
    created_at: str
    data: Dict[str, Any]


class CompletedWorkoutRequest(BaseModel):
    workout_id: int
    name: str
    completed_at: str
    exercises: List[str]


class FavoriteRecipeRequest(BaseModel):
    recipe_id: int
    recipe: Dict[str, Any]



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


@app.post("/auth/register")
def register_user(payload: RegisterRequest) -> Dict[str, Any]:
    normalized_email = payload.email.strip().lower()
    if not normalized_email or not payload.password or not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name, email and password are required")

    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must have at least 6 characters")

    user_id = f"u_{int(datetime.utcnow().timestamp() * 1000)}"
    now = datetime.utcnow().isoformat()

    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        exists = cur.execute(
            "SELECT id FROM users WHERE email = ?",
            (normalized_email,)
        ).fetchone()

        if exists:
            raise HTTPException(status_code=409, detail="Account already exists")

        cur.execute(
            """
            INSERT INTO users(id, name, email, password_hash, created_at)
            VALUES(?, ?, ?, ?, ?)
            """,
            (user_id, payload.name.strip(), normalized_email, hash_password(payload.password), now)
        )
        conn.commit()

    return {
        "success": True,
        "message": "Account created successfully",
        "user": {
            "id": user_id,
            "name": payload.name.strip(),
            "email": normalized_email
        }
    }


@app.post("/auth/login")
def login_user(payload: LoginRequest) -> Dict[str, Any]:
    normalized_email = payload.email.strip().lower()

    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        user = cur.execute(
            """
            SELECT id, name, email, password_hash
            FROM users
            WHERE email = ?
            """,
            (normalized_email,)
        ).fetchone()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if user["password_hash"] != hash_password(payload.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "success": True,
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }


@app.get("/users/{user_id}/predictions")
def get_prediction_history(user_id: str) -> List[Dict[str, Any]]:
    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        rows = cur.execute(
            """
            SELECT id, created_at, data_json
            FROM prediction_history
            WHERE user_id = ?
            ORDER BY datetime(created_at) DESC
            """,
            (user_id,)
        ).fetchall()

    return [
        {
            "id": row["id"],
            "created_at": row["created_at"],
            "data": json.loads(row["data_json"])
        }
        for row in rows
    ]


@app.post("/users/{user_id}/predictions")
def save_prediction_history(user_id: str, payload: PredictionHistoryRequest) -> Dict[str, Any]:
    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO prediction_history(user_id, created_at, data_json)
            VALUES(?, ?, ?)
            """,
            (user_id, payload.created_at, json.dumps(payload.data))
        )
        inserted_id = cur.lastrowid
        conn.commit()

    return {"success": True, "id": inserted_id}


@app.delete("/users/{user_id}/predictions/{record_id}")
def delete_prediction_history(user_id: str, record_id: int) -> Dict[str, Any]:
    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM prediction_history WHERE id = ? AND user_id = ?",
            (record_id, user_id)
        )
        conn.commit()

    return {"success": True}


@app.get("/users/{user_id}/completed-workouts")
def get_completed_workouts(user_id: str) -> List[Dict[str, Any]]:
    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        rows = cur.execute(
            """
            SELECT id, workout_id, name, completed_at, exercises_json
            FROM completed_workouts
            WHERE user_id = ?
            ORDER BY datetime(completed_at) DESC
            """,
            (user_id,)
        ).fetchall()

    return [
        {
            "id": row["id"],
            "workout_id": row["workout_id"],
            "name": row["name"],
            "completed_at": row["completed_at"],
            "exercises": json.loads(row["exercises_json"])
        }
        for row in rows
    ]


@app.post("/users/{user_id}/completed-workouts")
def add_completed_workout(user_id: str, payload: CompletedWorkoutRequest) -> Dict[str, Any]:
    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO completed_workouts(user_id, workout_id, name, completed_at, exercises_json)
            VALUES(?, ?, ?, ?, ?)
            """,
            (user_id, payload.workout_id, payload.name, payload.completed_at, json.dumps(payload.exercises))
        )
        inserted_id = cur.lastrowid
        conn.commit()

    return {"success": True, "id": inserted_id}


@app.get("/users/{user_id}/favorite-recipes")
def get_favorite_recipes(user_id: str) -> List[Dict[str, Any]]:
    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        rows = cur.execute(
            """
            SELECT recipe_id, recipe_json
            FROM favorite_recipes
            WHERE user_id = ?
            ORDER BY datetime(created_at) DESC
            """,
            (user_id,)
        ).fetchall()

    return [json.loads(row["recipe_json"]) for row in rows]


@app.post("/users/{user_id}/favorite-recipes")
def add_favorite_recipe(user_id: str, payload: FavoriteRecipeRequest) -> Dict[str, Any]:
    now = datetime.utcnow().isoformat()

    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT OR REPLACE INTO favorite_recipes(user_id, recipe_id, recipe_json, created_at)
            VALUES(?, ?, ?, ?)
            """,
            (user_id, payload.recipe_id, json.dumps(payload.recipe), now)
        )
        conn.commit()

    return {"success": True}


@app.delete("/users/{user_id}/favorite-recipes/{recipe_id}")
def delete_favorite_recipe(user_id: str, recipe_id: int) -> Dict[str, Any]:
    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM favorite_recipes WHERE user_id = ? AND recipe_id = ?",
            (user_id, recipe_id)
        )
        conn.commit()

    return {"success": True}


@app.get("/recipes/likes")
def get_recipes_likes() -> Dict[str, int]:
    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        rows = cur.execute(
            """
            SELECT recipe_id, COUNT(*) AS likes_count
            FROM favorite_recipes
            GROUP BY recipe_id
            """
        ).fetchall()

    return {str(row["recipe_id"]): int(row["likes_count"]) for row in rows}


@app.get("/recipes/{recipe_id}/likes")
def get_recipe_likes(recipe_id: int) -> Dict[str, Any]:
    with closing(get_db_connection()) as conn:
        cur = conn.cursor()
        row = cur.execute(
            """
            SELECT COUNT(*) AS likes_count
            FROM favorite_recipes
            WHERE recipe_id = ?
            """,
            (recipe_id,)
        ).fetchone()

    return {"recipe_id": recipe_id, "likes": int(row["likes_count"]) if row else 0}



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
