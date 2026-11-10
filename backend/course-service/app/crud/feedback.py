from sqlalchemy.orm import Session
from ..models.feedback import Feedback
from ..schemas.feedback import FeedbackCreate
import httpx
from ..core.config import get_settings
import asyncio

settings = get_settings()

async def trigger_n8n_feedback(feedback_data: dict):
    try:
        async with httpx.AsyncClient() as client:
            await client.post(settings.n8n_webhook_url, json=feedback_data, timeout=5.0)
    except Exception as e:
        print(f"Failed to trigger n8n: {e}")

def create_feedback(db: Session, feedback_in: FeedbackCreate, user_id: str):
    db_feedback = Feedback(
        course_id=feedback_in.course_id,
        user_id=user_id,
        rating=feedback_in.rating,
        comment=feedback_in.comment
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def get_course_feedbacks(db: Session, course_id: str):
    return db.query(Feedback).filter(Feedback.course_id == course_id).all()

def update_feedback_analysis(db: Session, feedback_id: str, ai_summary: str):
    db_feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if db_feedback:
        db_feedback.ai_summary = ai_summary
        db.commit()
        db.refresh(db_feedback)
    return db_feedback
