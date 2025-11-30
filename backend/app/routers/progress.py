from __future__ import annotations
from typing import List, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Student, DiagnosticResult, Performance
from ..schemas import ProgressOverview
from ..dependencies import get_current_student

router = APIRouter(prefix="/progress", tags=["progress"])

# Chapter names mapping (consistent with other routers)
CHAPTER_NAMES = {
    1: "Chương I: Mệnh đề và Tập hợp",
    2: "Chương II: Bất phương trình",
    3: "Chương III: Góc lượng giác và Hệ thức lượng",
    4: "Chương IV: Vectơ",
    5: "Chương V: Phương trình đường thẳng và đường tròn",
}


@router.get("/overview", response_model=ProgressOverview)
def progress_overview(
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    """
    Progress overview dựa trên:
    1. Diagnostic results (chapter mastery)
    2. Exercise performance (số bài làm, độ chính xác)
    
    Không còn dựa vào schedule/sessions nữa.
    """
    
    # Get diagnostic results (chapter mastery)
    diagnostic_results = (
        db.query(DiagnosticResult)
        .filter(DiagnosticResult.student_id == current.id)
        .all()
    )
    
    # Calculate topics mastered and weak topics
    topics_mastered = sum(1 for dr in diagnostic_results if dr.percent >= 75)
    weak_topics = sum(1 for dr in diagnostic_results if dr.percent < 60)
    
    # Get exercise statistics
    # Note: Performance model doesn't have is_correct field, it uses score
    # We'll count total exercises attempted
    total_exercises = db.query(func.count(Performance.id))\
        .filter(Performance.student_id == current.id).scalar() or 0
    
    # Count exercises with good scores (>= 70%)
    correct_exercises = db.query(func.count(Performance.id))\
        .filter(Performance.student_id == current.id, Performance.score >= 70.0).scalar() or 0
    
    # Calculate completion based on:
    # - Has taken diagnostic test (20%)
    # - Number of exercises completed (80%)
    has_diagnostic = len(diagnostic_results) > 0
    diagnostic_weight = 20.0 if has_diagnostic else 0.0
    
    # Exercise weight: up to 80% based on number completed (target: 100 exercises)
    exercise_weight = min(80.0, (total_exercises / 100) * 80.0)
    
    completion_percent = round(diagnostic_weight + exercise_weight, 2)
    
    # Discipline score based on exercise accuracy
    if total_exercises > 0:
        discipline_score = round((correct_exercises / total_exercises) * 100.0, 2)
    else:
        discipline_score = 100.0  # Default if no exercises yet
    
    # Build mastery radar from diagnostic results
    radar: List[Dict] = [
        {
            "topic_id": dr.topic_id,
            "topic_name": CHAPTER_NAMES.get(dr.topic_id, f"Chương {dr.topic_id}"),
            "percent": round(dr.percent, 2)
        } 
        for dr in diagnostic_results
    ]
    
    # Sort by topic_id for consistent display
    radar.sort(key=lambda x: x["topic_id"])

    return ProgressOverview(
        total_sessions=total_exercises,  # Now represents total exercises
        completed_sessions=correct_exercises,  # Now represents correct exercises
        completion_percent=completion_percent,
        discipline_score=discipline_score,
        mastery_radar=radar,
        topics_mastered=topics_mastered,
        weak_topics=weak_topics,
    )
