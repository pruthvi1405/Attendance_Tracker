# attendance/models/attendance.py
from attendance.database import db
import datetime

class Attendance(db.Model):
    __tablename__ = "attendance"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), db.ForeignKey("user_details.username"), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)  # local date of the punch (UTC date stored)
    punch_in = db.Column(db.DateTime(timezone=False), nullable=False)
    punch_out = db.Column(db.DateTime(timezone=False), nullable=True)
    total_seconds = db.Column(db.Integer, nullable=True)  # computed when punch_out is recorded

    # relationship helper not required but convenient
    user = db.relationship("UserDetail", backref=db.backref("attendances", lazy="dynamic"))

    def compute_total(self):
        if self.punch_out and self.punch_in:
            delta = self.punch_out - self.punch_in
            self.total_seconds = int(delta.total_seconds())
        else:
            self.total_seconds = None

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "date": self.date.isoformat(),
            "punch_in": self.punch_in.isoformat(),
            "punch_out": self.punch_out.isoformat() if self.punch_out else None,
            "total_seconds": self.total_seconds
        }
