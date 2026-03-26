export const SAMPLE_CSV = `date,amount,type,category
2024-02-01,58000,credit,salary
2024-02-03,12000,debit,rent
2024-02-05,2400,debit,food
2024-02-11,1800,debit,shopping
2024-02-15,4200,credit,freelance
2024-02-18,950,debit,bills
2024-02-20,0,debit,missed_payment
2024-02-25,3200,debit,travel`;

const ESSENTIAL_CATEGORIES = ["rent", "food", "bills", "utilities", "groceries", "medicine", "emi"];
const LUXURY_CATEGORIES = ["shopping", "travel", "entertainment", "gadgets", "dining"];

const SCORE_BANDS = [
  { min: 300, max: 579, label: "Needs attention", color: "#ff6262", tone: "negative" },
  { min: 580, max: 669, label: "Building", color: "#ffac45", tone: "warning" },
  { min: 670, max: 739, label: "Fair", color: "#f4bf4f", tone: "neutral" },
  { min: 740, max: 799, label: "Strong", color: "#83c800", tone: "positive" },
  { min: 800, max: 900, label: "Excellent", color: "#15b8a6", tone: "positive" }
];

export function normalizeTransactions(rows) {
  return rows
    .map((row) => ({
      date: String(row.date || "").trim(),
      amount: Number.parseFloat(row.amount || "0") || 0,
      type: String(row.type || "").trim().toLowerCase(),
      category: String(row.category || "").trim().toLowerCase()
    }))
    .filter((row) => row.date && row.type && row.category);
}

export function getScoreBand(score) {
  return SCORE_BANDS.find((band) => score >= band.min && score <= band.max) || SCORE_BANDS[0];
}

export function summarizeTransactions(transactions) {
  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const income = sorted.filter((item) => item.type === "credit").reduce((sum, item) => sum + item.amount, 0);
  const expense = sorted.filter((item) => item.type === "debit").reduce((sum, item) => sum + item.amount, 0);
  const missedPayments = sorted.filter((item) => item.category.includes("missed")).length;
  const salaryCredits = sorted.filter((item) => item.type === "credit").length;
  const savings = income - expense;
  const savingsRate = income > 0 ? savings / income : 0;
  const debitCount = sorted.filter((item) => item.type === "debit").length;
  const avgExpense = debitCount > 0 ? expense / debitCount : 0;

  let runningBalance = 0;
  const balances = sorted.map((item) => {
    runningBalance += item.type === "credit" ? item.amount : -item.amount;
    return runningBalance;
  });

  const avgBalance = balances.length ? balances.reduce((sum, value) => sum + value, 0) / balances.length : 0;
  const minBalance = balances.length ? Math.min(...balances) : 0;
  const stability = balances.length
    ? Math.sqrt(balances.reduce((sum, value) => sum + (value - avgBalance) ** 2, 0) / balances.length)
    : 0;

  const spendingByCategory = sorted
    .filter((item) => item.type === "debit")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});

  const essentialSpend = Object.entries(spendingByCategory).reduce(
    (sum, [category, amount]) => sum + (ESSENTIAL_CATEGORIES.includes(category) ? amount : 0),
    0
  );

  const luxurySpend = Object.entries(spendingByCategory).reduce(
    (sum, [category, amount]) => sum + (LUXURY_CATEGORIES.includes(category) ? amount : 0),
    0
  );

  const monthlyTrend = sorted.reduce((acc, item) => {
    const month = item.date.slice(0, 7) || "Unknown";
    if (!acc[month]) {
      acc[month] = { month, credit: 0, debit: 0 };
    }

    if (item.type === "credit") {
      acc[month].credit += item.amount;
    } else {
      acc[month].debit += item.amount;
    }

    return acc;
  }, {});

  const trendSeries = Object.values(monthlyTrend).map((entry) => ({
    label: entry.month,
    value: Math.round(entry.credit - entry.debit)
  }));

  return {
    income,
    expense,
    savings,
    savingsRate,
    missedPayments,
    salaryCredits,
    avgExpense,
    avgBalance,
    minBalance,
    stability,
    spendingByCategory,
    topCategories: Object.entries(spendingByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount })),
    trendSeries,
    transactionCount: sorted.length
  };
}

export function calculateLocalScore(metrics) {
  const utilization = metrics.income > 0 ? metrics.expense / metrics.income : 1;
  let score = 690;
  score += metrics.savingsRate * 140;
  score -= metrics.missedPayments * 48;
  score -= Math.max(0, utilization - 0.65) * 180;
  score += Math.min(metrics.salaryCredits, 4) * 8;
  score += metrics.avgBalance > 0 ? 18 : -18;
  score -= metrics.minBalance < -5000 ? 24 : 0;
  score = Math.min(900, Math.max(300, score));
  return Math.round(score);
}

