from __future__ import annotations
import json
from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, Question, Performance
from ..schemas import (
    QuestionsResponse,
    QuestionReadLight,
    QuizSubmitIn,
    QuizSubmitResult,
    QuizItemResult,
)
from ..dependencies import get_current_student

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("", response_model=QuestionsResponse)
def get_questions(
    topic_id: int = Query(..., ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    rows: List[Question] = (
        db.query(Question)
        .filter(Question.topic_id == topic_id)
        .order_by(Question.id.asc())
        .limit(limit)
        .all()
    )
    questions: List[QuestionReadLight] = []
    for q in rows:
        try:
            options = json.loads(q.options_json)
        except Exception:
            options = []
        questions.append(
            QuestionReadLight(
                id=q.id,
                topic_id=q.topic_id,
                text=q.text,
                options=options,
                difficulty=q.difficulty,
            )
        )
    return QuestionsResponse(topic_id=topic_id, questions=questions)


@router.post("/quiz/submit", response_model=QuizSubmitResult)
def submit_quiz(
    payload: QuizSubmitIn,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    # Fetch questions by ids from provided answers
    qids = [a.question_id for a in payload.answers]
    if not qids:
        raise HTTPException(status_code=400, detail="No answers provided")

    rows: Dict[int, Question] = {q.id: q for q in db.query(Question).filter(Question.id.in_(qids)).all()}

    details: List[QuizItemResult] = []
    correct_count = 0
    for a in payload.answers:
        q = rows.get(a.question_id)
        if not q:
            # skip unknown question ids
            continue
        is_correct = a.answer_index == q.correct_index
        if is_correct:
            correct_count += 1
        details.append(
            QuizItemResult(
                question_id=q.id,
                correct_index=q.correct_index,
                chosen_index=a.answer_index,
                is_correct=is_correct,
            )
        )
    total = len(details)
    score_percent = (correct_count / total) * 100.0 if total > 0 else 0.0

    # Store performance record
    perf = Performance(
        student_id=current.id,
        topic_id=payload.topic_id,
        score_type="quiz",
        score=score_percent,
    )
    db.add(perf)
    db.commit()

    return QuizSubmitResult(
        topic_id=payload.topic_id,
        total=total,
        correct_count=correct_count,
        score_percent=round(score_percent, 2),
        details=details,
    )
