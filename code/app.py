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
import re
import requests
from typing import Optional, Dict, Any, List
from collections import Counter
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
RAG_SOURCES_DIR = os.path.join(BASE_DIR, "rag_sources")
FITCHAT_NAME = "FitChat"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
LLM_TIMEOUT_SECONDS = int(os.getenv("LLM_TIMEOUT_SECONDS", "45"))
RAG_DOC_FILES: List[str] = [
    "README.md",
    "FRONTEND_IMPLEMENTATION.md",
    "walkthrough.md",
    "reports/README_OUTPUTS.md",
    "Archives/Project instructions.txt",
]


model = None
label_encoder = None
rag_chunks: List[Dict[str, Any]] = []


def _ensure_rag_sources_dir() -> None:
    os.makedirs(RAG_SOURCES_DIR, exist_ok=True)


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


def _tokenize(text: str) -> List[str]:
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    tokens = [t for t in cleaned.split() if len(t) > 2]
    return tokens


def _chunk_text(text: str, chunk_size: int = 650, overlap: int = 120) -> List[str]:
    normalized = " ".join(text.split())
    if not normalized:
        return []

    if len(normalized) <= chunk_size:
        return [normalized]

    chunks: List[str] = []
    start = 0
    text_length = len(normalized)

    while start < text_length:
        end = min(start + chunk_size, text_length)
        chunk = normalized[start:end]

        if end < text_length:
            last_period = chunk.rfind(". ")
            if last_period > int(chunk_size * 0.5):
                end = start + last_period + 1
                chunk = normalized[start:end]

        chunks.append(chunk.strip())

        if end >= text_length:
            break

        start = max(end - overlap, start + 1)

    return chunks


