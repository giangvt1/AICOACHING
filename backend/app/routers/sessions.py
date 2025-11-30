from __future__ import annotations
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, Schedule, SessionLog
from ..schemas import ScheduleRead, SessionCompleteIn
from ..dependencies import get_current_student

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("/today", response_model=List[ScheduleRead])
def sessions_today(
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    today = date.today()
    items = (
        db.query(Schedule)
        .filter(Schedule.student_id == current.id, Schedule.date == today)
        .order_by(Schedule.start_time.asc())
        .all()
    )
    return items


@router.post("/{schedule_id}/complete", response_model=ScheduleRead)
def complete_session(
    schedule_id: int,
    payload: SessionCompleteIn,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    sch: Optional[Schedule] = (
        db.query(Schedule)
        .filter(Schedule.id == schedule_id, Schedule.student_id == current.id)
        .first()
    )
    if not sch:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Update schedule status
    sch.status = "done"
    db.add(sch)

    # Create a log entry
    log = SessionLog(
        schedule_id=sch.id,
        completed=True,
        completed_at=datetime.utcnow(),
        duration_min=payload.duration_min,
        notes=payload.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(sch)
    return sch
