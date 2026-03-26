import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { uploadCsvFile } from "../lib/api";

const REQUIREMENTS = [
  "Upload a CSV with date, amount, type, and category columns.",
  "The backend will parse the file and calculate the score.",
  "Insights and suggestions come from rules plus OpenAI when the API key is set.",
  "You can use the output page simulator to test better financial scenarios."
];

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
            <p className="eyebrow">Home Page</p>
            <h1 className="hero-title">Upload one CSV. Get a premium credit intelligence dashboard.</h1>
            <p className="hero-copy">
              The file goes directly to the backend, where the model scores it, SHAP explains it, and OpenAI can
              turn the signals into sharp human insights.
            </p>

            <div className="feature-grid">
              <div className="feature-card">
                <span>Score engine</span>
                <strong>Model + SHAP</strong>
              </div>
              <div className="feature-card">
                <span>Feature 1</span>
                <strong>LLM insights</strong>
              </div>
              <div className="feature-card">
                <span>Feature 2</span>
                <strong>LLM suggestions</strong>
              </div>
            </div>
          </article>

          <article className="glass-card upload-panel">
            <div className="panel-head">
              <p className="eyebrow">CSV Upload</p>
              <h2>Direct backend processing</h2>
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
              {REQUIREMENTS.map((item) => (
                <div className="instruction-item" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
