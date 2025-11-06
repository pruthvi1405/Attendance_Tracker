# config.py
import os
from datetime import timedelta

class DefaultConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "please-change-me")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/attendance_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT settings
    JWT_ALGORITHM = "HS256"
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv("JWT_EXP_HOURS", "8")) * 3600  # in seconds

    # Pagination defaults
    DEFAULT_PAGE_SIZE = int(os.getenv("DEFAULT_PAGE_SIZE", "50"))
    MAX_PAGE_SIZE = int(os.getenv("MAX_PAGE_SIZE", "200"))

    # Other flags
    JSON_SORT_KEYS = False
