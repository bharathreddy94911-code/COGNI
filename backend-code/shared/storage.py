"""
Storage abstraction module for Loan Document Processing Agent.
Supports seamless switching between Amazon Web Services (AWS) S3 storage
and local filesystem storage based on environment configuration.
"""

import os
import io
import shutil
import logging
import tempfile
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger("StorageService")

# Local Storage Directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
LOCAL_UPLOAD_DIR = PROJECT_ROOT / "uploads"
LOCAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# AWS S3 Configuration
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "").strip()

# Lazy-loaded boto3 client
_s3_client = None


def _get_s3_client():
    """Initializes and caches the boto3 S3 client using IAM roles or environment credentials."""
    global _s3_client
    if _s3_client is not None:
        return _s3_client
    try:
        import boto3
        from botocore.config import Config

        cfg = Config(
            region_name=AWS_REGION,
            signature_version="v4",
            retries={"max_attempts": 3, "mode": "standard"}
        )
        _s3_client = boto3.client("s3", config=cfg)
        logger.info(f"Initialized AWS S3 client for bucket: '{AWS_S3_BUCKET}' in region: '{AWS_REGION}'")
        return _s3_client
    except ImportError:
        logger.warning("boto3 package not installed. S3 storage unavailable; using local storage fallback.")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize AWS S3 client: {e}. Falling back to local storage.")
        return None


class StorageService:
    """Unified storage service providing S3 persistence and local fallback."""

    @staticmethod
    def is_s3_enabled() -> bool:
        """Returns True if AWS S3 bucket is configured and boto3 client is available."""
        return bool(AWS_S3_BUCKET) and (_get_s3_client() is not None)

    @staticmethod
    def upload_file(file_bytes: bytes, key: str, content_type: Optional[str] = None) -> Tuple[str, str]:
        """
        Uploads document to Amazon S3 (if configured) and local filesystem cache.
        Returns:
            Tuple[storage_path, storage_type] where storage_type is 's3' or 'local'.
        """
        # Always write to local storage path as working copy/cache
        local_path = LOCAL_UPLOAD_DIR / key
        local_path.parent.mkdir(parents=True, exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(file_bytes)

        if StorageService.is_s3_enabled():
            try:
                s3 = _get_s3_client()
                extra_args = {"ServerSideEncryption": "AES256"}
                if content_type:
                    extra_args["ContentType"] = content_type

                s3.put_object(
                    Bucket=AWS_S3_BUCKET,
                    Key=key,
                    Body=file_bytes,
                    **extra_args
                )
                logger.info(f"Successfully uploaded '{key}' ({len(file_bytes)} bytes) to S3 bucket '{AWS_S3_BUCKET}'.")
                return f"s3://{AWS_S3_BUCKET}/{key}", "s3"
            except Exception as e:
                logger.error(f"S3 upload failed for key '{key}': {e}. Using local storage copy.")
                return str(local_path), "local"

        return str(local_path), "local"

    @staticmethod
    def get_file_bytes(storage_path_or_key: str) -> bytes:
        """Retrieves raw bytes of a document from S3 or local storage."""
        if storage_path_or_key.startswith("s3://"):
            parts = storage_path_or_key[5:].split("/", 1)
            bucket = parts[0]
            key = parts[1] if len(parts) > 1 else ""
            s3 = _get_s3_client()
            if s3:
                try:
                    obj = s3.get_object(Bucket=bucket, Key=key)
                    return obj["Body"].read()
                except Exception as e:
                    logger.error(f"Failed to read from S3 path '{storage_path_or_key}': {e}")

        # Fallback to local path or relative key
        local_path = Path(storage_path_or_key)
        if not local_path.is_absolute():
            local_path = LOCAL_UPLOAD_DIR / storage_path_or_key

        if local_path.exists():
            with open(local_path, "rb") as f:
                return f.read()

        raise FileNotFoundError(f"Document not found at '{storage_path_or_key}' in S3 or local storage.")

    @staticmethod
    def get_local_file_path(storage_path_or_key: str) -> str:
        """
        Ensures a local file exists for OCR and library processing (PyPDF, pdfplumber, docx).
        Downloads from S3 to a temporary file if needed.
        """
        if storage_path_or_key.startswith("s3://"):
            parts = storage_path_or_key[5:].split("/", 1)
            bucket = parts[0]
            key = parts[1] if len(parts) > 1 else ""
            
            # Check if cached locally first
            cached_local = LOCAL_UPLOAD_DIR / key
            if cached_local.exists():
                return str(cached_local)

            # Download from S3 to temp file
            s3 = _get_s3_client()
            if s3:
                try:
                    ext = key.rsplit(".", 1)[-1] if "." in key else "tmp"
                    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}")
                    s3.download_fileobj(bucket, key, temp_file)
                    temp_file.close()
                    logger.info(f"Downloaded S3 object '{key}' to temporary file '{temp_file.name}'.")
                    return temp_file.name
                except Exception as e:
                    logger.error(f"Failed to download S3 object '{storage_path_or_key}': {e}")

        # Return local path
        local_path = Path(storage_path_or_key)
        if not local_path.is_absolute():
            local_path = LOCAL_UPLOAD_DIR / storage_path_or_key
        return str(local_path)

    @staticmethod
    def delete_file(storage_path_or_key: str) -> bool:
        """Deletes document from S3 and local storage."""
        success = True
        if storage_path_or_key.startswith("s3://"):
            parts = storage_path_or_key[5:].split("/", 1)
            bucket = parts[0]
            key = parts[1] if len(parts) > 1 else ""
            s3 = _get_s3_client()
            if s3:
                try:
                    s3.delete_object(Bucket=bucket, Key=key)
                    logger.info(f"Deleted S3 object '{key}' from bucket '{bucket}'.")
                except Exception as e:
                    logger.error(f"Failed to delete S3 object '{key}': {e}")
                    success = False

        # Delete local copy if exists
        local_path = Path(storage_path_or_key)
        if not local_path.is_absolute():
            local_path = LOCAL_UPLOAD_DIR / storage_path_or_key

        if local_path.exists():
            try:
                local_path.unlink()
            except Exception as e:
                logger.warning(f"Could not delete local file '{local_path}': {e}")
                success = False

        return success