def _read_text_file(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        with open(path, "r", encoding="latin-1") as f:
            return f.read()
    except Exception:
        return ""


def build_rag_corpus() -> None:
    global rag_chunks

    chunks: List[Dict[str, Any]] = []
    for rel_path in RAG_DOC_FILES:
        abs_path = os.path.join(BASE_DIR, rel_path)
        if not os.path.exists(abs_path):
            continue

        raw = _read_text_file(abs_path)
        if not raw.strip():
            continue

        for idx, chunk in enumerate(_chunk_text(raw), start=1):
            token_counts = Counter(_tokenize(chunk))
            if not token_counts:
                continue

            chunks.append(
                {
                    "source": rel_path,
                    "chunk_id": idx,
                    "content": chunk,
                    "token_counts": token_counts,
                }
            )

    _ensure_rag_sources_dir()
    for file_name in sorted(os.listdir(RAG_SOURCES_DIR)):
        file_path = os.path.join(RAG_SOURCES_DIR, file_name)
        if not os.path.isfile(file_path):
            continue

        if file_name.lower().startswith("readme"):
            continue

        allowed_extensions = (".txt", ".md", ".csv", ".json")
        if not file_name.lower().endswith(allowed_extensions):
            continue

        raw = _read_text_file(file_path)
        if not raw.strip():
            continue

        source_name = f"rag_sources/{file_name}"
        for idx, chunk in enumerate(_chunk_text(raw), start=1):
            token_counts = Counter(_tokenize(chunk))
            if not token_counts:
                continue

            chunks.append(
                {
                    "source": source_name,
                    "chunk_id": idx,
                    "content": chunk,
                    "token_counts": token_counts,
                }
            )

    if not chunks:
        chunks.append(
            {
                "source": "system:fallback",
                "chunk_id": 1,
                "content": "FitPredict helps with obesity prediction, workouts and healthy recipes.",
                "token_counts": Counter(_tokenize("FitPredict helps with obesity prediction workouts and healthy recipes")),
            }
        )

    rag_chunks = chunks


def _fetch_user_context_chunks(user_id: Optional[str]) -> List[Dict[str, Any]]:
    if not user_id:
        return []

    context_chunks: List[Dict[str, Any]] = []

    with closing(get_db_connection()) as conn:
        cur = conn.cursor()

        predictions = cur.execute(
            """
            SELECT created_at, data_json
            FROM prediction_history
            WHERE user_id = ?
            ORDER BY datetime(created_at) DESC
            LIMIT 5
            """,
            (user_id,),
        ).fetchall()

        if predictions:
            payload = []
            for row in predictions:
                try:
                    parsed = json.loads(row["data_json"])
                except Exception:
                    parsed = {"raw": row["data_json"]}

                prediction_value = parsed.get("prediction_label") or parsed.get("prediction_id")
                if prediction_value is None and isinstance(parsed, dict):
                    prediction_value = "recorded"

                payload.append(
                    {
                        "date": row["created_at"],
                        "prediction": prediction_value,
                    }
                )

            compact = ", ".join(
                [f"{item['date']} ({item['prediction']})" for item in payload[:5]]
            )
            text = f"User recent prediction timeline: {compact}."
            context_chunks.append(
                {
                    "source": f"user:{user_id}:prediction_history",
                    "chunk_id": 1,
                    "content": text,
                    "token_counts": Counter(_tokenize(text)),
                }
            )

        workouts = cur.execute(
            """
            SELECT name, completed_at, exercises_json
            FROM completed_workouts
            WHERE user_id = ?
            ORDER BY datetime(completed_at) DESC
            LIMIT 5
            """,
            (user_id,),
        ).fetchall()

        if workouts:
            payload = []
            for row in workouts:
                try:
                    exercises = json.loads(row["exercises_json"])
                except Exception:
                    exercises = []

                payload.append(
                    {
                        "name": row["name"],
                        "date": row["completed_at"],
                        "exercise_count": len(exercises),
                    }
                )

            compact = ", ".join(
                [f"{item['name']} on {item['date']} ({item['exercise_count']} exercises)" for item in payload[:5]]
            )
            text = f"User recent completed workouts: {compact}."
            context_chunks.append(
                {
                    "source": f"user:{user_id}:completed_workouts",
                    "chunk_id": 1,
                    "content": text,
                    "token_counts": Counter(_tokenize(text)),
                }
            )

        favorite_recipes = cur.execute(
            """
            SELECT recipe_json
            FROM favorite_recipes
            WHERE user_id = ?
            ORDER BY datetime(created_at) DESC
            LIMIT 5
            """,
            (user_id,),
        ).fetchall()

        if favorite_recipes:
            payload = []
            for row in favorite_recipes:
                try:
                    parsed_recipe = json.loads(row["recipe_json"])
                    if isinstance(parsed_recipe, dict):
                        payload.append(parsed_recipe.get("name", "recipe"))
                    else:
                        payload.append("recipe")
                except Exception:
                    payload.append("recipe")

            compact = ", ".join(payload[:8])
            text = f"User favorite recipes include: {compact}."
            context_chunks.append(
                {
                    "source": f"user:{user_id}:favorite_recipes",
                    "chunk_id": 1,
                    "content": text,
                    "token_counts": Counter(_tokenize(text)),
                }
            )

    return context_chunks


def _score_chunk(query_tokens: Counter, chunk_tokens: Counter, query_text: str, chunk_text: str) -> float:
    if not query_tokens or not chunk_tokens:
        return 0.0

    lexical_overlap = sum(min(freq, chunk_tokens.get(token, 0)) for token, freq in query_tokens.items())
    normalized_overlap = lexical_overlap / max(1, sum(query_tokens.values()))

    phrase_bonus = 0.25 if query_text.lower() in chunk_text.lower() else 0.0
    app_bonus = 0.08 if any(k in chunk_text.lower() for k in ["fitpredict", "prediction", "workout", "recipe", "obesity"]) else 0.0
    return normalized_overlap + phrase_bonus + app_bonus


def retrieve_relevant_chunks(question: str, user_id: Optional[str], top_k: int) -> List[Dict[str, Any]]:
    query_tokens = Counter(_tokenize(question))
    if not query_tokens:
        return []

    question_lower = question.lower()
    nutrition_intent = any(k in question_lower for k in ["nutrition", "diet", "meal", "protein", "carb", "calorie"])
    workout_intent = any(k in question_lower for k in ["workout", "training", "exercise", "fitness"])
    disease_intent = any(k in question_lower for k in ["disease", "risk", "complication", "diabetes", "hypertension"])

    candidates = rag_chunks + _fetch_user_context_chunks(user_id)
    scored: List[Dict[str, Any]] = []

    for chunk in candidates:
        score = _score_chunk(query_tokens, chunk["token_counts"], question, chunk["content"])
        chunk_text_lower = chunk["content"].lower()

        source_tokens = set(_tokenize(chunk["source"]))
        query_token_set = set(query_tokens.keys())
        source_overlap = len(source_tokens.intersection(query_token_set))
        score += min(0.15, 0.05 * source_overlap)

        if nutrition_intent and any(k in chunk_text_lower for k in ["nutrition", "diet", "protein", "carbohydrate", "fat", "calorie"]):
            score += 0.22
            if any(k in chunk["source"].lower() for k in ["nutrition", "diet"]):
                score += 0.35
        if workout_intent and any(k in chunk_text_lower for k in ["workout", "training", "exercise", "physical activity"]):
            score += 0.22
        if disease_intent and any(k in chunk_text_lower for k in ["disease", "risk", "complication", "diabetes", "hypertension"]):
            score += 0.2

        if score < 0.12:
            continue

        scored.append(
            {
                "source": chunk["source"],
                "chunk_id": chunk["chunk_id"],
                "content": chunk["content"],
                "score": score,
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:top_k]


def build_chat_answer(question: str, ranked_chunks: List[Dict[str, Any]]) -> str:
    opening = f"{FITCHAT_NAME} here."

    if not ranked_chunks:
        return (
            f"{opening} I could not find enough relevant information in my current knowledge base to answer that accurately. "
            "Please rephrase your question with more context (for example: prediction flow, workouts, recipes, user history, or API behavior)."
        )

    selected_chunks = select_diverse_chunks(ranked_chunks, max_chunks=6)
    combined_text = " ".join(chunk["content"] for chunk in selected_chunks).lower()
    has_user_context = any(chunk["source"].startswith("user:") for chunk in ranked_chunks)
    question_lower = question.lower()

    lines = [f"{opening} Here's a simple and practical answer:"]

    wants_plan = any(k in question_lower for k in ["plan", "practical", "daily", "routine", "week", "kickstart"])
    plateau_intent = any(k in question_lower for k in ["stall", "plateau", "not losing", "stopped losing", "no progress"])
    budget_intent = any(k in question_lower for k in ["budget", "cheap", "affordable", "low cost"])
    home_intent = any(k in question_lower for k in ["home", "no equipment", "without gym"])
    social_intent = any(k in question_lower for k in ["restaurant", "party", "event", "social"])
    student_intent = any(k in question_lower for k in ["student", "exam", "university", "campus"])
    office_intent = any(k in question_lower for k in ["office", "desk job", "meetings", "workday"])
    women_intent = any(k in question_lower for k in ["women", "woman", "cycle", "period"])
    vegan_intent = any(k in question_lower for k in ["vegan", "vegetarian", "plant-based"])
    fasting_intent = any(k in question_lower for k in ["ramadan", "fasting", "suhoor", "iftar"])
    travel_intent = any(k in question_lower for k in ["travel", "holiday", "trip", "hotel"])

    if plateau_intent:
        lines.append("- First, verify adherence and measurement quality for 2-3 weeks (weekly average weight + waist), because plateaus are often tracking or consistency issues.")
        lines.append("- Keep protein and meal quality high, then add a small activity increase (extra steps or one cardio session).")
        lines.append("- If adherence is already strong, reduce calories modestly (about 100-200 kcal/day), not aggressively.")
        lines.append("- Reassess after 10-14 days with one change at a time.")
    elif wants_plan:
        lines.append("- **Nutrition:** Aim for a moderate calorie deficit, prioritize protein at each meal, add vegetables/fiber, and limit sugary drinks and ultra-processed snacks.")
        lines.append("- **Training:** Do at least 150 minutes/week of moderate cardio plus 2 strength sessions to preserve muscle and improve metabolism.")
        lines.append("- **Lifestyle:** Sleep 7-9 hours, hydrate well (around 2-3L/day), and keep daily movement high (walking/steps).")
        lines.append("- **Tracking:** Monitor weight/waist weekly and adjust calories or activity gradually instead of making extreme changes.")
    else:
        if any(k in combined_text for k in ["nutrition", "diet", "protein", "calorie", "carbohydrate", "fat"]):
            lines.append("- Focus on balanced nutrition: adequate protein, quality carbs, healthy fats, and a sustainable calorie deficit when weight loss is the goal.")

        if any(k in combined_text for k in ["workout", "training", "exercise", "physical activity", "cardio"]):
            lines.append("- Combine cardio and strength training consistently; this supports fat loss, cardiometabolic health, and long-term maintenance.")

        if any(k in combined_text for k in ["risk", "disease", "diabetes", "hypertension", "cardiovascular"]):
            lines.append("- Managing weight reduces major health risks (e.g., diabetes, hypertension, cardiovascular complications), so consistency matters more than intensity.")

        if len(lines) == 1:
            lines.append("- Build a sustainable routine around nutrition quality, regular activity, hydration, and sleep. Small consistent steps work best.")

    if budget_intent:
        lines.append("- **Budget tip:** Build meals around affordable staples (eggs, lentils, oats, rice, frozen vegetables) and batch-cook to improve adherence and cost control.")

    if home_intent:
        lines.append("- **Home training tip:** Use 30-40 minute no-equipment full-body sessions 3x/week plus daily walking for a strong baseline.")

    if social_intent:
        lines.append("- **Social events tip:** Use an 80/20 strategy, choose protein + vegetables first, and return to your routine at the next meal without over-correcting.")

    if student_intent:
        lines.append("- **Student tip:** Keep a fixed meal skeleton, use quick high-protein meals on exam days, and keep 20-30 minute workouts to protect consistency.")

    if office_intent:
        lines.append("- **Office tip:** Add movement breaks every 60-90 minutes, walk after lunch, and pre-plan snacks to avoid impulsive high-calorie choices.")

    if women_intent:
        lines.append("- **Women-specific tip:** Track weekly trends (not single-day scale changes), prioritize strength training, and avoid overly aggressive calorie cuts.")

    if vegan_intent:
        lines.append("- **Vegan/vegetarian tip:** Ensure protein at each meal (legumes, tofu/tempeh, soy products) and monitor key micronutrients consistently.")

    if fasting_intent:
        lines.append("- **Fasting tip:** Prioritize hydration and balanced meals between fasting windows; keep training intensity moderate if recovery is low.")

    if travel_intent:
        lines.append("- **Travel tip:** Keep protein and steps high, use short hotel workouts, and return to routine immediately after travel days.")

    if has_user_context:
        lines.append("- Based on your recent activity/history, I can personalize this into a 7-day plan if you want.")
    else:
        lines.append("- If you share your goal (fat loss, maintenance, or fitness level), I can personalize this further.")

    return "\n".join(lines)


def _build_context_block(ranked_chunks: List[Dict[str, Any]], max_chunks: int = 6) -> str:
    context_lines: List[str] = []
    for idx, chunk in enumerate(ranked_chunks[:max_chunks], start=1):
        clean_content = re.sub(r"\s+", " ", chunk["content"]).strip()
        context_lines.append(f"[{idx}] {clean_content[:900]}")
    return "\n".join(context_lines)


def select_diverse_chunks(ranked_chunks: List[Dict[str, Any]], max_chunks: int = 6) -> List[Dict[str, Any]]:
    """
    Prioritize relevance while avoiding repeated chunks from the same source.
    """
    selected: List[Dict[str, Any]] = []
    used_sources = set()

    for chunk in ranked_chunks:
        source = chunk["source"]
        if source in used_sources:
            continue
        selected.append(chunk)
        used_sources.add(source)
        if len(selected) >= max_chunks:
            break

    if len(selected) < max_chunks:
        for chunk in ranked_chunks:
            if chunk in selected:
                continue
            selected.append(chunk)
            if len(selected) >= max_chunks:
                break

    return selected


def generate_answer_with_ollama(question: str, ranked_chunks: List[Dict[str, Any]]) -> Optional[str]:
    if not ranked_chunks:
        return None

    context_block = _build_context_block(select_diverse_chunks(ranked_chunks, max_chunks=6))
    system_prompt = (
        f"You are {FITCHAT_NAME}, the assistant of FitPredict. "
        "You MUST answer in clear, natural English only. "
        "Use ONLY the provided retrieved context and never invent facts. "
        "If the context is insufficient, explicitly say what is missing and ask one clarifying question. "
        "Style rules: be concise, practical, and structured. "
        "When relevant, provide 3-6 bullet points and a short actionable recommendation. "
        "Do NOT output raw JSON, raw logs, source labels, or technical dump-like text."
    )
    user_prompt = (
        f"Question: {question}\n\n"
        f"Retrieved context:\n{context_block}\n\n"
        "Output format:\n"
        "1) Direct answer\n"
        "2) Key points (bullets)\n"
        "3) Optional next step for the user\n"
        "Do not mention internal implementation details unless asked."
    )

    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "options": {
            "temperature": 0.2,
        },
    }

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL.rstrip('/')}/api/chat",
            json=payload,
            timeout=LLM_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()

        content = (
            data.get("message", {}).get("content", "")
            if isinstance(data, dict)
            else ""
        )
        content = content.strip()
        if not content:
            return None

        return content
    except Exception:
        return None


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
    build_rag_corpus()

    
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


