"""
Load exercises from artifacts/json folder.
"""
from __future__ import annotations
import os
import json
import random
from typing import List, Dict, Any, Optional


# Map topic names (from database) to chapter files (user-provided MCQs)
# 🎯 USING PRODUCTION FOLDER (471 MCQs from MD files)
TOPIC_TO_FILES: Dict[str, List[str]] = {
    # Chương I: Mệnh đề và Tập hợp (99 MCQs)
    "Mệnh đề": ["chuong_1.json"],
    "Mệnh đề – Tập hợp": ["chuong_1.json"],
    "Tập hợp": ["chuong_1.json"],
    "Tập hợp – Các phép toán": ["chuong_1.json"],
    "Ôn tập Chương I": ["chuong_1.json"],
    
    # Chương II: Bất phương trình (100 MCQs)
    "Bất phương trình": ["chuong_2.json"],
    "Hệ bất phương trình": ["chuong_2.json"],
    "Bất phương trình - Hệ bất phương trình": ["chuong_2.json"],
    "Ôn tập Chương II": ["chuong_2.json"],
    
    # Chương III: Góc lượng giác và Hệ thức lượng (101 MCQs)
    "Giá trị lượng giác": ["chuong_3.json"],
    "Góc lượng giác": ["chuong_3.json"],
    "Định lý côsin": ["chuong_3.json"],
    "Định lý sin": ["chuong_3.json"],
    "Giải tam giác": ["chuong_3.json"],
    "Hệ thức lượng giác": ["chuong_3.json"],
    "Ôn tập Chương III": ["chuong_3.json"],
    
    # Chương IV: Vectơ (71 MCQs)
    "Khái niệm vectơ": ["chuong_4.json"],
    "Vectơ": ["chuong_4.json"],
    "Tổng và hiệu vectơ": ["chuong_4.json"],
    "Tích vectơ với số": ["chuong_4.json"],
    "Tích vô hướng": ["chuong_4.json"],
    "Tọa độ vectơ": ["chuong_4.json"],
    "Vectơ và ứng dụng": ["chuong_4.json"],
    "Ôn tập Chương IV": ["chuong_4.json"],
    
    # Chương V: Phương trình đường thẳng và đường tròn (100 MCQs)
    "Phương trình đường thẳng": ["chuong_5.json"],
    "Phương trình đường tròn": ["chuong_5.json"],
    "Đường thẳng": ["chuong_5.json"],
    "Đường tròn": ["chuong_5.json"],
    "Elip": ["chuong_5.json"],
    "Ôn tập Chương V": ["chuong_5.json"],
    
    # Generic fallbacks
    "Hàm số – Đồ thị": ["chuong_1.json"],  # Fallback to chapter 1
}


def get_artifacts_base_path() -> str:
    """Get the base path to artifacts/production folder (user-provided MCQs)."""
    current_dir = os.path.dirname(__file__)
    artifacts_path = os.path.join(current_dir, "..", "..", "artifacts", "production")
    return os.path.abspath(artifacts_path)


def find_topic_files(topic: str) -> Optional[List[str]]:
    """Find the list of JSON files for a given topic."""
    base_path = get_artifacts_base_path()
    
    # Try exact match from mapping
    if topic in TOPIC_TO_FILES:
        file_names = TOPIC_TO_FILES[topic]
        # Verify files exist
        file_paths = []
        for file_name in file_names:
            file_path = os.path.join(base_path, file_name)
            if os.path.exists(file_path):
                file_paths.append(file_path)
        if file_paths:
            return file_paths
    
    # Try fuzzy match (case-insensitive, partial match)
    topic_lower = topic.lower()
    for mapped_topic, file_names in TOPIC_TO_FILES.items():
        if topic_lower in mapped_topic.lower() or mapped_topic.lower() in topic_lower:
            file_paths = []
            for file_name in file_names:
                file_path = os.path.join(base_path, file_name)
                if os.path.exists(file_path):
                    file_paths.append(file_path)
            if file_paths:
                return file_paths
    
    return None


