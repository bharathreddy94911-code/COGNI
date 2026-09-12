/**
 * Demo Backend Server for Loan Document Processing UI
 * 
 * This is a TEMPORARY demo backend that returns deterministic demo responses.
 * It does NOT contain real AI processing, LangGraph, Ollama, or any LLM.
 * The real backend will be connected later.
 * 
 * Supports all 9 endpoints consumed by the frontend.
 */

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 8000;
const upload = multer({ dest: path.join(__dirname, "uploads") });

app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// IN-MEMORY STATE
// ============================================================================

const ACTIVE_APPLICATIONS = {};
let appCounter = 1;

// ============================================================================
// LOAN TYPES (matching existing frontend expectations)
// ============================================================================

const LOAN_TYPE_NAMES = {
    personal_loan: "Personal Loan",
    home_loan: "Home Loan",
    vehicle_loan: "Car / Vehicle Loan",
    education_loan: "Education Loan",
    business_loan: "Business Loan",
    gold_loan: "Gold Loan",
    lap_loan: "Loan Against Property",
    agriculture_loan: "Agriculture / Crop Loan",
    lafd_loan: "Loan Against Fixed Deposit",
    consumer_durable_loan: "Consumer Durable Loan"
};

// ============================================================================
// DOCUMENT REQUIREMENTS POLICY (mirrors the real backend's policy structure)
// ============================================================================

