
from attendance.database import db  
import datetime

class Punch(db.Model):
    __tablename__ = "punches"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), db.ForeignKey("user_details.username"), nullable=False)
    date = db.Column(db.Date, nullable=False)  # the day
    punch_in = db.Column(db.DateTime, nullable=True)
    punch_out = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "date": self.date.isoformat(),
            "punch_in": self.punch_in.isoformat() if self.punch_in else None,
            "punch_out": self.punch_out.isoformat() if self.punch_out else None
        }

