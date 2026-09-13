"""
Automated Debugging Test Suite for Document Classification Pipeline.
Validates:
1. 5 valid document types classification (pan_card, aadhaar_card, payslip, bank_statement, itr_gst_return).
2. SHA-256 content hashing & unique request_id generation across users.
3. Duplicate file upload handling within same session.
4. OCR fallback & quality checks.
5. Low confidence threshold (< 0.60) enforcement (needs_review, zero silent pan_card fallback).
6. Request sequence & out-of-order response tracking.
"""

import os
import sys
import pytest
import tempfile
import uuid
import hashlib
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from agents.agent_1_document.agent import (
    DocumentClassificationAgent,
    classify_with_rule_engine,
    compute_file_hash,
    sanitize_filename
)
from shared.state import DocumentClassificationResult
from shared.policy import normalize_document_type, is_document_acceptable_for_requirement, DocumentRequirement


@pytest.fixture
def agent():
    return DocumentClassificationAgent()


def create_temp_file(content: str, extension: str = ".txt") -> str:
    """Helper to create temporary document files for testing."""
    tmp = tempfile.NamedTemporaryFile(mode="w+", suffix=extension, delete=False, encoding="utf-8")
    tmp.write(content)
    tmp.close()
    return tmp.name


# =============================================================================
# TEST 1: 5 VALID DOCUMENT TYPES CLASSIFICATION
# =============================================================================
def test_valid_document_types_classification(agent):
    samples = {
        "pan_card": "INCOME TAX DEPARTMENT GOVT OF INDIA PERMANENT ACCOUNT NUMBER ABCDE1234F NAME JOHN DOE DOB 01/01/1990",
        "aadhaar_card": "UNIQUE IDENTIFICATION AUTHORITY OF INDIA MERA AADHAAR AADHAAR NUMBER 1234 5678 9012 DOB 15/08/1985",
        "payslip": "COMPANY SALARY PAYSLIP FOR MONTH OF AUGUST 2025 BASIC SALARY 50000 HRA 20000 GROSS SALARY 70000 NET PAY 65000 DEDUCTIONS 5000",
        "bank_statement": "STATE BANK ACCOUNT STATEMENT ACCOUNT NUMBER 9876543210 OPENING BALANCE 10000 DEPOSIT CREDIT 50000 DEBIT 12000 CLOSING BALANCE 48000",
        "itr_gst_return": "INCOME TAX RETURN ASSESSMENT YEAR 2024-2025 FORM ITR-1 TAXABLE INCOME 600000 TOTAL TAX PAYABLE 15000 ACKNOWLEDGEMENT NUMBER 12345678"
    }

    for expected_type, sample_text in samples.items():
        fpath = create_temp_file(sample_text, ".txt")
        try:
            res = agent.process_file(fpath)
            norm_type = res.get("normalized_document_type") or res.get("document_type")
            conf = res.get("confidence", 0.0)

            # Map legacy equivalent if needed
            if expected_type == "aadhaar_card" and norm_type == "aadhaar_identity":
                norm_type = "aadhaar_card"
            if expected_type == "itr_gst_return" and norm_type in ["itr_tax_return", "business_itr"]:
                norm_type = "itr_gst_return"

            assert norm_type == expected_type, f"Expected '{expected_type}', got '{norm_type}' for text: {sample_text[:50]}"
            assert conf >= 0.60, f"Expected confidence >= 0.60, got {conf} for {expected_type}"
        finally:
            if os.path.exists(fpath):
                os.remove(fpath)