const DOCUMENT_POLICY = {
    personal_loan: {
        required: [
            { requirement_id: "kyc_identity", display_name: "KYC / Identity Proof", accepted_document_types: ["aadhaar_card", "passport", "voter_id", "driving_license"] },
            { requirement_id: "pan_card", display_name: "PAN Card", accepted_document_types: ["pan_card"] },
            { requirement_id: "payslip", display_name: "Payslip / Salary Certificate", accepted_document_types: ["payslip", "salary_certificate"] },
            { requirement_id: "bank_statement", display_name: "Bank Statement", accepted_document_types: ["bank_statement"] },
            { requirement_id: "employment_proof", display_name: "Employment Proof", accepted_document_types: ["employment_letter", "appointment_letter"] }
        ],
        optional: [
            { requirement_id: "address_proof", display_name: "Address Proof", accepted_document_types: ["utility_bill", "rental_agreement"] },
            { requirement_id: "itr", display_name: "Income Tax Returns", accepted_document_types: ["itr", "form_16"] }
        ]
    },
    home_loan: {
        required: [
            { requirement_id: "kyc_identity", display_name: "KYC / Identity Proof", accepted_document_types: ["aadhaar_card", "passport", "voter_id"] },
            { requirement_id: "pan_card", display_name: "PAN Card", accepted_document_types: ["pan_card"] },
            { requirement_id: "income_proof", display_name: "Income Proof / Salary Slips", accepted_document_types: ["payslip", "salary_certificate", "itr"] },
            { requirement_id: "bank_statement", display_name: "Bank Statement", accepted_document_types: ["bank_statement"] },
            { requirement_id: "property_docs", display_name: "Property Documents", accepted_document_types: ["property_document", "sale_deed"] },
            { requirement_id: "address_proof", display_name: "Address Proof", accepted_document_types: ["utility_bill", "aadhaar_card"] }
        ],
        optional: [
            { requirement_id: "itr", display_name: "Income Tax Returns / Form 16", accepted_document_types: ["itr", "form_16"] },
            { requirement_id: "valuation", display_name: "Property Valuation Report", accepted_document_types: ["valuation_report"] }
        ]
    },
    vehicle_loan: {
        required: [
            { requirement_id: "kyc_identity", display_name: "KYC / Identity Proof", accepted_document_types: ["aadhaar_card", "passport", "voter_id"] },
            { requirement_id: "pan_card", display_name: "PAN Card", accepted_document_types: ["pan_card"] },
            { requirement_id: "income_proof", display_name: "Income Proof", accepted_document_types: ["payslip", "salary_certificate"] },
            { requirement_id: "bank_statement", display_name: "Bank Statement", accepted_document_types: ["bank_statement"] },
            { requirement_id: "vehicle_quotation", display_name: "Vehicle Quotation / Invoice", accepted_document_types: ["quotation", "invoice"] }
        ],
        optional: [
            { requirement_id: "address_proof", display_name: "Address Proof", accepted_document_types: ["utility_bill", "rental_agreement"] },
            { requirement_id: "employment_proof", display_name: "Employment Proof", accepted_document_types: ["employment_letter"] }
        ]
    },
    education_loan: {
        required: [
            { requirement_id: "kyc_identity", display_name: "KYC / Identity Proof", accepted_document_types: ["aadhaar_card", "passport"] },
            { requirement_id: "admission_letter", display_name: "Admission / Offer Letter", accepted_document_types: ["admission_letter", "offer_letter"] },
            { requirement_id: "fee_structure", display_name: "Course Fee Structure", accepted_document_types: ["fee_structure"] },
            { requirement_id: "marksheets", display_name: "Academic Marksheets", accepted_document_types: ["marksheet", "certificate"] },
            { requirement_id: "coapplicant_income", display_name: "Co-applicant Income Proof", accepted_document_types: ["payslip", "itr"] }
        ],
        optional: [
            { requirement_id: "pan_card", display_name: "PAN Card", accepted_document_types: ["pan_card"] },
            { requirement_id: "collateral", display_name: "Collateral Documents", accepted_document_types: ["property_document"] }
        ]
    },
    business_loan: {
        required: [
            { requirement_id: "kyc_identity", display_name: "KYC / Identity Proof", accepted_document_types: ["aadhaar_card", "passport"] },
            { requirement_id: "pan_card", display_name: "PAN Card", accepted_document_types: ["pan_card"] },
            { requirement_id: "business_registration", display_name: "Business Registration Certificate", accepted_document_types: ["incorporation_certificate", "business_license"] },
            { requirement_id: "gst_registration", display_name: "GST Registration", accepted_document_types: ["gst_certificate"] },
            { requirement_id: "bank_statement", display_name: "Business Bank Statements", accepted_document_types: ["bank_statement"] },
            { requirement_id: "itr", display_name: "Income Tax Returns", accepted_document_types: ["itr"] },
            { requirement_id: "financial_statements", display_name: "Financial Statements / P&L", accepted_document_types: ["financial_statement", "profit_loss"] }
        ],
        optional: [
            { requirement_id: "balance_sheet", display_name: "Balance Sheet", accepted_document_types: ["balance_sheet"] },
            { requirement_id: "ownership_docs", display_name: "Ownership Documents", accepted_document_types: ["partnership_deed"] }
        ]
    },
    gold_loan: {
        required: [
            { requirement_id: "kyc_identity", display_name: "KYC / Identity Proof", accepted_document_types: ["aadhaar_card", "passport", "voter_id"] },
            { requirement_id: "pan_card", display_name: "PAN Card", accepted_document_types: ["pan_card"] },
            { requirement_id: "address_proof", display_name: "Address Proof", accepted_document_types: ["utility_bill", "aadhaar_card"] }
        ],
        optional: [
            { requirement_id: "gold_details", display_name: "Gold / Pledged Asset Details", accepted_document_types: ["gold_receipt", "asset_document"] }
        ]
    },
    agriculture_loan: {
        required: [
            { requirement_id: "kyc_identity", display_name: "KYC / Identity Proof", accepted_document_types: ["aadhaar_card", "voter_id"] },
            { requirement_id: "land_records", display_name: "Land Ownership / Land Records", accepted_document_types: ["land_record", "patta"] },
            { requirement_id: "bank_statement", display_name: "Bank Statements", accepted_document_types: ["bank_statement"] },
            { requirement_id: "crop_details", display_name: "Crop Details / Cultivation Records", accepted_document_types: ["crop_record"] }
        ],
        optional: [
            { requirement_id: "pan_card", display_name: "PAN Card", accepted_document_types: ["pan_card"] },
            { requirement_id: "agri_income", display_name: "Agricultural Income Documents", accepted_document_types: ["income_certificate"] }
        ]
    },
    lap_loan: {
        required: [
            { requirement_id: "kyc_identity", display_name: "KYC / Identity Proof", accepted_document_types: ["aadhaar_card", "passport"] },
            { requirement_id: "pan_card", display_name: "PAN Card", accepted_document_types: ["pan_card"] },
            { requirement_id: "income_proof", display_name: "Income Proof", accepted_document_types: ["payslip", "itr"] },
            { requirement_id: "bank_statement", display_name: "Bank Statements", accepted_document_types: ["bank_statement"] },
            { requirement_id: "property_ownership", display_name: "Property Ownership Documents", accepted_document_types: ["property_document", "title_deed"] },
            { requirement_id: "property_tax", display_name: "Property Tax Receipts", accepted_document_types: ["property_tax_receipt"] }
        ],
        optional: [
            { requirement_id: "itr", display_name: "Income Tax Returns", accepted_document_types: ["itr", "form_16"] },
            { requirement_id: "property_valuation", display_name: "Property Valuation Report", accepted_document_types: ["valuation_report"] }
        ]
    },
    lafd_loan: {
        required: [
            { requirement_id: "kyc_identity", display_name: "KYC / Identity Proof", accepted_document_types: ["aadhaar_card", "passport"] },
            { requirement_id: "pan_card", display_name: "PAN Card", accepted_document_types: ["pan_card"] },
            { requirement_id: "fd_certificate", display_name: "Fixed Deposit Certificate", accepted_document_types: ["fd_certificate", "fd_receipt"] },
            { requirement_id: "bank_details", display_name: "Bank Account Details", accepted_document_types: ["bank_statement", "passbook"] }
        ],
        optional: [
            { requirement_id: "address_proof", display_name: "Address Proof", accepted_document_types: ["utility_bill"] }
        ]
    },
    consumer_durable_loan: {
        required: [
            { requirement_id: "kyc_identity", display_name: "KYC / Identity Proof", accepted_document_types: ["aadhaar_card", "passport"] },
            { requirement_id: "pan_card", display_name: "PAN Card", accepted_document_types: ["pan_card"] },
            { requirement_id: "product_invoice", display_name: "Product Quotation / Invoice", accepted_document_types: ["invoice", "quotation"] },
            { requirement_id: "bank_details", display_name: "Bank Account Details", accepted_document_types: ["bank_statement"] }
        ],
        optional: [
            { requirement_id: "income_proof", display_name: "Income Proof", accepted_document_types: ["payslip", "salary_certificate"] },
            { requirement_id: "address_proof", display_name: "Address Proof", accepted_document_types: ["utility_bill"] }
        ]
    }
};

