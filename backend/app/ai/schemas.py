from __future__ import annotations
from typing import List, Optional, Literal, Dict
from pydantic import BaseModel, Field


ExerciseType = Literal["open", "mcq"]


class ExerciseItem(BaseModel):
    question: str
    type: ExerciseType = "open"
    difficulty: int = Field(3, ge=1, le=5)
    # MCQ fields (optional)
    options: Optional[List[str]] = None
    correct_index: Optional[int] = None
    # Open-ended solution (optional)
    solution: Optional[str] = None


class GenerateExercisesRequest(BaseModel):
    topic: str = Field(..., description="Topic name in Vietnamese, e.g., 'Mệnh đề', 'Vectơ'")
    n: int = Field(5, ge=1, le=20)
    difficulty: int = Field(3, ge=1, le=5)
    format: Literal["open", "mcq", "mixed"] = "mcq"  # ✅ Default to MCQ for speed
    top_k: int = Field(4, ge=1, le=8, description="How many context chunks to retrieve from artifacts")


class ContextDoc(BaseModel):
    id: str
    source: str
    chunk_index: int
    preview: str


class ExerciseSet(BaseModel):
    id: str
    user_id: int
    topic: str
    difficulty: int
    format: str
    items: List[ExerciseItem]
    contexts: List[ContextDoc] = []
    used_model: str
    saved_path: Optional[str] = None


class GenerateExercisesResponse(BaseModel):
    set: ExerciseSet


# ============= Placement Test Schemas =============

class PlacementTestQuestion(BaseModel):
    id: str
    question_number: int
    text: str
    type: ExerciseType
    chapter: str
    options: Optional[List[str]] = None


class PlacementTest(BaseModel):
    test_id: str
    num_questions: int
    time_limit_minutes: int
    questions: List[PlacementTestQuestion]
    instructions: str


class PlacementTestSubmission(BaseModel):
    test_id: str
    answers: Dict[str, str] = Field(..., description="Mapping question_id -> student_answer")


class ChapterPerformance(BaseModel):
    chapter: str
    correct: int
    total: int
    score: float


class StrengthWeakness(BaseModel):
    chapter: str
    score: float
    correct: int
    total: int


class IncorrectQuestion(BaseModel):
    id: str
    chapter: str
    text: str
    student_answer: str
    correct_answer: str
    explanation: str


class PlacementTestResult(BaseModel):
    total_questions: int
    correct_count: int
    incorrect_count: int
    score: float
    level: str  # foundation, beginner, intermediate, advanced
    level_name: str  # Tên tiếng Việt
    recommendation: str
    strengths: List[StrengthWeakness]
    weaknesses: List[StrengthWeakness]
    chapter_performance: List[ChapterPerformance]
    incorrect_questions: List[IncorrectQuestion]
    evaluated_at: str
