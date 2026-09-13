const http = require("http");

const BASE_URL = "http://127.0.0.1:8000";

function request(path, method = "GET", body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: { ...headers }
        };

        let reqBody = null;
        if (body && typeof body === "object" && !(body instanceof Buffer)) {
            reqBody = JSON.stringify(body);
            options.headers["Content-Type"] = "application/json";
            options.headers["Content-Length"] = Buffer.byteLength(reqBody);
        } else if (body instanceof Buffer) {
            reqBody = body;
        }

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {}
                resolve({ status: res.statusCode, headers: res.headers, data: parsed });
            });
        });

        req.on("error", err => resolve({ status: 500, error: err.message }));
        if (reqBody) req.write(reqBody);
        req.end();
    });
}

function makeMultipartRequest(path, fields, fileInfo, headers = {}) {
    return new Promise((resolve, reject) => {
        const boundary = "--------------------------" + Date.now().toString(16);
        let bodyParts = [];

        for (const [key, value] of Object.entries(fields)) {
            bodyParts.push(Buffer.from(
                `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
            ));
        }

        if (fileInfo) {
            const filename = fileInfo.filename || "document.pdf";
            const mimeType = fileInfo.mimeType || "application/pdf";
            const content = fileInfo.content !== undefined ? fileInfo.content : Buffer.from("Sample test document content");

            bodyParts.push(Buffer.from(
                `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
            ));
            bodyParts.push(content);
            bodyParts.push(Buffer.from("\r\n"));
        }

        bodyParts.push(Buffer.from(`--${boundary}--\r\n`));
        const bodyBuffer = Buffer.concat(bodyParts);

        const options = {
            hostname: "127.0.0.1",
            port: 8000,
            path: path,
            method: "POST",
            headers: {
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
                "Content-Length": bodyBuffer.length,
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {}
                resolve({ status: res.statusCode, headers: res.headers, data: parsed });
            });
        });

        req.on("error", err => resolve({ status: 500, error: err.message }));
        req.write(bodyBuffer);
        req.end();
    });
}

