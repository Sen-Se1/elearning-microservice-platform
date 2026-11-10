from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.tutor import router as tutor_router
from .core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Tutor Service for E-learning Platform"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(tutor_router, prefix="/api/v1/tutor", tags=["tutor"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": settings.APP_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
