# attendance/routes/auth_routes.py
from flask import Blueprint, request, jsonify, g
from attendance.services.auth_service import authenticate_user, register_user, logout_user
from attendance.utils.decorators import token_required
from attendance.services.user_service import get_user_by_username
from attendance.models.user import UserDetail

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json or {}
    required = ["username", "first_name", "last_name", "email", "password"]
    for k in required:
        if not data.get(k):
            return jsonify({"error": f"missing {k}"}), 400
    try:
        user = register_user(
            username=data["username"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            email=data["email"],
            password=data["password"],
            is_admin=bool(data.get("is_admin", False))
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"msg": "user created", "username": user.username}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify({"error": "username and password required"}), 400
    res = authenticate_user(username, password)
    if not res:
        return jsonify({"error": "invalid credentials"}), 401
    token, user = res
    return jsonify({"access_token": token, "username": user.username, "is_admin": user.is_admin})

@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    token = g.raw_token
    logout_user(token)
    return jsonify({"msg": "logged out"})
