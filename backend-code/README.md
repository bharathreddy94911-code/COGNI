# 🏦 Loan Document Processing Agent — Backend Engine

FastAPI-powered multi-agent backend for automated loan document classification, extraction, validation, and underwriting.

---

## 🧠 Multi-Agent Architecture

```text
       Document Upload (PDF / DOC / DOCX / Scanned)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 1: Document Classification Agent                     │
│  - OCR & Text Extraction (PyPDF / Tesseract)                │
│  - Slot matching & "Wrong Document Type" detection          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 2: Data Extraction Agent                             │
│  - Extracts structured entities (PII, financial amounts)    │
│  - Fallback to local Ollama LLMs for semantic extraction    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 3: Document Validation Agent                         │
│  - Mandatory field completeness verification                │
│  - Format & regex validity (PAN, IFSC, GSTIN, Dates)        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 4: Cross-Document Consistency Agent                  │
│  - Applicant name, DOB, and PAN matching across docs        │
│  - Address consistency scoring & entity resolution          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 5: Fraud & Anomaly Detection Agent                   │
│  - Cryptographic SHA-256 duplicate detection                │
│  - PDF metadata tampering & anomaly screening               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 6: Underwriting & Decisioning Agent                  │
│  - Automated loan eligibility & affordability assessment    │
│  - Interactive decision graph generation                    │
│  - Formal PDF Underwriting Report export                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python -u main.py
```

* **API Base URL**: `http://127.0.0.1:8000`
* **Interactive Swagger Documentation**: `http://127.0.0.1:8000/docs`
* **Alternative ReDoc**: `http://127.0.0.1:8000/redoc`