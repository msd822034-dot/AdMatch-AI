# AdMatch AI — Python FastAPI Service (Local Architecture Reference)

This directory provides the standalone FastAPI + Pydantic + BeautifulSoup + SQLAlchemy architecture for the PS-03 Ad-to-Landing-Page Message Match Auditor.

## Prerequisites
- Python 3.10+
- PostgreSQL (optional for persistent DB; defaults to SQLite/in-memory)

## Installation & Running Locally

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables in `.env`:
```env
GEMINI_API_KEY="your-gemini-api-key"
DATABASE_URL="postgresql://user:password@localhost:5432/admatch"
```

4. Run the development server:
```bash
uvicorn main:app --reload --port 8000
```

5. Run test suite:
```bash
pytest tests/ -v
```
Interactive OpenAPI documentation will be accessible at: `http://localhost:8000/docs`
