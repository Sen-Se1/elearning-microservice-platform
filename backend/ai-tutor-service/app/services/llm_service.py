import httpx
from ..core.config import settings
from ..schemas.tutor import ChatRequest, ChatMessage, QuizRequest, QuizQuestion
import json
import logging
from typing import AsyncGenerator, List, Optional

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.api_url = settings.LLM_API_URL
        self.model = settings.LLM_MODEL
        self.api_key = settings.LLM_API_KEY

    async def get_chat_response(self, request: ChatRequest) -> str:
        async with httpx.AsyncClient() as client:
            messages = [{"role": m.role, "content": m.content} for m in request.messages]
            
            # System prompt to act as an AI Tutor
            system_prompt = "You are a helpful AI Tutor for an E-learning platform. Help students understand complex concepts, explain code, and provide guidance on their courses."
            
            if request.course_id:
                system_prompt += f" You are currently helping with the course: {request.course_id}."

            if not any(m["role"] == "system" for m in messages):
                messages.insert(0, {
                    "role": "system", 
                    "content": system_prompt
                })

            payload = {
                "model": self.model,
                "messages": messages,
                "stream": False
            }
            
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            response = await client.post(
                f"{self.api_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=300.0
            )
            
            if response.status_code != 200:
                raise Exception(f"LLM API Error: {response.status_code} - {response.text}")
            
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def stream_chat_response(self, request: ChatRequest) -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient() as client:
            messages = [{"role": m.role, "content": m.content} for m in request.messages]
            
            if not any(m["role"] == "system" for m in messages):
                messages.insert(0, {
                    "role": "system", 
                    "content": "You are a helpful AI Tutor for an E-learning platform."
                })

            payload = {
                "model": self.model,
                "messages": messages,
                "stream": True
            }
            
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            async with client.stream(
                "POST",
                f"{self.api_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=300.0
            ) as response:
                if response.status_code != 200:
                    raise Exception(f"LLM API Error: {response.status_code}")
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        if line == "data: [DONE]":
                            break
                        try:
                            data = json.loads(line[6:])
                            content = data["choices"][0]["delta"].get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue

    async def generate_quiz(self, request: QuizRequest, course_context: str) -> List[QuizQuestion]:
        system_prompt = (
            "You are an expert educator. Generate a multiple-choice quiz based on the provided course content. "
            "Return the output strictly as a JSON list of objects, each containing: "
            "'question', 'options' (list of 4 strings), 'correct_answer' (must be one of the options), and 'explanation'."
        )
        
        prompt = f"Content: {course_context}\n\nGenerate {request.num_questions} questions for this content."
        
        async with httpx.AsyncClient() as client:
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
                "format": "json" # Ollama support for JSON output
            }
            
            headers = {"Authorization": f"Bearer {self.api_key}"}
            response = await client.post(f"{self.api_url}/chat/completions", json=payload, headers=headers, timeout=300.0)
            
            if response.status_code != 200:
                raise Exception(f"LLM API Error: {response.text}")
            
            content = response.json()["choices"][0]["message"]["content"]
            logger.info(f"LLM Quiz Content: {content}")

            # Remove markdown blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            questions_data = json.loads(content)
            
            # If Ollama returns a dict with 'questions' key, handle it
            if isinstance(questions_data, dict) and "questions" in questions_data:
                questions_data = questions_data["questions"]
                
            return [QuizQuestion(**q) for q in questions_data]

    async def get_recommendations(self, user_interests: str, available_courses: List[dict]) -> dict:
        system_prompt = (
            "You are a career advisor. Based on the user's interests and available courses, "
            "recommend the top 3 courses. Provide a brief explanation for each recommendation. "
            "Return JSON with 'recommendations' (list of objects with 'course_id', 'title', 'reason') and 'explanation'."
        )
        
        courses_str = "\n".join([f"- {c['id']}: {c['title']} ({c.get('category', 'N/A')})" for c in available_courses])
        prompt = f"User Interests/History: {user_interests}\n\nAvailable Courses:\n{courses_str}"
        
        async with httpx.AsyncClient() as client:
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
                "format": "json"
            }
            
            headers = {"Authorization": f"Bearer {self.api_key}"}
            response = await client.post(f"{self.api_url}/chat/completions", json=payload, headers=headers, timeout=300.0)
            
            if response.status_code != 200:
                raise Exception(f"LLM API Error: {response.text}")
            
            content = response.json()["choices"][0]["message"]["content"]
            logger.info(f"LLM Recommendation Content: {content}")
            
            # Remove markdown blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            return json.loads(content)

llm_service = LLMService()
