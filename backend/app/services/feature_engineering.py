import math


ESSENTIAL_CATEGORIES = {"food", "rent", "bills", "groceries", "utilities", "medicine", "emi"}
LUXURY_CATEGORIES = {"shopping", "entertainment", "travel", "gadgets", "dining"}


def extract_features(transactions):
    transactions = sorted(transactions, key=lambda item: item["date"])

    income = 0.0
    expense = 0.0
    income_freq = 0
    balance = 0.0
    balances = []
    essential_spend = 0.0
    luxury_spend = 0.0
    spending_by_category = {}
    spending_by_date = {}
    monthly_trend = {}
    missed_payments = 0

    for item in transactions:
        amount = float(item["amount"])
        txn_type = item["type"].lower()
        category = item["category"].lower()
        month_key = item["date"][:7] or "Unknown"

        monthly_trend.setdefault(month_key, {"label": month_key, "credit": 0.0, "debit": 0.0})

        if txn_type == "credit":
            income += amount
            income_freq += 1
            balance += amount
            monthly_trend[month_key]["credit"] += amount
        else:
            expense += amount
            balance -= amount
            monthly_trend[month_key]["debit"] += amount
            spending_by_category[category] = spending_by_category.get(category, 0.0) + amount
            spending_by_date[item["date"]] = spending_by_date.get(item["date"], 0.0) + amount

            if "missed" in category:
                missed_payments += 1

            if category in ESSENTIAL_CATEGORIES:
                essential_spend += amount

            if category in LUXURY_CATEGORIES:
                luxury_spend += amount

        balances.append(balance)

    txn_count = len(transactions)
    debit_count = len([item for item in transactions if item["type"].lower() == "debit"])
    avg_expense = expense / debit_count if debit_count else 0.0
    savings = income - expense
    savings_rate = savings / income if income else 0.0
    avg_balance = sum(balances) / len(balances) if balances else 0.0
    min_balance = min(balances) if balances else 0.0
    cashflow_stability = (
        math.sqrt(sum((value - avg_balance) ** 2 for value in balances) / len(balances))
        if balances
        else 0.0
    )
    essential_ratio = essential_spend / expense if expense else 0.0
    luxury_ratio = luxury_spend / expense if expense else 0.0

    feature_vector = [
        float(income),
        float(expense),
        float(avg_expense),
        int(txn_count),
        float(savings_rate),
        int(income_freq),
        float(avg_balance),
        float(min_balance),
        float(cashflow_stability),
        float(essential_ratio),
        float(luxury_ratio),
    ]

    top_categories = sorted(
        (
            {
                "category": category,
                "amount": round(amount, 2),
                "ratio": round((amount / expense) * 100, 1) if expense else 0.0,
            }
            for category, amount in spending_by_category.items()
        ),
        key=lambda item: item["amount"],
        reverse=True,
    )[:5]

    trend = [
        {
            "label": month,
            "value": round(values["credit"] - values["debit"], 2),
        }
        for month, values in sorted(monthly_trend.items())
    ]

    spend_timeline = [
        {
            "date": date,
            "amount": round(amount, 2),
        }
        for date, amount in sorted(spending_by_date.items())
    ]

    metrics = {
        "income": round(income, 2),
        "expense": round(expense, 2),
        "savings": round(savings, 2),
        "savings_rate": round(savings_rate, 4),
        "missed_payments": missed_payments,
        "transaction_count": txn_count,
        "income_frequency": income_freq,
        "avg_expense": round(avg_expense, 2),
        "avg_balance": round(avg_balance, 2),
        "min_balance": round(min_balance, 2),
        "cashflow_stability": round(cashflow_stability, 2),
        "essential_ratio": round(essential_ratio, 4),
        "luxury_ratio": round(luxury_ratio, 4),
    }

    return feature_vector, metrics, top_categories, trend, spend_timeline
