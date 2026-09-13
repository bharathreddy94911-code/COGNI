const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const getAuthHeaders = (customHeaders = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = { ...customHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
    /**
     * Fetch available loan types
     */
    async fetchLoanTypes() {
        const response = await fetch(`${API_BASE_URL}/api/loan-types`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch loan types");
        const data = await response.json();
        // Map the backend structure to the frontend structure
        return data.loan_types.map(lt => ({ id: lt.id, label: lt.name }));
    },

    /**
     * Fetch document requirements for a specific loan type
     */
    async fetchLoanRequirements(loanType) {
        const response = await fetch(`${API_BASE_URL}/api/loan-types/${loanType}/document-requirements`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch document requirements");
        const data = await response.json();
        
        // Combine required and optional into a unified list for the frontend
        const mapDoc = (doc, isRequired) => ({
            id: doc.requirement_id,
            label: doc.display_name,
            required: isRequired,
            multiple: false, // The backend doesn't explicitly return a 'multiple' flag in this payload
            acceptedTypes: doc.accepted_document_types
        });

        const requirements = [
            ...(data.required || []).map(d => mapDoc(d, true)),
            ...(data.optional || []).map(d => mapDoc(d, false))
        ];
        return requirements;
    },

    /**
     * Create a new application
     */
    async createApplication(loanType) {
        const formData = new FormData();
        formData.append("loan_type", loanType);

        const response = await fetch(`${API_BASE_URL}/api/applications?loan_type=${loanType}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: formData
        });
        if (!response.ok) throw new Error("Failed to create application");
        return await response.json();
    },

    /**
     * Upload a document to a specific slot
     */
    async uploadDocument(file, requirementId, applicationId, signal = null) {
        const formData = new FormData();
        formData.append("requirement_id", requirementId);
        formData.append("file", file);

        const options = {
            method: "POST",
            headers: getAuthHeaders(),
            body: formData
        };
        if (signal) {
            options.signal = signal;
        }

        const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/slot-upload`, options);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Upload failed: ${error}`);
        }
        
        const data = await response.json();
        
        // Return the full data payload so the UI can handle the specific status (accepted, wrong_document, etc.)
        return data;
    },

    /** Remove a document from its backend slot. */
    async removeDocument(requirementId, applicationId) {
        const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/slot/${requirementId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Could not remove document: ${error}`);
        }
        return await response.json();
    },

    /**
     * Initiate the AI Processing Pipeline (Synchronous)
     */
    async startAIProcessing(applicationId) {
        const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/process`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        if (!response.ok) {

            const error = await response.text();
            throw new Error(`Processing failed: ${error}`);
        }
        return await response.json();
    },

    /**
     * Download the final PDF report
     */
    async downloadReport(applicationId) {
        const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/report/pdf`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to generate PDF report");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `loan_application_report_${applicationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },

    /**
     * Map real backend results to the expected UI format
     */
    mapAnalysisResults(backendResponse) {
        // Extract data safely
        const finalReport = backendResponse?.final_report_results || {};
        const riskAssesment = backendResponse?.risk_assessment_results || {};
        const crossDoc = backendResponse?.cross_document_results || {};
        const validation = backendResponse?.validation_results || [];
        const extraction = backendResponse?.extraction_results || [];
        const classification = backendResponse?.classification_results || [];
        const appStatus = backendResponse?.application_status || {};

        // Agent 1: Document Classification
        const classificationSummary = classification.map(doc => ({
            name: doc.filename || "Unknown Document",
            expectedType: doc.document_type || "Unknown",
            detectedType: doc.document_type || "Unknown",
            status: doc.status === "success" ? "ACCEPTED" : "REJECTED",
            confidence: doc.confidence !== undefined ? `${(doc.confidence * 100).toFixed(1)}%` : "N/A"
        }));

        // Document Completeness
        const documentCompleteness = {
            totalUploaded: (appStatus.uploaded_required_documents_count || 0) + (appStatus.uploaded_optional_documents_count || 0),
            requiredSlots: appStatus.required_documents_count || 0,
            slotsSatisfied: (appStatus.required_documents_count || 0) - (appStatus.missing_required_documents_count || 0),
            missingRequired: appStatus.missing_required_documents_count || 0,
            wrongDocuments: classificationSummary.filter(d => d.status === "REJECTED").length || 0,
            overallStatus: appStatus.application_status === "READY_FOR_PROCESSING" || appStatus.missing_required_documents_count === 0 ? "COMPLETE" : "INCOMPLETE"
        };

        // Agent 2: Extraction (Income Summary)
        let monthlyIncome = "Not detected";
        let employer = "Not detected";
        let bankBalance = "Not detected";
        let applicantName = "Not detected";
        let panNumber = "Not detected";
        let address = "Not detected";
        
        extraction.forEach(doc => {
            if (doc.fields) {
                if (doc.fields.applicant_name?.value) applicantName = doc.fields.applicant_name.value;
                if (doc.fields.employer_name?.value) employer = doc.fields.employer_name.value;
                if (doc.fields.pan_number?.value) panNumber = doc.fields.pan_number.value;
                if (doc.fields.address?.value) address = doc.fields.address.value;
                
                if (doc.fields.net_salary?.value) monthlyIncome = `${doc.fields.currency?.value || '₹'} ${doc.fields.net_salary.value}`;
                else if (doc.fields.gross_salary?.value) monthlyIncome = `${doc.fields.currency?.value || '₹'} ${doc.fields.gross_salary.value}`;
                
                if (doc.fields.closing_balance?.value) bankBalance = `${doc.fields.currency?.value || '₹'} ${doc.fields.closing_balance.value}`;
            }
        });

        const extractionSummary = {
            applicantName,
            employer,
            monthlyIncome,
            panNumber,
            address,
            bankBalance,
            details: extraction
        };

        // Agent 3: Validation Summary
        let passedChecks = 0;
        let warnings = 0;
        let errorChecks = 0;
        let blockingIssues = 0;

        validation.forEach(v => {
            if (v.validation_status === "PASS") passedChecks++;
            else if (v.validation_status === "WARNING") {
                warnings++;
            } else {
                errorChecks++;
                blockingIssues++; 
            }
        });

        const validationSummary = {
            totalChecks: validation.length,
            passedChecks: passedChecks,
            warnings: warnings,
            errorChecks: errorChecks,
            blockingIssues: blockingIssues,
            details: validation
        };

        // Agent 4: Cross-Document
        const crossDocSummary = {
            coverage: crossDoc.verification_coverage !== undefined ? `${crossDoc.verification_coverage}%` : "0%",
            consistencyScore: crossDoc.consistency_score !== undefined ? `${crossDoc.consistency_score} / 100` : "0 / 100",
            totalComparisons: crossDoc.total_comparisons || 0,
            matches: crossDoc.match_count || 0,
            minorVariations: crossDoc.minor_variation_count || 0,
            mismatches: crossDoc.mismatch_count || 0,
            unverifiable: crossDoc.unverifiable_count || 0,
            details: crossDoc,
            mismatchDetails: [] 
        };

        // Agent 5: Risk Assessment
        let riskScore = riskAssesment.risk_score !== undefined ? riskAssesment.risk_score : 0;
        let riskLevel = riskAssesment.risk_level || "UNKNOWN";
        let criticalIssues = riskAssesment.critical_count || 0;
        let highSeverity = riskAssesment.high_count || 0;
        let mediumSeverity = riskAssesment.medium_count || 0;
        let lowSeverity = riskAssesment.low_count || 0;

        const riskSummary = {
            score: `${riskScore} / 100`,
            level: riskLevel,
            criticalIssues,
            highSeverity,
            mediumSeverity,
            lowSeverity,
            anomalies: riskAssesment.anomalies || []
        };

        // Agent 6: Final Decision
        const finalDecision = finalReport.decision || "PENDING";
        const requiresReview = finalReport.review_required ? "YES" : "NO";
        const rationale = finalReport.decision_reason || "Application processed. Not available.";
        const executiveSummary = finalReport.executive_summary || "Not available";
        const keyFindings = finalReport.key_findings || [];
        const recommendations = finalReport.recommendations || [];

        return {
            applicationId: backendResponse.application_id || "Unknown ID",
            status: backendResponse.status || "COMPLETED",
            documentCompleteness,
            classificationSummary,
            extractionSummary,
            validationSummary,
            crossDocSummary,
            riskSummary,
            finalDecision,
            requiresReview,
            rationale,
            executiveSummary,
            keyFindings,
            recommendations
        };
    },

    /** Submit the completed application to the backend. */
    async submitApplication(applicationId) {
        const response = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/submit`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Submission failed: ${error}`);
        }
        return await response.json();
    }
};
