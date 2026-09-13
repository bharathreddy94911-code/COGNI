/**
 * Result Validation Service
 * Enforces strict schema validation on AI Agent processing results.
 */

const resultValidationService = {
    /**
     * Validate an AI Agent result schema
     */
    validateAgentResult(result) {
        if (!result || typeof result !== "object") {
            throw new Error("Invalid Agent Result: Result payload must be a non-null object.");
        }

        const requiredFields = [
            "success",
            "requestId",
            "fileId",
            "agentId",
            "agentName",
            "documentType",
            "loanType",
            "extractedData",
            "missingFields",
            "validationErrors",
            "confidenceScore",
            "processingStatus"
        ];

        for (const field of requiredFields) {
            if (!(field in result) || result[field] === undefined || result[field] === null) {
                throw new Error(`Invalid Agent Result: Missing mandatory schema field '${field}'.`);
            }
        }

        if (typeof result.confidenceScore !== "number" || isNaN(result.confidenceScore)) {
            throw new Error("Invalid Agent Result: 'confidenceScore' must be a valid number.");
        }

        if (!Array.isArray(result.missingFields)) {
            throw new Error("Invalid Agent Result: 'missingFields' must be an array.");
        }

        if (!Array.isArray(result.validationErrors)) {
            throw new Error("Invalid Agent Result: 'validationErrors' must be an array.");
        }

        return {
            valid: true,
            normalizedResult: {
                ...result,
                confidenceScore: Math.max(0, Math.min(1, Number(result.confidenceScore))),
                documentValid: result.missingFields.length === 0 && result.validationErrors.length === 0
            }
        };
    }
};

module.exports = resultValidationService;
