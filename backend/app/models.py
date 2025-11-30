from __future__ import annotations
from datetime import datetime, date, time, timedelta
from typing import Optional, List

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    Time,
    Boolean,
    Float,
    ForeignKey,
    UniqueConstraint,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship, Mapped

from .database import Base


class Admin(Base):
    """
    Admin users - separate from students with their own authentication.
    """
    __tablename__ = "admins"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    email: Mapped[str] = Column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = Column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = Column(String(255), nullable=True)
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login: Mapped[Optional[datetime]] = Column(DateTime, nullable=True)


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    email: Mapped[str] = Column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = Column(String(255), nullable=False)

    full_name: Mapped[Optional[str]] = Column(String(255), nullable=True)
    school: Mapped[Optional[str]] = Column(String(255), nullable=True)
    grade: Mapped[Optional[str]] = Column(String(50), nullable=True)
    goal_score: Mapped[Optional[int]] = Column(Integer, nullable=True)

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, nullable=False)

    availability: Mapped[List["Availability"]] = relationship(
        "Availability", back_populates="student", cascade="all, delete-orphan"
    )
    diagnostics: Mapped[List["DiagnosticResult"]] = relationship(
        "DiagnosticResult", back_populates="student", cascade="all, delete-orphan"
    )
    learning_path: Mapped[List["LearningPathItem"]] = relationship(
        "LearningPathItem", back_populates="student", cascade="all, delete-orphan"
    )
    schedules: Mapped[List["Schedule"]] = relationship(
        "Schedule", back_populates="student", cascade="all, delete-orphan"
    )


class Availability(Base):
    __tablename__ = "availability"

    id: Mapped[int] = Column(Integer, primary_key=True)
    student_id: Mapped[int] = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), index=True)
    # weekday: 0=Mon ... 6=Sun
    weekday: Mapped[int] = Column(Integer, nullable=False)
    start_time: Mapped[time] = Column(Time, nullable=False)
    end_time: Mapped[time] = Column(Time, nullable=False)

    student: Mapped[Student] = relationship("Student", back_populates="availability")

    __table_args__ = (
        UniqueConstraint("student_id", "weekday", "start_time", "end_time", name="uq_availability_slot"),
    )


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = Column(Integer, primary_key=True)
    name: Mapped[str] = Column(String(255), nullable=False, unique=True)
    difficulty: Mapped[int] = Column(Integer, nullable=False, default=3)  # 1..5
    is_core: Mapped[bool] = Column(Boolean, nullable=False, default=True)
    order_index: Mapped[int] = Column(Integer, nullable=False, default=0)

    units: Mapped[List["LearningUnit"]] = relationship(
        "LearningUnit", back_populates="topic", cascade="all, delete-orphan"
    )


class LearningUnit(Base):
    __tablename__ = "learning_units"

    id: Mapped[int] = Column(Integer, primary_key=True)
    topic_id: Mapped[int] = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = Column(String(50), nullable=False, default="theory")  # theory|example|exercise|review
    title: Mapped[str] = Column(String(255), nullable=False)
    duration_min: Mapped[int] = Column(Integer, nullable=False, default=60)

    topic: Mapped[Topic] = relationship("Topic", back_populates="units")


class DiagnosticResult(Base):
    __tablename__ = "diagnostic_results"

    id: Mapped[int] = Column(Integer, primary_key=True)
    student_id: Mapped[int] = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), index=True)
    topic_id: Mapped[int] = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), index=True)
    total_questions: Mapped[int] = Column(Integer, nullable=False)
    correct: Mapped[int] = Column(Integer, nullable=False)
    percent: Mapped[float] = Column(Float, nullable=False)
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, nullable=False)

    student: Mapped[Student] = relationship("Student", back_populates="diagnostics")
    topic: Mapped[Topic] = relationship("Topic")

    __table_args__ = (
        UniqueConstraint("student_id", "topic_id", name="uq_diagnostic_once_per_topic"),
    )


class Performance(Base):
    __tablename__ = "performances"

    id: Mapped[int] = Column(Integer, primary_key=True)
    student_id: Mapped[int] = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), index=True)
    topic_id: Mapped[int] = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), index=True)
    score_type: Mapped[str] = Column(String(50), nullable=False, default="quiz")  # quiz|chapter|final
    score: Mapped[float] = Column(Float, nullable=False, default=0.0)
    taken_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, nullable=False)

    student: Mapped[Student] = relationship("Student")
    topic: Mapped[Topic] = relationship("Topic")


