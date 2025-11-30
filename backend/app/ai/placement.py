"""
Initial Placement Test System
Đánh giá trình độ học sinh lần đầu đăng nhập
"""

from __future__ import annotations
import os
import json
import random
from typing import List, Dict, Any, Optional
from datetime import datetime


def load_placement_test_questions(questions_per_chapter: int = 4) -> List[Dict[str, Any]]:
    """
    Load câu hỏi cho placement test: 4 câu từ mỗi chương (5 chương = 20 câu total).
    
    Args:
        questions_per_chapter: Số câu mỗi chương (default: 4)
    
    Returns:
        List of placement test questions with chapter_id
    """
    # Use production folder (after MD conversion)
    production_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "artifacts",
        "production"
    )
    
    # Chapter mapping: file -> chapter_id
    chapters = [
        ("chuong_1.json", 1, "Chương I: Mệnh đề và Tập hợp"),
        ("chuong_2.json", 2, "Chương II: Bất phương trình"),
        ("chuong_3.json", 3, "Chương III: Góc lượng giác và Hệ thức lượng"),
        ("chuong_4.json", 4, "Chương IV: Vectơ"),
        ("chuong_5.json", 5, "Chương V: Phương trình đường thẳng và đường tròn"),
    ]
    
    all_questions = []
    
    # Load exactly questions_per_chapter from each chapter
    for chapter_file, chapter_id, chapter_name in chapters:
        file_path = os.path.join(production_dir, chapter_file)
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Filter valid MCQ questions
            questions = [
                item for item in data
                if (
                    item.get("type") == "question" 
                    and item.get("answer")
                    and isinstance(item.get("answer"), dict)
                    and item.get("answer_type") in ["mcq", "multiple_choice"]
                    and isinstance(item.get("options"), list)
                    and len(item.get("options", [])) >= 3
                    and item.get("answer", {}).get("correct", "").upper() in "ABCDEFGH"
                )
            ]
            
            print(f"📊 {chapter_file}: Found {len(questions)} valid MCQ questions")
            
            # Randomly select questions_per_chapter questions
            if len(questions) >= questions_per_chapter:
                selected = random.sample(questions, questions_per_chapter)
            else:
                selected = questions  # Use all if not enough
                print(f"⚠️  Only {len(questions)} questions available for chapter {chapter_id}")
            
            # Add chapter metadata to each question
            for q in selected:
                q["chapter_id"] = chapter_id
                q["chapter_name"] = chapter_name
            
            all_questions.extend(selected)
            print(f"✅ Selected {len(selected)} questions from {chapter_name}")
        
        except Exception as e:
            print(f"⚠️  Error loading chapter {chapter_file}: {e}")
            continue
    
    print(f"✅ Total selected: {len(all_questions)} questions (target: {5 * questions_per_chapter})")
    
    # Shuffle to mix chapters
    random.shuffle(all_questions)
    
    return all_questions


def format_placement_question(item: Dict[str, Any], index: int) -> Dict[str, Any]:
    """
    Format question cho placement test.
    
    Args:
        item: Raw question data from JSON (with chapter_id added)
        index: Question index (0-based)
    
    Returns:
        Formatted question
    """
    text = item.get("text", "")
    options = item.get("options")
    answer = item.get("answer", {})
    answer_type = item.get("answer_type", "open")
    
    # Determine if MCQ
    has_valid_options = (
        isinstance(options, list) 
        and len(options) >= 2
        and answer_type in ["mcq", "multiple_choice"]
    )
    
    formatted = {
        "id": f"pt_q{index + 1}",
        "question_number": index + 1,
        "text": text,
        "type": "mcq" if has_valid_options else "open",
        "chapter": item.get("chapter_name", "Unknown"),
        "chapter_id": item.get("chapter_id", 0),  # ✅ Track chapter ID (1-5)
    }
    
    if has_valid_options:
        formatted["options"] = options
        # Store correct answer for validation (not sent to client)
        correct = answer.get("correct", "")
        if correct and len(correct) == 1 and correct.upper() in "ABCDEFGH":
            formatted["_correct_index"] = ord(correct.upper()) - ord('A')
            formatted["_correct_letter"] = correct.upper()
    
    # Store answer details (not sent to client initially)
    if isinstance(answer, dict):
        formatted["_answer_data"] = {
            "correct": answer.get("correct", ""),
            "explanation": answer.get("explanation", ""),
            "solution_steps": answer.get("solution_steps", []),
            "key_concepts": answer.get("key_concepts", []),
            "difficulty_level": answer.get("difficulty_level", "medium"),
        }
    
    return formatted