export function buildShapNarratives(explanation, metrics) {
  const entries = Object.entries(explanation || {})
    .filter(([, value]) => Number.isFinite(value))
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 4);

  if (!entries.length) {
    const fallback = [];
    if (metrics.missedPayments > 0) {
      fallback.push("You have a lower score because missed payments are showing up in your transaction history.");
    }
    if (metrics.savingsRate > 0.2) {
      fallback.push("Your savings habit is improving your creditworthiness and signaling stronger discipline.");
    }
    if (metrics.expense > metrics.income * 0.8) {
      fallback.push("Your spending is taking up a large share of income, which keeps the score under pressure.");
    }
    if (!fallback.length) {
      fallback.push("Your account activity looks stable, but you can improve the score by increasing savings and keeping payments on time.");
    }
    return fallback;
  }

  const featureMap = {
    income: "Higher income is supporting your score and showing repayment capacity.",
    expense: "High spending is reducing your score because monthly outflow is eating into cash reserves.",
    avg_expense: "Your average expense per transaction is a drag on the score, suggesting chunky debit behavior.",
    txn_count: "A healthy number of transactions is giving the model more confidence in your account behavior.",
    savings_rate: "Your savings rate is lifting the score by showing that income is not fully consumed.",
    income_freq: "Frequent income credits improve trust in your cash-flow consistency.",
    avg_balance: "A stronger average balance is helping your credit profile look more resilient.",
    min_balance: "Low balance dips are hurting the score because they suggest tighter liquidity.",
    cashflow_stability: "Volatile balances are lowering the score due to unstable month-to-month cash flow.",
    essential_ratio: "A larger share of essential spending is keeping your profile grounded and predictable.",
    luxury_ratio: "A high luxury spend ratio is pulling the score down by increasing discretionary risk."
  };

  return entries.map(([feature, value]) => {
    const direction = value >= 0 ? "positive" : "negative";
    const sentence = featureMap[feature] || `${feature} is having a ${direction} effect on your score.`;
    if (direction === "positive") {
      return sentence;
    }
    if (feature === "expense" || feature === "avg_expense") {
      return "You have a lower score because spending pressure is high compared with your inflow.";
    }
    return sentence;
  });
}

export function buildSuggestions(metrics) {
  const suggestions = [];

  if (metrics.missedPayments > 1) {
    suggestions.push({
      title: "Reduce missed payments",
      body: "Reduce missed payments to improve score by about 50 points and rebuild payment trust."
    });
  }

  if (metrics.savingsRate < 0.15) {
    suggestions.push({
      title: "Increase savings buffer",
      body: "Aim to save at least 15% of income each month to create a stronger repayment cushion."
    });
  }

  if (metrics.expense > metrics.income * 0.75) {
    suggestions.push({
      title: "Lower spending intensity",
      body: "Bring spending below 75% of income to make your score look healthier and more stable."
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      title: "Keep momentum",
      body: "Your current behavior is fairly solid. Continue timely payments and maintain a stable monthly surplus."
    });
  }

  return suggestions;
}

export function simulateScore(baseScore, metrics, simulator) {
  let delta = 0;
  delta += Math.round(simulator.savingsBoost / 500) * 8;
  delta += Math.round(simulator.spendingReduction / 500) * 7;
  delta += simulator.missedPaymentsImprovement * 18;
  delta += simulator.incomeBoost > 0 ? Math.round(simulator.incomeBoost / 1000) * 6 : 0;

  const adjusted = Math.min(900, Math.max(300, baseScore + delta));

  return {
    score: adjusted,
    delta,
    narrative:
      delta >= 0
        ? `If you follow this plan, your score could improve by around ${delta} points.`
        : `This scenario could reduce your score by around ${Math.abs(delta)} points.`
  };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function downloadSummary({ score, simulatedScore, band, metrics, insights, suggestions, fileName }) {
  const lines = [
    "Credit Intelligence Summary",
    `Source File: ${fileName || "Uploaded CSV"}`,
    `Current Score: ${score}`,
    `Simulated Score: ${simulatedScore}`,
    `Score Band: ${band.label}`,
    `Income: ${formatCurrency(metrics.income)}`,
    `Expense: ${formatCurrency(metrics.expense)}`,
    `Savings: ${formatCurrency(metrics.savings)}`,
    `Missed Payments: ${metrics.missedPayments}`,
    "",
    "Insights",
    ...insights.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Suggestions",
    ...suggestions.map((item, index) => `${index + 1}. ${item.title}: ${item.body}`)
  ].join("\n");

  const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "credit-summary.txt";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
