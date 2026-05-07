from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from ...schemas.tutor import ChatRequest, ChatResponse
from ...services.llm_service import llm_service
from ...auth import get_current_user
from ...core.config import settings

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Non-streaming chat endpoint
    """
    try:
        content = await llm_service.get_chat_response(request)
        return ChatResponse(content=content, model=settings.LLM_MODEL)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Streaming chat endpoint
    """
    try:
        return StreamingResponse(
            llm_service.stream_chat_response(request),
            media_type="text/event-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