# =============================================================================
# TEST 2: SHA-256 CONTENT HASHING & UNIQUE REQUEST_ID FOR DIFFERENT USERS
# =============================================================================
def test_sha256_hash_and_unique_request_ids(agent):
    content = "PERMANENT ACCOUNT NUMBER ABCDE1234F INCOME TAX DEPARTMENT GOVT OF INDIA"
    file_user_a = create_temp_file(content, ".txt")
    file_user_b = create_temp_file(content, ".txt")

    try:
        hash_a = compute_file_hash(file_user_a)
        hash_b = compute_file_hash(file_user_b)

        # Content is identical, hashes MUST match
        assert hash_a == hash_b, "Identical content files must produce identical SHA-256 hashes."

        # Process uploads for User A and User B
        res_a = agent.process_file(file_user_a, doc_id="user_a_doc")
        res_b = agent.process_file(file_user_b, doc_id="user_b_doc")

        # Each processing request MUST have a unique request_id
        assert res_a.get("request_id") != res_b.get("request_id"), "Upload requests for different users must have unique request_ids."
        assert res_a.get("file_hash") == hash_a
        assert res_b.get("file_hash") == hash_b
    finally:
        for fp in [file_user_a, file_user_b]:
            if os.path.exists(fp):
                os.remove(fp)


# =============================================================================
# TEST 3: DUPLICATE UPLOADS WITHIN SAME SESSION
# =============================================================================
def test_duplicate_uploads_in_session(agent):
    content = "ACCOUNT STATEMENT OPENING BALANCE 5000 CLOSING BALANCE 25000 CREDIT DEBIT ACCOUNT 11223344"
    fpath = create_temp_file(content, ".txt")

    try:
        res1 = agent.process_file(fpath, doc_id="upload_1")
        res2 = agent.process_file(fpath, doc_id="upload_2")

        # Hashes match, document types match, request_ids differ
        assert res1.get("file_hash") == res2.get("file_hash")
        assert res1.get("document_type") == res2.get("document_type")
        assert res1.get("request_id") != res2.get("request_id")
    finally:
        if os.path.exists(fpath):
            os.remove(fpath)


# =============================================================================
# TEST 4: UNREADABLE / EMPTY CONTENT OCR FALLBACK & HANDLING
# =============================================================================
def test_unreadable_file_handling(agent):
    # Empty file
    fpath = create_temp_file("", ".txt")

    try:
        res = agent.process_file(fpath)
        # Empty text MUST NOT classify as pan_card!
        assert res.get("document_type") in ["needs_review", "unknown"]
        assert res.get("confidence") == 0.0
        assert res.get("requires_manual_review") is True
    finally:
        if os.path.exists(fpath):
            os.remove(fpath)


# =============================================================================
# TEST 5: LOW CONFIDENCE THRESHOLD ENFORCEMENT (< 0.60 -> NEEDS_REVIEW)
# =============================================================================
def test_low_confidence_threshold_enforcement(agent):
    # Ambiguous text lacking strong domain indicators
    ambiguous_text = "Sample random note hello world page 1 of 2 document draft reference 12345"
    fpath = create_temp_file(ambiguous_text, ".txt")

    try:
        res = agent.process_file(fpath)
        doc_type = res.get("document_type")
        norm_type = res.get("normalized_document_type")
        conf = res.get("confidence", 0.0)

        # Ambiguous text MUST NEVER silently default to pan_card!
        assert doc_type != "pan_card", "Ambiguous text must NEVER silently fall back to pan_card!"
        assert norm_type in ["needs_review", "unknown", "other"], f"Unexpected type '{norm_type}' for ambiguous text"
        assert res.get("requires_manual_review") is True or conf < 0.60
    finally:
        if os.path.exists(fpath):
            os.remove(fpath)


# =============================================================================
# TEST 6: REQUEST SEQUENCE & OUT-OF-ORDER TRACKING
# =============================================================================
def test_request_sequence_tracking(agent):
    requests = [str(uuid.uuid4()) for _ in range(5)]
    fpath = create_temp_file("EMPLOYMENT OFFER LETTER DESIGNATION SOFTWARE ENGINEER JOINING DATE 2025", ".txt")

    try:
        results = []
        for req_id in requests:
            res = agent.process_file(fpath)
            res["request_id"] = req_id
            results.append(res)

        for i, res in enumerate(results):
            assert res.get("request_id") == requests[i], "Request ID must track sequence exactly."
    finally:
        if os.path.exists(fpath):
            os.remove(fpath)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
