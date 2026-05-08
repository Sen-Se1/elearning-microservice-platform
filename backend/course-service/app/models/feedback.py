from sqlalchemy import Column, String, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from .base import BaseModel
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

class Feedback(BaseModel):
    __tablename__ = "feedbacks"

    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    user_id = Column(String(36), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)

    course = relationship("Course", back_populates="feedbacks")
