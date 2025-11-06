# attendance/routes/admin_routes.py
from flask import Blueprint, request, jsonify, g, send_file
from attendance.models.attendance import Attendance
from attendance.models.punches import Punch
from attendance.models.user import UserDetail
from attendance.database import db
from attendance.utils.decorators import admin_required
from attendance.services.attendance_service import aggregate_seconds_per_user_for_date, get_attendance_for_user
from attendance.services.user_service import get_user_by_username, search_users
from attendance.utils.helpers import seconds_to_human
import datetime
import pandas as pd
from io import BytesIO

admin_bp = Blueprint("admin", __name__)

def get_week_bounds(week_of_date: datetime.date):
    """Return Monday and Sunday for the week containing week_of_date."""
    monday = week_of_date - datetime.timedelta(days=week_of_date.weekday())
    sunday = monday + datetime.timedelta(days=6)
    return monday, sunday


def format_time(dt):
    if not dt:
        return None
    return dt.strftime("%H:%M")  # returns e.g., "10:25"

@admin_bp.route("/daily-summary", methods=["GET"])
@admin_required
def daily_summary():
    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"error": "date param required (YYYY-MM-DD)"}), 400
    try:
        the_date = datetime.date.fromisoformat(date_str)
    except:
        return jsonify({"error": "invalid date"}), 400

    users = all_users = UserDetail.query.filter_by(is_admin=False).all()
    out = []

    for u in users:
        punches = Punch.query.filter_by(username=u.username, date=the_date).order_by(Punch.punch_in.asc()).all()
        punch_list = []
        total_seconds = 0

        if punches:
            for p in punches:
                in_time = format_time(p.punch_in)
                out_time = format_time(p.punch_out)
                punch_list.append({"in": in_time, "out": out_time})
                if p.punch_in and p.punch_out:
                    total_seconds += int((p.punch_out - p.punch_in).total_seconds())
                elif p.punch_in:
                    total_seconds += int((datetime.datetime.now() - p.punch_in).total_seconds())
        else:
            punch_list.append({"in": None, "out": None})

        user_dict = {
            "username": u.username,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "total": seconds_to_human(total_seconds),
            the_date.isoformat(): punch_list
        }

        out.append(user_dict)

    return jsonify({
        "week_start": the_date.isoformat(),
        "week_end": the_date.isoformat(),
        "users": out
    })



@admin_bp.route("/weekly-summary", methods=["GET"])
@admin_required
def weekly_summary():
    period = request.args.get("period")  # "current" or "previous"
    week_of = request.args.get("week_of")  # optional exact date

    if week_of:
        try:
            ref = datetime.date.fromisoformat(week_of)
        except:
            return jsonify({"error": "invalid week_of date"}), 400
    else:
        today = datetime.date.today()
        if period == "previous":
            # calculate previous week's Monday
            day_of_week = today.weekday()  # 0=Monday
            monday_this_week = today - datetime.timedelta(days=day_of_week)
            ref = monday_this_week - datetime.timedelta(weeks=1)
        else:
            ref = today

    start, end = get_week_bounds(ref)

    # fetch all punches for the week
    punch_rows = db.session.query(
        Punch.username,
        Punch.date,
        Punch.punch_in,
        Punch.punch_out
    ).filter(
        Punch.date >= start,
        Punch.date <= end
    ).all()

    # organize punches per user per day
    punches_by_user = {}
    for username, date_, punch_in, punch_out in punch_rows:
        day_key = date_.isoformat()
        punch_data = {
            "in": punch_in.strftime("%H:%M") if punch_in else None,
            "out": punch_out.strftime("%H:%M") if punch_out else None
        }
        punches_by_user.setdefault(username, {}).setdefault(day_key, []).append(punch_data)

    # get all users
    all_users = UserDetail.query.filter_by(is_admin=False).all()
    final = []

    for u in all_users:
        username = u.username
        item = {
            "username": username,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "week_start": start.isoformat(),
            "week_end": end.isoformat(),
        }

        week_total_secs = 0
        for i in range(7):
            d = (start + datetime.timedelta(days=i)).isoformat()
            punches = punches_by_user.get(username, {}).get(d, [])
            # ensure at least one empty punch for UI consistency
            item[d] = punches if punches else [{"in": None, "out": None}]

            # calculate total seconds for the week
            for punch in punches:
                if punch["in"] and punch["out"]:
                    date_obj = datetime.date.fromisoformat(d)
                    in_time = datetime.datetime.combine(
                        date_obj, datetime.datetime.strptime(punch["in"], "%H:%M").time()
                    )
                    out_time = datetime.datetime.combine(
                        date_obj, datetime.datetime.strptime(punch["out"], "%H:%M").time()
                    )
                    week_total_secs += int((out_time - in_time).total_seconds())

        item["total"] = seconds_to_human(week_total_secs)
        final.append(item)

    return jsonify({
        "week_start": start.isoformat(),
        "week_end": end.isoformat(),
        "users": final
    })

