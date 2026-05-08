from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...schemas.feedback import FeedbackCreate, FeedbackResponse, FeedbackUpdate
from ...crud import feedback as crud_feedback
from ...core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=FeedbackResponse)
async def create_feedback(
    feedback_in: FeedbackCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    feedback = crud_feedback.create_feedback(db, feedback_in, current_user["user_id"])
    
    # Trigger n8n in background
    feedback_data = {
        "id": str(feedback.id),
        "course_id": str(feedback.course_id),
        "user_id": feedback.user_id,
        "rating": feedback.rating,
        "comment": feedback.comment,
        "created_at": feedback.created_at.isoformat()
    }
    background_tasks.add_task(crud_feedback.trigger_n8n_feedback, feedback_data)
    
    return feedback

@router.get("/course/{course_id}", response_model=List[FeedbackResponse])
def get_course_feedbacks(course_id: str, db: Session = Depends(get_db)):
    return crud_feedback.get_course_feedbacks(db, course_id)

@router.patch("/{feedback_id}", response_model=FeedbackResponse)
def update_feedback_analysis(
    feedback_id: str,
    update_data: FeedbackUpdate,
    db: Session = Depends(get_db)
):
    print(f"Updating feedback {feedback_id} with AI summary: {update_data.ai_summary}")
    feedback = crud_feedback.update_feedback_analysis(db, feedback_id, update_data.ai_summary)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback
