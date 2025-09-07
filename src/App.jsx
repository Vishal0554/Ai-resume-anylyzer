import { useState } from "react";
import "./App.css";
import { FaFileUpload, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

function App() {
    const [file, setFile] = useState(null);
    const [responseText, setResponseText] = useState("");
    const [selectionProbability, setSelectionProbability] = useState("");
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(false); // Added loading state

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return alert("Please select a file");

        // Validate file type
        if (file.type !== "application/pdf" && file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && file.type !== "text/plain") {
            return alert("Please upload a valid PDF, DOCX, or TXT file.");
        }

        const formData = new FormData();
        formData.append("resume", file);

        setLoading(true); // Set loading state to true

        try {
            let response = await fetch("/api/upload", { 
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            let data = await response.json();
            setResponseText(data.extractedText);
            setSelectionProbability(data.selectionProbability);
            setFeedback(data.feedback);
        } catch (error) {
            alert("Error uploading file: " + error.message);
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    return (
        <div className="main-container">
            {/* Header */}
            <header className="header">
                <h2>Welcome</h2>
            </header>

            {/* Main Content */}
            <div className="container">
                <h1>📄 AI Resume Analyzer for IT</h1>
                <p className="subheading">Upload your resume to get AI-powered feedback!</p>

                <div className="upload-section">
                    <label className="file-label">
                        <FaFileUpload className="icon" />
                        <input type="file" onChange={handleFileChange} accept=".pdf,.docx,.txt" />
                        {file ? file.name : "Choose File"}
                    </label>
                    <button onClick={handleUpload} disabled={loading}>
                        {loading ? "Uploading..." : "Upload Resume"}
                    </button>
                </div>

                {responseText && (
                    <div className="result">
                        <h2>🔍 Extracted Resume Text:</h2>
                        <p>{responseText}</p>
                    </div>
                )}

                {selectionProbability && (
                    <h2 className="probability">🎯 Selection Probability: {selectionProbability}</h2>
                )}

                {feedback.length > 0 && (
                    <div className="feedback">
                        <h2>💬 Feedback & Suggestions:</h2>
                        <ul>
                            {feedback.map((item, index) => (
                                <li key={index} className={item.includes("✅") ? "positive" : "negative"}>
                                    {item.includes("✅") ? <FaCheckCircle /> : <FaTimesCircle />} {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="footer">
                <p>🚀 Created by <span>vishal</span>, <span>Siddhi</span>, <span>shreyash</span></p>
            </footer>
        </div>
    );
}

export default App;
