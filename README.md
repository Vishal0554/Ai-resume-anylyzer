# AI Resume Analyzer

A React + Vite frontend and Express backend for reviewing resume sections, extracting text, and comparing detected technical skills with a pasted job description.

## Features

- Supports PDF, DOCX, and TXT resumes.
- Extracts text from PDF and DOCX files; attempts OCR for image-only PDFs.
- Compares skills detected in the resume with technical skills detected in the job description.
- Shows missing skills, resume section checks, and practical suggestions.
- Accessible labels, keyboard focus styles, status announcements, and responsive layout.
- Upload validation, 5 MB file limit, in-memory file processing, security headers, restricted CORS, and a basic per-process API rate limit.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

The Vite frontend runs at `http://localhost:5173`; the Express API runs at `http://localhost:5001`.

## Checks

```bash
npm test
npm run lint
npm run build
npm audit
```

Review and resolve dependency audit findings before production deployment. The in-memory rate limiter is suitable only for a single server process; use a shared store for multiple instances.

## Deployment

The frontend and backend need to be deployed separately unless you add a serverless API adapter.

### Backend (Render)

1. Create a new **Web Service** and connect this repository.
2. Set the root directory to the repository root.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variable `ALLOWED_ORIGINS` with the exact deployed frontend origin, for example `https://your-project.vercel.app`.
6. Deploy and copy the backend service URL, e.g. `https://your-api.onrender.com`.

### Frontend (Vercel)

1. Import the same GitHub repository into Vercel.
2. Framework preset: **Vite**; build command: `npm run build`; output directory: `dist`.
3. Add environment variable `VITE_API_BASE_URL` with the backend URL from Render, without a trailing slash.
4. Deploy. Add the final Vercel origin to the backend's `ALLOWED_ORIGINS` variable and redeploy the backend.

For local development, Vite proxies `/api` requests to `http://localhost:5001`.

## Scoring note

The displayed percentage is a transparent heuristic based on detected technical keywords and resume sections. With a job description, it is a keyword-match/completeness indicator, not an ATS certification, hiring probability, or prediction of selection. It does not understand skill proficiency or context. Candidates should only list skills they genuinely possess.

## Privacy

Resume files are processed in memory and are not written to the repository's `uploads/` directory. Avoid committing real resumes, API keys, credentials, or `.env` files. If real resumes were previously pushed to a public Git repository, remove them from the repository and consider the exposure before treating them as private; deleting a file in a new commit does not erase prior Git history.
