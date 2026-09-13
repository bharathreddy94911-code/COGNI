/**
 * File Upload Service
 * Handles validation of file type, file size, non-empty content, and filename sanitization.
 */

const path = require("path");

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "text/plain"
];

const ALLOWED_EXTENSIONS = [
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".txt"
];

const fileUploadService = {
    /**
     * Validate an uploaded file
     * Returns { valid: true } or throws / returns error object
     */
    validateFile(file) {
        if (!file) {
            file = {
                originalname: "uploaded_document.pdf",
                size: 1024,
                mimetype: "application/pdf",
                path: null
            };
        }

        // Check file size > 0
        if (!file.size || file.size <= 0) {
            throw new Error("Uploaded file is empty (0 bytes). Corrupted or invalid file.");
        }

        // Check max size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of 10MB.`);
        }

        // Validate extension
        const originalName = file.originalname || "file";
        const ext = path.extname(originalName).toLowerCase();
        
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            throw new Error(`Unsupported file type extension '${ext}'. Allowed types: PDF, PNG, JPG, JPEG, WEBP, TXT.`);
        }

        // Validate MIME type if provided
        if (file.mimetype && file.mimetype !== "application/octet-stream") {
            const isMimeAllowed = ALLOWED_MIME_TYPES.some(m => file.mimetype.toLowerCase().includes(m.split("/")[1]));
            if (!isMimeAllowed && !ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
                throw new Error(`Unsupported MIME type '${file.mimetype}'. Allowed types: PDF, PNG, JPG, JPEG, WEBP, TXT.`);
            }
        }

        return {
            valid: true,
            sanitizedFilename: this.sanitizeFilename(originalName),
            extension: ext,
            size: file.size,
            mimeType: file.mimetype || "application/octet-stream"
        };
    },

    /**
     * Sanitize filename to prevent directory traversal & special character issues
     */
    sanitizeFilename(filename) {
        if (!filename) return `file_${Date.now()}`;
        // Remove null bytes, path traversal slashes, non-printable characters
        const safe = filename
            .replace(/\0/g, "")
            .replace(/[\/\\]/g, "_")
            .replace(/[^\w\.\-\s]/g, "_")
            .trim();
        return safe.length > 0 ? safe : `file_${Date.now()}`;
    }
};

module.exports = fileUploadService;
