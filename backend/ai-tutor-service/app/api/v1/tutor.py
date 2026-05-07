from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from ...schemas.tutor import ChatRequest, ChatResponse, QuizRequest, QuizResponse, RecommendationResponse
from ...services.llm_service import llm_service
from ...services.external_service import external_service
from ...auth import get_current_user
from ...core.config import settings
import logging

logger = logging.getLogger(__name__)

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
        logger.exception("Error in chat endpoint")
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
        logger.exception("Error in chat_stream endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(
    request: QuizRequest, 
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(...)
):
    """
    Generate a quiz based on course content
    """
    token = authorization.split(" ")[1]
    try:
        # 1. Fetch course details for context
        course = await external_service.get_course_details(request.course_id, token)
        context = f"Course: {course['title']}\nDescription: {course['description']}"
        
        # 3. Generate quiz using LLM
        questions = await llm_service.generate_quiz(request, context)
        return QuizResponse(course_id=request.course_id, questions=questions)
    except Exception as e:
        logger.exception("Error in quiz endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    current_user: dict = Depends(get_current_user),
    authorization: str = Header(...)
):
    """
    Get personalized course recommendations
    """
    token = authorization.split(" ")[1]
    try:
        # 1. Get user analytics/history
        user_data = await external_service.get_user_analytics(token)
        interests = str(user_data.get("top_categories", "Unknown interests"))
        
        # 2. Get available courses
        courses = await external_service.get_all_courses()
        
        # 3. Get recommendations from LLM
        result = await llm_service.get_recommendations(interests, courses)
        return RecommendationResponse(**result)
    except Exception as e:
        logger.exception("Error in recommendations endpoint")
        raise HTTPException(status_code=500, detail=str(e))
