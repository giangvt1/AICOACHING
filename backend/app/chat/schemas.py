from __future__ import annotations
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ContextDoc(BaseModel):
    id: str
    source: str
    chunk_index: int
    preview: str


class ChatExplainRequest(BaseModel):
    problem: str = Field(..., description="User's math problem (Vietnamese)")
    top_k: int = Field(4, ge=1, le=8)


class ChatExplainResponse(BaseModel):
    text: str
    contexts: List[ContextDoc] = []


# Action pipeline (scaffold for future steps)
class ActionSlots(BaseModel):
    topic: Optional[str] = None
    topic_id: Optional[int] = None
    freq: Optional[int] = None
    days: Optional[List[str]] = None
    time_of_day: Optional[str] = None
    session_id: Optional[int] = None
    new_date: Optional[str] = None
    new_time: Optional[str] = None


class ActionProposal(BaseModel):
    action: str = Field(..., description="create_schedule|reschedule|explain|none|mark_complete")
    confidence: float = Field(..., ge=0.0, le=1.0)
    slots: ActionSlots = Field(default_factory=ActionSlots)
    explanation: Optional[str] = None


class ChatMessageRequest(BaseModel):
    text: str
    session_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    type: str  # reply|confirm|clarify
    text: Optional[str] = None
    action_id: Optional[str] = None
    proposal: Optional[Dict[str, Any]] = None
