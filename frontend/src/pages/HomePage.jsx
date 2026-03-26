import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { uploadCsvFile } from "../lib/api";

const REQUIREMENTS = [
  "Upload a CSV with date, amount, type, and category columns."
];

const SAMPLE_CSV = `date,amount,type,category
2026-03-01,52000,credit,salary
2026-03-03,14000,debit,rent
2026-03-05,2800,debit,food
2026-03-08,2200,debit,shopping
2026-03-12,4500,credit,freelance
2026-03-16,0,debit,missed_payment
2026-03-20,1300,debit,bills`;

export default function HomePage() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Upload your CSV file to generate the credit dashboard.");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-panel, .upload-panel", {
        y: 36,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out"
      });

      gsap.from(".floating-orb", {
        y: 30,
        opacity: 0,
        scale: 0.8,
        stagger: 0.1,
        duration: 1,
        ease: "power2.out"
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const downloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sample.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setMessage("Please choose a CSV file first.");
      return;
    }

    setLoading(true);
    setMessage("Uploading file and generating analysis...");

    try {
      const report = await uploadCsvFile(selectedFile);
      sessionStorage.setItem("creditDashboardReport", JSON.stringify(report));
      navigate("/output", { state: { report } });
    } catch (error) {
      setMessage(
        error.message.includes("Failed to fetch")
          ? "File selected, but the backend is not reachable. Start the FastAPI server and try again."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scene-shell" ref={rootRef}>
      <div className="background-grid" />
      <div className="floating-orb orb-one" />
      <div className="floating-orb orb-two" />

      <main className="page-shell">
        <section className="hero-layout">
          <article className="glass-card hero-panel">
            <p className="eyebrow">AI Financial Intelligence Platform For Credit Decisions</p>
            <h1 className="hero-title">Turn transaction intelligence into confident credit decisions.</h1>
            <p className="hero-copy">
              We help lenders assess risk faster and help users become more creditworthy by transforming transaction
              behavior into explainable scoring, AI-driven insights, and improvement pathways.
            </p>

            <div className="feature-grid">
              <div className="feature-card">
                <span>Decision speed</span>
                <strong>From raw CSV to lender-ready insights in minutes</strong>
              </div>
              <div className="feature-card">
                <span>Explainability</span>
                <strong>Transparent drivers behind every score and recommendation</strong>
              </div>
              <div className="feature-card">
                <span>Borrower growth</span>
                <strong>Practical pathways to improve creditworthiness over time</strong>
              </div>
            </div>
          </article>

          <article className="glass-card upload-panel">
            <div className="panel-head">
              <p className="eyebrow">Transaction Intake</p>
              <h2>Upload transaction data for decision intelligence</h2>
            </div>

            <label
              className={`upload-dropzone ${dragging ? "active" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  setMessage(`${file.name} selected and ready to upload.`);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    setMessage(`${file.name} selected and ready to upload.`);
                  }
                }}
              />
              <div>
                <strong>Choose or drop a CSV file</strong>
                <p>The file is uploaded as-is. No direct parsing happens on the home page.</p>
                {selectedFile ? <div className="file-pill">{selectedFile.name}</div> : null}
              </div>
            </label>

            <div className="upload-actions">
              <button
                className="secondary-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose CSV
              </button>
              {selectedFile ? <div className="file-pill">{selectedFile.name}</div> : null}
            </div>

            <button className="primary-btn large" disabled={loading} onClick={handleSubmit}>
              {loading ? "Generating dashboard..." : "Process to Output"}
            </button>

            <p className="status-text">{message}</p>

            <div className="instruction-list">
              <div className="instruction-item">{REQUIREMENTS[0]}</div>
            </div>

            <div className="sample-card">
              <div className="sample-head">
                <div>
                  <p className="eyebrow">Sample CSV</p>
                  <h3>Use a ready sample file</h3>
                </div>
                <button className="secondary-btn" type="button" onClick={downloadSampleCsv}>
                  Download sample.csv
                </button>
              </div>

              <pre className="sample-preview">{SAMPLE_CSV}</pre>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
