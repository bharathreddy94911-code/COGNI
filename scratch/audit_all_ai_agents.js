const http = require("http");

const BASE_URL = "http://127.0.0.1:8000";

function makeRequest(path, method = "GET", body = null, headers = {}) {
    return new Promise((resolve) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
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
                try { parsed = JSON.parse(data); } catch (e) {}
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on("error", err => resolve({ status: 500, error: err.message }));
        if (reqBody) req.write(reqBody);
        req.end();
    });
}

function makeMultipartRequest(path, fields, fileInfo, headers = {}) {
    return new Promise((resolve) => {
        const boundary = "--------------------------" + Date.now().toString(16);
        let bodyParts = [];

        for (const [key, value] of Object.entries(fields)) {
            bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
        }

        if (fileInfo) {
            const filename = fileInfo.filename || "document.pdf";
            const mimeType = fileInfo.mimeType || "application/pdf";
            const content = fileInfo.content !== undefined ? fileInfo.content : Buffer.from("Sample document content");

            bodyParts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`));
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
                try { parsed = JSON.parse(data); } catch (e) {}
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on("error", err => resolve({ status: 500, error: err.message }));
        req.write(bodyBuffer);
        req.end();
    });
}

async function runAgentAudit() {
    console.log("===============================================================================");
    console.log("             COMPREHENSIVE AUDIT & ACCURACY TEST OF ALL 14 AI AGENTS          ");
    console.log("===============================================================================\n");

    let total = 0;
    let pass = 0;
    let fail = 0;

    function assert(condition, title, detail = "") {
        total++;
        if (condition) {
            pass++;
            console.log(`  ✓ PASS [${String(total).padStart(2, "0")}] ${title}`);
        } else {
            fail++;
            console.error(`  ✗ FAIL [${String(total).padStart(2, "0")}] ${title} - ${detail}`);
        }
    }

    try {
        const appRes = await makeRequest("/api/applications", "POST", { loan_type: "personal_loan" });
        const appId = appRes.data.application_id || "DEMO-APP-101";

        // AGENT 1: AGENT-PAYSLIP-01
        console.log("--- Agent 1/14: AGENT-PAYSLIP-01 (Payslip Processing Agent) ---");
        const a1 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "payslip", userId: "usr_agent_test" },
            { filename: "payslip_august.pdf", content: Buffer.from("Pay Period August 2026 Salary 75000 TechCorp") }
        );
        assert(a1.status === 200, "AGENT-PAYSLIP-01 returns HTTP 200");
        assert(a1.data.agent_result.agentId === "AGENT-PAYSLIP-01", "AGENT-PAYSLIP-01 correct Agent ID");
        assert(a1.data.agent_result.extractedData.net_salary.value === "75000", "AGENT-PAYSLIP-01 extracted net salary accurately (100% accuracy)");

        // AGENT 2: AGENT-BANK-02
        console.log("\n--- Agent 2/14: AGENT-BANK-02 (Bank Statement Processing Agent) ---");
        const a2 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "bank_statement", userId: "usr_agent_test" },
            { filename: "bank_q3.pdf", content: Buffer.from("HDFC Bank Closing Balance 245000") }
        );
        assert(a2.status === 200, "AGENT-BANK-02 returns HTTP 200");
        assert(a2.data.agent_result.agentId === "AGENT-BANK-02", "AGENT-BANK-02 correct Agent ID");
        assert(a2.data.agent_result.extractedData.closing_balance.value === "245000", "AGENT-BANK-02 extracted closing balance accurately (100% accuracy)");

        // AGENT 3: AGENT-KYC-03
        console.log("\n--- Agent 3/14: AGENT-KYC-03 (Identity Verification Agent) ---");
        const a3 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "kyc_identity", userId: "usr_agent_test" },
            { filename: "aadhaar_nani.pdf", content: Buffer.from("Aadhaar Number 9988-7766-5544 Rajesh Kumar") }
        );
        assert(a3.status === 200, "AGENT-KYC-03 returns HTTP 200");
        assert(a3.data.agent_result.agentId === "AGENT-KYC-03", "AGENT-KYC-03 correct Agent ID");
        assert(a3.data.agent_result.extractedData.document_number.value === "9988-7766-5544", "AGENT-KYC-03 extracted identity document number accurately (100% accuracy)");

        // AGENT 4: AGENT-PAN-04
        console.log("\n--- Agent 4/14: AGENT-PAN-04 (PAN Verification Agent) ---");
        const a4 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "pan_card", userId: "usr_agent_test" },
            { filename: "pan_card.pdf", content: Buffer.from("PAN Number ABCDE1234F Ramesh Kumar") }
        );
        assert(a4.status === 200, "AGENT-PAN-04 returns HTTP 200");
        assert(a4.data.agent_result.agentId === "AGENT-PAN-04", "AGENT-PAN-04 correct Agent ID");
        assert(a4.data.agent_result.extractedData.pan_number.value === "ABCDE1234F", "AGENT-PAN-04 extracted PAN number accurately (100% accuracy)");

        // AGENT 5: AGENT-EMP-05
        console.log("\n--- Agent 5/14: AGENT-EMP-05 (Employment Verification Agent) ---");
        const a5 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "employment_proof", userId: "usr_agent_test" },
            { filename: "employment_letter.pdf", content: Buffer.from("TechCorp Senior Software Engineer Permanent") }
        );
        assert(a5.status === 200, "AGENT-EMP-05 returns HTTP 200");
        assert(a5.data.agent_result.agentId === "AGENT-EMP-05", "AGENT-EMP-05 correct Agent ID");
        assert(a5.data.agent_result.extractedData.designation.value === "Senior Software Engineer", "AGENT-EMP-05 extracted designation accurately (100% accuracy)");

        // AGENT 6: AGENT-LOAN-06
        console.log("\n--- Agent 6/14: AGENT-LOAN-06 (Loan Application Form Agent) ---");
        const a6 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "loan_application", userId: "usr_agent_test" },
            { filename: "loan_form.pdf", content: Buffer.from("Loan Application Form Personal Loan") }
        );
        assert(a6.status === 200, "AGENT-LOAN-06 returns HTTP 200");
        assert(a6.data.agent_result.agentId === "AGENT-LOAN-06", "AGENT-LOAN-06 correct Agent ID");

        // AGENT 7: AGENT-PROP-07
        console.log("\n--- Agent 7/14: AGENT-PROP-07 (Property Document Processing Agent) ---");
        const a7 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "property_docs", userId: "usr_agent_test" },
            { filename: "sale_deed.pdf", content: Buffer.from("Plot 104 Sunrise Heights Bengaluru Registration REG-2023-889911") }
        );
        assert(a7.status === 200, "AGENT-PROP-07 returns HTTP 200");
        assert(a7.data.agent_result.agentId === "AGENT-PROP-07", "AGENT-PROP-07 correct Agent ID");
        assert(a7.data.agent_result.extractedData.registration_number.value === "REG-2023-889911", "AGENT-PROP-07 extracted registration number accurately (100% accuracy)");

        // AGENT 8: AGENT-INC-08
        console.log("\n--- Agent 8/14: AGENT-INC-08 (Income Verification Agent) ---");
        const a8 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "itr", userId: "usr_agent_test" },
            { filename: "itr_2025.pdf", content: Buffer.from("Income Tax Return Form 16 Assessment Year 2025-26") }
        );
        assert(a8.status === 200, "AGENT-INC-08 returns HTTP 200");
        assert(a8.data.agent_result.agentId === "AGENT-INC-08", "AGENT-INC-08 correct Agent ID");

        // AGENTS 9-14: MASTER PIPELINE AGENTS (1 THROUGH 6)
        console.log("\n--- Master Pipeline 6-Agent Verification Audit (Agents 9 to 14) ---");
        const pipeRes = await makeRequest(`/api/applications/${appId}/process`, "POST");
        assert(pipeRes.status === 200, "Master Pipeline /process returns HTTP 200");

        // Agent 9 (Master Pipeline Agent 1: Classification)
        assert(Array.isArray(pipeRes.data.classification_results) && pipeRes.data.classification_results.length >= 5, "Agent 9 (Pipeline Agent 1 Classification) executed");

        // Agent 10 (Master Pipeline Agent 2: Extraction)
        assert(Array.isArray(pipeRes.data.extraction_results) && pipeRes.data.extraction_results.length >= 5, "Agent 10 (Pipeline Agent 2 Extraction) executed");

        // Agent 11 (Master Pipeline Agent 3: Validation)
        assert(Array.isArray(pipeRes.data.validation_results) && pipeRes.data.validation_results.length >= 5, "Agent 11 (Pipeline Agent 3 Validation) executed");

        // Agent 12 (Master Pipeline Agent 4: Cross-Document)
        assert(pipeRes.data.cross_document_results.consistency_score === 92, "Agent 12 (Pipeline Agent 4 Cross-Document) executed (92/100 score)");

        // Agent 13 (Master Pipeline Agent 5: Risk Assessment)
        assert(pipeRes.data.risk_assessment_results.risk_level === "LOW", "Agent 13 (Pipeline Agent 5 Risk) executed (LOW risk)");

        // Agent 14 (Master Pipeline Agent 6: Final Report)
        assert(pipeRes.data.final_report_results.decision === "APPROVED", "Agent 14 (Pipeline Agent 6 Final Report) executed (APPROVED decision)");

    } catch (err) {
        console.error("Agent audit exception:", err);
        fail++;
    }

    console.log("\n===============================================================================");
    console.log(`  ALL 14 AI AGENTS AUDIT COMPLETE: ${pass} PASSED, ${fail} FAILED (TOTAL ${total} CHECKS)`);
    console.log("===============================================================================\n");
    process.exit(fail > 0 ? 1 : 0);
}

runAgentAudit();
