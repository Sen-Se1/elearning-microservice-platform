import httpx
import logging
from typing import Optional
from .config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

async def record_analytics_event(event_type: str, course_id: str, token: Optional[str] = None):
    """
    Calls the analytics-service to record a view or enrollment event.
    event_type: 'view' or 'enroll'
    """
    if not settings.analytics_service_url:
        logger.warning("Analytics service URL not configured. Skipping event recording.")
        return

    url = f"{settings.analytics_service_url}/events/{event_type}"
    payload = {"course_id": str(course_id)}
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=5.0)
            if response.status_code != 201:
                logger.error(f"Failed to record {event_type} event: {response.status_code} - {response.text}")
            else:
                logger.info(f"Successfully recorded {event_type} event for course {course_id}")
    except Exception as e:
        logger.error(f"Error calling analytics service: {str(e)}")