@admin_bp.route("/user/<string:username>", methods=["GET"])
@admin_required
def view_user(username):
    from_date = request.args.get("from")
    to_date = request.args.get("to")

    today = datetime.date.today()

    # Parse dates or default to last 7 days
    try:
        start_date = datetime.date.fromisoformat(from_date) if from_date else today - datetime.timedelta(days=6)
        end_date = datetime.date.fromisoformat(to_date) if to_date else today
    except:
        return jsonify({"error": "invalid date format"}), 400

    user = get_user_by_username(username)
    if not user:
        return jsonify({"error": "user not found"}), 404

    # Fetch punches for the user in range
    punch_rows = db.session.query(
        Punch.date, Punch.punch_in, Punch.punch_out
    ).filter(
        Punch.username == username,
        Punch.date >= start_date,
        Punch.date <= end_date
    ).order_by(Punch.date, Punch.punch_in).all()

    # Organize punches per day
    attendance_by_day = {}
    weekly_total_seconds = 0

    for date_, punch_in, punch_out in punch_rows:
        day_key = date_.isoformat()
        punch_data = {
            "punch_in": punch_in.isoformat() if punch_in else None,
            "punch_out": punch_out.isoformat() if punch_out else None,
            "total_seconds": int((punch_out - punch_in).total_seconds()) if punch_in and punch_out else 0,
            "total_human": seconds_to_human(int((punch_out - punch_in).total_seconds())) if punch_in and punch_out else "0h 0m"
        }
        weekly_total_seconds += punch_data["total_seconds"]

        if day_key not in attendance_by_day:
            attendance_by_day[day_key] = []
        attendance_by_day[day_key].append(punch_data)

    # Ensure all days in range exist
    current_day = start_date
    while current_day <= end_date:
        day_str = current_day.isoformat()
        if day_str not in attendance_by_day:
            attendance_by_day[day_str] = []
        current_day += datetime.timedelta(days=1)

    weekly_total_human = seconds_to_human(weekly_total_seconds)

    return jsonify({
        "user": user.to_dict(),
        "attendance": attendance_by_day,
        "weekly_total_seconds": weekly_total_seconds,
        "weekly_total_human": weekly_total_human
    })


