from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class FeedbackBase(BaseModel):
    course_id: UUID
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackUpdate(BaseModel):
    ai_summary: str

class FeedbackResponse(FeedbackBase):
    id: UUID
    user_id: str
    ai_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