async function runMasterAudit() {
    console.log("===============================================================================");
    console.log("  FULL LOAN APPLICATION MASTER END-TO-END AUDIT & VERIFICATION SUITE");
    console.log("===============================================================================\n");

    let totalTests = 0;
    let passed = 0;
    let failed = 0;

    function assert(condition, testName, detail = "") {
        totalTests++;
        if (condition) {
            passed++;
            console.log(`  ✓ PASS [${String(totalTests).padStart(2, "0")}] ${testName}`);
        } else {
            failed++;
            console.error(`  ✗ FAIL [${String(totalTests).padStart(2, "0")}] ${testName} - ${detail}`);
        }
    }

    try {
        // SECTION 1: STARTUP & ENDPOINT REGISTRATION AUDIT
        console.log("--- 1. Application Startup & Server Availability Audit ---");
        const loanTypesRes = await request("/api/loan-types");
        assert(loanTypesRes.status === 200, "Backend server active on port 8000");
        assert(Array.isArray(loanTypesRes.data.loan_types) && loanTypesRes.data.loan_types.length >= 10, "Backend serves 10+ configured loan types");

        // SECTION 2: AUTHENTICATION & GOOGLE SIGNUP AUDIT
        console.log("\n--- 2. Authentication & User Profile Isolation Audit ---");
        const testEmail = `nani.master.${Date.now()}@example.com`;
        const googleNewUser = await request("/api/auth/google", "POST", {
            google_id: `g_master_${Date.now()}`,
            email: testEmail,
            name: "Nani Master"
        });
        assert(googleNewUser.status === 200, "POST /api/auth/google returns HTTP 200");
        assert(googleNewUser.data.isNewUser === true, "New Google user flagged with isNewUser = true");
        assert(googleNewUser.data.user.role === "BANK_CUSTOMER", "Default user role set to BANK_CUSTOMER");

        // Complete onboarding for user
        const onboardingRes = await request("/api/auth/onboarding", "POST", {
            email: testEmail,
            onboardingData: { name: "Nani Master", age: "28", city: "Bengaluru", profession: "Engineer" },
            onboardingCompleted: true
        });
        assert(onboardingRes.status === 200, "POST /api/auth/onboarding completes user onboarding");
        assert(onboardingRes.data.user.onboardingCompleted === true, "User onboardingCompleted state set to true");

        // Returning user check
        const googleReturnUser = await request("/api/auth/google", "POST", {
            google_id: googleNewUser.data.user.google_id,
            email: testEmail
        });
        assert(googleReturnUser.data.isNewUser === false, "Returning Google user receives isNewUser = false");
        assert(googleReturnUser.data.onboardingCompleted === true, "Returning Google user retains onboardingCompleted = true");

        // SECTION 3: APPLICATION CREATION & LOAN SELECTION AUDIT
        console.log("\n--- 3. Loan Selection & Application Creation Audit ---");
        const createHomeApp = await request("/api/applications", "POST", { loan_type: "home_loan" });
        assert(createHomeApp.status === 200, "Create application returns HTTP 200");
        const homeAppId = createHomeApp.data.application_id;
        assert(homeAppId && homeAppId.startsWith("DEMO-APP-"), "Generates valid application ID format");

        const reqsRes = await request(`/api/loan-types/home_loan/document-requirements`);
        assert(reqsRes.status === 200, "Fetch document requirements for home_loan returns HTTP 200");
        assert(reqsRes.data.required_count > 0, "Document policy returns required document slots");

        // SECTION 4: AI AGENT DOCUMENT UPLOAD PIPELINE AUDIT
        console.log("\n--- 4. Document Upload & AI Agent Pipeline Execution Audit ---");

        // Upload Payslip -> AGENT-PAYSLIP-01
        const uploadPayslip = await makeMultipartRequest(`/api/applications/${homeAppId}/slot-upload`,
            { requirement_id: "payslip", userId: googleNewUser.data.user.id },
            { filename: "payslip_nani.pdf", content: Buffer.from("Salary Payslip August 2026 Net Pay 75000") }
        );
        assert(uploadPayslip.status === 200, "Payslip upload returns HTTP 200");
        assert(uploadPayslip.data.agent_result && uploadPayslip.data.agent_result.agentId === "AGENT-PAYSLIP-01", "Payslip correctly executed by AGENT-PAYSLIP-01");

        // Upload Bank Statement -> AGENT-BANK-02
        const uploadBank = await makeMultipartRequest(`/api/applications/${homeAppId}/slot-upload`,
            { requirement_id: "bank_statement", userId: googleNewUser.data.user.id },
            { filename: "bank_nani.pdf", content: Buffer.from("HDFC Bank Statement Closing Balance 245000") }
        );
        assert(uploadBank.status === 200, "Bank statement upload returns HTTP 200");
        assert(uploadBank.data.agent_result && uploadBank.data.agent_result.agentId === "AGENT-BANK-02", "Bank statement correctly executed by AGENT-BANK-02");

        // Upload Identity Document -> AGENT-KYC-03
        const uploadKYC = await makeMultipartRequest(`/api/applications/${homeAppId}/slot-upload`,
            { requirement_id: "kyc_identity", userId: googleNewUser.data.user.id },
            { filename: "aadhaar_nani.pdf", content: Buffer.from("Aadhaar Number 9988-7766-5544 Nani Master") }
        );
        assert(uploadKYC.status === 200, "Identity document upload returns HTTP 200");
        assert(uploadKYC.data.agent_result && uploadKYC.data.agent_result.agentId === "AGENT-KYC-03", "Identity document correctly executed by AGENT-KYC-03");

        // SECTION 5: MASTER 6-AGENT PIPELINE AUDIT
        console.log("\n--- 5. 6-Agent Verification Pipeline Audit ---");
        const processPipeline = await request(`/api/applications/${homeAppId}/process`, "POST");
        assert(processPipeline.status === 200, "POST /api/applications/:id/process executes 6-agent pipeline");
        assert(Array.isArray(processPipeline.data.classification_results), "Agent 1: Classification results compiled");
        assert(Array.isArray(processPipeline.data.extraction_results), "Agent 2: Extraction results compiled from real agent outputs");
        assert(Array.isArray(processPipeline.data.validation_results), "Agent 3: Validation checks compiled");
        assert(processPipeline.data.cross_document_results.consistency_score !== undefined, "Agent 4: Cross-document consistency score computed");
        assert(processPipeline.data.risk_assessment_results.risk_level === "LOW", "Agent 5: Risk level evaluated as LOW");
        assert(processPipeline.data.final_report_results.decision === "APPROVED", "Agent 6: Final decision evaluated as APPROVED");

        // SECTION 6: NEGATIVE & SECURITY AUDIT
        console.log("\n--- 6. Negative, Security & Edge Case Audit ---");

        // Unsupported Document Category
        const unsupportedDoc = await makeMultipartRequest(`/api/applications/${homeAppId}/slot-upload`,
            { requirement_id: "unsupported_invalid_category", userId: googleNewUser.data.user.id },
            { filename: "unsupported_doc.pdf", content: Buffer.from("Unknown text") }
        );
        assert(unsupportedDoc.status === 404 && unsupportedDoc.data.status === "AGENT_NOT_FOUND", "Unsupported document category returns HTTP 404 AGENT_NOT_FOUND");

        // Empty 0-byte file
        const emptyFile = await makeMultipartRequest(`/api/applications/${homeAppId}/slot-upload`,
            { requirement_id: "pan_card", userId: googleNewUser.data.user.id },
            { filename: "empty.pdf", content: Buffer.alloc(0) }
        );
        assert(emptyFile.status === 400 || !emptyFile.data.success, "Empty 0-byte file rejected with HTTP 400");

        // Blurry scan quality
        const blurryDoc = await makeMultipartRequest(`/api/applications/${homeAppId}/slot-upload`,
            { requirement_id: "pan_card", userId: googleNewUser.data.user.id },
            { filename: "pan_low_quality_blurry.png", content: Buffer.from("Blurry image bytes") }
        );
        assert(blurryDoc.status === 200 && blurryDoc.data.agent_result.confidenceScore < 0.5, "Blurry document scan assigned low confidence score (< 0.5)");

        // Audit Logs Verification
        const auditLogs = await request("/api/agent-logs");
        assert(auditLogs.status === 200 && Array.isArray(auditLogs.data.logs) && auditLogs.data.logs.length > 0, "Audit execution logs recorded for all uploaded documents");

    } catch (err) {
        console.error("Master audit exception:", err);
        failed++;
    }

    console.log("\n===============================================================================");
    console.log(`  MASTER AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL ${totalTests} CHECKS)`);
    console.log("===============================================================================\n");
    process.exit(failed > 0 ? 1 : 0);
}

runMasterAudit();
