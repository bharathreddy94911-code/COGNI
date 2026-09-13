# 🏦 Loan Document Processing Agent

An enterprise-grade, multi-agent AI application designed to automate the verification, classification, fraud screening, and underwriting of loan documents across retail and commercial lending products.

---

## 📌 Project Overview

In traditional retail banking, loan processing requires loan officers to manually inspect and verify dozens of documents (PAN cards, bank statements, payslips, ITR/GST returns, collateral papers, etc.). This manual process is time-consuming, repetitive, expensive, and prone to human error.

The **Loan Document Processing Agent** automates this entire pipeline using specialized AI agents, OCR, deterministic business rule engines, and LangChain/LangGraph orchestration to verify uploads in real time against strict underwriting policies.

---

## 🎯 Objectives

* **Automated Classification**: Accurately classify uploaded documents based on layout, text, and structure rather than filename alone.
* **Slot-Based Validation**: Verify whether the uploaded document satisfies the exact requirements of the chosen loan product.
* **Cross-Document Verification**: Cross-verify applicant details (Name, DOB, PAN, Address) across multiple uploaded files.
* **Fraud & Anomaly Detection**: Detect tampered PDFs, duplicate file hashes, and unreadable/corrupted files.
* **Underwriting Decisioning**: Automatically compute loan eligibility, risk tiering, and credit approval status.
* **Role-Based Workflows**: Provide dedicated dashboards for Borrowers, Bank Officers, and Branch Managers.

---

## 🧠 Multi-Agent Architecture

The core system is powered by six collaborative, specialized agents:

