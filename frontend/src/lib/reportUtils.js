export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function simulateScore(baseScore, simulator) {
  const delta =
    Math.round(simulator.spendingReduction / 500) * 6 +
    Math.round(simulator.savingsBoost / 500) * 7 +
    simulator.missedPaymentsFixed * 18 +
    Math.round(simulator.incomeBoost / 1000) * 5;

  return {
    nextScore: Math.min(900, Math.max(300, baseScore + delta)),
    delta
  };
}

export function buildPredictedScenario(report) {
  const metrics = report?.metrics || {};
  const spendingReduction = Math.min(10000, Math.max(500, Math.round(((metrics.expense || 0) * 0.08) / 500) * 500));
  const savingsBase = metrics.savings > 0 ? metrics.savings : (metrics.income || 0) * 0.05;
  const savingsBoost = Math.min(10000, Math.max(500, Math.round((savingsBase || 1000) / 500) * 500));
  const missedPaymentsFixed = Math.min(metrics.missed_payments || 0, 1);
  const incomeBoost = Math.min(20000, Math.max(0, Math.round(((metrics.income || 0) * 0.05) / 1000) * 1000));

  return {
    spendingReduction: Number.isFinite(spendingReduction) ? spendingReduction : 1000,
    savingsBoost: Number.isFinite(savingsBoost) ? savingsBoost : 1000,
    missedPaymentsFixed,
    incomeBoost: Number.isFinite(incomeBoost) ? incomeBoost : 0
  };
}

export function getRiskPresentation(score) {
  if (score < 580) {
    return { label: "High Risk", decision: "Risky", loanEligibility: "Low", color: "#ff6e7b" };
  }
  if (score < 700) {
    return { label: "Medium Risk", decision: "Risky", loanEligibility: "Medium", color: "#ffb14a" };
  }
  return { label: "Low Risk", decision: "Approve", loanEligibility: "High", color: "#2ee6c5" };
}

export function getRecommendedLoan(metrics, score) {
  const income = metrics?.income || 0;
  const expense = metrics?.expense || 0;
  const savings = metrics?.savings || 0;
  const missedPayments = metrics?.missed_payments || 0;
  const surplus = Math.max(0, income - expense);
  const expenseRatio = income ? expense / income : 1;
  const savingsRatio = income ? Math.max(0, savings) / income : 0;
  const surplusRatio = income ? surplus / income : 0;
  const normalizedScore = Math.max(300, Math.min(score, 900));
  const scoreAnchor = 50000 + ((normalizedScore - 300) / 600) * 550000;

  let affordabilityFactor = 1;
  affordabilityFactor += Math.min(0.08, surplusRatio * 0.18);
  affordabilityFactor += Math.min(0.05, savingsRatio * 0.12);

  if (expenseRatio > 0.9) affordabilityFactor -= 0.14;
  else if (expenseRatio > 0.8) affordabilityFactor -= 0.1;
  else if (expenseRatio > 0.7) affordabilityFactor -= 0.06;

  affordabilityFactor -= Math.min(0.12, missedPayments * 0.05);
  affordabilityFactor = Math.max(0.82, Math.min(1.08, affordabilityFactor));

  const recommended = scoreAnchor * affordabilityFactor;
  return Math.max(50000, Math.round(recommended / 5000) * 5000);
}

export function getDecisionReasons(report) {
  const reasons = [];
  const metrics = report.metrics;

  if (metrics.missed_payments > 0) reasons.push(`Missed payments detected: ${metrics.missed_payments}`);
  if (metrics.savings > 0) reasons.push(`Positive savings buffer of ${formatCurrency(metrics.savings)}`);
  if (metrics.expense > metrics.income * 0.75) reasons.push("High expense-to-income ratio is increasing lending risk");

  const topDrivers = Object.entries(report.feature_importance)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 2)
    .map(([key]) => key.replaceAll("_", " "));

  topDrivers.forEach((item) => reasons.push(`Model highlights ${item} as a major driver`));
  return reasons.slice(0, 3);
}

function adjustScore(baseScore, delta) {
  return Math.max(300, Math.min(900, Math.round(baseScore + delta)));
}

function deriveDecision(score) {
  if (score < 560) return "Reject";
  if (score < 700) return "Risky";
  return "Approve";
}

function deriveRiskFactors(metrics, featureImportance, variantIndex) {
  const factors = [];
  if ((metrics.missed_payments || 0) + (variantIndex % 3 === 0 ? 1 : 0) > 0) factors.push("Missed payment behavior");
  if ((metrics.expense || 0) > (metrics.income || 0) * 0.72) factors.push("High expense-to-income ratio");
  if ((metrics.savings || 0) <= 0 || variantIndex % 4 === 0) factors.push("Weak savings cushion");

  const driver = Object.entries(featureImportance || {})
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 1)
    .map(([key]) => key.replaceAll("_", " "))[0];

  if (driver) factors.push(`Model sensitivity around ${driver}`);
  return factors.slice(0, 3);
}

export function buildLenderUsers(report) {
  const ids = "ABCDEFGHIJ".split("");
  const scoreOffsets = [-42, -25, -10, 6, 18, 28, -33, 14, 36, -5];

  return ids.map((userId, index) => {
    const score = adjustScore(report.credit_score, scoreOffsets[index]);
    const risk = getRiskPresentation(score);
    const recommendedLoan = getRecommendedLoan(
      {
        ...report.metrics,
        income: Math.max(10000, report.metrics.income + (index - 4) * 3500),
        savings: report.metrics.savings + (index - 3) * 1800
      },
      score
    );

    return {
      userId,
      creditScore: score,
      riskLevel: risk.label,
      decision: deriveDecision(score),
      recommendedLoan,
      keyRiskFactors: deriveRiskFactors(report.metrics, report.feature_importance, index)
    };
  });
}
