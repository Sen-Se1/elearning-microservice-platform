from jose import jwt, JWTError, ExpiredSignatureError
from fastapi import HTTPException, status, Depends
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .core.config import settings

JWT_SECRET_KEY = settings.JWT_SECRET_KEY
JWT_ALGORITHM = settings.JWT_ALGORITHM

security = HTTPBearer()

def decode_jwt(token: str):
    """
    Decodes a JWT token using the HS256 algorithm and the shared secret.
    Maps Node.js camelCase 'userId' to Pythonic 'user_id'.
    """
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        return {
            "user_id": payload.get("userId"),
            "role": payload.get("role"),
        }

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    return decode_jwt(token)

security_optional = HTTPBearer(auto_error=False)

def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional)):
    if credentials:
        try:
            return decode_jwt(credentials.credentials)
        except Exception:
            return None
    return None