function getPolicy(loanType) {
    return DOCUMENT_POLICY[loanType] || DOCUMENT_POLICY.personal_loan;
}

// ============================================================================
// ENDPOINT 1: GET /api/loan-types
// ============================================================================

app.get("/api/loan-types", (req, res) => {
    const loan_types = Object.entries(LOAN_TYPE_NAMES).map(([id, name]) => ({ id, name }));
    res.json({ loan_types });
});

// ============================================================================
// ENDPOINT 2: GET /api/loan-types/:loanType/document-requirements
// ============================================================================

app.get("/api/loan-types/:loanType/document-requirements", (req, res) => {
    const loanType = req.params.loanType;
    const policy = getPolicy(loanType);
    const displayName = LOAN_TYPE_NAMES[loanType] || loanType.replace(/_/g, " ");

    const mapReq = (r, isRequired) => ({
        requirement_id: r.requirement_id,
        display_name: r.display_name,
        required: isRequired,
        accepted_document_types: r.accepted_document_types
    });

    res.json({
        loan_type: loanType,
        display_name: displayName,
        required_count: policy.required.length,
        optional_count: policy.optional.length,
        required: policy.required.map(r => mapReq(r, true)),
        optional: policy.optional.map(r => mapReq(r, false))
    });
});

// ============================================================================
// ENDPOINT 3: POST /api/applications
// ============================================================================

app.post("/api/applications", upload.none(), (req, res) => {
    const loanType = req.body.loan_type || "personal_loan";
    const appId = `DEMO-APP-${String(appCounter++).padStart(3, "0")}`;
    const policy = getPolicy(loanType);

    const slots = {};
    [...policy.required, ...policy.optional].forEach(r => {
        const isReq = policy.required.includes(r);
        slots[r.requirement_id] = {
            requirement_id: r.requirement_id,
            display_name: r.display_name,
            required: isReq,
            accepted_document_types: r.accepted_document_types,
            status: "pending",
            uploaded_document_id: null,
            uploaded_filename: null,
            file_path: null,
            detected_document_type: null,
            confidence: null,
            error: null
        };
    });

    ACTIVE_APPLICATIONS[appId] = {
        application_id: appId,
        loan_type: loanType,
        slots,
        uploaded_files: {},
        status: "NOT_STARTED"
    };

    res.json(buildApplicationStatus(appId));
});

