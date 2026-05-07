from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    course_id: Optional[str] = None
    stream: bool = False

class ChatResponse(BaseModel):
    content: str
    model: str

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class QuizRequest(BaseModel):
    course_id: str
    lesson_id: Optional[str] = None
    num_questions: int = 5

class QuizResponse(BaseModel):
    course_id: str
    questions: List[QuizQuestion]

class RecommendationResponse(BaseModel):
    recommendations: List[dict]
    explanation: str
