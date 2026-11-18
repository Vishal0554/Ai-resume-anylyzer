const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  } else {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Lightweight in-memory rate limit. Use a shared store if deploying multiple instances.
const requestCounts = new Map();
app.use("/api", (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = requestCounts.get(key);
  if (!entry || now - entry.startedAt > 60_000) {
    requestCounts.set(key, { startedAt: now, count: 1 });
    return next();
  }
  entry.count += 1;
  if (entry.count > 15) return res.status(429).json({ error: "Too many requests. Please try again in a minute." });
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext)) return cb(new Error("Only PDF, DOCX, and TXT files are supported."));
    cb(null, true);
  }
});

const hardSkills = [
  "JavaScript", "TypeScript", "Python", "React", "Node.js", "Express",
  "Machine Learning", "Data Science", "SQL", "Java", "Git", "Docker",
  "C++", "C#", "AWS", "Azure", "HTML", "CSS", "MongoDB", "PostgreSQL",
  "TensorFlow", "PyTorch", "REST API", "Linux", "Kubernetes", "Excel"
];
const softSkills = [
  "leadership", "communication", "teamwork", "public speaking",
  "problem solving", "adaptability", "creativity", "time management",
  "collaboration", "critical thinking"
];
const actionVerbs = ["led", "developed", "managed", "designed", "implemented", "created", "improved", "built", "automated", "delivered"];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function hasTerm(text, term) {
  const normalized = String(text || "").toLowerCase();
  const escaped = escapeRegex(term.toLowerCase());
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(normalized);
}
function findMatches(terms, text) {
  return terms.filter((term) => hasTerm(text, term));
}
function analyzeResume(resumeText, jobDescription = "") {
  const text = String(resumeText || "").trim();
  const jd = String(jobDescription || "").trim();
  const matchedHardSkills = findMatches(hardSkills, text);
  const matchedSoftSkills = findMatches(softSkills, text);
  const jobSkills = jd ? findMatches(hardSkills, jd) : [];
  const matchedJobSkills = jobSkills.filter((skill) => hasTerm(text, skill));
  const missingJobSkills = jobSkills.filter((skill) => !hasTerm(text, skill));

  const sections = {
    contact: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) || /\b(linkedin\.com|github\.com)\b/i.test(text),
    education: /\b(b\.?tech|bachelor|master|degree|university|college|bsc|m\.?tech|mba|ph\.?d)\b/i.test(text),
    experience: /\b(experience|internship|employment|work history|professional experience)\b/i.test(text),
    projects: /\b(projects?|portfolio)\b/i.test(text),
    skills: matchedHardSkills.length > 0
  };
  const sectionScore = Object.values(sections).filter(Boolean).length / Object.keys(sections).length;
  const keywordScore = jobSkills.length ? matchedJobSkills.length / jobSkills.length : Math.min(matchedHardSkills.length / 8, 1);
  const score = Math.round((keywordScore * 0.7 + sectionScore * 0.3) * 100);

  const feedback = [];
  feedback.push(matchedHardSkills.length
    ? `Hard skills found: ${matchedHardSkills.join(", ")}`
    : "Add a clearly labeled technical skills section with relevant skills.");
  feedback.push(matchedSoftSkills.length
    ? `Soft skills found: ${matchedSoftSkills.join(", ")}`
    : "Add relevant soft skills and demonstrate them through examples.");
  if (!sections.contact) feedback.push("Add a professional email address and relevant LinkedIn or GitHub profile.");
  if (!sections.education) feedback.push("Add your education, institution, degree, and graduation details.");
  if (!sections.experience) feedback.push("Add internship or work experience; include responsibilities and outcomes.");
  if (!sections.projects) feedback.push("Add 2–3 relevant projects with your role, tools, and measurable outcomes.");
  if (jobSkills.length) {
    feedback.push(`Job description skills matched: ${matchedJobSkills.length}/${jobSkills.length}.`);
    if (missingJobSkills.length) feedback.push(`Consider adding evidence for these job skills if you genuinely have them: ${missingJobSkills.join(", ")}.`);
  } else if (jd) {
    feedback.push("No supported technical keywords were detected in the job description. Add specific required skills to improve matching.");
  } else {
    feedback.push("Add a job description to get a role-specific keyword match.");
  }

  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 150) feedback.push("The resume is very short; consider adding relevant project and experience details.");
  if (words > 1000) feedback.push("Consider shortening the resume and prioritizing role-relevant information.");
  const verbCount = actionVerbs.reduce((sum, verb) => sum + (text.match(new RegExp(`\\b${verb}\\b`, "gi")) || []).length, 0);
  if (verbCount < 3) feedback.push("Use strong action verbs and describe the impact of your work.");
  if (!/\b\d+%?\b/.test(text)) feedback.push("Add genuine measurable results where possible (numbers, time saved, scale, or percentages).");

  return {
    score,
    scoreLabel: jd ? "Job Description Match" : "Resume Completeness",
    matchedHardSkills,
    matchedSoftSkills,
    jobSkills,
    matchedJobSkills,
    missingJobSkills,
    sections,
    feedback,
    wordCount: words
  };
}
function validateFileSignature(file) {
  const ext = (file.originalname.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return file.buffer.subarray(0, 5).toString() === "%PDF-";
  if (ext === "docx") return file.buffer.subarray(0, 2).toString() === "PK";
  return ext === "txt" && !file.buffer.includes(0);
}
async function extractText(file) {
  const ext = file.originalname.split(".").pop().toLowerCase();
  if (ext === "pdf") {
    const parsed = await pdfParse(file.buffer);
    let text = parsed.text || "";
    if (!text.trim()) {
      const result = await Tesseract.recognize(file.buffer, "eng");
      text = result.data.text || "";
    }
    return text;
  }
  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || "";
  }
  return file.buffer.toString("utf8");
}

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.post("/api/upload", upload.single("resume"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Please select a resume file." });
  if (!validateFileSignature(req.file)) return res.status(400).json({ error: "The file content does not match its extension. Please upload a valid PDF, DOCX, or TXT file." });
  try {
    const resumeText = (await extractText(req.file)).replace(/\u0000/g, "").trim();
    if (!resumeText) return res.status(422).json({ error: "No readable text found. Try a text-based PDF, DOCX, or TXT file." });
    const analysis = analyzeResume(resumeText, req.body.jobDescription || "");
    return res.json({
      message: "Resume analyzed successfully",
      extractedText: resumeText.slice(0, 1200),
      ...analysis
    });
  } catch (error) {
    console.error("Resume processing failed:", error.message);
    return res.status(422).json({ error: "Could not read this resume. Please try another supported file." });
  }
});
app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File is too large. Maximum allowed size is 5 MB." });
  }
  if (error) return res.status(400).json({ error: error.message || "Invalid request." });
  return res.status(500).json({ error: "Internal server error." });
});

if (require.main === module) app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
module.exports = { app, analyzeResume, validateFileSignature };