function buildApplicationStatus(appId) {
    const app = ACTIVE_APPLICATIONS[appId];
    if (!app) return { application_id: appId, application_status: "NOT_FOUND" };

    const slotsList = Object.values(app.slots);
    const reqSlots = slotsList.filter(s => s.required);
    const optSlots = slotsList.filter(s => !s.required);

    const reqCount = reqSlots.length;
    const uploadedReq = reqSlots.filter(s => s.status === "accepted").length;
    const wrongReq = slotsList.filter(s => s.status === "wrong_document").length;
    const missingReq = reqCount - uploadedReq;
    const optCount = optSlots.length;
    const uploadedOpt = optSlots.filter(s => s.status === "accepted").length;

    const hasAnyUpload = slotsList.some(s => s.uploaded_filename !== null);
    let appStatus;
    if (!hasAnyUpload) appStatus = "NOT_STARTED";
    else if (missingReq > 0 || wrongReq > 0) appStatus = "INCOMPLETE";
    else appStatus = "READY_FOR_PROCESSING";

    app.status = appStatus;

    return {
        application_id: appId,
        loan_type: app.loan_type,
        application_status: appStatus,
        required_documents_count: reqCount,
        uploaded_required_documents_count: uploadedReq,
        missing_required_documents_count: missingReq,
        wrong_documents_count: wrongReq,
        optional_documents_count: optCount,
        uploaded_optional_documents_count: uploadedOpt,
        slots: slotsList
    };
}

// ============================================================================
// ENDPOINT 4: POST /api/applications/:id/slot-upload
// ============================================================================

app.post("/api/applications/:id/slot-upload", upload.single("file"), (req, res) => {
    const appId = req.params.id;
    const requirementId = req.body.requirement_id;
    const file = req.file;

    if (!ACTIVE_APPLICATIONS[appId]) {
        return res.status(404).json({ detail: "Application not found" });
    }

    const appData = ACTIVE_APPLICATIONS[appId];
    const slot = appData.slots[requirementId];
    if (!slot) {
        return res.status(400).json({ detail: `Invalid requirement_id '${requirementId}'` });
    }

    const filename = file ? file.originalname : "demo_document.pdf";
    const docId = `doc_${requirementId}_${Date.now()}`;

    // Demo: always accept the document
    const detectedType = slot.accepted_document_types[0] || "document";

    slot.status = "accepted";
    slot.uploaded_document_id = docId;
    slot.uploaded_filename = filename;
    slot.file_path = file ? file.path : null;
    slot.detected_document_type = detectedType;
    slot.confidence = 0.95;
    slot.error = null;

    appData.uploaded_files[requirementId] = {
        file_path: file ? file.path : null,
        filename: filename,
        classification_result: {
            document_id: docId,
            filename: filename,
            document_type: detectedType,
            confidence: 0.95,
            status: "success"
        }
    };

    const statusObj = buildApplicationStatus(appId);

    res.json({
        application_id: appId,
        requirement_id: requirementId,
        slot: { ...slot },
        classification_result: appData.uploaded_files[requirementId].classification_result,
        application_status: statusObj
    });
});

// ============================================================================
// ENDPOINT 5: DELETE /api/applications/:id/slot/:reqId
// ============================================================================

app.delete("/api/applications/:id/slot/:reqId", (req, res) => {
    const appId = req.params.id;
    const reqId = req.params.reqId;

    if (ACTIVE_APPLICATIONS[appId]) {
        const appData = ACTIVE_APPLICATIONS[appId];
        if (appData.slots[reqId]) {
            const slot = appData.slots[reqId];
            slot.status = "pending";
            slot.uploaded_document_id = null;
            slot.uploaded_filename = null;
            slot.file_path = null;
            slot.detected_document_type = null;
            slot.confidence = null;
            slot.error = null;
        }
        delete appData.uploaded_files[reqId];
    }

    res.json(buildApplicationStatus(appId));
});

// ============================================================================
// ENDPOINT 6: POST /api/applications/:id/process
// ============================================================================

