# AdMatch AI — Ad-to-Landing-Page Message Match Auditor (PS-03)

> **"Every Ad Promise. Verified Against the Page."**

AdMatch AI is an ad-to-landing-page message match auditor designed to eliminate high bounce rates caused by broken advertising promises. It systematically compares ad copy headlines, descriptions, CTAs, and promotional offers against canonical landing-page content.

---

## Key Capabilities & PS-03 Specifications

- **Deterministic Message-Match Score (0 to 100)**: Transparent, weighted rubric (Promise Alignment: 30%, Offer & Price Consistency: 25%, Claim Support: 20%, CTA Consistency: 15%, Content Prominence: 10%).
- **Strict Evidence Grounding & Anti-Hallucination**: Every quoted passage is deterministically verified against the extracted DOM text using exact substring and normalized matching. Non-existent quotes are rejected immediately and flagged as hallucinations.
- **Position & Prominence Awareness**: Classifies evidence across `Above the Fold / Hero`, `Primary Content`, `Secondary Content`, `FAQ or Supporting`, and `Footer`. Promises buried in the footer receive prominence penalties.
- **Compliance & Claim-Risk Warnings**: Detects high-risk claims in regulated categories (guaranteed loan approvals, risk-free investment returns, medical guarantees, missing trial cancellation terms, unsubstantiated superlatives).
- **Grounded Rewritten Copy Suggestions**: Generates alternative ad copy strictly grounded in verified landing page copy.
- **Offline Snapshots & Live Fetching**: Works 100% offline with uploaded HTML snapshots, ZIP archives, or pasted text. Safe live URL fetching is protected by a strict SSRF guard blocking localhost, loopback, private ranges, link-local metadata endpoints (`169.254.169.254`), and script execution.
- **Batch Processing**: Supports CSV uploads of up to 60 pairs with independent row resilience.
- **Report Exports**: Downloadable/printable PDF reports, CSV finding logs, and structured JSON files.
- **12 Automated Acceptance Tests**: Interactive test runner for all 12 PS-03 acceptance criteria.
- **Bilingual Interface**: Full English and Tamil (`ta`) localization.

---

## Architecture Overview

```
├── server.ts                       # Express full-stack entry point (port 3000)
├── server/
│   ├── services/
│   │   ├── extractor.ts            # Cheerio HTML parser with DOM offset tracking
│   │   ├── ssrf-guard.ts           # SSRF protection, IP/DNS checks, timeout limits
│   │   ├── evidence-verifier.ts    # Deterministic quote verification & anti-hallucination engine
│   │   ├── scoring-engine.ts       # Mathematical 5-category scoring rubric
│   │   ├── compliance-detector.ts  # Regulated & sensitive claims detector
│   │   ├── deterministic-baseline.ts # Offline pattern & lexical matching baseline
│   │   ├── gemini-service.ts       # @google/genai Gemini 3.8 Flash structured analyzer
│   │   └── storage.ts              # Persistent store & 60-benchmark test suite
│   └── acceptance-tests.ts         # 12 PS-03 Acceptance Test Suites
├── src/
│   ├── App.tsx                     # Main React application
│   ├── components/                 # UI components (Navbar, Sidebar, Dashboard, etc.)
│   ├── lib/                        # API client, export generators, i18n
│   └── types.ts                    # Strict TypeScript interfaces
└── backend_fastapi/                # Standalone FastAPI Python reference implementation
    ├── main.py                     # FastAPI application
    ├── schemas.py                  # Pydantic schemas
    └── requirements.txt            # Python dependencies
```

---

## Local Development & Setup

### 1. Run the Fullstack React + Node Application
```bash
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

### 2. Run with FastAPI Backend (Python Reference)
For teams wishing to run the Python FastAPI backend:
```bash
cd backend_fastapi
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Environment Variables

Configured in `.env`:
```env
# Optional: Gemini API key for structured LLM evaluations.
# If omitted, the engine automatically runs the deterministic grounding baseline.
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Development server port
PORT=3000
```

---

## Verification & Automated Tests

To run the automated acceptance test suite directly from the terminal or browser:
- In the web app: Click the **Acceptance Tests** button in the top navigation or sidebar.
- Via API:
```bash
curl -X GET http://localhost:3000/api/run-tests
```
All 12 acceptance tests will execute synchronously and return status reports for each test scenario.
