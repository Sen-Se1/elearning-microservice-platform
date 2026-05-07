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
