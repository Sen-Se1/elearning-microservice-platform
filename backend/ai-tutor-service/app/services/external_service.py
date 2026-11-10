import httpx
from ..core.config import settings
from typing import Optional, List, Dict

class ExternalService:
    def __init__(self):
        self.course_url = settings.COURSE_SERVICE_URL
        self.analytics_url = settings.ANALYTICS_SERVICE_URL

    async def get_course_details(self, course_id: str, token: Optional[str] = None) -> dict:
        async with httpx.AsyncClient() as client:
            headers = {"X-Internal-Service": "ai-tutor-service"}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            response = await client.get(f"{self.course_url}/api/v1/courses/{course_id}", headers=headers)
            response.raise_for_status()
            return response.json()

    async def get_course_lessons(self, course_id: str, token: Optional[str] = None) -> dict:
        async with httpx.AsyncClient() as client:
            headers = {"X-Internal-Service": "ai-tutor-service"}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            response = await client.get(f"{self.course_url}/api/v1/lessons/course/{course_id}", headers=headers)
            response.raise_for_status()
            return response.json()

    async def get_lesson_details(self, lesson_id: str, token: Optional[str] = None) -> dict:
        async with httpx.AsyncClient() as client:
            headers = {"X-Internal-Service": "ai-tutor-service"}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            response = await client.get(f"{self.course_url}/api/v1/lessons/{lesson_id}", headers=headers)
            response.raise_for_status()
            return response.json()

    async def get_top_courses(self, token: Optional[str] = None) -> List[dict]:
        async with httpx.AsyncClient() as client:
            headers = {"X-Internal-Service": "ai-tutor-service"}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            for path in ["/metrics/top-courses", "/api/v1/metrics/top-courses"]:
                try:
                    response = await client.get(f"{self.analytics_url}{path}", headers=headers, timeout=5.0)
                    if response.status_code == 200:
                        return response.json()
                except Exception:
                    pass
            return []

    async def get_all_courses(self) -> List[dict]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.course_url}/api/v1/courses/", timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("items", [])
        except Exception:
            pass
        return []

external_service = ExternalService()
