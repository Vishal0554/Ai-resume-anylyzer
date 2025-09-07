const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const fs = require("fs");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Define keywords
const hardSkills = [
    "JavaScript", "Python", "React", "Node.js",
    "Machine Learning", "Data Science", "SQL",
    "Java", "Git", "Docker", "C++", "C#", "AWS", "Azure"
];

const softSkills = [
    "leadership", "communication", "teamwork", "public speaking",
    "problem solving", "adaptability", "creativity", "time management",
    "collaboration", "critical thinking"
];

const achievements = [
    "award", "recognition", "scholarship", "published", "patent",
    "certified", "winner", "accomplishment", "project completed",
    "hackathon", "seminar", "certificate", "competition", "volunteer"
];

const educations = [
    "bsc", "b.tech", "btech", "mtech", "mba", "msc", "phd", "bachelor", "master", "degree"
];

// Weights
const weights = {
    hardSkills: 0.45,
    softSkills: 0.30,
    education: 0.15,
    achievements: 0.10
};

const minimumRequiredScore = 0.6; // 60%

function countMatches(keywords, text) {
    let count = 0;
    keywords.forEach(keyword => {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
        if (regex.test(text)) count++;
    });
    return count;
}

function selectionProbabilityCalculator(resumeText) {
    const text = resumeText.toLowerCase();

    const hardMatches = countMatches(hardSkills, text);
    const softMatches = countMatches(softSkills, text);
    const eduMatches = countMatches(educations, text);
    const achievementMatches = countMatches(achievements, text);

    const hardFraction = hardMatches / hardSkills.length;
    const softFraction = softMatches / softSkills.length;
    const eduFraction = eduMatches / educations.length;
    const achievementFraction = achievementMatches / achievements.length;

    const totalScore = (hardFraction * weights.hardSkills) +
                       (softFraction * weights.softSkills) +
                       (eduFraction * weights.education) +
                       (achievementFraction * weights.achievements);

    const normalizedScore = Math.min(totalScore / minimumRequiredScore, 1);

    return (normalizedScore * 100).toFixed(2);
}

function feedbackGenerator(resumeText) {
    let feedback = [];
    const text = resumeText.toLowerCase();

    const matchedHard = hardSkills.filter(skill => {
        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
        return regex.test(resumeText);
    });

    const matchedSoft = softSkills.filter(skill => {
        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
        return regex.test(resumeText);
    });

    const matchedEdu = educations.filter(edu => {
        const escapedEdu = edu.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedEdu}\\b`, 'i');
        return regex.test(resumeText);
    });

    const matchedAch = achievements.filter(ach => {
        const escapedAch = ach.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedAch}\\b`, 'i');
        return regex.test(resumeText);
    });

    if (matchedHard.length > 0) {
        feedback.push("✅ Hard skills detected: " + matchedHard.join(", "));
    } else {
        feedback.push("⚠️ Hard skills missing or insufficient.");
    }

    if (matchedSoft.length > 0) {
        feedback.push("✅ Soft skills detected: " + matchedSoft.join(", "));
    } else {
        feedback.push("⚠️ Soft skills missing or insufficient.");
    }

    if (matchedEdu.length > 0) {
        feedback.push("✅ Education qualifications found: " + matchedEdu.join(", "));
    } else {
        feedback.push("⚠️ Education details missing.");
    }

    if (matchedAch.length > 0) {
        feedback.push("✅ Achievements detected: " + matchedAch.join(", "));
    } else {
        feedback.push("⚠️ Achievements missing or not listed.");
    }

    if (text.includes("experience") || text.includes("internship") || text.includes("project")) {
        feedback.push("✅ Work experience or internships mentioned.");
    } else {
        feedback.push("⚠️ No work experience found. Consider adding internships or projects.");
    }

    if (resumeText.includes("@") && (resumeText.includes("gmail.com") || resumeText.includes("linkedin.com"))) {
        feedback.push("✅ Contact details found (Email/LinkedIn).");
    } else {
        feedback.push("⚠️ Contact details missing. Add email and LinkedIn profile.");
    }

    return feedback;
}