```text
       User Upload (PDF / DOC / DOCX / Scanned Document)
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 1: Document Classification Agent                     │
│  - OCR & Text Extraction (PyPDF / Tesseract)                │
│  - High-precision keyword & layout heuristic classifier     │
│  - Slot matching & "Wrong Document Type" detection          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 2: Data Extraction Agent                             │
│  - Extracts structured entities (PII, financial amounts)    │
│  - Fallback to local Ollama LLMs for semantic extraction    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 3: Document Validation Agent                         │
│  - Mandatory field completeness verification                │
│  - Format & regex validity (PAN, IFSC, GSTIN, Dates)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 4: Cross-Document Consistency Agent                  │
│  - Applicant name, DOB, and PAN matching across docs        │
│  - Address consistency scoring & entity resolution          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 5: Fraud & Anomaly Detection Agent                   │
│  - Cryptographic SHA-256 duplicate detection                │
│  - PDF metadata tampering & anomaly screening               │
└──────────────────────────────┬──────────────────────────────┘
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

## 🚀 Key Features

### 1. Document Upload & Multi-Format Parsing
* Supports **PDF**, **DOC**, and **DOCX** formats.
* Integrated OCR pipeline for scanned identity cards and statements.
* Text extraction preserves document layout, headers, and transaction tables.

### 2. Discrete Canonical Document Classification
The system maintains strictly isolated document types to avoid generic misclassification:
* **Identity / KYC**: `pan_card`, `aadhaar_identity`, `passport_identity`, `voter_identity`, `driving_license`, `student_kyc`, `co_applicant_kyc`
* **Banking & Statements**: `bank_statement` (transaction history, balances), `bank_account_document` (passbook, cancelled cheque, verification letter)
* **Deposits**: `fd_statement`, `fixed_deposit_certificate_receipt`
* **Income & Tax**: `payslip`, `salary_certificate`, `form_16`, `itr_gst_return`, `balance_sheet`, `co_applicant_income_proof`, `agricultural_income_proof`
* **Collateral & Securities**: `gold_security_document`, `gold_valuation_report`, `property_title_document`, `land_record`, `vehicle_invoice`

### 3. Pre-Configured Underwriting Policies (10 Loan Types)
Supports tailored document checklists and policy rules for:
1. **Personal Loan** (`personal_loan`)
2. **Home Loan** (`home_loan`)
3. **Vehicle Loan** (`vehicle_loan`)
4. **Education Loan** (`education_loan`)
5. **Business Loan** (`business_loan`)
6. **Gold Loan** (`gold_loan`)
7. **Loan Against Property** (`lap_loan`)
8. **Agriculture Loan** (`agri_loan`)
9. **Loan Against Fixed Deposit** (`fd_loan`)
10. **Consumer Durable Loan** (`consumer_durable_loan`)

### 4. Real-Time Slot Validation & Error Handling
* **Exact Slot Matching**: Evaluates whether an uploaded document matches the required slot (e.g. uploading a PAN Card in a Bank Statement slot flags `WRONG DOCUMENT TYPE`).
* **Informative Feedback**: Clear messaging explaining expected vs. detected document types.
* **State Isolation**: Every upload is evaluated independently without stale-state pollution or cached carry-over.

### 5. Automated Underwriting & Auditability
* **Eligibility Assessment**: Generates credit decision graphs, telemetry metrics, and approval/rejection recommendations.
* **Audit Trail**: Full event logging stored in SQLite.
* **PDF Report Generation**: Downloadable formal Credit & Document Verification reports (`/api/applications/{id}/report/pdf`).

---

## 🛠️ Technology Stack

* **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons
* **Backend**: Python 3.13, FastAPI, Uvicorn, SQLite, SQLAlchemy
* **Agentic Framework**: LangChain, LangGraph, Ollama LLM integration
* **Document Processing & OCR**: `pypdf`, `pdfplumber`, `python-docx`, Tesseract OCR
* **Authentication**: JWT-based authentication with Role-Based Access Control (RBAC: Customer, Employee, Manager)

---

## 📁 Project Structure

```text
COGNIZANT-FINAL-2/
│
├── backend-code/
│   ├── main.py                     # FastAPI server & REST API endpoints
│   ├── agents/                     # Multi-Agent Pipeline
│   │   ├── agent_1_document/       # Document Classification & OCR
│   │   ├── agent_2_extraction/     # Structured Field Extraction
│   │   ├── agent_3_validation/     # Field & Business Rules Validation
│   │   ├── agent_4_cross_document/ # Cross-Document Consistency Checking
│   │   ├── agent_5_fraud/          # Fraud, Hash & Tampering Detection
│   │   └── agent_6_underwriting/   # Risk Scoring, Eligibility & Decisioning
│   ├── policy_kb/                  # Underwriting rules for 10 loan types
│   ├── shared/                     # Canonical policy registry & normalization
│   ├── data/                       # SQLite database (loan_agent.db)
│   └── uploads/                    # Storage for uploaded loan documents
│
├── hackathon UI/                   # Modern React + Vite Frontend
│   ├── src/                        # React UI components & views
│   ├── index.html                  # Main application layout
│   └── package.json                # Frontend dependencies
│
└── README.md                       # Project documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
* Python 3.10+ installed
* Node.js 18+ and npm installed

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend-code

# Create and activate virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate          # On Windows
# source venv/bin/activate     # On macOS/Linux

# Install backend dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -u main.py
```
* The backend server runs at **`http://127.0.0.1:8000`**
* Interactive Swagger API documentation: **`http://127.0.0.1:8000/docs`**

### 2. Frontend Setup

```bash
# In a new terminal, navigate to the frontend directory
cd "hackathon UI"

# Install frontend dependencies
npm install

# Start the development server
npm run dev
```
* The frontend web application runs at **`http://localhost:5173/`**

---

## 🧪 Testing

Automated test suites verify classifier precision, canonical isolation, and live API endpoints:

```bash
# Run unit test suites for document classification
python scratch/test_bank_statement_fix.py
python scratch/test_pan_and_bank_fix.py
python scratch/test_gold_security_fix.py

# Run live slot-upload API test
node scratch/test_upload_bank_statement_fix.js
```

---

## 🔐 Security and Privacy

* **PII Protection**: Sensitive identifiers (e.g. PAN, Aadhaar numbers) are masked in logging output.
* **Cryptographic Integrity**: SHA-256 hash calculation prevents duplicate file attacks and replay attempts.
* **Role-Based Access**: Multi-tier authentication separates customer loan submissions from officer reviews and manager overrides.

---

## 👥 Contributors

* **Bharath Reddy**
* Team Members

---

## 📄 License

This project is developed for educational, research, and demonstration purposes.