class ChatRagRequest(BaseModel):
    question: str
    user_id: Optional[str] = None
    top_k: int = 4



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


@app.post("/chat/rag")
def chat_rag(payload: ChatRagRequest) -> Dict[str, Any]:
    question = payload.question.strip()
    if len(question) < 3:
        raise HTTPException(status_code=400, detail="Question is too short")

    top_k = max(1, min(payload.top_k, 12))
    ranked_chunks = retrieve_relevant_chunks(question, payload.user_id, top_k)
    answer = generate_answer_with_ollama(question, ranked_chunks)
    generation_mode = "ollama"

    if not answer:
        answer = build_chat_answer(question, ranked_chunks)
        generation_mode = "extractive"

    dedup_sources: List[Dict[str, Any]] = []
    seen_sources = set()
    for chunk in ranked_chunks:
        source_name = chunk["source"]
        if source_name in seen_sources:
            continue
        seen_sources.add(source_name)
        dedup_sources.append(
            {
                "source": source_name,
                "score": round(float(chunk["score"]), 4),
                "snippet": chunk["content"][:220],
            }
        )
        if len(dedup_sources) >= 8:
            break

    return {
        "assistant_name": FITCHAT_NAME,
        "answer": answer,
        "sources": dedup_sources,
        "used_user_context": any(chunk["source"].startswith("user:") for chunk in ranked_chunks),
        "language": "en",
        "generation_mode": generation_mode,
        "llm": {
            "provider": "ollama",
            "model": OLLAMA_MODEL,
            "base_url": OLLAMA_BASE_URL,
        },
    }


@app.post("/chat/rag/reindex")
def chat_rag_reindex() -> Dict[str, Any]:
    build_rag_corpus()
    unique_sources = sorted({chunk["source"] for chunk in rag_chunks})
    return {
        "success": True,
        "assistant_name": FITCHAT_NAME,
        "indexed_chunks": len(rag_chunks),
        "indexed_sources": unique_sources,
    }


@app.get("/chat/rag/sources")
def chat_rag_sources() -> Dict[str, Any]:
    _ensure_rag_sources_dir()
    files = [
        file_name
        for file_name in sorted(os.listdir(RAG_SOURCES_DIR))
        if os.path.isfile(os.path.join(RAG_SOURCES_DIR, file_name))
    ]

    return {
        "assistant_name": FITCHAT_NAME,
        "folder": RAG_SOURCES_DIR,
        "supported_extensions": [".txt", ".md", ".csv", ".json"],
        "custom_source_files": files,
        "indexed_chunks": len(rag_chunks),
    }



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
