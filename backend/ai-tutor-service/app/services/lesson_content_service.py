import httpx
import base64
import mimetypes
import logging
from typing import Tuple, List, Dict, Optional, Any
from ..core.config import settings

logger = logging.getLogger(__name__)

MAX_INLINE_BYTES = 15 * 1024 * 1024  # 15 MB Gemini inline limit


class LessonContentService:
    def resolve_media_url(self, url: Optional[str]) -> str:
        """Resolve external/localhost media URLs to internal docker network service URLs"""
        if not url:
            return ""
        if url.startswith("http://localhost:8001"):
            return url.replace("http://localhost:8001", settings.COURSE_SERVICE_URL)
        if url.startswith("http://course-service:8001"):
            return url.replace("http://course-service:8001", settings.COURSE_SERVICE_URL)
        if url.startswith("/"):
            return f"{settings.COURSE_SERVICE_URL}{url}"
        if not url.startswith("http://") and not url.startswith("https://"):
            return f"{settings.COURSE_SERVICE_URL}/{url}"
        return url

    async def get_youtube_details(self, url: str) -> Dict[str, str]:
        """Fetch YouTube video metadata using oEmbed"""
        try:
            oembed_url = f"https://www.youtube.com/oembed?url={url}&format=json"
            async with httpx.AsyncClient() as client:
                resp = await client.get(oembed_url, timeout=5.0)
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "title": data.get("title", ""),
                        "author": data.get("author_name", ""),
                        "provider": data.get("provider_name", "YouTube"),
                    }
        except Exception as e:
            logger.warning(f"Failed to fetch YouTube oEmbed for {url}: {e}")
        return {}

    async def extract_lesson_content(self, lesson: Dict[str, Any], course: Dict[str, Any]) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Extract textual context and multimodal inline parts (PDF, image, audio, video)
        from a specific lesson file or YouTube URL.
        Returns:
            Tuple[context_text, inline_parts]
        """
        title = lesson.get("title", "Lesson")
        description = lesson.get("description") or ""
        content_type = (lesson.get("content_type") or "").lower()
        raw_url = lesson.get("content_url") or ""
        course_title = course.get("title", "Course")
        
        inline_parts: List[Dict[str, Any]] = []
        context_lines = [
            f"Course Title: {course_title}",
            f"Lesson Title: {title}",
            f"Lesson Type: {content_type}",
        ]
        if description:
            context_lines.append(f"Lesson Description: {description}")

        # Check if YouTube video
        if "youtube.com" in raw_url or "youtu.be" in raw_url:
            yt_data = await self.get_youtube_details(raw_url)
            yt_title = yt_data.get("title", title)
            yt_author = yt_data.get("author", "Online Instructor")
            context_lines.append(
                f"\nThis lesson is based on YouTube video '{yt_title}' by {yt_author} ({raw_url}).\n"
                f"Please generate quiz questions testing the student's mastery of the concepts taught in this video."
            )
            return "\n".join(context_lines), inline_parts

        if not raw_url:
            return "\n".join(context_lines), inline_parts

        resolved_url = self.resolve_media_url(raw_url)

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(resolved_url, timeout=30.0)
                if resp.status_code != 200:
                    logger.warning(f"Could not download lesson file at {resolved_url}, status: {resp.status_code}")
                    return "\n".join(context_lines), inline_parts

                file_bytes = resp.content
                file_size = len(file_bytes)
                logger.info(f"Downloaded lesson file ({content_type}): {file_size} bytes")

                # 1. Text file
                if content_type == "text" or raw_url.endswith(".txt") or raw_url.endswith(".md"):
                    try:
                        text_content = file_bytes.decode("utf-8", errors="ignore").strip()
                        # Limit text to 60k chars to stay safe
                        context_lines.append(f"\n--- LESSON TEXT CONTENT ---\n{text_content[:60000]}\n--- END LESSON CONTENT ---")
                    except Exception as e:
                        logger.warning(f"Failed to decode text file: {e}")

                # 2. PDF Document
                elif content_type == "pdf" or raw_url.endswith(".pdf"):
                    if file_size <= MAX_INLINE_BYTES:
                        b64_pdf = base64.b64encode(file_bytes).decode("utf-8")
                        inline_parts.append({
                            "inline_data": {
                                "mime_type": "application/pdf",
                                "data": b64_pdf
                            }
                        })
                        context_lines.append("\nThe full PDF document for this lesson is attached. Generate questions based on the key facts, formulas, principles, and concepts inside this PDF.")
                    else:
                        context_lines.append(f"\nThe lesson PDF '{title}' covers topics in {course_title}. File size exceeds direct inline attachment ({file_size} bytes).")

                # 3. Image
                elif content_type == "image" or any(raw_url.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".gif"]):
                    if file_size <= MAX_INLINE_BYTES:
                        mime_type = mimetypes.guess_type(raw_url)[0] or "image/png"
                        b64_img = base64.b64encode(file_bytes).decode("utf-8")
                        inline_parts.append({
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_img
                            }
                        })
                        context_lines.append("\nThe diagram/image for this lesson is attached. Generate questions testing the student's understanding of the visual elements, steps, labels, or content in the image.")

                # 4. Audio
                elif content_type == "audio" or any(raw_url.endswith(ext) for ext in [".mp3", ".wav", ".ogg", ".aac", ".m4a"]):
                    if file_size <= MAX_INLINE_BYTES:
                        mime_type = "audio/mp3" if raw_url.endswith(".mp3") else (mimetypes.guess_type(raw_url)[0] or "audio/mp3")
                        b64_audio = base64.b64encode(file_bytes).decode("utf-8")
                        inline_parts.append({
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_audio
                            }
                        })
                        context_lines.append("\nThe audio recording for this lesson is attached. Generate questions testing the student's understanding of the spoken content and ideas discussed in this audio.")
                    else:
                        context_lines.append(f"\nThis is an audio lesson titled '{title}' in course '{course_title}' (Duration: {lesson.get('duration_minutes', 0)}m). File size: {file_size} bytes.")

                # 5. Video
                elif content_type == "video" or any(raw_url.endswith(ext) for ext in [".mp4", ".webm"]):
                    if file_size <= MAX_INLINE_BYTES:
                        mime_type = "video/mp4" if raw_url.endswith(".mp4") else (mimetypes.guess_type(raw_url)[0] or "video/mp4")
                        b64_video = base64.b64encode(file_bytes).decode("utf-8")
                        inline_parts.append({
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_video
                            }
                        })
                        context_lines.append("\nThe video for this lesson is attached. Generate questions based on the video demonstration and explanations.")
                    else:
                        context_lines.append(f"\nThis is a video lesson titled '{title}' covering topics in '{course_title}'.")

        except Exception as e:
            logger.warning(f"Error fetching lesson content from {resolved_url}: {e}")

        return "\n".join(context_lines), inline_parts


lesson_content_service = LessonContentService()
