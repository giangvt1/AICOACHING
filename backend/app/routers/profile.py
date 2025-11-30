from __future__ import annotations
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, Availability
from ..schemas import StudentRead, StudentUpdate, AvailabilityIn, AvailabilityRead
from ..dependencies import get_current_student

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/me", response_model=StudentRead)
def get_me(current: Student = Depends(get_current_student)):
    return current


@router.put("/me", response_model=StudentRead)
def update_me(
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    if payload.full_name is not None:
        current.full_name = payload.full_name
    if payload.school is not None:
        current.school = payload.school
    if payload.grade is not None:
        current.grade = payload.grade
    if payload.goal_score is not None:
        current.goal_score = payload.goal_score

    db.add(current)
    db.commit()
    db.refresh(current)
    return current


@router.get("/me/availability", response_model=List[AvailabilityRead])
def get_availability(
    current: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    slots = db.query(Availability).filter(Availability.student_id == current.id).all()
    return slots


@router.put("/me/availability", response_model=List[AvailabilityRead])
def set_availability(
    payload: List[AvailabilityIn],
    current: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    # Replace existing availability with the provided list
    db.query(Availability).filter(Availability.student_id == current.id).delete()
    db.commit()

    new_slots: list[Availability] = []
    for item in payload:
        if item.end_time <= item.start_time:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_time must be after start_time")
        slot = Availability(
            student_id=current.id,
            weekday=item.weekday,
            start_time=item.start_time,
            end_time=item.end_time,
        )
        db.add(slot)
        new_slots.append(slot)
    db.commit()
    for s in new_slots:
        db.refresh(s)
    return new_slots