def evaluate_placement_test(
    questions: List[Dict[str, Any]],
    answers: Dict[str, str]
) -> Dict[str, Any]:
    """
    Đánh giá kết quả placement test và xác định trình độ học sinh.
    
    Args:
        questions: List of placement test questions (with _correct_index and chapter_id)
        answers: Dict mapping question_id -> student_answer
    
    Returns:
        Evaluation result với level, score, strengths, weaknesses, và chapter_results
    """
    total_questions = len(questions)
    correct_count = 0
    incorrect_questions = []
    correct_questions = []
    chapter_performance = {}  # By chapter_id (1-5)
    chapter_id_performance = {}  # For diagnostic_results
    
    for question in questions:
        q_id = question["id"]
        student_answer = answers.get(q_id, "").strip()
        chapter = question.get("chapter", "Unknown")
        chapter_id = question.get("chapter_id", 0)
        
        # Initialize chapter tracking (by name for display)
        if chapter not in chapter_performance:
            chapter_performance[chapter] = {"total": 0, "correct": 0, "chapter_id": chapter_id}
        
        # Initialize chapter_id tracking (for diagnostic_results)
        if chapter_id not in chapter_id_performance:
            chapter_id_performance[chapter_id] = {"total": 0, "correct": 0}
        
        chapter_performance[chapter]["total"] += 1
        chapter_id_performance[chapter_id]["total"] += 1
        
        # MCQ: compare with correct letter
        is_correct = False
        correct_letter = question.get("_correct_letter", "")
        if student_answer.upper() == correct_letter:
            is_correct = True
        
        if is_correct:
            correct_count += 1
            chapter_performance[chapter]["correct"] += 1
            chapter_id_performance[chapter_id]["correct"] += 1
            correct_questions.append({
                "id": q_id,
                "chapter": chapter,
                "chapter_id": chapter_id,
                "text": question["text"][:100] + "...",
            })
        else:
            incorrect_questions.append({
                "id": q_id,
                "chapter": chapter,
                "text": question["text"][:100] + "...",
                "student_answer": student_answer,
                "correct_answer": question.get("_answer_data", {}).get("correct", ""),
                "explanation": question.get("_answer_data", {}).get("explanation", ""),
            })
    
    # Calculate score
    score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    
    # Determine level
    if score >= 80:
        level = "advanced"
        level_name = "Khá - Giỏi"
        recommendation = "Bạn có nền tảng vững vàng! Nên tập trung vào các bài tập nâng cao và chuyên sâu."
    elif score >= 60:
        level = "intermediate"
        level_name = "Trung bình - Khá"
        recommendation = "Bạn đã nắm được kiến thức cơ bản. Hãy luyện tập thêm để củng cố và nâng cao."
    elif score >= 40:
        level = "beginner"
        level_name = "Cơ bản"
        recommendation = "Bạn cần ôn lại kiến thức cơ bản. Hãy bắt đầu với các bài tập đơn giản và tăng dần độ khó."
    else:
        level = "foundation"
        level_name = "Nền tảng"
        recommendation = "Bạn nên bắt đầu từ các kiến thức nền tảng. Đừng lo lắng, mọi người đều bắt đầu từ đây!"
    
    # Identify strengths and weaknesses
    strengths = []
    weaknesses = []
    
    for chapter, perf in chapter_performance.items():
        chapter_score = (perf["correct"] / perf["total"]) * 100 if perf["total"] > 0 else 0
        
        if chapter_score >= 70:
            strengths.append({
                "chapter": chapter,
                "chapter_id": perf["chapter_id"],
                "score": round(chapter_score, 1),
                "correct": perf["correct"],
                "total": perf["total"],
            })
        elif chapter_score < 50:
            weaknesses.append({
                "chapter": chapter,
                "chapter_id": perf["chapter_id"],
                "score": round(chapter_score, 1),
                "correct": perf["correct"],
                "total": perf["total"],
            })
    
    # Build chapter_results for diagnostic_results table (keyed by chapter_id 1-5)
    chapter_results = []
    for chapter_id, perf in chapter_id_performance.items():
        if perf["total"] > 0:
            percent = (perf["correct"] / perf["total"]) * 100
            chapter_results.append({
                "chapter_id": chapter_id,
                "total_questions": perf["total"],
                "correct": perf["correct"],
                "percent": round(percent, 2),
            })
    
    # Build question reviews for frontend display
    question_reviews = []
    for question in questions:
        q_id = question["id"]
        student_answer = answers.get(q_id, "").strip()
        correct_letter = question.get("_correct_letter", "")
        is_correct = (student_answer.upper() == correct_letter)
        answer_data = question.get("_answer_data", {})
        
        question_reviews.append({
            "question": {
                "id": q_id,
                "question_number": question["question_number"],
                "text": question["text"],
                "type": question["type"],
                "chapter": question["chapter"],
                "chapter_id": question.get("chapter_id", 0),
                "options": question.get("options", []),
            },
            "student_answer": student_answer,
            "correct_answer": correct_letter,
            "is_correct": is_correct,
            "explanation": answer_data.get("explanation", ""),
            "solution_steps": answer_data.get("solution_steps", []),
            "key_concepts": answer_data.get("key_concepts", []),
        })
    
    return {
        "total_questions": total_questions,
        "correct_count": correct_count,
        "incorrect_count": total_questions - correct_count,
        "score": round(score, 2),
        "level": level,
        "level_name": level_name,
        "recommendation": recommendation,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "chapter_performance": [
            {
                "chapter": ch,
                "chapter_id": perf["chapter_id"],
                "correct": perf["correct"],
                "total": perf["total"],
                "score": round((perf["correct"] / perf["total"]) * 100, 1) if perf["total"] > 0 else 0,
            }
            for ch, perf in chapter_performance.items()
        ],
        "chapter_results": chapter_results,  # ✅ For diagnostic_results table
        "incorrect_questions": incorrect_questions[:5],  # Top 5 for review
        "question_reviews": question_reviews,  # ✅ Full question reviews for detailed display
        "evaluated_at": datetime.utcnow().isoformat(),
    }


