from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...schemas.feedback import FeedbackCreate, FeedbackResponse, FeedbackUpdate
from ...crud import feedback as crud_feedback
from ...core.auth import get_current_user
from ...crud import enrollment as crud_enrollment

router = APIRouter()

@router.post("/", response_model=FeedbackResponse)
async def create_feedback(
    feedback_in: FeedbackCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Check if user is an instructor (only students can leave feedback)
    if current_user.get("role") == "instructor":
        raise HTTPException(status_code=403, detail="Instructors cannot leave feedback on courses")

    # Check if user is enrolled in the course
    is_enrolled = crud_enrollment.enrollment.get_by_user_and_course(
        db, 
        user_id=current_user["user_id"], 
        course_id=feedback_in.course_id
    )
    
    if not is_enrolled:
        raise HTTPException(
            status_code=403, 
            detail="You must be enrolled in this course to leave feedback"
        )

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