function subjectiveSuggestions(text) {
    const suggestions = [];
    const wordCount = text.trim().split(/\s+/).length;

    if (wordCount < 200) {
        suggestions.push("Your resume seems quite brief. Consider adding more details about your projects and responsibilities.");
    } else if (wordCount > 1500) {
        suggestions.push("Your resume is quite long. Try to be concise and highlight only the most relevant experiences.");
    } else {
        suggestions.push("Your resume length looks balanced.");
    }

    const actionVerbs = ["led", "developed", "managed", "designed", "implemented", "created", "improved", "achieved"];
    const actionVerbCount = actionVerbs.reduce((count, verb) => {
        const regex = new RegExp(`\\b${verb}\\b`, 'gi');
        const matches = text.match(regex);
        return count + (matches ? matches.length : 0);
    }, 0);

    if (actionVerbCount < 3) {
        suggestions.push("Try to use more action verbs like 'led', 'developed', or 'managed' to make your achievements stand out.");
    } else {
        suggestions.push("Good use of action verbs to demonstrate your contributions.");
    }

    if (!text.match(/\b(\d+|percent|%)\b/)) {
        suggestions.push("Consider adding quantifiable achievements (numbers, percentages) to strengthen your resume impact.");
    } else {
        suggestions.push("Including measurable achievements boosts the credibility of your experience.");
    }

    const passiveIndicators = text.match(/\bwas\b|\bwere\b|\bbeen\b|\bbeing\b/gi);
    if (passiveIndicators && passiveIndicators.length > 5) {
        suggestions.push("Your resume uses some passive voice constructions. Active voice is usually more engaging and clear.");
    }

    const positiveWords = ["achieved", "successful", "improved", "strong", "effective", "positive", "led", "managed"];
    const negativeWords = ["problem", "failure", "delay", "difficult", "lack"];

    const posCount = positiveWords.reduce((c, w) => c + (text.match(new RegExp(`\\b${w}\\b`, 'gi'))?.length || 0), 0);
    const negCount = negativeWords.reduce((c, w) => c + (text.match(new RegExp(`\\b${w}\\b`, 'gi'))?.length || 0), 0);

    if (negCount > posCount) {
        suggestions.push("Try to keep the tone positive and focus on your strengths and accomplishments.");
    } else {
        suggestions.push("Your resume has a positive and confident tone.");
    }

    if (!text.toLowerCase().includes("objective") && !text.toLowerCase().includes("summary")) {
        suggestions.push("Consider adding a professional summary or objective at the top to quickly highlight your career goals and skills.");
    }

    return suggestions;
}

app.post("/api/upload", upload.single("resume"), async (req, res) => {
    try {
        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        let resumeText = "";

        if (fileExtension === "pdf") {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            resumeText = data.text;

            if (!resumeText.trim()) {
                const ocrResult = await Tesseract.recognize(filePath, 'eng');
                resumeText = ocrResult.data.text;
            }
        } else if (fileExtension === "docx") {
            const data = await mammoth.extractRawText({ path: filePath });
            resumeText = data.value;
        } else if (fileExtension === "txt") {
            resumeText = fs.readFileSync(filePath, "utf8");
        } else {
            return res.status(400).json({ error: "Unsupported file format. Please upload a PDF, DOCX, or TXT file." });
        }

        const probability = selectionProbabilityCalculator(resumeText);
        const feedback = feedbackGenerator(resumeText);
        const subjective = subjectiveSuggestions(resumeText);

        fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete uploaded file:", err);
        });

        res.json({
            message: "Resume analyzed successfully",
            extractedText: resumeText.substring(0, 500) + "...",
            selectionProbability: `${probability}%`,
            feedback: feedback,
            subjectiveSuggestions: subjective
        });

    } catch (error) {
        console.error("Error processing resume:", error);
        res.status(500).json({ error: "Error processing resume" });
    }
});

const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
