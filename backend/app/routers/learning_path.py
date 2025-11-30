from __future__ import annotations
from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, DiagnosticResult, LearningPathItem
from ..schemas import LearningPathItemRead
from ..dependencies import get_current_student

router = APIRouter(prefix="/learning-path", tags=["learning-path"])

# Chapter names mapping (consistent with diagnostic and analysis)
CHAPTER_NAMES = {
    1: "Chương I: Mệnh đề và Tập hợp",
    2: "Chương II: Bất phương trình",
    3: "Chương III: Góc lượng giác và Hệ thức lượng",
    4: "Chương IV: Vectơ",
    5: "Chương V: Phương trình đường thẳng và đường tròn",
}


def _prioritize_chapters(db: Session, student_id: int) -> List[int]:
    """
    Prioritize chapters (1-5) based on diagnostic results.
    Lower percent = higher priority (study weakest first).
    """
    results = (
        db.query(DiagnosticResult)
        .filter(DiagnosticResult.student_id == student_id)
        .all()
    )
    
    if results:
        # Calculate priority: lower percent = higher priority
        scored = []
        for dr in results:
            # Simple priority: study weakest chapters first
            priority = 100.0 - dr.percent
            scored.append((dr.topic_id, priority))  # topic_id is actually chapter_id 1-5
        
        scored.sort(key=lambda x: x[1], reverse=True)
        return [chapter_id for chapter_id, _ in scored]
    
    # Fallback: default order 1-5
    return [1, 2, 3, 4, 5]


@router.post("/generate", response_model=List[LearningPathItemRead])
def generate_learning_path(
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    """
    Generate learning path based on diagnostic results.
    Strategy: 
    - Top 2 weakest chapters → foundation phase
    - Next 2 chapters → focus phase
    - Strongest chapter → review phase
    """
    chapter_ids = _prioritize_chapters(db, current.id)
    
    phases = []
    # Foundation: 2 weakest chapters
    if len(chapter_ids) >= 1:
        phases.append(("foundation", chapter_ids[0]))
    if len(chapter_ids) >= 2:
        phases.append(("foundation", chapter_ids[1]))
    
    # Focus: next 2 chapters
    if len(chapter_ids) >= 3:
        phases.append(("focus", chapter_ids[2]))
    if len(chapter_ids) >= 4:
        phases.append(("focus", chapter_ids[3]))
    
    # Review: strongest chapter
    if len(chapter_ids) >= 5:
        phases.append(("review", chapter_ids[4]))

    # Clear old learning path
    db.query(LearningPathItem).filter(LearningPathItem.student_id == current.id).delete()
    db.commit()

    # Create new learning path items
    items: list[LearningPathItem] = []
    for rank, (phase, chapter_id) in enumerate(phases, start=1):
        li = LearningPathItem(
            student_id=current.id, 
            topic_id=chapter_id,  # Store chapter_id (1-5) in topic_id field
            phase=phase, 
            priority_rank=rank
        )
        db.add(li)
        items.append(li)
    
    db.commit()
    for it in items:
        db.refresh(it)
    return items


@router.get("", response_model=List[LearningPathItemRead])
def list_learning_path(
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    items = (
        db.query(LearningPathItem)
        .filter(LearningPathItem.student_id == current.id)
        .order_by(LearningPathItem.priority_rank.asc())
        .all()
    )
    return items
