import httpx
import asyncio
import json

BASE_URL = "http://localhost:8004/api/v1/tutor"
USER_SERVICE_URL = "http://localhost:8002/api/v1/users"
COURSE_ID = "5541cc9b-70d2-4577-8f0c-1231d8197832"

async def get_token():
    print("Logging in...")
    async with httpx.AsyncClient() as client:
        login_data = {"email": "student@example.com", "password": "Password123!"}
        response = await client.post(f"{USER_SERVICE_URL}/login", json=login_data)
        if response.status_code != 200:
            raise Exception(f"Login failed: {response.text}")
        return response.json()["token"]

async def test_chat_unauthenticated():
    print("\nTesting: Chat Unauthenticated")
    async with httpx.AsyncClient() as client:
        payload = {"messages": [{"role": "user", "content": "Hello"}]}
        response = await client.post(f"{BASE_URL}/chat", json=payload)
        # FastAPI HTTPBearer returns 403 Forbidden when credentials are missing
        if response.status_code in [401, 403]:
            print(f"PASS: Got {response.status_code}")
            return True
        else:
            print(f"FAIL: Got {response.status_code}")
            return False

async def test_chat_non_streaming(headers):
    print("\nTesting: Chat (Non-streaming)")
    async with httpx.AsyncClient() as client:
        payload = {
            "messages": [{"role": "user", "content": "Explain Python in one sentence."}]
        }
        response = await client.post(f"{BASE_URL}/chat", json=payload, headers=headers, timeout=120.0)
        if response.status_code == 200:
            data = response.json()
            print(f"PASS: Received response: {data['content'][:100]}...")
            return True
        else:
            print(f"FAIL: {response.status_code} - {response.text}")
            return False

async def test_chat_streaming(headers):
    print("\nTesting: Chat (Streaming)")
    async with httpx.AsyncClient() as client:
        payload = {
            "messages": [{"role": "user", "content": "Count to 3."}]
        }
        print("Receiving chunks: ", end="", flush=True)
        try:
            async with client.stream("POST", f"{BASE_URL}/chat/stream", json=payload, headers=headers, timeout=120.0) as response:
                if response.status_code == 200:
                    count = 0
                    async for chunk in response.aiter_text():
                        print(".", end="", flush=True)
                        count += 1
                    print(f"\nPASS: Stream finished with {count} chunks")
                    return True
                else:
                    print(f"\nFAIL: {response.status_code}")
                    return False
        except Exception as e:
            print(f"\nFAIL: {str(e)}")
            return False

async def test_generate_quiz(headers):
    print("\nTesting: Quiz Generation")
    async with httpx.AsyncClient() as client:
        payload = {
            "course_id": COURSE_ID,
            "num_questions": 2
        }
        response = await client.post(f"{BASE_URL}/quiz", json=payload, headers=headers, timeout=180.0)
        if response.status_code == 200:
            data = response.json()
            print(f"PASS: Generated {len(data['questions'])} questions")
            for i, q in enumerate(data['questions']):
                print(f"  Q{i+1}: {q['question']}")
            return True
        else:
            print(f"FAIL: {response.status_code} - {response.text}")
            return False

async def test_recommendations(headers):
    print("\nTesting: Recommendations")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/recommendations", headers=headers, timeout=120.0)
        if response.status_code == 200:
            data = response.json()
            print(f"PASS: Received {len(data['recommendations'])} recommendations")
            for r in data['recommendations']:
                print(f"  - {r['title']}")
            return True
        else:
            print(f"FAIL: {response.status_code} - {response.text}")
            return False

async def run_all_tests():
    success = True
    try:
        token = await get_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        results = [
            await test_chat_unauthenticated(),
            await test_chat_non_streaming(headers),
            await test_chat_streaming(headers),
            await test_generate_quiz(headers),
            await test_recommendations(headers)
        ]
        
        if all(results):
            print("\n✅ All tests passed!")
        else:
            print("\n❌ Some tests failed.")
            import sys
            sys.exit(1)

    except Exception as e:
        print(f"\nTests failed with exception: {str(e)}")
        import sys
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_all_tests())

if __name__ == "__main__":
    asyncio.run(run_all_tests())
