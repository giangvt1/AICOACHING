from __future__ import annotations
import json
from sqlalchemy.orm import Session
from .models import Topic, LearningUnit, Question


def ensure_seed(db: Session) -> None:
    # Seed topics for Toán 10 (matched with artifacts/input files)
    # Format: (name, difficulty, is_core, order_index)
    topics = [
        # Chương I: Mệnh đề - Tập hợp
        ("Mệnh đề", 3, True, 1),
        ("Tập hợp", 3, True, 2),
        ("Mệnh đề – Tập hợp", 3, True, 3),
        
        # Chương II: Bất phương trình
        ("Bất phương trình", 4, True, 4),
        ("Hệ bất phương trình", 4, True, 5),
        
        # Chương III: Hệ thức lượng giác
        ("Giá trị lượng giác", 4, True, 6),
        ("Định lý côsin", 4, True, 7),
        ("Định lý sin", 4, True, 8),
        ("Giải tam giác", 4, True, 9),
        
        # Chương IV: Vectơ
        ("Khái niệm vectơ", 3, True, 10),
        ("Tổng và hiệu vectơ", 3, True, 11),
        ("Tích vectơ với số", 3, True, 12),
        ("Tích vô hướng", 4, True, 13),
        ("Tọa độ vectơ", 4, True, 14),
        ("Vectơ", 3, True, 15),
        
        # Chương V: Thống kê
        ("Số gần đúng và sai số", 2, True, 16),
        ("Đo xu thế trung tâm", 2, True, 17),
        ("Các số đặc trưng", 3, True, 18),
        ("Thống kê – Xác suất", 2, True, 19),
        
        # Fallback topics
        ("Hàm số – Đồ thị", 3, False, 20),
        ("Giá trị tuyệt đối", 3, False, 21),
    ]
    
    try:
        existing = {t.name: t for t in db.query(Topic).all()}
        for name, difficulty, is_core, order_index in topics:
            if name not in existing:
                t = Topic(name=name, difficulty=difficulty, is_core=is_core, order_index=order_index)
                db.add(t)
        db.commit()
    except Exception as e:
        db.rollback()
        # Silently ignore - topics already exist in database
        pass

    # Seed sample learning units per topic (minimal for demo)
    for topic in db.query(Topic).all():
        units = db.query(LearningUnit).filter(LearningUnit.topic_id == topic.id).all()
        if units:
            continue
        base_title = topic.name
        sample_units = [
            ("theory", f"{base_title} - Lý thuyết 1", 45),
            ("example", f"{base_title} - Ví dụ mẫu", 30),
            ("exercise", f"{base_title} - Bài tập mức 1", 45),
        ]
        for utype, title, duration in sample_units:
            db.add(LearningUnit(topic_id=topic.id, type=utype, title=title, duration_min=duration))
    db.commit()

    # Seed simple question bank per topic if empty
    for topic in db.query(Topic).all():
        has_q = db.query(Question).filter(Question.topic_id == topic.id).first()
        if has_q:
            continue
        sample_questions = [
            {
                "text": f"{topic.name}: Câu hỏi 1 (cơ bản)",
                "options": ["A", "B", "C", "D"],
                "correct_index": 1,
                "difficulty": 2,
            },
            {
                "text": f"{topic.name}: Câu hỏi 2 (trung bình)",
                "options": ["A", "B", "C", "D"],
                "correct_index": 2,
                "difficulty": 3,
            },
        ]
        for q in sample_questions:
            db.add(
                Question(
                    topic_id=topic.id,
                    text=q["text"],
                    options_json=json.dumps(q["options"], ensure_ascii=False),
                    correct_index=q["correct_index"],
                    difficulty=q["difficulty"],
                )
            )
    db.commit()
