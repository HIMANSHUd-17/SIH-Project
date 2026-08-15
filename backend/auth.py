import os
from datetime import datetime, timedelta
import jwt
import bcrypt
import hashlib

# BUG-005 fix: Load secret from environment, never hardcode
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", os.urandom(32).hex())
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

def get_password_hash(password: str) -> str:
    # BUG-004 fix: Salted bcrypt password hashing
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Support legacy SHA-256 hashes during migration
    legacy_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    if hashed_password == legacy_hash:
        return True
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

