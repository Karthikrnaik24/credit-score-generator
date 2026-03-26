import numpy as np

def extract_features(transactions):
    """
    Converts transaction list into feature vector
    """

    # 🔹 Sort transactions by date
    transactions = sorted(transactions, key=lambda x: x["date"])

    balance = 0
    balances = []

    income = 0
    expense = 0
    income_freq = 0

    essential_categories = ["food", "rent", "bills"]
    luxury_categories = ["shopping", "entertainment"]

    essential_spend = 0
    luxury_spend = 0

    # 🔹 Loop through transactions
    for t in transactions:
        amount = t["amount"]
        t_type = t["type"]
        category = t["category"]

        if t_type == "credit":
            income += amount
            balance += amount
            income_freq += 1

        elif t_type == "debit":
            expense += amount
            balance -= amount

            if category in essential_categories:
                essential_spend += amount

            if category in luxury_categories:
                luxury_spend += amount

        balances.append(balance)

    # 🔹 Derived features
    txn_count = len(transactions)

    avg_expense = expense / txn_count if txn_count else 0

    savings_rate = (income - expense) / income if income else 0

    avg_balance = np.mean(balances) if balances else 0
    min_balance = np.min(balances) if balances else 0
    cashflow_stability = np.std(balances) if balances else 0

    essential_ratio = essential_spend / expense if expense else 0
    luxury_ratio = luxury_spend / expense if expense else 0

    # 🔹 Final feature order (VERY IMPORTANT)
    return [
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
    float(luxury_ratio)
    ]