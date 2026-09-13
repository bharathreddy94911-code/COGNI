/**
 * Agent Selection Service
 * Dynamically selects the appropriate AI Agent based on document category/type and loan type.
 * Returns agent metadata or returns/throws AGENT_NOT_FOUND when no matching agent exists.
 */

const AGENT_REGISTRY = {
    "AGENT-PAYSLIP-01": {
        agentId: "AGENT-PAYSLIP-01",
        agentName: "Payslip Processing Agent",
        category: "income",
        supportedTypes: ["payslip", "salary_certificate", "income_proof", "coapplicant_income"]
    },
    "AGENT-BANK-02": {
        agentId: "AGENT-BANK-02",
        agentName: "Bank Statement Processing Agent",
        category: "bank",
        supportedTypes: ["bank_statement", "bank_details"]
    },
    "AGENT-KYC-03": {
        agentId: "AGENT-KYC-03",
        agentName: "Identity Verification Agent",
        category: "kyc",
        supportedTypes: ["kyc_identity", "aadhaar_card", "passport", "voter_id", "driving_license", "address_proof"]
    },
    "AGENT-PAN-04": {
        agentId: "AGENT-PAN-04",
        agentName: "PAN Verification Agent",
        category: "identity",
        supportedTypes: ["pan_card"]
    },
    "AGENT-EMP-05": {
        agentId: "AGENT-EMP-05",
        agentName: "Employment Verification Agent",
        category: "employment",
        supportedTypes: ["employment_proof", "employment_letter", "appointment_letter"]
    },
    "AGENT-LOAN-06": {
        agentId: "AGENT-LOAN-06",
        agentName: "Loan Application Processing Agent",
        category: "application",
        supportedTypes: ["loan_application", "application_form"]
    },
    "AGENT-PROP-07": {
        agentId: "AGENT-PROP-07",
        agentName: "Property Document Processing Agent",
        category: "property",
        supportedTypes: [
            "property_docs", "property_document", "sale_deed", "title_deed",
            "property_ownership", "property_tax", "valuation", "collateral",
            "land_records", "property_tax_receipt", "valuation_report"
        ]
    },
    "AGENT-INC-08": {
        agentId: "AGENT-INC-08",
        agentName: "Income Verification Agent",
        category: "tax_financials",
        supportedTypes: [
            "itr", "form_16", "financial_statements", "balance_sheet",
            "business_registration", "gst_registration", "incorporation_certificate",
            "business_license", "gst_certificate", "financial_statement", "profit_loss",
            "ownership_docs", "vehicle_quotation", "admission_letter", "fee_structure",
            "marksheets", "gold_details", "crop_details", "fd_certificate", "product_invoice",
            "quotation", "invoice", "offer_letter", "marksheet", "certificate",
            "partnership_deed", "gold_receipt", "asset_document", "land_record",
            "patta", "crop_record", "income_certificate", "fd_receipt", "passbook"
        ]
    }
};

const agentSelectionService = {
    /**
     * Select AI Agent based on document requirement/type and loan type
     */
    selectAgent(documentType, loanType) {
        if (!documentType) {
            const err = new Error("No suitable AI agent is configured for this document type.");
            err.statusCode = 404;
            err.status = "AGENT_NOT_FOUND";
            throw err;
        }

        const cleanDocType = String(documentType).trim().toLowerCase();

        // Check registry for matching agent
        for (const agent of Object.values(AGENT_REGISTRY)) {
            if (agent.supportedTypes.includes(cleanDocType)) {
                return { ...agent };
            }
        }

        // Check partial string matching for generic types
        if (cleanDocType.includes("pay") || cleanDocType.includes("salary")) {
            return { ...AGENT_REGISTRY["AGENT-PAYSLIP-01"] };
        }
        if (cleanDocType.includes("bank")) {
            return { ...AGENT_REGISTRY["AGENT-BANK-02"] };
        }
        if (cleanDocType.includes("kyc") || cleanDocType.includes("identity") || cleanDocType.includes("aadhaar") || cleanDocType.includes("passport")) {
            return { ...AGENT_REGISTRY["AGENT-KYC-03"] };
        }
        if (cleanDocType.includes("pan")) {
            return { ...AGENT_REGISTRY["AGENT-PAN-04"] };
        }
        if (cleanDocType.includes("emp")) {
            return { ...AGENT_REGISTRY["AGENT-EMP-05"] };
        }
        if (cleanDocType.includes("prop") || cleanDocType.includes("land")) {
            return { ...AGENT_REGISTRY["AGENT-PROP-07"] };
        }
        if (cleanDocType.includes("itr") || cleanDocType.includes("tax") || cleanDocType.includes("income")) {
            return { ...AGENT_REGISTRY["AGENT-INC-08"] };
        }

        // If no matching agent found, raise AGENT_NOT_FOUND
        const error = new Error("No suitable AI agent is configured for this document type.");
        error.statusCode = 404;
        error.status = "AGENT_NOT_FOUND";
        throw error;
    },

    /**
     * Get all registered agents
     */
    getAllAgents() {
        return Object.values(AGENT_REGISTRY);
    }
};

module.exports = agentSelectionService;
