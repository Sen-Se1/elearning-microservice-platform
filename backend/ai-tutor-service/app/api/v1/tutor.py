from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from ...schemas.tutor import ChatRequest, ChatResponse, QuizRequest, QuizResponse, RecommendationResponse
from ...services.llm_service import llm_service
from ...services.external_service import external_service
from ...auth import get_current_user, get_current_user_optional
from ...core.config import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user: Optional[dict] = Depends(get_current_user_optional)):
    """
    Standard chat endpoint with optional context
    """
    try:
        context = ""
        user_token = "" # Fallback
        
        if request.lesson_id:
            try:
                lesson = await external_service.get_lesson_details(request.lesson_id, user_token)
                context = f"Lesson Title: {lesson.get('title')}\nDescription: {lesson.get('description')}\nContent: {lesson.get('content')}"
            except: pass
        elif request.course_id:
            try:
                course = await external_service.get_course_details(request.course_id, user_token)
                context = f"Course Title: {course.get('title')}\nDescription: {course.get('description')}"
            except: pass

        content = await llm_service.get_chat_response(request, context=context)
        return ChatResponse(content=content, model=settings.LLM_MODEL)
    except Exception as e:
        logger.exception("Error in chat endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, current_user: Optional[dict] = Depends(get_current_user_optional)):
    """
    Streaming chat endpoint with optional context
    """
    try:
        context = ""
        user_token = "" # Fallback
        
        if request.lesson_id:
            try:
                lesson = await external_service.get_lesson_details(request.lesson_id, user_token)
                context = f"Lesson Title: {lesson.get('title')}\nDescription: {lesson.get('description')}\nContent: {lesson.get('content')}"
            except: pass
        elif request.course_id:
            try:
                course = await external_service.get_course_details(request.course_id, user_token)
                context = f"Course Title: {course.get('title')}\nDescription: {course.get('description')}"
            except: pass

        return StreamingResponse(
            llm_service.stream_chat_response(request, context=context),
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
        # 1. Fetch course details
        course = await external_service.get_course_details(request.course_id, token)
        
        # 2. Fetch all lessons for the course to get deeper context
        lessons_data = await external_service.get_course_lessons(request.course_id, token)
        lessons = lessons_data.get("items", [])
        
        # 3. Build context from lessons (Title and Description)
        context = f"Course: {course['title']}\n"
        if lessons:
            context += "Lessons and Topics covered:\n"
            for i, lesson in enumerate(lessons, 1):
                context += f"{i}. {lesson['title']}: {lesson.get('description', '')}\n"
        else:
            context += f"Description: {course['description']}"
        
        # 4. Generate quiz using LLM
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
        # 1. Get trending courses from analytics
        top_courses = await external_service.get_top_courses(token)
        trending_info = "Trending Courses:\n"
        for tc in top_courses[:5]:
            trending_info += f"- Course ID: {tc['course_id']} (Views: {tc['total_views']}, Enrollments: {tc['total_enrollments']})\n"
        
        # 2. Get all available courses
        courses = await external_service.get_all_courses()
        
        # 3. Get recommendations from LLM based on trending data
        result = await llm_service.get_recommendations(trending_info, courses)
        return RecommendationResponse(**result)
    except Exception as e:
        logger.exception("Error in recommendations endpoint")
        raise HTTPException(status_code=500, detail=str(e))
