# attendance/models/user.py
from attendance.database import db
from werkzeug.security import generate_password_hash, check_password_hash

class UserDetail(db.Model):
    __tablename__ = "user_details"

    username = db.Column(db.String(64), primary_key=True, unique=True, nullable=False)
    first_name = db.Column(db.String(120), nullable=False)
    last_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self, hide_email=False):
        return {
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": None if hide_email else self.email,
            "is_admin": self.is_admin
        }
