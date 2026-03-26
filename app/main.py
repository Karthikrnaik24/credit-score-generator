from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas.request_schema import TransactionRequest
from app.services.feature_engineering import extract_features
from app.services.predict import predict_score

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get("/")
def home():
    return {"message": "Credit Scoring API running"}


@app.post("/predict")
def predict(request: TransactionRequest):
    # 🔹 Convert request to dict
    transactions = [t.dict() for t in request.transactions]

    # 🔹 Feature extraction
    features = extract_features(transactions)

    # 🔹 Prediction + explanation
    score, explanation = predict_score(features)

    return {
        "credit_score": round(score, 2),
        "feature_importance": explanation
    }