def generate_placement_test(questions_per_chapter: int = 4) -> Dict[str, Any]:
    """
    Generate complete placement test: 4 câu x 5 chương = 20 câu.
    
    Args:
        questions_per_chapter: Number of questions per chapter (default: 4)
    
    Returns:
        Placement test với questions và metadata
    """
    raw_questions = load_placement_test_questions(questions_per_chapter)
    
    formatted_questions = []
    for idx, q in enumerate(raw_questions):
        formatted = format_placement_question(q, idx)
        formatted_questions.append(formatted)
    
    # Separate client questions (without answers) and full questions (for evaluation)
    client_questions = []
    for q in formatted_questions:
        client_q = {
            "id": q["id"],
            "question_number": q["question_number"],
            "text": q["text"],
            "type": q["type"],
            "chapter": q["chapter"],
            "chapter_id": q["chapter_id"],
        }
        if q["type"] == "mcq":
            client_q["options"] = q["options"]
        
        client_questions.append(client_q)
    
    return {
        "test_id": f"placement_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        "num_questions": len(formatted_questions),
        "time_limit_minutes": 30,
        "questions": client_questions,
        "_full_questions": formatted_questions,  # For server-side evaluation
        "instructions": (
            "Bài kiểm tra đánh giá trình độ này gồm {} câu hỏi (4 câu mỗi chương) từ tất cả 5 chương Toán 10. "
            "Hãy cố gắng trả lời các câu hỏi một cách chính xác nhất. "
            "Kết quả sẽ giúp chúng tôi xác định điểm mạnh/yếu và đề xuất bài tập phù hợp."
        ).format(len(formatted_questions)),
    }

