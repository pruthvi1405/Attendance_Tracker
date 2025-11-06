# attendance/services/attendance_service.py
from attendance.database import db
from attendance.models.attendance import Attendance
import datetime
from sqlalchemy import func
from typing import List, Dict

def punch_in(username: str, when: datetime.datetime = None) -> Attendance:
    when = when or datetime.datetime.utcnow()
    rec = Attendance(
        username=username,
        date=when.date(),
        punch_in=when,
        punch_out=None,
        total_seconds=None
    )
    db.session.add(rec)
    db.session.commit()
    return rec

def punch_out(username: str, attendance_id: int = None, when: datetime.datetime = None) -> Attendance:
    when = when or datetime.datetime.utcnow()
    if attendance_id:
        rec = Attendance.query.filter_by(id=attendance_id, username=username).first()
    else:
        rec = Attendance.query.filter_by(username=username, punch_out=None).order_by(Attendance.punch_in.desc()).first()
    if not rec:
        raise ValueError("No open punch-in record found")
    if when < rec.punch_in:
        raise ValueError("Punch-out cannot be earlier than punch-in")
    rec.punch_out = when
    rec.compute_total()
    db.session.commit()
    return rec

def get_attendance_for_user(username: str, start_date=None, end_date=None) -> List[Attendance]:
    q = Attendance.query.filter_by(username=username)
    if start_date:
        q = q.filter(Attendance.date >= start_date)
    if end_date:
        q = q.filter(Attendance.date <= end_date)
    return q.order_by(Attendance.date.desc(), Attendance.punch_in.desc()).all()

def aggregate_seconds_per_user_for_date(the_date: datetime.date):
    rows = db.session.query(
        Attendance.username,
        func.sum(Attendance.total_seconds).label("total_seconds")
    ).filter(Attendance.date == the_date).group_by(Attendance.username).all()
    return rows

def aggregate_seconds_per_user_for_range(start_date: datetime.date, end_date: datetime.date):
    rows = db.session.query(
        Attendance.username,
        Attendance.date,
        func.sum(Attendance.total_seconds).label("total_seconds")
    ).filter(Attendance.date >= start_date, Attendance.date <= end_date).group_by(Attendance.username, Attendance.date).all()
    # return rows as list of tuples (username, date, total_seconds)
    return rows
