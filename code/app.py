from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import io
import os

app = FastAPI(title="Bank Churn Prediction API - Enhanced")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "data/best_model_pipeline.pkl"

if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
else:
    model = None

class CustomerData(BaseModel):
    Geography: str
    Gender: str
    CreditScore: int
    Age: int
    Tenure: int
    Balance: float
    NumOfProducts: int
    HasCrCard: int
    IsActiveMember: int
    EstimatedSalary: float

@app.get("/health")
def health_check():
    """
    Health check endpoint to ensure API is running and model is loaded.
    """
    if model:
        return {"status": "ok", "model_loaded": True}
    return {"status": "degraded", "model_loaded": False}

@app.post("/predict")
def predict_churn(data: CustomerData):
    """
    Real-time prediction for a single customer.
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model pipeline not available")
    
    input_df = pd.DataFrame([data.dict()])
    prediction = model.predict(input_df)[0]
    probability = model.predict_proba(input_df)[0][1]
    
    return {
        "churn_prediction": int(prediction),
        "churn_probability": float(probability),
        "status": "Exited" if prediction == 1 else "Stayed"
    }

@app.post("/predict_batch")
async def predict_batch(file: UploadFile = File(...)):
    """
    Batch prediction endpoint expecting a CSV file.
    Returns the input CSV with two new columns: 'Churn_Prediction' and 'Churn_Probability'.
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model pipeline not available")
    
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Verify columns exist
        required_cols = ['Geography', 'Gender', 'CreditScore', 'Age', 'Tenure', 'Balance', 'NumOfProducts', 'HasCrCard', 'IsActiveMember', 'EstimatedSalary']
        if not all(col in df.columns for col in required_cols):
             raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_cols}")
             
        predictions = model.predict(df)
        probabilities = model.predict_proba(df)[:, 1]
        
        df['Churn_Prediction'] = predictions
        df['Churn_Probability'] = probabilities
        
        return df.to_dict(orient='records')
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
