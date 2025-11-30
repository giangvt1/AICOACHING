from __future__ import annotations
from datetime import date, time, datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# Admin
class AdminBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class AdminRead(AdminBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str = "admin"


# Auth & Student
class StudentBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    goal_score: Optional[int] = Field(default=None, ge=0, le=10)


class StudentCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    goal_score: Optional[int] = Field(default=None, ge=0, le=10)


class StudentRead(StudentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str = "student"


# Availability
class AvailabilityIn(BaseModel):
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time


class AvailabilityRead(AvailabilityIn):
    id: int

    class Config:
        from_attributes = True


# Diagnostic submissions
class DiagnosticItemSubmission(BaseModel):
    topic_id: int
    total_questions: int = Field(ge=1, le=100)
    correct: int = Field(ge=0, le=100)


class DiagnosticSubmission(BaseModel):
    items: List[DiagnosticItemSubmission]


class DiagnosticResultRead(BaseModel):
    id: int
    topic_id: int
    total_questions: int
    correct: int
    percent: float
    created_at: datetime

    class Config:
        from_attributes = True


# Analysis
class AnalysisTopicSummary(BaseModel):
    topic_id: int
    topic_name: str
    percent: float
    mastery_level: int  # 1..5
    classification: str  # weak|average|strong
    priority_score: float


class AnalysisResponse(BaseModel):
    topics: List[AnalysisTopicSummary]
    prioritized_topic_ids: List[int]


# Learning Path
class LearningPathItemRead(BaseModel):
    id: int
    topic_id: int
    phase: str
    priority_rank: int

    class Config:
        from_attributes = True


# Schedule
class ScheduleRead(BaseModel):
    id: int
    date: date
    start_time: time
    end_time: time
    topic_id: Optional[int]
    learning_unit_id: Optional[int]
    status: str

    class Config:
        from_attributes = True


class SessionCompleteIn(BaseModel):
    duration_min: Optional[int] = None
    notes: Optional[str] = None


# Progress
class ProgressOverview(BaseModel):
    total_sessions: int  # Now represents total exercises
    completed_sessions: int  # Now represents correct exercises
    completion_percent: float
    discipline_score: float  # Exercise accuracy
    mastery_radar: List[dict]
    topics_mastered: int = 0
    weak_topics: int = 0


# Topics / Units
class TopicRead(BaseModel):
    id: int
    name: str
    difficulty: int
    is_core: bool
    order_index: int

    class Config:
        from_attributes = True


class LearningUnitRead(BaseModel):
    id: int
    topic_id: int
    type: str
    title: str
    duration_min: int

    class Config:
        from_attributes = True


# Question Bank / Quiz
class QuestionReadLight(BaseModel):
    id: int
    topic_id: int
    text: str
    options: List[str]
    difficulty: int


class QuestionsResponse(BaseModel):
    topic_id: int
    questions: List[QuestionReadLight]


class QuizAnswer(BaseModel):
    question_id: int
    answer_index: int


class QuizSubmitIn(BaseModel):
    topic_id: int
    answers: List[QuizAnswer]


class QuizItemResult(BaseModel):
    question_id: int
    correct_index: int
    chosen_index: int
    is_correct: bool


class QuizSubmitResult(BaseModel):
    topic_id: int
    total: int
    correct_count: int
    score_percent: float
    details: List[QuizItemResult]


# AI Assistant
class ExplainRequest(BaseModel):
    problem: str


class GenerateExercisesRequest(BaseModel):
    topic: str
    difficulty: int = Field(ge=1, le=5, default=3)
    n: int = Field(ge=1, le=10, default=5)


class AssistantResponse(BaseModel):
    text: str


# Admin Schemas
class AdminStudentListItem(BaseModel):
    """Student list item for admin view"""
    id: int
    email: str
    full_name: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    role: str = "student"
    created_at: datetime

    class Config:
        from_attributes = True


class AdminStatsResponse(BaseModel):
    """Platform-wide statistics for admin dashboard"""
    total_students: int
    active_students: int  # Students who have completed at least one session
    total_sessions: int
    completed_sessions: int
    avg_completion_rate: float
    total_diagnostic_tests: int
    total_exercises_completed: int


class AdminStudentProgressResponse(BaseModel):
    """Detailed progress for a specific student"""
    student_id: int
    student_email: str
    student_name: Optional[str]
    total_sessions: int
    completed_sessions: int
    completion_rate: float
    discipline_score: float
    topics_mastered: int
    weak_topics: int
    mastery_radar: List[dict]  # List of {topic_id, topic_name, percent}
