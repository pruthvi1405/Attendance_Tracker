# attendance/services/auth_service.py
from attendance.models.user import UserDetail
from attendance.database import db
from attendance.utils.decorators import create_jwt, revoke_token
from werkzeug.security import generate_password_hash
from flask import current_app
import datetime

def register_user(username: str, first_name: str, last_name: str, email: str, password: str, is_admin: bool=False):
    if UserDetail.query.filter((UserDetail.username==username) | (UserDetail.email==email)).first():
        raise ValueError("User with given username or email already exists")
    u = UserDetail(
        username=username,
        first_name=first_name,
        last_name=last_name,
        email=email,
        is_admin=bool(is_admin)
    )
    u.set_password(password)
    db.session.add(u)
    db.session.commit()
    return u

def authenticate_user(username: str, password: str):
    user = UserDetail.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return None
    payload = {"username": user.username, "is_admin": user.is_admin}
    token = create_jwt(payload)
    return token, user

def logout_user(token: str):
    revoke_token(token)
    return True
