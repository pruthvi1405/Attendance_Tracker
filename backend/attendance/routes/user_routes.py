# attendance/routes/user_routes.py
from flask import Blueprint, request, jsonify, g
from attendance.utils.decorators import token_required
from attendance.utils.helpers import seconds_to_human
from attendance.models.user import UserDetail, db
from attendance.models.punches import Punch
import datetime

user_bp = Blueprint("user", __name__)

@user_bp.route("/punch-in", methods=["POST"])
@token_required
def route_punch_in():
    user = g.current_user
    data = request.json or {}

    # optional timestamp
    when = None
    if data.get("when"):
        try:
            when = datetime.datetime.fromisoformat(data["when"])
        except:
            return jsonify({"error": "invalid when timestamp"}), 400
    else:
        when = datetime.datetime.now()

    today = when.date()

    # get all punches for today
    today_punches = Punch.query.filter_by(username=user.username, date=today).all()

    # Rule 1: Max 4 punches per day
    if len(today_punches) >= 4:
        return jsonify({"error": "maximum 4 punches per day reached"}), 400

    # check if the last punch of today has no punch_out
    last_punch = Punch.query.filter_by(username=user.username, date=today).order_by(Punch.punch_in.desc()).first()
    if last_punch and not last_punch.punch_out:
        return jsonify({"error": "previous punch not completed. Punch out first"}), 400

    # create new punch record
    rec = Punch(username=user.username, date=today, punch_in=when)
    db.session.add(rec)
    db.session.commit()

    return jsonify({
        "msg": "punched in",
        "attendance": {
            "id": rec.id,
            "date": rec.date.isoformat(),
            "punch_in": rec.punch_in.isoformat(),
            "punch_out": rec.punch_out.isoformat() if rec.punch_out else None
        }
    }), 201

@user_bp.route("/punch-out", methods=["PUT"])
@token_required
def route_punch_out():
    user = g.current_user
    data = request.json or {}

    when = None
    if data.get("when"):
        try:
            when = datetime.datetime.fromisoformat(data["when"])
        except:
            return jsonify({"error": "invalid when timestamp"}), 400
    else:
        when = datetime.datetime.now()

    today = when.date()
    # find the most recent open punch for today
    rec = Punch.query.filter(
        Punch.username == user.username,
        Punch.date == today,
        Punch.punch_out.is_(None)
    ).order_by(Punch.punch_in.desc()).first()

    if not rec or not rec.punch_in:
        return jsonify({"error": "no active punch-in found for today"}), 400

    # Rule 2: Minimum 1 hour between punch-in and punch-out
    elapsed_seconds = (when - rec.punch_in).total_seconds()
    if elapsed_seconds < 3600:  # 3600 seconds = 1 hour
        return jsonify({"error": "cannot punch out before 1 hour of punch-in"}), 400

    rec.punch_out = when
    db.session.commit()

    total_seconds = int((rec.punch_out - rec.punch_in).total_seconds())

    return jsonify({
        "msg": "punched out",
        "attendance": {
            "id": rec.id,
            "date": rec.date.isoformat(),
            "punch_in": rec.punch_in.isoformat(),
            "punch_out": rec.punch_out.isoformat()
        },
        "total_human": seconds_to_human(total_seconds)
    })



@user_bp.route("/my-attendance", methods=["GET"])
@token_required
def route_my_attendance():
    user = g.current_user
    start = request.args.get("from")
    end = request.args.get("to")

    start_date = None
    end_date = None
    if start:
        try:
            start_date = datetime.date.fromisoformat(start)
        except:
            return jsonify({"error": "invalid from date"}), 400
    if end:
        try:
            end_date = datetime.date.fromisoformat(end)
        except:
            return jsonify({"error": "invalid to date"}), 400

    query = Punch.query.filter_by(username=user.username)
    if start_date:
        query = query.filter(Punch.date >= start_date)
    if end_date:
        query = query.filter(Punch.date <= end_date)

    rows = query.order_by(Punch.date, Punch.punch_in).all()

    out = []
    for r in rows:
        total_seconds = int((r.punch_out - r.punch_in).total_seconds()) if r.punch_in and r.punch_out else 0
        out.append({
            "id": r.id,
            "date": r.date.isoformat(),
            "punch_in": r.punch_in.isoformat() if r.punch_in else None,
            "punch_out": r.punch_out.isoformat() if r.punch_out else None,
            "total_seconds": total_seconds,
            "total_human": seconds_to_human(total_seconds)
        })

    # check if user currently punched in and not out
    active = Punch.query.filter_by(username=user.username, punch_out=None).first()
    active_punch = active.punch_in.isoformat() if active else None

    return jsonify({
        "username": user.username,
        "active_punch_in": active_punch,     # <- This tells frontend if user is currently punched in
        "attendance": out
    })

@user_bp.route("/create_user", methods=["POST"])
def create_user():
    data = request.json
    try:
        user = UserDetail(
            username=data["username"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            email=data["email"],
            is_admin=data.get("is_admin", False)
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": f"User {user.username} created", "is_admin": user.is_admin})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
