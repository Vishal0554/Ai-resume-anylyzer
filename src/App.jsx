import { useRef, useState } from "react";
import "./App.css";
import { FaFileUpload, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function App() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setResult(null);
    setError("");
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Please select a resume first.");
      inputRef.current?.focus();
      return;
    }
    const allowedExtensions = /\.(pdf|docx|txt)$/i;
    if (!allowedExtensions.test(file.name)) {
      setError("Please upload a PDF, DOCX, or TXT file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be 5 MB or less.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to analyze this resume.");
      setResult(data);
    } catch (requestError) {
      setError(requestError.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="header">
        <a className="brand" href="/" aria-label="AI Resume Analyzer home">Resume<span>Wise</span></a>
        <span className="header-note">Career-ready insights</span>
      </header>

      <main className="main-content">
        <section className="intro">
          <p className="eyebrow">SMART RESUME REVIEW</p>
          <h1>Make your resume work <span>smarter.</span></h1>
          <p className="subheading">Upload your resume to review key sections, skills, and alignment with a job description.</p>
        </section>

        <form className="analyzer-card" onSubmit={handleUpload}>
          <div className="field-group">
            <label htmlFor="resume-file">Your resume</label>
            <div className="file-picker">
              <input
                ref={inputRef}
                id="resume-file"
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileChange}
                aria-describedby="file-help"
              />
              <p id="file-help" className="field-help">PDF, DOCX or TXT · Maximum 5 MB</p>
              {file && <p className="selected-file" role="status">{file.name}</p>}
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="job-description">Job description <span className="optional">(optional, recommended)</span></label>
            <textarea
              id="job-description"
              rows="5"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the job description here to see which listed technical skills match your resume..."
            />
          </div>

          <button className="analyze-button" type="submit" disabled={loading}>
            <FaFileUpload aria-hidden="true" />
            {loading ? "Analyzing resume..." : "Analyze resume"}
          </button>
          {loading && <p className="status-message" role="status">Your file is being processed. This may take a moment.</p>}
          {error && <p className="error-message" role="alert">{error}</p>}
        </form>

        {result && (
          <section className="results" aria-live="polite" aria-labelledby="results-title">
            <div className="results-heading">
              <div>
                <p className="eyebrow">ANALYSIS COMPLETE</p>
                <h2 id="results-title">Your resume review</h2>
              </div>
              <div className="score" aria-label={`${result.score} percent ${result.scoreLabel}`}>
                <strong>{result.score}%</strong>
                <span>{result.scoreLabel}</span>
              </div>
            </div>

            {result.jobSkills?.length > 0 && (
              <div className="skill-grid">
                <div className="result-panel">
                  <h3>Matched job skills ({result.matchedJobSkills.length})</h3>
                  <p>{result.matchedJobSkills.join(", ") || "No matching listed skills found."}</p>
                </div>
                <div className="result-panel">
                  <h3>Skills to review ({result.missingJobSkills.length})</h3>
                  <p>{result.missingJobSkills.join(", ") || "No missing skills from the detected list."}</p>
                </div>
              </div>
            )}

            <div className="result-panel">
              <h3>Resume sections</h3>
              <ul className="section-list">
                {Object.entries(result.sections || {}).map(([name, found]) => (
                  <li key={name} className={found ? "positive" : "negative"}>
                    {found ? <FaCheckCircle aria-hidden="true" /> : <FaTimesCircle aria-hidden="true" />}
                    <span>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                    <strong>{found ? "Found" : "Not detected"}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="result-panel">
              <h3>Feedback & suggestions</h3>
              <ul className="feedback-list">
                {result.feedback.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
              </ul>
            </div>

            <details className="result-panel extracted-text">
              <summary>View extracted resume text</summary>
              <p>{result.extractedText}</p>
            </details>
            <p className="disclaimer">This score is an automated keyword and section review, not a prediction of hiring or selection. Verify all suggestions and only include skills you genuinely have.</p>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Built by <strong>Vishal, Siddhi &amp; Shreyash</strong></p>
      </footer>
    </div>
  );
}

export default App;
