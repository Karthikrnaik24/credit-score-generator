import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.predict import router as predict_router

load_dotenv()

app = FastAPI(title="Credit Score Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router, prefix="/predict", tags=["predict"])


@app.get("/")
def root():
    return {
        "message": "Credit score generator backend is running",
        "openai_enabled": bool(os.getenv("OPENAI_API_KEY")),
    }