class LearningPathItem(Base):
    __tablename__ = "learning_path_items"

    id: Mapped[int] = Column(Integer, primary_key=True)
    student_id: Mapped[int] = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), index=True)
    topic_id: Mapped[int] = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), index=True)
    phase: Mapped[str] = Column(String(50), nullable=False)  # foundation|focus|review
    priority_rank: Mapped[int] = Column(Integer, nullable=False, default=0)

    student: Mapped[Student] = relationship("Student", back_populates="learning_path")
    topic: Mapped[Topic] = relationship("Topic")


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = Column(Integer, primary_key=True)
    student_id: Mapped[int] = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = Column(Date, nullable=False)
    start_time: Mapped[time] = Column(Time, nullable=False)
    end_time: Mapped[time] = Column(Time, nullable=False)
    topic_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    learning_unit_id: Mapped[Optional[int]] = Column(Integer, ForeignKey("learning_units.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = Column(String(20), nullable=False, default="planned")  # planned|done|missed

    student: Mapped[Student] = relationship("Student", back_populates="schedules")
    topic: Mapped[Optional[Topic]] = relationship("Topic")
    learning_unit: Mapped[Optional[LearningUnit]] = relationship("LearningUnit")


class SessionLog(Base):
    __tablename__ = "session_logs"

    id: Mapped[int] = Column(Integer, primary_key=True)
    schedule_id: Mapped[int] = Column(Integer, ForeignKey("schedules.id", ondelete="CASCADE"), index=True)
    completed: Mapped[bool] = Column(Boolean, default=False, nullable=False)
    completed_at: Mapped[Optional[datetime]] = Column(DateTime, nullable=True)
    duration_min: Mapped[Optional[int]] = Column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = Column(String(1000), nullable=True)

    schedule: Mapped[Schedule] = relationship("Schedule")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = Column(Integer, primary_key=True)
    topic_id: Mapped[int] = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), index=True)
    text: Mapped[str] = Column(String(1000), nullable=False)
    # JSON-encoded list of options (List[str]) for cross-DB compatibility
    options_json: Mapped[str] = Column(String(2000), nullable=False)
    correct_index: Mapped[int] = Column(Integer, nullable=False, default=0)
    difficulty: Mapped[int] = Column(Integer, nullable=False, default=3)

    topic: Mapped[Topic] = relationship("Topic")


class PlacementTestResult(Base):
    """
    Lưu kết quả Initial Placement Test của học sinh.
    Test này được thực hiện khi học sinh đăng nhập lần đầu để đánh giá trình độ.
    """
    __tablename__ = "placement_test_results"

    id: Mapped[int] = Column(Integer, primary_key=True)
    student_id: Mapped[int] = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), index=True, nullable=False)
    test_id: Mapped[str] = Column(String(255), nullable=False, index=True)
    
    # Test metrics
    total_questions: Mapped[int] = Column(Integer, nullable=False)
    correct_count: Mapped[int] = Column(Integer, nullable=False)
    score: Mapped[float] = Column(Float, nullable=False)  # Percentage (0-100)
    
    # Assessed level
    level: Mapped[str] = Column(String(50), nullable=False)  # foundation|beginner|intermediate|advanced
    level_name: Mapped[str] = Column(String(100), nullable=False)  # Tên tiếng Việt
    recommendation: Mapped[str] = Column(Text, nullable=True)  # AI recommendation
    
    # Detailed results (stored as JSON)
    chapter_performance: Mapped[Optional[str]] = Column(JSON, nullable=True)  # Performance by chapter
    strengths: Mapped[Optional[str]] = Column(JSON, nullable=True)  # Strong chapters
    weaknesses: Mapped[Optional[str]] = Column(JSON, nullable=True)  # Weak chapters
    
    # Metadata
    taken_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    student: Mapped[Student] = relationship("Student")
    
    __table_args__ = (
        # Allow multiple tests per student (for retakes), but unique test_id
        UniqueConstraint("test_id", name="uq_placement_test_id"),
    )
