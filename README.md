# 💳 AI-Based Credit Scoring System (Thin-File Users)

## 🚀 Overview

This project is an **AI-powered credit scoring system** designed for users who lack traditional credit history (thin-file users).

Instead of relying on credit cards or loan history, this system:

* analyzes **transaction data**
* extracts **financial behavior features**
* predicts a **credit score (300–900)**
* explains **why the score was assigned**

---

## 🎯 Problem Statement

Millions of users cannot access loans because they:

* don’t have credit cards
* have no formal credit history

👉 Traditional systems fail them.

This project solves that by:

* using **transaction-level data**
* applying **machine learning + explainability**

---

## 🧠 How It Works

```text
User Transactions (1 month)
        ↓
Feature Engineering
        ↓
ML Model (XGBoost)
        ↓
Credit Score Prediction
        ↓
SHAP Explainability
```

---

## 📊 Features Used

The model evaluates user behavior using:

### 💰 Income & Cashflow

* `income`
* `income_frequency`

### 💸 Spending Behavior

* `expense`
* `avg_expense`
* `essential_ratio`
* `luxury_ratio`

### 🧠 Financial Discipline

* `savings_rate`
* `txn_count`

### 📈 Stability & Balance

* `avg_balance`
* `min_balance`
* `cashflow_stability`

---

## 🎯 Output

The API returns:

```json
{
  "credit_score": 676.05,
  "feature_importance": {
    "savings_rate": 147.01,
    "avg_balance": 22.71,
    "luxury_ratio": -8.31
  }
}
```

### 🔍 Interpretation

* Positive values → increase score
* Negative values → decrease score

---

## 🛠 Tech Stack

* **Backend:** FastAPI
* **ML Model:** XGBoost Regressor
* **Explainability:** SHAP
* **Data Processing:** Pandas, NumPy
* **API Testing:** Swagger UI

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

### 3. Activate Environment

```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Run Server

```bash
uvicorn app.main:app --reload
```

---

## 🌐 API Usage

### Endpoint

```
POST /predict
```

### Sample Input

```json
{
  "transactions": [
    {"date": "2026-03-01", "amount": 5000, "type": "credit", "category": "salary"},
    {"date": "2026-03-02", "amount": 1200, "type": "debit", "category": "food"}
  ]
}
```

### Sample Output

```json
{
  "credit_score": 676.05,
  "feature_importance": {
    "savings_rate": 147.01,
    "avg_balance": 22.71
  }
}
```

---

## 📌 Key Highlights

* ✔️ Works without traditional credit history
* ✔️ Uses behavioral finance patterns
* ✔️ Fully explainable predictions (SHAP)
* ✔️ End-to-end ML pipeline
* ✔️ Ready for frontend integration

---

## ⚠️ Note

This system uses **synthetic data for training**, and:

* is intended for **demonstration & hackathon purposes**
* does not represent real-world financial scoring systems

---

## 🚀 Future Improvements

* Add **LLM-based financial suggestions**
* Integrate **real banking APIs**
* Improve **feature engineering with time-series patterns**
* Deploy on cloud (AWS / Render / Vercel backend)

---

## 👨‍💻 Author

Deepak
AIML Student | ML & Space-Tech Enthusiast

---

## ⭐ If you found this useful

Give this repo a star ⭐
