/**
 * Document Repository
 * Handles database persistence for uploaded documents, applications, and user links.
 */

const DOCUMENTS_DB = new Map();

const documentRepository = {
    /**
     * Save or update an uploaded document record
     */
    saveDocument(docData) {
        const id = docData.fileId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const record = {
            id,
            fileId: id,
            userId: docData.userId || "anonymous_user",
            applicationId: docData.applicationId || "DEFAULT_APP",
            originalFilename: docData.originalFilename || "document.pdf",
            filePath: docData.filePath || null,
            mimeType: docData.mimeType || "application/pdf",
            fileSize: docData.fileSize || 0,
            requirementId: docData.requirementId || "kyc_identity",
            documentType: docData.documentType || "kyc_identity",
            loanType: docData.loanType || "personal_loan",
            agentId: docData.agentId || null,
            agentName: docData.agentName || null,
            status: docData.status || "UPLOADED",
            createdAt: docData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        DOCUMENTS_DB.set(id, record);
        return record;
    },

    /**
     * Get document by fileId
     */
    getDocument(fileId) {
        return DOCUMENTS_DB.get(fileId) || null;
    },

    /**
     * Get all documents for a specific user
     */
    getDocumentsByUser(userId) {
        const results = [];
        for (const doc of DOCUMENTS_DB.values()) {
            if (doc.userId === userId) {
                results.push(doc);
            }
        }
        return results;
    },

    /**
     * Get all documents for a specific application
     */
    getDocumentsByApplication(applicationId) {
        const results = [];
        for (const doc of DOCUMENTS_DB.values()) {
            if (doc.applicationId === applicationId) {
                results.push(doc);
            }
        }
        return results;
    },

    /**
     * Update document status
     */
    updateStatus(fileId, status, extraFields = {}) {
        const doc = DOCUMENTS_DB.get(fileId);
        if (!doc) return null;
        doc.status = status;
        doc.updatedAt = new Date().toISOString();
        Object.assign(doc, extraFields);
        DOCUMENTS_DB.set(fileId, doc);
        return doc;
    },

    /**
     * Clear repository (for testing)
     */
    clearAll() {
        DOCUMENTS_DB.clear();
    }
};

module.exports = documentRepository;
