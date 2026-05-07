import httpx
from ..core.config import settings
from typing import Optional, List, Dict

class ExternalService:
    def __init__(self):
        self.course_url = settings.COURSE_SERVICE_URL
        self.analytics_url = settings.ANALYTICS_SERVICE_URL

    async def get_course_details(self, course_id: str, token: str) -> dict:
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.get(f"{self.course_url}/api/v1/courses/{course_id}", headers=headers)
            response.raise_for_status()
            return response.json()

    async def get_lesson_details(self, course_id: str, lesson_id: str, token: str) -> dict:
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            # Assuming there is an endpoint for lessons in course-service
            response = await client.get(f"{self.course_url}/api/v1/courses/{course_id}/lessons/{lesson_id}", headers=headers)
            response.raise_for_status()
            return response.json()

    async def get_user_analytics(self, token: str) -> dict:
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            # Get user metrics to understand their interests
            response = await client.get(f"{self.analytics_url}/metrics/me", headers=headers)
            if response.status_code == 200:
                return response.json()
            return {}

    async def get_all_courses(self) -> List[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.course_url}/api/v1/courses/")
            response.raise_for_status()
            data = response.json()
            return data.get("items", [])

external_service = ExternalService()
