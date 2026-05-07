import httpx
from ..core.config import settings
from ..schemas.tutor import ChatRequest, ChatMessage
import json
from typing import AsyncGenerator

class LLMService:
    def __init__(self):
        self.api_url = settings.LLM_API_URL
        self.model = settings.LLM_MODEL
        self.api_key = settings.LLM_API_KEY

    async def get_chat_response(self, request: ChatRequest) -> str:
        async with httpx.AsyncClient() as client:
            messages = [{"role": m.role, "content": m.content} for m in request.messages]
            
            # System prompt to act as an AI Tutor
            if not any(m["role"] == "system" for m in messages):
                messages.insert(0, {
                    "role": "system", 
                    "content": "You are a helpful AI Tutor for an E-learning platform. Help students understand complex concepts, explain code, and provide guidance on their courses."
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
                timeout=60.0
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
                timeout=60.0
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

llm_service = LLMService()
