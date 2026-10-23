import httpx
from ..core.config import settings
from ..schemas.tutor import ChatRequest, ChatMessage, QuizRequest, QuizQuestion
import json
import logging
import re
from typing import AsyncGenerator, List, Optional, Any

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


class LLMService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL

    def _build_contents(self, messages: List[Any], system_prompt: str) -> dict:
        """Build Gemini contents payload from messages and system prompt"""
        contents = []
        if system_prompt:
            contents.append({
                "role": "user",
                "parts": [{"text": system_prompt}]
            })
        for m in messages:
            if isinstance(m, dict):
                m_role = m.get("role", "user")
                m_content = m.get("content", "")
            else:
                m_role = getattr(m, "role", "user")
                m_content = getattr(m, "content", "")

            role = "model" if m_role == "assistant" else "user"
            contents.append({
                "role": role,
                "parts": [{"text": str(m_content)}]
            })
        return {"contents": contents}

    async def _generate_content(self, payload: dict, stream: bool = False) -> httpx.Response:
        """Send request to Gemini API with automatic model fallback for 503/404/429 errors"""
        models_to_try = [
            "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            self.model,
            "gemini-3.6-flash",
        ]
        unique_models = []
        for m in models_to_try:
            if m and m not in unique_models:
                unique_models.append(m)

        last_response = None
        for model_name in unique_models:
            endpoint = f"{GEMINI_API_BASE}/models/{model_name}:{'streamGenerateContent' if stream else 'generateContent'}"
            params = {"key": self.api_key}
            try:
                async with httpx.AsyncClient() as client:
                    if stream:
                        resp = await client.stream("POST", endpoint, json=payload, params=params, timeout=300.0)
                    else:
                        resp = await client.post(endpoint, json=payload, params=params, timeout=120.0)

                if resp.status_code in (503, 404, 429):
                    logger.warning(f"Model {model_name} returned HTTP {resp.status_code}. Trying fallback model...")
                    last_response = resp
                    continue

                return resp
            except Exception as e:
                logger.warning(f"Error calling {model_name}: {e}")
                continue

        if last_response is not None:
            return last_response
        raise Exception("All Gemini models failed")

    async def get_chat_response(self, request: ChatRequest, context: str = "") -> str:
        """Get a non-streaming chat response from Gemini"""
        system_prompt = "You are a helpful AI Tutor for an E-learning platform. Help students understand complex concepts, explain code, and provide guidance on their courses."
        if request.course_id:
            system_prompt += f" You are currently helping with the course: {request.course_id}."
        if context:
            system_prompt += f"\n\nContext for current discussion:\n{context}"

        payload = self._build_contents(request.messages, system_prompt)

        response = await self._generate_content(payload, stream=False)
        if response.status_code != 200:
            raise Exception(f"Gemini API Error: {response.status_code} - {response.text}")

        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise Exception("Gemini returned no candidates")
        return candidates[0]["content"]["parts"][0]["text"]

    async def stream_chat_response(self, request: ChatRequest, context: str = "") -> AsyncGenerator[str, None]:
        """Stream a chat response from Gemini"""
        system_prompt = f"You are a helpful AI Tutor for an E-learning platform. Help students understand complex concepts. Context: {context}" if context else "You are a helpful AI Tutor for an E-learning platform."

        payload = self._build_contents(request.messages, system_prompt)

        async with self._generate_content(payload, stream=True) as response:
            if response.status_code != 200:
                raise Exception(f"Gemini API Error: {response.status_code}")
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    if line == "data: [DONE]":
                        break
                    try:
                        data = json.loads(line[6:])
                        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                        if parts and parts[0].get("text"):
                            yield parts[0]["text"]
                    except json.JSONDecodeError:
                        continue

    async def generate_quiz(
        self, 
        request: QuizRequest, 
        course_context: str, 
        inline_parts: Optional[List[dict]] = None
    ) -> List[QuizQuestion]:
        """Generate a multiple-choice quiz using Gemini, supporting multimodal content (PDF, image, audio, video)"""
        system_prompt = (
            "You are an expert educator. Generate a multiple-choice quiz based on the provided lesson and course content. "
            f"Generate exactly {request.num_questions} questions for this lesson. "
            "Return the output strictly as a JSON list of objects, each containing: "
            "'question', 'options' (list of 4 strings), 'correct_answer' (must be one of the options), and 'explanation'."
        )
        prompt = f"Lesson & Course Content:\n{course_context}\n\nPlease generate {request.num_questions} multiple-choice questions testing comprehension of this lesson."

        if inline_parts:
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": f"{system_prompt}\n\n{prompt}"},
                            *inline_parts
                        ]
                    }
                ]
            }
        else:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
            payload = self._build_contents(messages, "")

        response = await self._generate_content(payload, stream=False)
        if response.status_code != 200:
            raise Exception(f"Gemini API Error: {response.text}")

        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise Exception("Gemini returned no candidates")
        content = candidates[0]["content"]["parts"][0]["text"]

        logger.warning(f"Gemini Quiz Content Length: {len(content)}")
        logger.warning(f"Gemini Quiz Content: {content}")

        if not content or content.strip() == "":
            raise Exception("Gemini returned an empty response")

        # Remove markdown blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        else:
            array_match = re.search(r'\[.*\]', content, re.DOTALL)
            object_match = re.search(r'\{.*\}', content, re.DOTALL)
            if array_match:
                content = array_match.group(0)
            elif object_match:
                content = object_match.group(0)

        try:
            questions_data = json.loads(content)
        except json.JSONDecodeError as e:
            try:
                if content.strip().startswith("["):
                    last_bracket = content.rfind("]")
                    if last_bracket != -1:
                        questions_data = json.loads(content[:last_bracket + 1])
                    else:
                        raise e
                elif content.strip().startswith("{"):
                    last_brace = content.rfind("}")
                    if last_brace != -1:
                        questions_data = json.loads(content[:last_brace + 1])
                    else:
                        raise e
                else:
                    raise e
            except Exception:
                logger.error(f"Failed to parse JSON: {content}")
                raise Exception(f"Failed to parse Gemini response as JSON: {str(e)}")

        if isinstance(questions_data, dict) and "questions" in questions_data:
            questions_data = questions_data["questions"]

        sanitized_questions = []
        for q in questions_data:
            if isinstance(q, dict):
                question_text = str(q.get("question", "")).strip()
                if not question_text:
                    continue

                raw_options = q.get("options", [])
                if isinstance(raw_options, list):
                    options = [str(opt).strip() for opt in raw_options if str(opt).strip()]
                else:
                    options = []

                raw_answer = str(q.get("correct_answer", "")).strip()

                # If answer is just a letter like "A", "B", "C", "D"
                if len(raw_answer) == 1 and raw_answer.upper() in ["A", "B", "C", "D"] and options:
                    idx = ord(raw_answer.upper()) - ord("A")
                    if 0 <= idx < len(options):
                        raw_answer = options[idx]

                # Ensure correct answer is in options
                if raw_answer and raw_answer not in options:
                    options.append(raw_answer)

                # Ensure at least 4 options
                while len(options) < 4:
                    options.append(f"Additional option {len(options) + 1}")

                explanation = str(q.get("explanation", "Correct based on the lesson material."))

                sanitized_questions.append({
                    "question": question_text,
                    "options": options[:4],
                    "correct_answer": raw_answer if raw_answer in options[:4] else options[0],
                    "explanation": explanation
                })

        return [QuizQuestion(**q) for q in sanitized_questions]

    async def get_recommendations(self, user_interests: str, available_courses: List[dict]) -> dict:
        """Get course recommendations using Gemini with fallback to available courses"""
        if not available_courses:
            return {
                "recommendations": [],
                "explanation": "No courses are currently available for recommendation."
            }

        fallback_recs = [
            {
                "course_id": str(c.get("id")),
                "title": c.get("title", "Course"),
                "reason": f"Popular {c.get('category', 'general')} course on the platform."
            }
            for c in available_courses[:3]
        ]

        system_prompt = (
            "You are a career advisor. Based on the user's interests and available courses, "
            "recommend the top 3 courses. Provide a brief explanation for each recommendation. "
            "Return JSON with 'recommendations' (list of objects with 'course_id', 'title', 'reason') and 'explanation'."
        )
        courses_str = "\n".join([f"- {c.get('id')}: {c.get('title')} ({c.get('category', 'N/A')})" for c in available_courses])
        prompt = f"User Interests/History: {user_interests}\n\nAvailable Courses:\n{courses_str}"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]

        try:
            payload = self._build_contents(messages, "")
            response = await self._generate_content(payload, stream=False)
            if response.status_code != 200:
                logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
                return {
                    "recommendations": fallback_recs,
                    "explanation": "Trending courses on the platform."
                }

            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return {
                    "recommendations": fallback_recs,
                    "explanation": "Trending courses on the platform."
                }

            content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            logger.info(f"Gemini Recommendation Content: {content}")

            # Remove markdown blocks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            else:
                object_match = re.search(r'\{.*\}', content, re.DOTALL)
                array_match = re.search(r'\[.*\]', content, re.DOTALL)
                if object_match:
                    content = object_match.group(0)
                elif array_match:
                    content = array_match.group(0)

            parsed = json.loads(content)
            if isinstance(parsed, list):
                return {
                    "recommendations": parsed,
                    "explanation": "Recommended based on your learning journey and platform trends."
                }
            elif isinstance(parsed, dict):
                recs = parsed.get("recommendations", parsed.get("courses", []))
                expl = parsed.get("explanation", "Recommended based on your learning journey and platform trends.")
                return {
                    "recommendations": recs if isinstance(recs, list) else fallback_recs,
                    "explanation": str(expl)
                }

            return {
                "recommendations": fallback_recs,
                "explanation": "Recommended courses based on trending topics."
            }
        except Exception as e:
            logger.warning(f"Failed to generate Gemini recommendations, using fallback: {e}")
            return {
                "recommendations": fallback_recs,
                "explanation": "Recommended courses based on trending topics."
            }


llm_service = LLMService()
