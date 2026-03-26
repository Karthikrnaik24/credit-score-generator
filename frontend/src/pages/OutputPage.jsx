import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount || 0);
}

function simulateScore(baseScore, simulator) {
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

function buildPredictedScenario(report) {
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

function downloadReport(report, projectedScore) {
  const text = [
    "Credit Score Summary",
    `File: ${report.file_name}`,
    `Credit Score: ${report.credit_score}`,
    `Projected Score: ${projectedScore}`,
    `Score Band: ${report.score_band}`,
    `Analysis Accuracy: ${report.analysis_accuracy}%`,
    "",
    "Insights",
    ...report.insights.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Suggestions",
    ...report.suggestions.map((item, index) => `${index + 1}. ${item}`)
  ].join("\n");

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "credit-summary.txt";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function OutputPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const rootRef = useRef(null);

  const report = useMemo(() => {
    if (location.state?.report) {
      return location.state.report;
    }

    try {
      return JSON.parse(sessionStorage.getItem("creditDashboardReport") || "null");
    } catch {
      return null;
    }
  }, [location.state]);

  const [simulator, setSimulator] = useState(() => buildPredictedScenario(report));
  const deferredSimulator = useDeferredValue(simulator);

  useEffect(() => {
    if (!report) {
      navigate("/");
    }
  }, [navigate, report]);

  useEffect(() => {
    if (report) {
      setSimulator(buildPredictedScenario(report));
    }
  }, [report]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".score-stage, .stack-card", {
        y: 40,
        opacity: 0,
        duration: 0.85,
        stagger: 0.08,
        ease: "power3.out"
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const scenario = useMemo(
    () => (report ? simulateScore(report.credit_score, deferredSimulator) : { nextScore: 0, delta: 0 }),
    [deferredSimulator, report]
  );

  if (!report) {
    return null;
  }

  return (
    <div className="scene-shell output-scene" ref={rootRef}>
      <div className="background-grid" />
      <div className="floating-orb orb-three" />
      <div className="floating-orb orb-four" />

      <main className="page-shell">
        <div className="page-topbar">
          <div>
            <p className="eyebrow">Output Page</p>
            <h1 className="dashboard-title">Credit score dashboard</h1>
          </div>
          <div className="topbar-actions">
            <button className="secondary-btn" onClick={() => navigate("/")}>
              Back
            </button>
            <button className="primary-btn" onClick={() => downloadReport(report, scenario.nextScore)}>
              Download Summary
            </button>
          </div>
        </div>

        <section className="dashboard-grid">
          <div className="main-column">
            <article className="glass-card score-stage">
              <div className="score-stage-copy">
                <p className="eyebrow">Credit Score</p>
                <div className="mega-score">{report.credit_score}</div>
                <div className="score-badges">
                  <span className="score-chip accent">{report.score_band}</span>
                  <span className="score-chip">Accuracy {report.analysis_accuracy}%</span>
                  <span className="score-chip">{report.llm_enabled ? "OpenAI insights active" : "Rule engine fallback"}</span>
                </div>
              </div>

              <div className="score-cubes">
                <div className="cube-card">
                  <span>Income</span>
                  <strong>{formatCurrency(report.metrics.income)}</strong>
                </div>
                <div className="cube-card">
                  <span>Expense</span>
                  <strong>{formatCurrency(report.metrics.expense)}</strong>
                </div>
                <div className="cube-card">
                  <span>Savings</span>
                  <strong>{formatCurrency(report.metrics.savings)}</strong>
                </div>
              </div>
            </article>

            <div className="split-grid">
              <article className="glass-card stack-card">
                <div className="panel-head">
                  <p className="eyebrow">Feature 1</p>
                  <h2>Insights Generator</h2>
                </div>
                <div className="bullet-stack">
                  {report.insights.map((item) => (
                    <div className="insight-tile" key={item}>
                      {item}
                    </div>
                  ))}
                </div>
              </article>

              <article className="glass-card stack-card">
                <div className="panel-head">
                  <p className="eyebrow">Feature 2</p>
                  <h2>Improvement Suggestions</h2>
                </div>
                <div className="bullet-stack">
                  {report.suggestions.map((item) => (
                    <div className="insight-tile highlight" key={item}>
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <article className="glass-card stack-card">
              <div className="panel-head">
                <p className="eyebrow">Spend Analysis</p>
                <h2>Top categories</h2>
              </div>
              <div className="category-stack">
                {report.top_categories.map((item, index) => (
                  <div className="category-row" key={item.category}>
                    <div className="category-topline">
                      <strong>{item.category}</strong>
                      <span>
                        {formatCurrency(item.amount)} - {item.ratio}%
                      </span>
                    </div>
                    <div className="category-track">
                      <div
                        className={`category-fill tone-${index + 1}`}
                        style={{ width: `${Math.min(item.ratio, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="side-column">
            <article className="glass-card stack-card">
              <div className="panel-head">
                <p className="eyebrow">Feature 3</p>
                <h2>What-if Simulator</h2>
              </div>

              <div className="slider-stack">
                <label className="slider-block">
                  <div className="slider-topline">
                    <span>Reduce spending</span>
                    <strong>{formatCurrency(simulator.spendingReduction)}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="500"
                    value={simulator.spendingReduction}
                    onChange={(event) =>
                      setSimulator((current) => ({ ...current, spendingReduction: Number(event.target.value) }))
                    }
                  />
                </label>

                <label className="slider-block">
                  <div className="slider-topline">
                    <span>Increase savings</span>
                    <strong>{formatCurrency(simulator.savingsBoost)}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="500"
                    value={simulator.savingsBoost}
                    onChange={(event) =>
                      setSimulator((current) => ({ ...current, savingsBoost: Number(event.target.value) }))
                    }
                  />
                </label>

                <label className="slider-block">
                  <div className="slider-topline">
                    <span>Fix missed payments</span>
                    <strong>{simulator.missedPaymentsFixed}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(report.metrics.missed_payments, 2)}
                    step="1"
                    value={simulator.missedPaymentsFixed}
                    onChange={(event) =>
                      setSimulator((current) => ({ ...current, missedPaymentsFixed: Number(event.target.value) }))
                    }
                  />
                </label>

                <label className="slider-block">
                  <div className="slider-topline">
                    <span>Increase income</span>
                    <strong>{formatCurrency(simulator.incomeBoost)}</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20000"
                    step="1000"
                    value={simulator.incomeBoost}
                    onChange={(event) =>
                      setSimulator((current) => ({ ...current, incomeBoost: Number(event.target.value) }))
                    }
                  />
                </label>
              </div>

              <div className="projection-card">
                <span>Predicted score after improvements</span>
                <strong>{scenario.nextScore}</strong>
                <span>{scenario.delta >= 0 ? `+${scenario.delta}` : scenario.delta} points from current score</span>
              </div>
            </article>

            <article className="glass-card stack-card">
              <div className="panel-head">
                <p className="eyebrow">Model Signal</p>
                <h2>Feature importance</h2>
              </div>
              <div className="signal-stack">
                {Object.entries(report.feature_importance)
                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                  .slice(0, 5)
                  .map(([key, value]) => (
                    <div className="signal-row" key={key}>
                      <span>{key}</span>
                      <strong>{value.toFixed(3)}</strong>
                    </div>
                  ))}
              </div>
            </article>

            <article className="glass-card stack-card">
              <div className="panel-head">
                <p className="eyebrow">Accuracy Panel</p>
                <h2>Report confidence</h2>
              </div>
              <div className="confidence-ring">
                <div className="ring-core">{report.analysis_accuracy}%</div>
              </div>
              <p className="confidence-copy">
                This accuracy score is based on input coverage and signal richness from the uploaded CSV.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
