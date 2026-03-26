# AI Financial Intelligence Platform For Credit Decisions

This project turns transaction CSV data into explainable credit decisions for both borrower-facing and lender-facing workflows.

## Structure

```text
credit-score-generator/
├── backend/    # FastAPI scoring, SHAP/rule insights, lender dashboard data
└── frontend/   # React + GSAP dashboard
```

## What It Does

- Upload a transaction CSV from the frontend
- Generate a credit score from the backend model
- Show Behavioral Lens, Next Best Moves, risk drivers, and spend analysis
- Run a what-if simulator for score improvement
- Open a separate lender dashboard with 10 sample users and loan decisions

## Required CSV Format

```csv
date,amount,type,category
2026-03-01,50000,credit,salary
2026-03-02,1200,debit,food
```

## Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Set `OPENAI_API_KEY` in `backend/.env` if you want LLM-enhanced insights.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Main Endpoints

- `POST /predict/upload`
- `GET /predict/lender-dashboard`

## Tech Stack

- Frontend: React, Vite, GSAP
- Backend: FastAPI
- Model: XGBoost + SHAP
- LLM: OpenAI API
