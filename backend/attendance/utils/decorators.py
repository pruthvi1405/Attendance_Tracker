# attendance/utils/decorators.py
import functools
from flask import request, jsonify, g, current_app
import jwt
from attendance.models.user import UserDetail
from attendance.database import db

# simple in-memory blacklist (for demo); for production use Redis or DB
JWT_BLACKLIST = set()

def create_jwt(payload: dict) -> str:
    payload_copy = payload.copy()
    # add exp in seconds since epoch
    import time
    exp = int(time.time()) + current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
    payload_copy["exp"] = exp
    token = jwt.encode(payload_copy, current_app.config["SECRET_KEY"], algorithm=current_app.config["JWT_ALGORITHM"])
    # PyJWT returns a str in new versions
    if isinstance(token, bytes):
        token = token.decode()
    return token

def decode_jwt(token: str) -> dict:
    return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=[current_app.config["JWT_ALGORITHM"]])

def token_required(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Missing Authorization header"}), 401
        token = auth.split(" ", 1)[1]
        if token in JWT_BLACKLIST:
            return jsonify({"error": "Token revoked"}), 401
        try:
            payload = decode_jwt(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except Exception as e:
            return jsonify({"error": "Invalid token", "detail": str(e)}), 401
        # attach current user
        username = payload.get("username")
        if not username:
            return jsonify({"error": "Invalid token payload"}), 401
        user = UserDetail.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 401
        g.current_user = user
        g.token_payload = payload
        g.raw_token = token
        return f(*args, **kwargs)
    return wrapper

def admin_required(f):
    from functools import wraps
    @wraps(f)
    @token_required
    def wrapper(*args, **kwargs):
        if not getattr(g, "current_user", None) or not g.current_user.is_admin:
            return jsonify({"error": "Admin privileges required"}), 403
        return f(*args, **kwargs)
    return wrapper

def revoke_token(token: str):
    JWT_BLACKLIST.add(token)
