const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzeResume, validateFileSignature } = require("../server");

test("matches skills mentioned in a job description", () => {
  const result = analyzeResume(
    "Email: vishal@example.com. B.Tech student. Developed a React project using JavaScript and SQL. Projects and internship experience.",
    "We need React, JavaScript, Python and SQL."
  );
  assert.deepEqual(result.matchedJobSkills, ["JavaScript", "React", "SQL"]);
  assert.deepEqual(result.missingJobSkills, ["Python"]);
  assert.equal(result.scoreLabel, "Job Description Match");
  assert.ok(result.score >= 0 && result.score <= 100);
});

test("uses resume completeness label without a job description", () => {
  const result = analyzeResume("B.Tech student with Python and Java projects.");
  assert.equal(result.scoreLabel, "Resume Completeness");
  assert.equal(typeof result.sections.education, "boolean");
});

test("rejects a PDF extension with a non-PDF signature", () => {
  assert.equal(validateFileSignature({
    originalname: "resume.pdf",
    buffer: Buffer.from("not a pdf")
  }), false);
});

test("accepts a PDF signature", () => {
  assert.equal(validateFileSignature({
    originalname: "resume.pdf",
    buffer: Buffer.from("%PDF-1.7 sample")
  }), true);
});

test("does not return a perfect match when no job skills are present", () => {
  const result = analyzeResume("A short resume with an email vishal@example.com", "React Python SQL");
  assert.equal(result.matchedJobSkills.length, 0);
  assert.equal(result.missingJobSkills.length, 3);
});