app.post("/api/applications/:id/process", (req, res) => {
    const appId = req.params.id;

    if (!ACTIVE_APPLICATIONS[appId]) {
        return res.status(404).json({ detail: "Application not found" });
    }

    const appData = ACTIVE_APPLICATIONS[appId];
    const uploadedFiles = appData.uploaded_files || {};
    const loanType = appData.loan_type;
    const docCount = Object.keys(uploadedFiles).length;

    // Build demo classification results from uploaded files
    const classificationResults = Object.values(uploadedFiles).map(u => u.classification_result);

    // Demo extraction results
    const extractionResults = classificationResults.map(cr => ({
        document_id: cr.document_id,
        filename: cr.filename,
        document_type: cr.document_type,
        fields: {
            applicant_name: { value: "Rajesh Kumar", confidence: 0.92 },
            employer_name: { value: "TechCorp Solutions Pvt Ltd", confidence: 0.88 },
            pan_number: { value: "ABCDE1234F", confidence: 0.97 },
            address: { value: "42, MG Road, Bengaluru, Karnataka 560001", confidence: 0.85 },
            net_salary: { value: "75000", confidence: 0.90 },
            currency: { value: "₹", confidence: 0.99 },
            closing_balance: { value: "245000", confidence: 0.87 }
        }
    }));

    // Demo validation results
    const validationResults = classificationResults.map(cr => ({
        document_id: cr.document_id,
        filename: cr.filename,
        document_type: cr.document_type,
        validation_status: "PASS",
        checks: [
            { check_name: "Document Authenticity", status: "PASS", message: "Document appears genuine" },
            { check_name: "Data Completeness", status: "PASS", message: "All required fields present" },
            { check_name: "Date Validity", status: "PASS", message: "Document is within acceptable date range" }
        ]
    }));

    // Demo cross-document results
    const crossDocResults = {
        verification_coverage: 85,
        consistency_score: 92,
        total_comparisons: docCount * 3,
        match_count: docCount * 2,
        minor_variation_count: Math.max(1, Math.floor(docCount / 2)),
        mismatch_count: 0,
        unverifiable_count: Math.max(1, docCount - 2),
        comparisons: [
            { field: "Applicant Name", source_a: "KYC Document", source_b: "PAN Card", status: "MATCH", detail: "Names are consistent" },
            { field: "Address", source_a: "KYC Document", source_b: "Bank Statement", status: "MINOR_VARIATION", detail: "Minor formatting difference" }
        ]
    };

    // Demo risk assessment results
    const riskResults = {
        risk_score: 25,
        risk_level: "LOW",
        critical_count: 0,
        high_count: 0,
        medium_count: 1,
        low_count: 2,
        anomalies: [
            { severity: "MEDIUM", category: "Income Verification", description: "Income declared is above average for the reported employer category", recommendation: "Verify with employer directly" },
            { severity: "LOW", category: "Document Age", description: "Bank statement is 2 months old", recommendation: "Request recent statement if needed" },
            { severity: "LOW", category: "Address Consistency", description: "Minor variation in address format across documents", recommendation: "No action required" }
        ],
        risk_summary: { level: "LOW", score: 25 }
    };

    // Demo final report results
    const finalReportResults = {
        decision: "APPROVED",
        review_required: false,
        decision_reason: "All documents verified successfully. Income meets minimum requirements. Risk assessment indicates low risk profile. Cross-document verification shows consistent information across all submitted documents.",
        executive_summary: `Loan application ${appId} for ${LOAN_TYPE_NAMES[loanType] || loanType} has been processed through the complete 6-agent verification pipeline. All ${docCount} documents passed classification, extraction, validation, and cross-document verification. The risk score of 25/100 indicates a LOW risk profile. The application is recommended for APPROVAL.`,
        key_findings: [
            "All required documents are present and verified",
            "Applicant identity confirmed across multiple documents",
            "Income documentation is consistent and within expected range",
            "No critical or high-severity anomalies detected",
            "Cross-document consistency score: 92/100"
        ],
        recommendations: [
            "Proceed with standard loan disbursement process",
            "No additional documentation required",
            "Standard terms and conditions apply"
        ],
        final_decision: "APPROVED"
    };

    // Update application state
    appData.status = "COMPLETED";
    appData.classification_results = classificationResults;
    appData.extraction_results = extractionResults;
    appData.validation_results = validationResults;
    appData.cross_document_results = crossDocResults;
    appData.risk_assessment_results = riskResults;
    appData.final_report_results = finalReportResults;

    const statusObj = buildApplicationStatus(appId);

    res.json({
        application_id: appId,
        loan_type: loanType,
        document_count: docCount,
        classification_results: classificationResults,
        extraction_results: extractionResults,
        validation_results: validationResults,
        cross_document_results: crossDocResults,
        cross_document_result: crossDocResults,
        risk_assessment_results: riskResults,
        risk_result: riskResults,
        final_report_results: finalReportResults,
        final_report: finalReportResults,
        application_status: statusObj,
        next_agent: "completed"
    });
});

// ============================================================================
// ENDPOINT 7: POST /api/applications/:id/submit
// ============================================================================

