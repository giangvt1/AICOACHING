from __future__ import annotations
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, DiagnosticResult, Topic
from ..schemas import DiagnosticSubmission, DiagnosticResultRead
from ..dependencies import get_current_student

router = APIRouter(prefix="/diagnostic", tags=["diagnostic"])


@router.post("/submit", response_model=List[DiagnosticResultRead])
def submit_diagnostic(
    payload: DiagnosticSubmission,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No items provided")

    # Accept chapter IDs 1-5 (from frontend CHAPTERS hardcoded list)
    # We treat them as "virtual" topics for diagnostic purposes
    VALID_CHAPTER_IDS = {1, 2, 3, 4, 5}

    results: list[DiagnosticResult] = []
    for it in payload.items:
        # Validate chapter ID
        if it.topic_id not in VALID_CHAPTER_IDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Invalid chapter_id {it.topic_id}. Must be 1-5"
            )
        if it.correct > it.total_questions:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="correct cannot exceed total_questions")
        percent = (it.correct / it.total_questions) * 100.0 if it.total_questions > 0 else 0.0

        existing: Optional[DiagnosticResult] = (
            db.query(DiagnosticResult)
            .filter(DiagnosticResult.student_id == current.id, DiagnosticResult.topic_id == it.topic_id)
            .first()
        )
        if existing:
            existing.total_questions = it.total_questions
            existing.correct = it.correct
            existing.percent = percent
            db.add(existing)
            results.append(existing)
        else:
            dr = DiagnosticResult(
                student_id=current.id,
                topic_id=it.topic_id,
                total_questions=it.total_questions,
                correct=it.correct,
                percent=percent,
            )
            db.add(dr)
            results.append(dr)

    db.commit()
    for r in results:
        db.refresh(r)
    return results


@router.get("/results", response_model=List[DiagnosticResultRead])
def get_results(
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    res = (
        db.query(DiagnosticResult)
        .filter(DiagnosticResult.student_id == current.id)
        .order_by(DiagnosticResult.created_at.desc())
        .all()
    )
    return res
