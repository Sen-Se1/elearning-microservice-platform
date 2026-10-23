import os
import uuid
import shutil
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException
from .config import get_settings

settings = get_settings()

# Base upload directory (relative to the service working directory)
UPLOAD_DIR = settings.upload_dir
BASE_URL = settings.base_url.rstrip("/") if settings.base_url else ""

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


class LocalStorageClient:
    def __init__(self):
        self.upload_dir = UPLOAD_DIR
        self.base_url = BASE_URL
        self._ensure_directories()

    def _ensure_directories(self):
        """Create base upload directory if it doesn't exist"""
        os.makedirs(self.upload_dir, exist_ok=True)

    def _get_file_path(self, object_name: str) -> str:
        """Get the full filesystem path for an object name"""
        return os.path.join(self.upload_dir, object_name)

    def _get_url(self, object_name: str) -> str:
        """Generate a URL for an object name"""
        if self.base_url:
            return f"{self.base_url}/uploads/{object_name}"
        return f"/uploads/{object_name}"

    def _validate_thumbnail_file(self, file: UploadFile) -> Tuple[bool, str]:
        """
        Validate thumbnail image file
        Returns: (is_valid, error_message)
        """
        allowed_types = [
            'image/jpeg', 'image/jpg', 'image/png',
            'image/gif', 'image/webp', 'image/svg+xml'
        ]

        # Check file type
        if file.content_type not in allowed_types:
            return False, f"Unsupported file type. Allowed: {', '.join(allowed_types)}"

        # Check file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size > max_size:
            return False, f"File too large. Max size: 5MB"

        # Check file extension
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
        file_extension = os.path.splitext(file.filename or "")[1].lower()
        if file_extension not in allowed_extensions:
            return False, f"Unsupported file extension. Allowed: {', '.join(allowed_extensions)}"

        return True, ""

    def extract_object_name(self, url: str) -> str:
        """Extract object name from a local storage URL"""
        try:
            # URL format: /uploads/object_name or http(s)://host/uploads/object_name
            if "/uploads/" in url:
                parts = url.split("/uploads/", 1)
                if len(parts) > 1:
                    return parts[1]
            return ""
        except Exception:
            return ""

    async def upload_course_thumbnail(
        self,
        file: UploadFile,
        course_id: str,
        delete_old: bool = True,
        old_thumbnail_url: Optional[str] = None
    ) -> Tuple[str, Optional[str]]:
        """
        Upload course thumbnail to local storage

        Returns: (new_thumbnail_url, old_object_name)
        """
        # Validate thumbnail file
        is_valid, error_msg = self._validate_thumbnail_file(file)
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        # Delete old thumbnail if requested
        old_object_name = None
        if delete_old and old_thumbnail_url:
            old_object_name = self.extract_object_name(old_thumbnail_url)
            if old_object_name:
                self.delete_file(old_object_name)

        try:
            # Generate unique filename
            file_extension = os.path.splitext(file.filename or "thumbnail")[1]
            filename = f"{uuid.uuid4()}{file_extension}"
            object_name = f"courses/{course_id}/thumbnails/{filename}"

            # Create directory if needed
            file_path = self._get_file_path(object_name)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            # Save file to local storage
            content = await file.read()
            with open(file_path, "wb") as buffer:
                buffer.write(content)

            # Generate URL
            new_url = self._get_url(object_name)

            return new_url, old_object_name

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Thumbnail upload failed: {str(e)}"
            )
        finally:
            await file.close()

    async def upload_lesson_content(self, file: UploadFile, course_id: str, lesson_id: str = None) -> str:
        """
        Upload lesson content file to local storage
        """
        try:
            file_extension = os.path.splitext(file.filename or "")[1]
            filename = f"{uuid.uuid4()}{file_extension}"

            if lesson_id:
                object_name = f"courses/{course_id}/lessons/{lesson_id}/{filename}"
            else:
                object_name = f"courses/{course_id}/assets/{filename}"

            # Create directory if needed
            file_path = self._get_file_path(object_name)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            # Save file to local storage
            content = await file.read()
            with open(file_path, "wb") as buffer:
                buffer.write(content)

            url = self._get_url(object_name)
            return url

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"File upload failed: {str(e)}"
            )
        finally:
            await file.close()

    def delete_file(self, object_name: str):
        """Delete file from local storage"""
        try:
            file_path = self._get_file_path(object_name)
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass


local_storage = LocalStorageClient()