app.post("/api/applications/:id/submit", (req, res) => {
    const appId = req.params.id;

    if (!ACTIVE_APPLICATIONS[appId]) {
        return res.status(404).json({ detail: "Application not found" });
    }

    const appData = ACTIVE_APPLICATIONS[appId];
    const referenceId = `REF-${appId.replace("DEMO-APP-", "")}`;
    appData.reference_id = referenceId;
    appData.status = "SUBMITTED";

    res.json({
        success: true,
        application_id: appId,
        referenceId: referenceId,
        status: "SUBMITTED"
    });
});

// ============================================================================
// ENDPOINT 8: GET /api/applications/:id/report/pdf
// ============================================================================

app.get("/api/applications/:id/report/pdf", (req, res) => {
    const appId = req.params.id;
    const appData = ACTIVE_APPLICATIONS[appId];
    const loanType = appData ? (LOAN_TYPE_NAMES[appData.loan_type] || appData.loan_type) : "Unknown";

    // Generate a minimal valid PDF
    const pdfContent = buildDemoPdf(appId, loanType);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=loan_report_${appId}.pdf`);
    res.send(pdfContent);
});

function buildDemoPdf(appId, loanType) {
    // Minimal valid PDF with demo content
    const textLines = [
        `LOAN APPLICATION REPORT`,
        ``,
        `Application ID: ${appId}`,
        `Loan Type: ${loanType}`,
        `Status: DEMO - APPROVED`,
        `Risk Level: LOW (25/100)`,
        ``,
        `This is a DEMO report generated by the temporary demo backend.`,
        `The real AI-powered report will be generated when the production`,
        `backend is connected.`,
        ``,
        `Decision: APPROVED`,
        `Review Required: NO`,
        ``,
        `Key Findings:`,
        `- All required documents present and verified`,
        `- Identity confirmed across documents`,
        `- Income within expected range`,
        `- No critical anomalies detected`,
        `- Cross-document consistency: 92/100`
    ];
    const text = textLines.join("\n");
    const streamContent = `BT\n/F1 12 Tf\n50 750 Td\n14 TL\n${textLines.map(l => `(${l.replace(/[()\\]/g, "\\$&")}) '`).join("\n")}\nET`;
    const stream = Buffer.from(streamContent);

    const objects = [];
    // Obj 1: Catalog
    objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
    // Obj 2: Pages
    objects.push(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`);
    // Obj 3: Page
    objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`);
    // Obj 4: Content stream
    objects.push(`4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream.toString()}\nendstream\nendobj`);
    // Obj 5: Font
    objects.push(`5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);

    let body = "";
    const offsets = [];
    const header = "%PDF-1.4\n";
    body = header;
    for (const obj of objects) {
        offsets.push(body.length);
        body += obj + "\n";
    }
    const xrefOffset = body.length;
    body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) {
        body += `${String(off).padStart(10, "0")} 00000 n \n`;
    }
    body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(body);
}

// ============================================================================
// ENDPOINT 9: GET /api/admin/applications
// ============================================================================

app.get("/api/admin/applications", (req, res) => {
    const appsList = [];

    for (const [appId, appData] of Object.entries(ACTIVE_APPLICATIONS)) {
        const riskRes = appData.risk_assessment_results || {};
        const reportRes = appData.final_report_results || {};

        let riskLevel = "UNKNOWN";
        if (riskRes.risk_level) riskLevel = riskRes.risk_level;
        else if (riskRes.risk_summary?.level) riskLevel = riskRes.risk_summary.level;

        let decision = "PENDING";
        if (reportRes.decision) decision = reportRes.decision;
        else if (reportRes.final_decision) decision = reportRes.final_decision;

        let docStatus = appData.status || "INCOMPLETE";
        if (docStatus === "COMPLETED" || docStatus === "SUBMITTED") docStatus = "Complete";
        else if (docStatus === "INCOMPLETE") docStatus = "Incomplete";
        else docStatus = "Pending";

        appsList.push({
            application_id: appId,
            loan_type: appData.loan_type || "Unknown",
            status: appData.status || "PENDING_REVIEW",
            document_status: docStatus,
            riskLevel: riskLevel,
            decision: decision,
            extraction_results: appData.extraction_results || [],
            risk_assessment_results: riskRes,
            final_report_results: reportRes,
            validation_results: appData.validation_results || [],
            classification_results: appData.classification_results || Object.values(appData.uploaded_files || {}).map(u => u.classification_result).filter(Boolean)
        });
    }

    res.json({ applications: appsList });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log(`\n  ✓ Demo backend running on http://127.0.0.1:${PORT}`);
    console.log(`  ✓ This is a TEMPORARY demo backend — no real AI processing.`);
    console.log(`  ✓ The real backend will be connected later.\n`);
});