def load_questions_from_files(file_paths: List[str], auto_generate_answers: bool = False) -> List[Dict[str, Any]]:
    """
    Load and merge questions from multiple JSON files.
    
    Args:
        file_paths: List of paths to JSON files
        auto_generate_answers: If True, auto-generate answers for questions without answers (SLOW!)
    
    Returns:
        List of questions with answers
    """
    all_questions = []
    
    for file_path in file_paths:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            if not isinstance(data, list):
                continue
            
            # Process each item
            for item in data:
                if not isinstance(item, dict):
                    continue
                
                # Skip theory items
                if item.get("type") == "theory":
                    continue
                
                text = item.get("text", "").strip()
                if not text:
                    continue
                
                options = item.get("options")
                answer_type = item.get("answer_type", "open")
                
                # Determine if it's MCQ with valid options
                has_valid_options = (
                    isinstance(options, list) 
                    and len(options) >= 2 
                    and all(isinstance(opt, str) and opt.strip() for opt in options)
                    and answer_type == "mcq"
                )
                
                # ✅ CHỈ LẤY MCQ - Skip câu tự luận
                if not has_valid_options:
                    continue
                
                # Always MCQ at this point (already filtered above)
                # ✅ Read difficulty from JSON answer data
                answer_data = item.get("answer", {})
                
                # Map difficulty_level string to number (1-5)
                difficulty_map = {
                    "easy": 2,
                    "medium": 3,
                    "hard": 4,
                    "very_hard": 5,
                    "very_easy": 1
                }
                
                # Get difficulty from answer metadata or use number directly
                difficulty_level = answer_data.get("difficulty_level", "medium")
                difficulty_number = answer_data.get("difficulty_number", None)
                
                # Prefer difficulty_number if available, otherwise map from level
                if difficulty_number and isinstance(difficulty_number, int) and 1 <= difficulty_number <= 5:
                    difficulty = difficulty_number
                else:
                    difficulty = difficulty_map.get(difficulty_level, 3)
                
                question = {
                    "question": text,
                    "type": "mcq",
                    "difficulty": difficulty,  # ✅ From JSON metadata
                    "options": [opt.strip() for opt in options],
                }
                
                # Check if answer exists in source data (REQUIRED for MCQ)
                if "answer" in item and item["answer"]:
                    answer = item["answer"]
                    if isinstance(answer, dict):
                        question["solution"] = answer.get("correct", "")
                        question["explanation"] = answer.get("explanation", "")
                        question["solution_steps"] = answer.get("solution_steps", [])
                        question["key_concepts"] = answer.get("key_concepts", [])
                        
                        # For MCQ, extract correct answer letter (REQUIRED)
                        correct = answer.get("correct", "")
                        if correct and len(correct) == 1 and correct.upper() in "ABCDEFGH":
                            question["correct_index"] = ord(correct.upper()) - ord('A')
                            all_questions.append(question)  # ✅ Only add if has valid answer
                        else:
                            # Skip MCQ without valid correct answer
                            continue
                    else:
                        # Skip if answer is not dict
                        continue
                else:
                    # Skip MCQ without answer (no auto-generate for speed)
                    continue
        
        except Exception as e:
            print(f"Error loading questions from {file_path}: {e}")
            continue
    
    return all_questions


def sample_questions(
    questions: List[Dict[str, Any]], 
    n: int, 
    difficulty: int,
    fmt: str
) -> List[Dict[str, Any]]:
    """
    Sample N questions from the pool and transform to exercise format.
    
    Args:
        questions: Pool of questions
        n: Number of questions to sample
        difficulty: Target difficulty (1-5) - adjusts question selection
        fmt: Format ("open", "mcq", "mixed")
    
    Returns:
        List of sampled and transformed questions
    """
    if not questions:
        return []
    
    # Filter by format if needed
    if fmt == "mcq":
        filtered = [q for q in questions if q.get("type") == "mcq"]
    elif fmt == "open":
        filtered = [q for q in questions if q.get("type") == "open"]
    else:  # mixed
        filtered = questions
    
    if not filtered:
        filtered = questions  # Fallback to all if no match
    
    # Random sample (with replacement if not enough questions)
    if len(filtered) >= n:
        sampled = random.sample(filtered, n)
    else:
        # If not enough, sample with replacement
        sampled = random.choices(filtered, k=n)
    
    # Transform to exercise format expected by frontend
    transformed = []
    for q in sampled:
        exercise = {
            "question": q.get("question", ""),  # Already transformed by load_questions_from_files
            "type": q.get("type", "open"),
            "difficulty": difficulty,
        }
        
        # MCQ specific fields
        if exercise["type"] == "mcq":
            exercise["options"] = q.get("options", [])
            exercise["correct_index"] = q.get("correct_index")
        
        # Build comprehensive solution from already-extracted fields
        # (load_questions_from_files already extracted these from answer dict)
        solution_parts = []
        
        # Add explanation if available
        explanation = q.get("explanation", "").strip()
        if explanation:
            solution_parts.append(explanation)
        
        # Add solution steps if available
        solution_steps = q.get("solution_steps", [])
        if solution_steps and isinstance(solution_steps, list) and len(solution_steps) > 0:
            solution_parts.append("\n\n📝 Các bước giải:")
            for i, step in enumerate(solution_steps, 1):
                if step and step.strip():
                    solution_parts.append(f"{i}. {step}")
        
        # Add key concepts if available
        key_concepts = q.get("key_concepts", [])
        if key_concepts and isinstance(key_concepts, list) and len(key_concepts) > 0:
            solution_parts.append("\n\n💡 Khái niệm liên quan:")
            for concept in key_concepts:
                if concept and concept.strip():
                    solution_parts.append(f"• {concept}")
        
        exercise["solution"] = "\n".join(solution_parts) if solution_parts else "Chưa có lời giải chi tiết."
        
        transformed.append(exercise)
    
    return transformed


def load_exercises_from_artifacts(
    topic: str, 
    n: int, 
    difficulty: int, 
    fmt: str
) -> Optional[List[Dict[str, Any]]]:
    """
    Main function to load exercises from artifacts.
    
    Args:
        topic: Topic name (Vietnamese)
        n: Number of exercises
        difficulty: Difficulty level (1-5)
        fmt: Format ("open", "mcq", "mixed")
    
    Returns:
        List of exercises, or None if not found
    """
    file_paths = find_topic_files(topic)
    if not file_paths:
        print(f"No artifact files found for topic: {topic}")
        return None
    
    print(f"Loading questions from {len(file_paths)} file(s): {[os.path.basename(p) for p in file_paths]}")
    questions = load_questions_from_files(file_paths)
    
    if not questions:
        print(f"No questions found in files for topic: {topic}")
        return None
    
    print(f"Found {len(questions)} questions in artifacts")
    sampled = sample_questions(questions, n, difficulty, fmt)
    print(f"Sampled {len(sampled)} questions")
    
    return sampled

