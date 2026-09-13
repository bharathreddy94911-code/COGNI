/**
 * Agent Execution Service
 * Orchestrates the complete end-to-end AI Agent pipeline:
 * Validation -> Agent Selection -> OCR -> Text Extraction -> Validation -> Persistence -> Structured Response
 */

const fileUploadService = require("./fileUploadService");
const documentValidationService = require("./documentValidationService");
const agentSelectionService = require("./agentSelectionService");
const ocrService = require("./ocrService");
const classificationService = require("./classificationService");
const documentExtractionService = require("./documentExtractionService");
const resultValidationService = require("./resultValidationService");
const documentRepository = require("./documentRepository");
const agentResultRepository = require("./agentResultRepository");

const agentExecutionService = {
    /**
     * Process a document upload through the AI Agent pipeline
     */
    async executeAgentPipeline({ file, requirementId, applicationId, userId, loanType, authorizationHeader, isRetry = false }) {
        const startTime = new Date();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const fileId = file && file.path ? `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` : `file_demo_${Date.now()}`;

        console.log(`[Upload Request Received] requestId=${requestId} fileId=${fileId} reqId=${requirementId} loanType=${loanType}`);

        try {
            // STEP 1: VALIDATING - File & Request Context
            const validatedFile = fileUploadService.validateFile(file);
            console.log(`[File Validation Completed] requestId=${requestId} fileId=${fileId} name=${validatedFile.sanitizedFilename} size=${validatedFile.size}`);

            const context = documentValidationService.validateUploadContext({
                userId,
                authorizationHeader,
                loanType,
                requirementId
            });
            console.log(`[Document Context Validated] requestId=${requestId} userId=${context.userId} loanType=${context.loanType}`);

            // STEP 2: AGENT_SELECTED - Dynamic Agent Selection
            const agent = agentSelectionService.selectAgent(context.requirementId, context.loanType);
            console.log(`[Agent Selected] requestId=${requestId} fileId=${fileId} docType=${context.requirementId} loanType=${context.loanType} agentId=${agent.agentId} agentName="${agent.agentName}"`);

            // Save initial document record with status AGENT_SELECTED
            documentRepository.saveDocument({
                fileId,
                userId: context.userId,
                applicationId: applicationId || "DEFAULT_APP",
                originalFilename: validatedFile.sanitizedFilename,
                filePath: file ? file.path : null,
                mimeType: validatedFile.mimeType,
                fileSize: validatedFile.size,
                requirementId: context.requirementId,
                documentType: context.requirementId,
                loanType: context.loanType,
                agentId: agent.agentId,
                agentName: agent.agentName,
                status: "AGENT_SELECTED"
            });

            // STEP 3: PROCESSING, OCR & AGENT 1 CLASSIFICATION ANALYSIS
            console.log(`[Agent Execution Started] requestId=${requestId} agentId=${agent.agentId}`);
            
            // Check for simulated agent failure scenario
            if (validatedFile.sanitizedFilename.includes("agent_fail") || validatedFile.sanitizedFilename.includes("model_error")) {
                throw new Error(`AI Model Failure: ${agent.agentName} encountered an internal processing timeout.`);
            }

            const ocrResult = await ocrService.extractText(file, context.requirementId);
            console.log(`[OCR Completed] requestId=${requestId} fileId=${fileId} confidence=${ocrResult.confidenceScore}`);

            // AGENT 1: Document Classification Analysis
            const classification = classificationService.classifyDocument({
                file,
                requirementId: context.requirementId,
                ocrText: ocrResult.text,
                filename: validatedFile.sanitizedFilename
            });
            console.log(`[Agent 1 Classification Analyzed] type=${classification.detectedType} status=${classification.status} match=${classification.isMatch}`);

            const extraction = documentExtractionService.extractStructuredData({
                ocrText: ocrResult.text,
                documentType: classification.detectedType || context.requirementId,
                loanType: context.loanType,
                filename: validatedFile.sanitizedFilename
            });
            console.log(`[Document Data Extraction Completed] requestId=${requestId} missingFields=${extraction.missingFields.length}`);

            // Aggregate validation errors including Agent 1 classification mismatch
            const allValidationErrors = [...extraction.validationErrors];
            if (!classification.isMatch) {
                allValidationErrors.push(classification.classificationReason);
            }

            const finalConfidenceScore = classification.isMatch ? 
                Math.min(classification.confidence, extraction.confidenceScore) : 
                0.35;

            // STEP 4: VALIDATING_RESULT - Structure & Confidence Validation
            const endTime = new Date();
            const processingDurationMs = endTime.getTime() - startTime.getTime();

            const rawAgentResponse = {
                success: true,
                requestId,
                fileId,
                userId: context.userId,
                applicationId: applicationId || "DEFAULT_APP",
                agentId: agent.agentId,
                agentName: agent.agentName,
                documentType: classification.detectedType || context.requirementId,
                loanType: context.loanType,
                classificationResult: classification,
                extractedText: ocrResult.text,
                extractedData: extraction.extractedData,
                missingFields: extraction.missingFields,
                validationErrors: allValidationErrors,
                confidenceScore: finalConfidenceScore,
                documentValid: classification.isMatch && extraction.missingFields.length === 0 && allValidationErrors.length === 0,
                processingStatus: "COMPLETED",
                message: classification.isMatch ? 
                    `Document successfully analyzed and classified by ${classification.agentName} and ${agent.agentName}` : 
                    classification.classificationReason,
                processingStartTime: startTime.toISOString(),
                processingEndTime: endTime.toISOString(),
                processingDurationMs
            };

            const validatedResult = resultValidationService.validateAgentResult(rawAgentResponse);
            console.log(`[Agent Response Validated] requestId=${requestId} status=COMPLETED score=${validatedResult.normalizedResult.confidenceScore}`);

            // STEP 5: SAVING_RESULT - Database Persistence
            agentResultRepository.saveResult(validatedResult.normalizedResult);
            documentRepository.updateStatus(fileId, "COMPLETED", {
                confidence: validatedResult.normalizedResult.confidenceScore,
                agentResult: validatedResult.normalizedResult
            });
            console.log(`[Database Result Saved] requestId=${requestId} fileId=${fileId}`);
            console.log(`[Frontend Response Returned] requestId=${requestId} fileId=${fileId}`);

            return validatedResult.normalizedResult;

        } catch (error) {
            const endTime = new Date();
            console.error(`[Agent Execution Failed] requestId=${requestId} fileId=${fileId} error="${error.message}"`);

            const errorRecord = {
                success: false,
                status: error.status || "FAILED",
                errorCode: error.errorCode || "PROCESSING_ERROR",
                message: error.message || "Document processing failed",
                requestId,
                fileId,
                userId: userId || "anonymous_user",
                applicationId: applicationId || "DEFAULT_APP",
                loanType: loanType || "personal_loan",
                documentType: requirementId || "unknown",
                processingStatus: "FAILED",
                processingStartTime: startTime.toISOString(),
                processingEndTime: endTime.toISOString()
            };

            if (error.statusCode) {
                errorRecord.statusCode = error.statusCode;
            }

            return errorRecord;
        }
    }
};

module.exports = agentExecutionService;
