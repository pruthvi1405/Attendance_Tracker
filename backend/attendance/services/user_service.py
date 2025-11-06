# attendance/services/user_service.py
from attendance.models.user import UserDetail
from typing import Optional
from attendance.database import db

def get_user_by_username(username: str) -> Optional[UserDetail]:
    return UserDetail.query.filter_by(username=username).first()

def search_users(name: str = None, email: str = None, limit: int = 50, offset: int = 0):
    q = UserDetail.query
    if name:
        like = f"%{name}%"
        q = q.filter((UserDetail.first_name.ilike(like)) | (UserDetail.last_name.ilike(like)) | (UserDetail.username.ilike(like)))
    if email:
        q = q.filter(UserDetail.email.ilike(f"%{email}%"))
    total = q.count()
    results = q.order_by(UserDetail.username).limit(limit).offset(offset).all()
    return total, results
