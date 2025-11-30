from __future__ import annotations
from typing import List, Dict, Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, DiagnosticResult, Topic
from ..schemas import AnalysisResponse, AnalysisTopicSummary
from ..dependencies import get_current_student
from ..ai.insights import generate_analysis_insights, generate_daily_coaching_message

router = APIRouter(prefix="/analysis", tags=["analysis"])


def _classify(percent: float) -> tuple[int, str]:
    # Map percent to mastery level 1..5 and label
    if percent < 40:
        return 1, "weak"
    if percent < 60:
        return 2, "weak"
    if percent < 75:
        return 3, "average"
    if percent < 90:
        return 4, "strong"
    return 5, "strong"


@router.get("/strength-weakness", response_model=AnalysisResponse)
def strength_weakness(
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    # Chapter names mapping (topic_id now stores chapter_id 1-5)
    CHAPTER_NAMES = {
        1: "Chương I: Mệnh đề và Tập hợp",
        2: "Chương II: Bất phương trình",
        3: "Chương III: Góc lượng giác và Hệ thức lượng",
        4: "Chương IV: Vectơ",
        5: "Chương V: Phương trình đường thẳng và đường tròn",
    }
    
    # Load diagnostic results (no join needed, using hardcoded chapter names)
    results = (
        db.query(DiagnosticResult)
        .filter(DiagnosticResult.student_id == current.id)
        .all()
    )

    topics: List[AnalysisTopicSummary] = []
    for dr in results:
        # Get chapter name from mapping
        chapter_name = CHAPTER_NAMES.get(dr.topic_id, f"Chương {dr.topic_id}")
        
        mastery, classification = _classify(dr.percent)
        # Priority: higher when percent is lower (simpler calculation without topic metadata)
        # Lower percent = higher priority
        priority = 100.0 - dr.percent
        
        topics.append(
            AnalysisTopicSummary(
                topic_id=dr.topic_id,  # This is actually chapter_id 1-5
                topic_name=chapter_name,
                percent=dr.percent,
                mastery_level=mastery,
                classification=classification,
                priority_score=priority,
            )
        )

    # Sort by priority desc (study the weakest/most important first)
    topics_sorted = sorted(topics, key=lambda t: t.priority_score, reverse=True)
    prioritized_ids = [t.topic_id for t in topics_sorted]

    return AnalysisResponse(topics=topics_sorted, prioritized_topic_ids=prioritized_ids)


@router.get("/insights")
def get_analysis_insights(
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
) -> Dict[str, Any]:
    """
    Generate AI-powered insights based on diagnostic analysis.
    Returns personalized recommendations, reasoning, and encouragement.
    """
    # Chapter names mapping (same as strength-weakness)
    CHAPTER_NAMES = {
        1: "Chương I: Mệnh đề và Tập hợp",
        2: "Chương II: Bất phương trình",
        3: "Chương III: Góc lượng giác và Hệ thức lượng",
        4: "Chương IV: Vectơ",
        5: "Chương V: Phương trình đường thẳng và đường tròn",
    }
    
    # Load diagnostic results (no join needed)
    results = (
        db.query(DiagnosticResult)
        .filter(DiagnosticResult.student_id == current.id)
        .all()
    )

    topics: List[Dict[str, Any]] = []
    for dr in results:
        chapter_name = CHAPTER_NAMES.get(dr.topic_id, f"Chương {dr.topic_id}")
        mastery, classification = _classify(dr.percent)
        
        # Simplified priority (no topic difficulty/is_core metadata)
        priority = 100.0 - dr.percent
        
        topics.append({
            "topic_id": dr.topic_id,  # Actually chapter_id 1-5
            "topic_name": chapter_name,
            "percent": dr.percent,
            "mastery_level": mastery,
            "classification": classification,
            "priority_score": priority,
            "difficulty": 3,  # Default medium difficulty
            "is_core": True,  # All chapters are core
        })

    # Sort by priority
    topics_sorted = sorted(topics, key=lambda t: t["priority_score"], reverse=True)

    # Build student profile
    student_profile = {
        "goal_score": current.goal_score or 8,
        "full_name": current.full_name,
    }

    # Generate insights
    insights = generate_analysis_insights(topics_sorted, student_profile)
    
    return insights


@router.get("/coaching-message")
def get_coaching_message(
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
) -> Dict[str, str]:
    """Generate daily coaching message for dashboard"""
    # TODO: Calculate actual completed_today and streak from SessionLog
    message = generate_daily_coaching_message(
        student_name=current.full_name or "bạn",
        completed_today=0,
        streak_days=0,
        next_topic=None
    )
    return {"message": message}
