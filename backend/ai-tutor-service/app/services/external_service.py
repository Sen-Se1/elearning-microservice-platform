import httpx
from ..core.config import settings
from typing import Optional, List, Dict

class ExternalService:
    def __init__(self):
        self.course_url = settings.COURSE_SERVICE_URL
        self.analytics_url = settings.ANALYTICS_SERVICE_URL

    async def get_course_details(self, course_id: str, token: str) -> dict:
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "X-Internal-Service": "ai-tutor-service"
            }
            response = await client.get(f"{self.course_url}/api/v1/courses/{course_id}", headers=headers)
            response.raise_for_status()
            return response.json()

    async def get_course_lessons(self, course_id: str, token: str) -> dict:
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "X-Internal-Service": "ai-tutor-service"
            }
            response = await client.get(f"{self.course_url}/api/v1/lessons/course/{course_id}", headers=headers)
            response.raise_for_status()
            return response.json()

    async def get_top_courses(self, token: str) -> List[dict]:
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            # Get popular courses from analytics service
            response = await client.get(f"{self.analytics_url}/api/v1/metrics/top-courses", headers=headers)
            if response.status_code == 200:
                return response.json()
            return []

    async def get_all_courses(self) -> List[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.course_url}/api/v1/courses/")
            response.raise_for_status()
            data = response.json()
            return data.get("items", [])

external_service = ExternalService()
