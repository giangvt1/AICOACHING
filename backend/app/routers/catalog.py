from __future__ import annotations
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Topic, LearningUnit
from ..schemas import TopicRead, LearningUnitRead

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/topics", response_model=List[TopicRead])
def list_topics(db: Session = Depends(get_db)):
    topics = db.query(Topic).order_by(Topic.order_index.asc(), Topic.id.asc()).all()
    return topics


@router.get("/topics/{topic_id}/units", response_model=List[LearningUnitRead])
def list_units(topic_id: int, db: Session = Depends(get_db)):
    units = (
        db.query(LearningUnit)
        .filter(LearningUnit.topic_id == topic_id)
        .order_by(LearningUnit.id.asc())
        .all()
    )
    return units
