"""
Admin router - endpoints for admin users to manage and monitor the platform
"""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ..database import get_db
from ..models import Admin, Student, DiagnosticResult, Performance, LearningPathItem
from ..schemas import (
    AdminStudentListItem, 
    AdminStatsResponse, 
    AdminStudentProgressResponse
)
from ..dependencies import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])

# Chapter names mapping
CHAPTER_NAMES = {
    1: "Chương I: Mệnh đề và Tập hợp",
    2: "Chương II: Bất phương trình",
    3: "Chương III: Góc lượng giác và Hệ thức lượng",
    4: "Chương IV: Vectơ",
    5: "Chương V: Phương trình đường thẳng và đường tròn",
}


@router.get("/stats", response_model=AdminStatsResponse)
def get_platform_stats(
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin)
):
    """Get overall platform statistics"""
    
    # Total students (all students, as admins are in separate table)
    total_students = db.query(func.count(Student.id)).scalar() or 0
    
    # Active students (those who have completed at least one exercise)
    active_students = db.query(func.count(func.distinct(Performance.student_id))).scalar() or 0
    
    # Total and correct exercises (replacing sessions)
    # Note: Performance uses 'score' field, not 'is_correct'
    total_sessions = db.query(func.count(Performance.id)).scalar() or 0
    completed_sessions = db.query(func.count(Performance.id)).filter(Performance.score >= 70.0).scalar() or 0
    
    # Average completion rate (now exercise accuracy)
    if total_sessions > 0:
        avg_completion_rate = round((completed_sessions / total_sessions) * 100, 2)
    else:
        avg_completion_rate = 0.0
    
    # Total diagnostic tests
    total_diagnostic_tests = db.query(func.count(func.distinct(DiagnosticResult.student_id))).scalar() or 0
    
    # Total exercises completed
    total_exercises_completed = db.query(func.count(Performance.id)).scalar() or 0
    
    return AdminStatsResponse(
        total_students=total_students,
        active_students=active_students,
        total_sessions=total_sessions,
        completed_sessions=completed_sessions,
        avg_completion_rate=avg_completion_rate,
        total_diagnostic_tests=total_diagnostic_tests,
        total_exercises_completed=total_exercises_completed
    )


@router.get("/students", response_model=List[AdminStudentListItem])
def get_all_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin)
):
    """Get list of all students with pagination and search"""
    
    # Note: Students table only contains students now (admins are in separate table)
    query = db.query(Student)
    
    # Search by email or full_name
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Student.email.ilike(search_term)) | 
            (Student.full_name.ilike(search_term))
        )
    
    # Order by created_at descending (newest first)
    query = query.order_by(Student.created_at.desc())
    
    students = query.offset(skip).limit(limit).all()
    return students


@router.get("/students/{student_id}", response_model=AdminStudentListItem)
def get_student_details(
    student_id: int,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin)
):
    """Get detailed information about a specific student"""
    
    # Note: Students table only contains students now (admins in separate table)
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return student


@router.get("/students/{student_id}/progress", response_model=AdminStudentProgressResponse)
def get_student_progress(
    student_id: int,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin)
):
    """Get progress overview for a specific student"""
    
    # Note: Students table only contains students now (admins in separate table)
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get exercise stats (replacing session stats)
    # Note: Performance uses 'score' field, not 'is_correct'
    total_sessions = db.query(func.count(Performance.id))\
        .filter(Performance.student_id == student_id).scalar() or 0
    completed_sessions = db.query(func.count(Performance.id))\
        .filter(Performance.student_id == student_id, Performance.score >= 70.0).scalar() or 0
    
    completion_rate = round((completed_sessions / total_sessions * 100), 2) if total_sessions > 0 else 0.0
    
    # Calculate discipline score (exercise accuracy)
    discipline_score = completion_rate
    
    # Get mastery by chapter
    diagnostic_results = db.query(
        DiagnosticResult.topic_id,
        func.avg(DiagnosticResult.percent).label('avg_percent')
    ).filter(
        DiagnosticResult.student_id == student_id
    ).group_by(DiagnosticResult.topic_id).all()
    
    mastery_radar = []
    topics_mastered = 0
    weak_topics = 0
    
    for result in diagnostic_results:
        chapter_id = result.topic_id
        percent = round(result.avg_percent, 2)
        
        mastery_radar.append({
            "topic_id": chapter_id,
            "topic_name": CHAPTER_NAMES.get(chapter_id, f"Chapter {chapter_id}"),
            "percent": percent
        })
        
        if percent >= 75:
            topics_mastered += 1
        elif percent < 60:
            weak_topics += 1
    
    return AdminStudentProgressResponse(
        student_id=student.id,
        student_email=student.email,
        student_name=student.full_name,
        total_sessions=total_sessions,
        completed_sessions=completed_sessions,
        completion_rate=completion_rate,
        discipline_score=discipline_score,
        topics_mastered=topics_mastered,
        weak_topics=weak_topics,
        mastery_radar=mastery_radar
    )


@router.get("/students/{student_id}/diagnostic")
def get_student_diagnostic(
    student_id: int,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin)
):
    """Get diagnostic test results for a specific student"""
    
    # Note: Students table only contains students now (admins in separate table)
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get all diagnostic results grouped by chapter
    results = db.query(DiagnosticResult).filter(
        DiagnosticResult.student_id == student_id
    ).order_by(DiagnosticResult.topic_id).all()
    
    # Group by chapter
    chapters_data = {}
    for result in results:
        chapter_id = result.topic_id
        if chapter_id not in chapters_data:
            chapters_data[chapter_id] = {
                "chapter_id": chapter_id,
                "chapter_name": CHAPTER_NAMES.get(chapter_id, f"Chapter {chapter_id}"),
                "results": []
            }
        
        chapters_data[chapter_id]["results"].append({
            "id": result.id,
            "percent": result.percent,
            "mastery_level": result.mastery_level,
            "timestamp": result.timestamp
        })
    
    return {
        "student_id": student.id,
        "student_email": student.email,
        "chapters": list(chapters_data.values())
    }


@router.get("/students/{student_id}/exercises")
def get_student_exercises(
    student_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin)
):
    """Get exercise submissions for a specific student"""
    
    # Note: Students table only contains students now (admins in separate table)
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get performances
    performances = db.query(Performance).filter(
        Performance.student_id == student_id
    ).order_by(Performance.taken_at.desc()).offset(skip).limit(limit).all()
    
    exercises_data = []
    for perf in performances:
        # Performance model fields: id, student_id, topic_id, score_type, score, taken_at
        exercises_data.append({
            "id": perf.id,
            "topic_id": perf.topic_id,  # Chapter ID
            "score_type": perf.score_type,
            "score": perf.score,
            "is_correct": perf.score >= 70.0,  # Derived from score
            "timestamp": perf.taken_at,
        })
    
    # Note: Performance uses 'score' field, not 'is_correct'
    total_exercises = db.query(func.count(Performance.id))\
        .filter(Performance.student_id == student_id).scalar() or 0
    correct_exercises = db.query(func.count(Performance.id))\
        .filter(Performance.student_id == student_id, Performance.score >= 70.0).scalar() or 0
    
    accuracy = round((correct_exercises / total_exercises * 100), 2) if total_exercises > 0 else 0.0
    
    return {
        "student_id": student.id,
        "student_email": student.email,
        "total_exercises": total_exercises,
        "correct_exercises": correct_exercises,
        "accuracy": accuracy,
        "exercises": exercises_data
    }

