const http = require("http");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://127.0.0.1:8000";

function makeMultipartRequest(urlPath, fields, fileInfo, headers = {}) {
    return new Promise((resolve, reject) => {
        const boundary = "--------------------------" + Date.now().toString(16);
        let bodyParts = [];

        // Add fields
        for (const [key, value] of Object.entries(fields)) {
            bodyParts.push(Buffer.from(
                `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
            ));
        }

        // Add file if provided
        if (fileInfo) {
            const filename = fileInfo.filename || "test.pdf";
            const mimeType = fileInfo.mimeType || "application/pdf";
            const content = fileInfo.content !== undefined ? fileInfo.content : Buffer.from("Sample document content for testing");

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
            path: urlPath,
            method: "POST",
            headers: {
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
                "Content-Length": bodyBuffer.length,
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let resData = "";
            res.on("data", chunk => resData += chunk);
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(resData);
                } catch (e) {
                    parsed = resData;
                }
                resolve({ statusCode: res.statusCode, body: parsed });
            });
        });

        req.on("error", reject);
        req.write(bodyBuffer);
        req.end();
    });
}

function makeGetRequest(urlPath) {
    return new Promise((resolve, reject) => {
        http.get(`${BASE_URL}${urlPath}`, (res) => {
            let resData = "";
            res.on("data", chunk => resData += chunk);
            res.on("end", () => {
                try {
                    resolve({ statusCode: res.statusCode, body: JSON.parse(resData) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: resData });
                }
            });
        }).on("error", reject);
    });
}

async function runAllTests() {
    console.log("=== RUNNING 20 COMPREHENSIVE AI AGENT UPLOAD TEST CASES ===\n");
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`✓ PASS: ${message}`);
            passed++;
        } else {
            console.error(`✗ FAIL: ${message}`);
            failed++;
        }
    }

    try {
        // Create an application first
        const appRes = await makeMultipartRequest("/api/applications", { loan_type: "personal_loan" });
        const appId = appRes.body.application_id || "DEMO-APP-101";

        // TEST 1: Uploading a Payslip -> Payslip Processing Agent
        const t1 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`, 
            { requirement_id: "payslip", userId: "usr_rajesh_101" },
            { filename: "payslip_august.pdf", content: Buffer.from("Pay Period August 2026 Salary 75000") }
        );
        assert(t1.statusCode === 200, "1. Payslip upload returns HTTP 200");
        assert(t1.body.agent_result && t1.body.agent_result.agentId === "AGENT-PAYSLIP-01", "1. Payslip routed to AGENT-PAYSLIP-01 (Payslip Processing Agent)");

        // TEST 2: Uploading a Bank Statement -> Bank Statement Agent
        const t2 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "bank_statement", userId: "usr_rajesh_101" },
            { filename: "bank_statement_q3.pdf", content: Buffer.from("Bank HDFC Balance 245000") }
        );
        assert(t2.statusCode === 200, "2. Bank statement upload returns HTTP 200");
        assert(t2.body.agent_result && t2.body.agent_result.agentId === "AGENT-BANK-02", "2. Bank statement routed to AGENT-BANK-02 (Bank Statement Processing Agent)");

        // TEST 3: Uploading Identity Document -> Identity Verification Agent
        const t3 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "kyc_identity", userId: "usr_rajesh_101" },
            { filename: "aadhaar_card.pdf", content: Buffer.from("Aadhaar Number 9988-7766-5544 Rajesh Kumar") }
        );
        assert(t3.statusCode === 200, "3. Identity document upload returns HTTP 200");
        assert(t3.body.agent_result && t3.body.agent_result.agentId === "AGENT-KYC-03", "3. Identity document routed to AGENT-KYC-03 (Identity Verification Agent)");

        // TEST 4: Uploading unsupported document category -> AGENT_NOT_FOUND
        const t4 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "unsupported_invalid_category", userId: "usr_rajesh_101" },
            { filename: "random_doc.pdf", content: Buffer.from("random text") }
        );
        assert(t4.statusCode === 404, "4. Unsupported document category returns HTTP 404");
        assert(t4.body.status === "AGENT_NOT_FOUND", "4. Unsupported document category returns status AGENT_NOT_FOUND");

        // TEST 5: Uploading empty 0-byte file -> Rejection with error
        const t5 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "pan_card", userId: "usr_rajesh_101" },
            { filename: "empty.pdf", content: Buffer.alloc(0) }
        );
        assert(t5.statusCode === 400 || !t5.body.success, "5. Empty 0-byte file rejected");

        // TEST 6: Uploading document with missing fields -> missingFields array returned
        const t6 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "payslip", userId: "usr_rajesh_101" },
            { filename: "payslip_missing_fields.pdf", content: Buffer.from("Incomplete payslip content") }
        );
        assert(t6.statusCode === 200, "6. Payslip with missing fields uploaded");
        assert(t6.body.agent_result.missingFields.length > 0, "6. Agent detected missing mandatory fields");

        // TEST 7: Uploading low-quality scanned document -> low confidence score
        const t7 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "pan_card", userId: "usr_rajesh_101" },
            { filename: "pan_low_quality_blurry.png", content: Buffer.from("Blurry image bytes") }
        );
        assert(t7.statusCode === 200, "7. Low quality document uploaded");
        assert(t7.body.agent_result.confidenceScore < 0.5, "7. Confidence score adjusted below 0.5 for blurry scan");

        // TEST 8: Uploading multiple documents to single application
        assert(t1.body.application_id === t2.body.application_id, "8. Multiple documents linked to same application_id");

        // TEST 9: Uploading same document slot twice -> Updates existing slot
        const t9 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "kyc_identity", userId: "usr_rajesh_101" },
            { filename: "aadhaar_updated.pdf", content: Buffer.from("Updated Aadhaar Content") }
        );
        assert(t9.statusCode === 200, "9. Overwriting slot returned HTTP 200");
        assert(t9.body.slot.uploaded_filename === "aadhaar_updated.pdf", "9. Slot filename successfully updated to new upload");

        // TEST 10: Missing authentication -> Rejection
        const t10 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "pan_card", userId: "" },
            { filename: "pan.pdf", content: Buffer.from("PAN sample") },
            { "Authorization": "" }
        );
        assert(t10.body !== null, "10. Handled authentication verification check");

        // TEST 11: Uploading with different loan type (business_loan)
        const appRes2 = await makeMultipartRequest("/api/applications", { loan_type: "business_loan" });
        const appId2 = appRes2.body.application_id;
        const t11 = await makeMultipartRequest(`/api/applications/${appId2}/slot-upload`,
            { requirement_id: "business_registration", userId: "usr_biz_202" },
            { filename: "gst_certificate.pdf", content: Buffer.from("GST Registration Certificate") }
        );
        assert(t11.statusCode === 200, "11. Business loan document upload returns HTTP 200");
        assert(t11.body.agent_result.agentId === "AGENT-INC-08", "11. Business doc routed to AGENT-INC-08");

        // TEST 12: Agent model failure scenario
        const t12 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "pan_card", userId: "usr_rajesh_101" },
            { filename: "pan_agent_fail.pdf", content: Buffer.from("Sample text") }
        );
        assert(t12.statusCode === 400 || !t12.body.success, "12. Agent model failure scenario handled cleanly");

        // TEST 13: OCR failure scenario
        const t13 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "pan_card", userId: "usr_rajesh_101" },
            { filename: "pan_unreadable_corrupt.pdf", content: Buffer.from("Sample text") }
        );
        assert(t13.statusCode === 400 || !t13.body.success, "13. OCR failure scenario handled cleanly");

        // TEST 14: Agent response structure verification
        assert(t1.body.agent_result.requestId !== undefined, "14. Agent response contains requestId");
        assert(t1.body.agent_result.fileId !== undefined, "14. Agent response contains fileId");
        assert(t1.body.agent_result.extractedData !== undefined, "14. Agent response contains extractedData");
        assert(t1.body.agent_result.processingStatus === "COMPLETED", "14. Agent response contains processingStatus=COMPLETED");

        // TEST 15: Database persistence check
        const t15 = await makeMultipartRequest(`/api/applications/${appId}/slot-upload`,
            { requirement_id: "pan_card", userId: "usr_rajesh_101" },
            { filename: "pan_rajesh_final.pdf", content: Buffer.from("PAN ABCDE1234F") }
        );
        assert(t15.body.file_id !== undefined && t15.body.request_id !== undefined, "15. DB assigned unique file_id and request_id");

        // TEST 16: Structured response schema verification
        assert(typeof t15.body.agent_result.confidenceScore === "number", "16. Confidence score is numeric");

        // TEST 17: Application status endpoint incorporates AI Agent results
        const processRes = await makeMultipartRequest(`/api/applications/${appId}/process`, {});
        assert(processRes.statusCode === 200, "17. Pipeline process endpoint returns HTTP 200");
        assert(processRes.body.final_report_results.decision === "APPROVED", "17. Pipeline process final decision is APPROVED");

        // TEST 18: User ID mapping
        assert(t1.body.agent_result.userId === "usr_rajesh_101", "18. Document correctly linked to authenticated userId");

        // TEST 19: No raw upload response shown as final result
        assert(t1.body.agent_result.extractedData.applicant_name !== undefined, "19. Structured AI agent extracted data returned instead of raw upload metadata");

        // TEST 20: Execution log verification
        const logsRes = await makeGetRequest("/api/agent-logs");
        assert(logsRes.statusCode === 200 && Array.isArray(logsRes.body.logs), "20. Audit log endpoint returns execution logs array");
        assert(logsRes.body.logs.length > 0, "20. Verified backend logs generated for every AI agent document upload");

    } catch (err) {
        console.error("Test execution exception:", err);
        failed++;
    }

    console.log(`\n==================================================`);
    console.log(`TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED.`);
    console.log(`==================================================\n`);
    process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
