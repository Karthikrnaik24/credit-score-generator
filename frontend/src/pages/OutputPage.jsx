import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { jsPDF } from "jspdf";
import {
  buildPredictedScenario,
  formatCurrency,
  getDecisionReasons,
  getRecommendedLoan,
  getRiskPresentation,
  simulateScore
} from "../lib/reportUtils";

function SpendingLineChart({ items }) {
  if (!items?.length) {
    return <p className="status-text">No spending data available for the chart.</p>;
  }

  const visiblePoints = Math.min(5, items.length);
  const [windowStart, setWindowStart] = useState(0);
  const windowItems = items.slice(windowStart, windowStart + visiblePoints);
  const width = 320;
  const height = 140;
  const padding = 18;
  const maxValue = Math.max(...windowItems.map((item) => item.amount), 1);
  const stepX = windowItems.length > 1 ? (width - padding * 2) / (windowItems.length - 1) : 0;
  const points = windowItems.map((item, index) => {
    const x = padding + index * stepX;
    const y = height - padding - (item.amount / maxValue) * (height - padding * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="chart-wrap">
      <div className="chart-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="spending-chart"
          style={{ width: `${width}px`, height: `${height}px` }}
          role="img"
          aria-label="Spending line chart"
        >
          <defs>
            <linearGradient id="spendingLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff37d1" />
              <stop offset="100%" stopColor="#2ee6c5" />
            </linearGradient>
          </defs>
          <path d={path} fill="none" stroke="url(#spendingLine)" strokeWidth="4" strokeLinecap="round" />
          {points.map((point) => (
            <g key={point.date}>
              <circle cx={point.x} cy={point.y} r="4.5" fill="#ffffff" />
              <text x={point.x} y={height - 4} textAnchor="middle" className="chart-label-small">
                {point.date}
              </text>
              <text x={point.x} y={point.y - 10} textAnchor="middle" className="chart-value-small">
                {Math.round(point.amount)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      {items.length > visiblePoints ? (
        <div className="chart-slider-wrap">
          <input
            className="chart-slider"
            type="range"
            min="0"
            max={items.length - visiblePoints}
            step="1"
            value={windowStart}
            onChange={(event) => setWindowStart(Number(event.target.value))}
          />
        </div>
      ) : null}
    </div>
  );
}

function addWrappedLines(doc, text, x, y, maxWidth, lineHeight = 7) {
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line, index) => {
    doc.text(line, x, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

function downloadReport(report, projectedScore) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = 20;

  doc.setFillColor(11, 17, 32);
  doc.roundedRect(margin, 12, pageWidth - margin * 2, 36, 6, 6, "F");
  doc.setTextColor(245, 247, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("AI Financial Intelligence Platform", margin + 8, 24);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Credit Decision Summary", margin + 8, 32);
  doc.text(`File: ${report.file_name}`, margin + 8, 39);

  y = 58;
  const cards = [
    { label: "Current Score", value: String(report.credit_score) },
    { label: "Predicted Score", value: String(projectedScore) },
    { label: "Risk Level", value: getRiskPresentation(report.credit_score).label },
    { label: "Confidence", value: `${report.analysis_accuracy}%` }
  ];

  cards.forEach((item, index) => {
    const cardX = margin + index * 43;
    doc.setFillColor(246, 244, 255);
    doc.roundedRect(cardX, y, 38, 24, 4, 4, "F");
    doc.setTextColor(98, 106, 135);
    doc.setFontSize(8);
    doc.text(item.label, cardX + 4, y + 7);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(item.value, cardX + 4, y + 16);
  });

  y += 34;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text("Behavioral Analysis", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  report.insights.forEach((item, index) => {
    y = addWrappedLines(doc, `${index + 1}. ${item}`, margin, y, pageWidth - margin * 2);
    y += 2;
  });

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Action Plan", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  report.suggestions.forEach((item, index) => {
    y = addWrappedLines(doc, `${index + 1}. ${item}`, margin, y, pageWidth - margin * 2);
    y += 2;
  });

  if (y > pageHeight - 60) {
    doc.addPage();
    y = 20;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Top Spending Categories", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  report.top_categories.slice(0, 5).forEach((item) => {
    doc.text(`${item.category}: ${formatCurrency(item.amount)} (${item.ratio}%)`, margin, y);
    y += 6;
  });

  doc.save("credit-summary.pdf");
}

export default function OutputPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const rootRef = useRef(null);

  const report = useMemo(() => {
    if (location.state?.report) return location.state.report;
    try {
      return JSON.parse(sessionStorage.getItem("creditDashboardReport") || "null");
    } catch {
      return null;
    }
  }, [location.state]);

  const [simulator, setSimulator] = useState(() => buildPredictedScenario(report));
  const deferredSimulator = useDeferredValue(simulator);

  useEffect(() => {
    if (!report) navigate("/");
  }, [navigate, report]);

  useEffect(() => {
    if (report) setSimulator(buildPredictedScenario(report));
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
  const risk = useMemo(() => getRiskPresentation(report?.credit_score || 0), [report]);
  const projectedRisk = useMemo(() => getRiskPresentation(scenario.nextScore), [scenario.nextScore]);
  const recommendedLoan = useMemo(() => getRecommendedLoan(report?.metrics || {}, report?.credit_score || 0), [report]);
  const decisionReasons = useMemo(() => (report ? getDecisionReasons(report) : []), [report]);

  if (!report) return null;

  return (
    <div className="scene-shell output-scene" ref={rootRef}>
      <div className="background-grid" />
      <div className="floating-orb orb-three" />
      <div className="floating-orb orb-four" />

      <main className="page-shell">
        <div className="page-topbar">
          <div>
            <p className="eyebrow">AI Financial Intelligence Platform For Credit Decisions</p>
            <h1 className="dashboard-title">Credit decision intelligence dashboard</h1>
          </div>
          <div className="topbar-actions">
            <div className="view-toggle">
              <button className="toggle-btn active" type="button">User View</button>
              <button className="toggle-btn" type="button" onClick={() => navigate("/lender", { state: { report } })}>
                Lender View
              </button>
            </div>
            <button className="secondary-btn" onClick={() => navigate("/")}>Back</button>
            <button className="primary-btn" onClick={() => downloadReport(report, scenario.nextScore)}>Download Summary</button>
          </div>
        </div>

        <section className="dashboard-grid">
          <div className="main-column">
            <article className="glass-card score-stage">
              <div className="score-stage-copy">
                <p className="eyebrow">Credit Score</p>
                <div className="mega-score">{report.credit_score}</div>
                <div className="score-badges">
                  <span className="score-chip accent" style={{ color: risk.color }}>{risk.label}</span>
                  <span className="score-chip">Accuracy {report.analysis_accuracy}%</span>
                  <span className="score-chip">{report.llm_enabled ? "OpenAI insights active" : "Rule engine fallback"}</span>
                </div>
              </div>

              <div className="score-cubes">
                <div className="cube-card"><span>Income</span><strong>{formatCurrency(report.metrics.income)}</strong></div>
                <div className="cube-card"><span>Expense</span><strong>{formatCurrency(report.metrics.expense)}</strong></div>
                <div className="cube-card"><span>Savings</span><strong>{formatCurrency(report.metrics.savings)}</strong></div>
              </div>
            </article>

            <article className="glass-card stack-card">
              <div className="panel-head">
                <p className="eyebrow">Decision Panel</p>
                <h2>Credit decision summary</h2>
              </div>
              <div className="decision-grid">
                <div className="decision-card"><span>Loan Eligibility</span><strong>{risk.loanEligibility}</strong></div>
                <div className="decision-card"><span>Recommended Loan Amount</span><strong>{formatCurrency(recommendedLoan)}</strong></div>
                <div className="decision-card"><span>Decision</span><strong>{risk.decision}</strong></div>
              </div>
              <div className="bullet-stack">
                {decisionReasons.map((item) => <div className="insight-tile" key={item}>{item}</div>)}
              </div>
            </article>

            <div className="split-grid">
              <article className="glass-card stack-card">
                <div className="panel-head"><p className="eyebrow">Behavioral Lens</p><h2>Behavioral Analysis</h2></div>
                <div className="bullet-stack">
                  {report.insights.map((item) => <div className="insight-tile" key={item}>{item}</div>)}
                </div>
              </article>

              <article className="glass-card stack-card">
                <div className="panel-head"><p className="eyebrow">Next Best Moves</p><h2>Action Plan</h2></div>
                <div className="bullet-stack">
                  {report.suggestions.map((item) => <div className="insight-tile highlight" key={item}>{item}</div>)}
                </div>
              </article>
            </div>

            <article className="glass-card stack-card">
              <div className="panel-head"><p className="eyebrow">Spend Analysis</p><h2>Top categories</h2></div>
              <div className="category-stack">
                {report.top_categories.map((item, index) => (
                  <div className="category-row" key={item.category}>
                    <div className="category-topline">
                      <strong>{item.category}</strong>
                      <span>{formatCurrency(item.amount)} - {item.ratio}%</span>
                    </div>
                    <div className="category-track">
                      <div className={`category-fill tone-${index + 1}`} style={{ width: `${Math.min(item.ratio, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="side-column">
            <article className="glass-card stack-card">
              <div className="panel-head"><p className="eyebrow">Scenario Modeling</p><h2>What-if Simulator</h2></div>
              <div className="slider-stack">
                <label className="slider-block">
                  <div className="slider-topline"><span>Reduce spending</span><strong>{formatCurrency(simulator.spendingReduction)}</strong></div>
                  <input type="range" min="0" max="10000" step="500" value={simulator.spendingReduction} onChange={(e) => setSimulator((c) => ({ ...c, spendingReduction: Number(e.target.value) }))} />
                </label>
                <label className="slider-block">
                  <div className="slider-topline"><span>Increase savings</span><strong>{formatCurrency(simulator.savingsBoost)}</strong></div>
                  <input type="range" min="0" max="10000" step="500" value={simulator.savingsBoost} onChange={(e) => setSimulator((c) => ({ ...c, savingsBoost: Number(e.target.value) }))} />
                </label>
                <label className="slider-block">
                  <div className="slider-topline"><span>Fix missed payments</span><strong>{simulator.missedPaymentsFixed}</strong></div>
                  <input type="range" min="0" max={Math.max(report.metrics.missed_payments, 2)} step="1" value={simulator.missedPaymentsFixed} onChange={(e) => setSimulator((c) => ({ ...c, missedPaymentsFixed: Number(e.target.value) }))} />
                </label>
                <label className="slider-block">
                  <div className="slider-topline"><span>Increase income</span><strong>{formatCurrency(simulator.incomeBoost)}</strong></div>
                  <input type="range" min="0" max="20000" step="1000" value={simulator.incomeBoost} onChange={(e) => setSimulator((c) => ({ ...c, incomeBoost: Number(e.target.value) }))} />
                </label>
              </div>
              <div className="projection-card">
                <span>Predicted score after improvements</span>
                <strong>{scenario.nextScore}</strong>
                <span>{scenario.delta >= 0 ? `+${scenario.delta}` : scenario.delta} points from current score</span>
                <span style={{ color: projectedRisk.color }}>{projectedRisk.label}</span>
              </div>
            </article>

            <article className="glass-card stack-card">
              <div className="panel-head"><p className="eyebrow">Model Signal</p><h2>Risk Drivers</h2></div>
              <div className="signal-stack">
                {Object.entries(report.feature_importance).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 5).map(([key, value]) => (
                  <div className="signal-row" key={key}><span>{key}</span><strong>{value.toFixed(3)}</strong></div>
                ))}
              </div>
            </article>

            <article className="glass-card stack-card">
              <div className="panel-head"><p className="eyebrow">Spending Pattern</p><h2>Date-wise spending trend</h2></div>
              <SpendingLineChart items={report.spend_timeline} />
              <p className="confidence-copy">This line chart tracks debit spending across transaction dates from the uploaded CSV.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
