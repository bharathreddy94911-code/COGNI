/**
 * Agent Result Repository
 * Stores AI Agent execution records, extracted data, validation results, and execution telemetry.
 */

const AGENT_RESULTS_DB = new Map();
const EXECUTION_LOGS = [];

const agentResultRepository = {
    /**
     * Save an AI Agent processing result
     */
    saveResult(result) {
        const key = result.fileId || result.requestId || `res_${Date.now()}`;
        const record = {
            requestId: result.requestId,
            fileId: result.fileId,
            userId: result.userId || "anonymous_user",
            applicationId: result.applicationId || "DEFAULT_APP",
            agentId: result.agentId,
            agentName: result.agentName,
            documentType: result.documentType,
            loanType: result.loanType,
            extractedText: result.extractedText || "",
            extractedData: result.extractedData || {},
            missingFields: result.missingFields || [],
            validationErrors: result.validationErrors || [],
            confidenceScore: typeof result.confidenceScore === 'number' ? result.confidenceScore : 0,
            documentValid: typeof result.documentValid === 'boolean' ? result.documentValid : true,
            processingStatus: result.processingStatus || "COMPLETED",
            message: result.message || "Document processed successfully",
            processingStartTime: result.processingStartTime || new Date().toISOString(),
            processingEndTime: result.processingEndTime || new Date().toISOString(),
            processingDurationMs: result.processingDurationMs || 0,
            createdAt: new Date().toISOString()
        };

        AGENT_RESULTS_DB.set(key, record);

        // Store sanitized execution log entry
        EXECUTION_LOGS.push({
            requestId: record.requestId,
            userId: record.userId,
            fileId: record.fileId,
            documentType: record.documentType,
            loanType: record.loanType,
            agentId: record.agentId,
            agentName: record.agentName,
            processingStartTime: record.processingStartTime,
            processingEndTime: record.processingEndTime,
            processingStatus: record.processingStatus,
            confidenceScore: record.confidenceScore,
            missingFieldsCount: record.missingFields.length,
            validationErrorsCount: record.validationErrors.length
        });

        return record;
    },

    /**
     * Get agent result by file ID
     */
    getResultByFileId(fileId) {
        return AGENT_RESULTS_DB.get(fileId) || null;
    },

    /**
     * Get agent result by request ID
     */
    getResultByRequestId(requestId) {
        for (const record of AGENT_RESULTS_DB.values()) {
            if (record.requestId === requestId) {
                return record;
            }
        }
        return null;
    },

    /**
     * Get all results for an application
     */
    getResultsByApplication(applicationId) {
        const results = [];
        for (const record of AGENT_RESULTS_DB.values()) {
            if (record.applicationId === applicationId) {
                results.push(record);
            }
        }
        return results;
    },

    /**
     * Get execution logs for auditing & debugging
     */
    getExecutionLogs() {
        return EXECUTION_LOGS;
    },

    /**
     * Clear repository (for testing)
     */
    clearAll() {
        AGENT_RESULTS_DB.clear();
        EXECUTION_LOGS.length = 0;
    }
};

module.exports = agentResultRepository;
