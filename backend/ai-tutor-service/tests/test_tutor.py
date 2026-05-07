import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.llm_service import llm_service
from unittest.mock import AsyncMock, patch

client = TestClient(app)

@pytest.fixture
def mock_jwt():
    # This is a mock token that would decode to a valid user if we mocked decode_jwt
    return "mock.token.here"

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@patch("app.auth.decode_jwt")
@patch("app.services.llm_service.llm_service.get_chat_response")
def test_chat_endpoint(mock_get_chat, mock_decode, mock_jwt):
    # Setup mocks
    mock_decode.return_value = {"user_id": "test_user", "role": "learner"}
    mock_get_chat.return_value = "Hello! I am your AI Tutor. How can I help you today?"
    
    payload = {
        "messages": [
            {"role": "user", "content": "Hi, who are you?"}
        ]
    }
    
    headers = {"Authorization": f"Bearer {mock_jwt}"}
    response = client.post("/api/v1/tutor/chat", json=payload, headers=headers)
    
    assert response.status_code == 200
    assert "AI Tutor" in response.json()["content"]
    assert response.json()["model"] == "llama3"

@patch("app.auth.decode_jwt")
def test_chat_unauthorized(mock_decode):
    payload = {
        "messages": [{"role": "user", "content": "Hi"}]
    }
    response = client.post("/api/v1/tutor/chat", json=payload)
    assert response.status_code == 403 # HTTPBearer returns 403 if no auth header
