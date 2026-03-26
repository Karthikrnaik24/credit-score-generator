import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { formatCurrency } from "../lib/reportUtils";
import { fetchLenderDashboard } from "../lib/api";

export default function LenderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const rootRef = useRef(null);
  const [lenderUsers, setLenderUsers] = useState([]);
  const [status, setStatus] = useState("Loading lender dashboard...");

  const report = useMemo(() => {
    if (location.state?.report) return location.state.report;
    try {
      return JSON.parse(sessionStorage.getItem("creditDashboardReport") || "null");
    } catch {
      return null;
    }
  }, [location.state]);

  useEffect(() => {
    if (!report) navigate("/");
  }, [navigate, report]);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const data = await fetchLenderDashboard();
        if (!active) return;
        setLenderUsers(data.users || []);
        setStatus("");
      } catch (error) {
        if (!active) return;
        setStatus(error.message);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".stack-card, .score-stage", {
        y: 36,
        opacity: 0,
        duration: 0.85,
        stagger: 0.07,
        ease: "power3.out"
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

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
            <h1 className="dashboard-title">Lender decision dashboard</h1>
          </div>
          <div className="topbar-actions">
            <div className="view-toggle">
              <button className="toggle-btn" type="button" onClick={() => navigate("/output", { state: { report } })}>
                User View
              </button>
              <button className="toggle-btn active" type="button">
                Lender View
              </button>
            </div>
            <button className="secondary-btn" onClick={() => navigate("/output", { state: { report } })}>
              Back
            </button>
          </div>
        </div>

        <article className="glass-card stack-card lender-table-card">
          <div className="panel-head">
            <p className="eyebrow">Lender Dashboard</p>
            <h2>10-user credit decision portfolio</h2>
          </div>
          {status ? <p className="status-text">{status}</p> : null}
          {!status ? (
            <div className="lender-table">
              <div className="lender-row lender-header">
                <div className="lender-table-head">User ID</div>
                <div className="lender-table-head">Credit Score</div>
                <div className="lender-table-head">Risk Level</div>
                <div className="lender-table-head">Decision</div>
                <div className="lender-table-head">Recommended Loan</div>
                <div className="lender-table-head">Key Risk Factors</div>
              </div>
              {lenderUsers.map((user) => (
                <div className="lender-row" key={user.user_id}>
                  <div className="lender-cell lender-id">{user.user_id}</div>
                  <div className="lender-cell">{user.credit_score}</div>
                  <div className="lender-cell">{user.risk_level}</div>
                  <div className="lender-cell">{user.decision}</div>
                  <div className="lender-cell">{formatCurrency(user.recommended_loan)}</div>
                  <div className="lender-cell lender-factors">{user.key_risk_factors.join(", ")}</div>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      </main>
    </div>
  );
}