@admin_bp.route("/search", methods=["GET"])
@admin_required
def search():
    name = request.args.get("name", "").strip() or None
    email = request.args.get("email", "").strip() or None
    start = request.args.get("from")
    end = request.args.get("to")
    page = int(request.args.get("page", "1"))
    page_size = int(request.args.get("page_size", "50"))

    from flask import current_app
    page_size = max(1, min(page_size, current_app.config.get("MAX_PAGE_SIZE", 100)))
    offset = (page - 1) * page_size

    total, users = search_users(name=name, email=email, limit=page_size, offset=offset)
    results = []
    for u in users:
        from attendance.database import db
        from attendance.models.attendance import Attendance

        # Query total seconds
        aq = db.session.query(db.func.sum(Attendance.total_seconds)).filter(Attendance.username == u.username)
        # Query individual punches
        pq = db.session.query(Attendance).filter(Attendance.username == u.username)

        if start:
            try:
                start_date = datetime.date.fromisoformat(start)
                aq = aq.filter(Attendance.date >= start_date)
                pq = pq.filter(Attendance.date >= start_date)
            except:
                return jsonify({"error": "invalid from date"}), 400

        if end:
            try:
                end_date = datetime.date.fromisoformat(end)
                aq = aq.filter(Attendance.date <= end_date)
                pq = pq.filter(Attendance.date <= end_date)
            except:
                return jsonify({"error": "invalid to date"}), 400

        total_seconds = aq.scalar() or 0
        punches = [
            {
                "date": r.date.isoformat(),
                "in": r.punch_in.isoformat() if r.punch_in else None,
                "out": r.punch_out.isoformat() if r.punch_out else None,
                "total_seconds": r.total_seconds,
                "total_human": seconds_to_human(r.total_seconds)
            }
            for r in pq.all()
        ]

        results.append({
            "username": u.username,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "total_seconds_in_range": int(total_seconds),
            "punches": punches
        })

    return jsonify({
        "count": len(results),
        "total_matching": total,
        "page": page,
        "page_size": page_size,
        "results": results
    })

@admin_bp.route("/export-attendance", methods=["GET"])
@admin_required
def export_attendance():
    import pandas as pd
    from io import BytesIO
    from flask import send_file

    start = request.args.get("from")
    end = request.args.get("to")

    # Validate dates
    try:
        start_date = datetime.date.fromisoformat(start)
        end_date = datetime.date.fromisoformat(end)
    except:
        return jsonify({"error": "invalid dates"}), 400

    # Fetch all users
    total, users = search_users(limit=None, offset=0)

    # Generate list of all dates in range
    date_list = [start_date + datetime.timedelta(days=x) 
                 for x in range((end_date - start_date).days + 1)]

    # Prepare rows for Excel
    rows = []

    for u in users:
        row = {
            "ID": u.username,
            "Name": f"{u.first_name} {u.last_name}",
            "Email": u.email
        }
        total_seconds = 0

        # Fetch punches for user in date range
        punches_query = db.session.query(Attendance).filter(
            Attendance.username == u.username,
            Attendance.date >= start_date,
            Attendance.date <= end_date
        ).all()

        # Group punches by date
        punches_by_date = {}
        for p in punches_query:
            punches_by_date.setdefault(p.date, []).append(p)

        # Fill each date column
        for d in date_list:
            punches = punches_by_date.get(d, [])
            if punches:
                cell_content = "\n".join(
                    f"{p.punch_in.strftime('%H:%M') if p.punch_in else '--'} | "
                    f"{p.punch_out.strftime('%H:%M') if p.punch_out else '--'}"
                    for p in punches
                )
                row[d.isoformat()] = cell_content
                total_seconds += sum(p.total_seconds or 0 for p in punches)
            else:
                row[d.isoformat()] = "-- | --"

        # Total hours per user
        row["Total Hours"] = round(total_seconds / 3600, 2)
        rows.append(row)

    # Create DataFrame
    df = pd.DataFrame(rows)
    # Order columns: ID, Name, Email, dates..., Total Hours
    df = df[["ID", "Name", "Email"] + [d.isoformat() for d in date_list] + ["Total Hours"]]

    # Export to Excel
    output = BytesIO()
    with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
        df.to_excel(writer, index=False, sheet_name="Attendance")
        # Enable text wrap for punches
        workbook  = writer.book
        worksheet = writer.sheets["Attendance"]
        wrap_format = workbook.add_format({'text_wrap': True})
        for i, col in enumerate(df.columns):
            worksheet.set_column(i, i, 20, wrap_format)  # Adjust width & wrap text

    output.seek(0)

    return send_file(
        output,
        as_attachment=True,
        download_name=f"attendance_{start}_to_{end}.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
