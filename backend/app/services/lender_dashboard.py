from pathlib import Path

from app.services.pipeline import analyze_uploaded_csv

SAMPLE_USERS_DIR = Path(__file__).resolve().parent.parent.parent / "sample_users"


def get_risk_level(score):
    if score < 580:
        return "High Risk"
    if score < 700:
        return "Medium Risk"
    return "Low Risk"


def get_decision(score):
    if score < 560:
        return "Reject"
    if score < 700:
        return "Risky"
    return "Approve"


def get_recommended_loan(metrics, score):
    income = metrics.get("income", 0)
    expense = metrics.get("expense", 0)
    savings = metrics.get("savings", 0)
    missed_payments = metrics.get("missed_payments", 0)
    surplus = max(0, income - expense)
    expense_ratio = (expense / income) if income else 1.0
    savings_ratio = (max(0, savings) / income) if income else 0.0
    surplus_ratio = (surplus / income) if income else 0.0
    normalized_score = max(300, min(score, 900))
    score_anchor = 50000 + ((normalized_score - 300) / 600) * 550000

    affordability_factor = 1.0
    affordability_factor += min(0.08, surplus_ratio * 0.18)
    affordability_factor += min(0.05, savings_ratio * 0.12)

    if expense_ratio > 0.9:
        affordability_factor -= 0.14
    elif expense_ratio > 0.8:
        affordability_factor -= 0.1
    elif expense_ratio > 0.7:
        affordability_factor -= 0.06

    affordability_factor -= min(0.12, missed_payments * 0.05)
    affordability_factor = max(0.82, min(1.08, affordability_factor))

    recommended = score_anchor * affordability_factor
    return max(50000, round(recommended / 5000) * 5000)


def get_key_risk_factors(report):
    metrics = report["metrics"]
    factors = []

    if metrics.get("missed_payments", 0) > 0:
        factors.append("Missed payment behavior")
    if metrics.get("expense", 0) > metrics.get("income", 0) * 0.72:
        factors.append("High expense-to-income ratio")
    if metrics.get("savings", 0) <= 0:
        factors.append("Weak savings cushion")

    top_drivers = sorted(
        report["feature_importance"].items(),
        key=lambda item: abs(item[1]),
        reverse=True,
    )[:2]

    for feature, _ in top_drivers:
        factors.append(f"Model sensitivity around {feature.replace('_', ' ')}")

    return factors[:3]


def build_lender_dashboard():
    users = []
    for csv_path in sorted(SAMPLE_USERS_DIR.glob("User *.csv")):
        report = analyze_uploaded_csv(csv_path.name, csv_path.read_bytes())
        score = report["credit_score"]
        users.append(
            {
                "user_id": csv_path.stem.replace("User ", ""),
                "credit_score": score,
                "risk_level": get_risk_level(score),
                "decision": get_decision(score),
                "recommended_loan": get_recommended_loan(report["metrics"], score),
                "key_risk_factors": get_key_risk_factors(report),
            }
        )
    return users
