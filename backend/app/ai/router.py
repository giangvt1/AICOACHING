from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from ..dependencies import get_current_student, get_db
from ..models import Student, PlacementTestResult
from .schemas import (
    GenerateExercisesRequest,
    GenerateExercisesResponse,
    ExerciseSet,
    ExerciseItem,
    PlacementTest,
    PlacementTestQuestion,
    PlacementTestSubmission,
    PlacementTestResult,
)
from .generator import generate_exercises, save_exercise_set, list_user_sets, load_user_set
from .placement import generate_placement_test, evaluate_placement_test

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/generate-exercises", response_model=GenerateExercisesResponse)
def api_generate_exercises(req: GenerateExercisesRequest, current: Student = Depends(get_current_student)):
    try:
        items_raw, contexts, model_used = generate_exercises(
            topic=req.topic,
            n=req.n,
            difficulty=req.difficulty,
            fmt=req.format,
            top_k=req.top_k,
        )
        # Convert to schema
        items: List[ExerciseItem] = [ExerciseItem(**it) for it in items_raw]
        # Save to JSON store
        path, doc = save_exercise_set(
            user_id=current.id,
            topic=req.topic,
            difficulty=req.difficulty,
            fmt=req.format,
            items=[it.dict() for it in items],
            contexts=contexts,
            model_used=model_used,
        )
        ex_set = ExerciseSet(
            id=doc["id"],
            user_id=current.id,
            topic=req.topic,
            difficulty=req.difficulty,
            format=req.format,
            items=items,
            contexts=contexts,
            used_model=model_used,
            saved_path=path,
        )
        return GenerateExercisesResponse(set=ex_set)
    except Exception as e:
        print(f"Error generating exercises: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate exercises: {str(e)}")


@router.get("/exercises")
def api_list_sets(current: Student = Depends(get_current_student)):
    return list_user_sets(current.id)


@router.get("/exercises/{set_id}")
def api_get_set(set_id: str, current: Student = Depends(get_current_student)):
    doc = load_user_set(current.id, set_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc


# ============= Placement Test Endpoints =============

# In-memory storage for placement tests (should be moved to DB in production)
_placement_tests = {}


@router.post("/placement-test/generate", response_model=PlacementTest)
def api_generate_placement_test(
    questions_per_chapter: int = 4,
    current: Student = Depends(get_current_student)
):
    """
    Generate initial placement test for student.
    Default: 20 questions (4 questions per chapter x 5 chapters).
    
    Args:
        questions_per_chapter: Questions per chapter (default: 4, total: 20)
    
    Returns:
        PlacementTest with questions (without answers)
    """
    try:
        test_data = generate_placement_test(questions_per_chapter)
        
        # Store full test data (with answers) for later evaluation
        test_id = test_data["test_id"]
        _placement_tests[test_id] = test_data
        
        # Return only client-facing data (without answers)
        return PlacementTest(
            test_id=test_id,
            num_questions=test_data["num_questions"],
            time_limit_minutes=test_data["time_limit_minutes"],
            questions=[PlacementTestQuestion(**q) for q in test_data["questions"]],
            instructions=test_data["instructions"],
        )
    except Exception as e:
        print(f"Error generating placement test: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate placement test: {str(e)}")


@router.get("/placement-test/status")
def api_check_placement_test_status(
    current: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Check if student has taken placement test.
    
    Returns:
        Latest placement test result or 404 if not found
    """
    from ..models import PlacementTestResult as DBPlacementTestResult
    
    result = db.query(DBPlacementTestResult)\
        .filter(DBPlacementTestResult.student_id == current.id)\
        .order_by(DBPlacementTestResult.taken_at.desc())\
        .first()
    
    if not result:
        raise HTTPException(status_code=404, detail="No placement test found")
    
    return {
        "test_id": result.test_id,
        "score": result.score,
        "level": result.level,
        "level_name": result.level_name,
        "taken_at": result.taken_at.isoformat() if result.taken_at else None
    }


@router.post("/placement-test/submit", response_model=PlacementTestResult)
def api_submit_placement_test(
    submission: PlacementTestSubmission,
    current: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Submit placement test answers and get evaluation.
    
    Args:
        submission: Test ID and answers
        current: Current authenticated student
        db: Database session
    
    Returns:
        PlacementTestResult with score, level, and recommendations
    """
    try:
        test_id = submission.test_id
        
        # Retrieve stored test data
        if test_id not in _placement_tests:
            raise HTTPException(status_code=404, detail="Test not found or expired")
        
        test_data = _placement_tests[test_id]
        full_questions = test_data["_full_questions"]
        
        # Evaluate answers
        result = evaluate_placement_test(full_questions, submission.answers)
        
        # 1. Save to placement_test_results table
        from ..models import PlacementTestResult as DBPlacementTestResult
        
        db_result = DBPlacementTestResult(
            student_id=current.id,
            test_id=test_id,
            total_questions=result["total_questions"],
            correct_count=result["correct_count"],
            score=result["score"],
            level=result["level"],
            level_name=result["level_name"],
            recommendation=result["recommendation"],
            chapter_performance=json.dumps(result["chapter_performance"], ensure_ascii=False),
            strengths=json.dumps(result["strengths"], ensure_ascii=False),
            weaknesses=json.dumps(result["weaknesses"], ensure_ascii=False),
        )
        
        db.add(db_result)
        
        # 2. ✅ Save to diagnostic_results table (for each chapter)
        from ..models import DiagnosticResult
        
        for chapter_result in result.get("chapter_results", []):
            chapter_id = chapter_result["chapter_id"]
            
            # Check if diagnostic result already exists for this chapter
            existing = db.query(DiagnosticResult).filter(
                DiagnosticResult.student_id == current.id,
                DiagnosticResult.topic_id == chapter_id
            ).first()
            
            if existing:
                # Update existing
                existing.total_questions = chapter_result["total_questions"]
                existing.correct = chapter_result["correct"]
                existing.percent = chapter_result["percent"]
                # Note: mastery_level is calculated dynamically in analysis, not stored
                db.add(existing)
                print(f"📝 Updated diagnostic result for chapter {chapter_id}: {chapter_result['percent']}%")
            else:
                # Create new
                diagnostic = DiagnosticResult(
                    student_id=current.id,
                    topic_id=chapter_id,  # Store chapter_id (1-5)
                    total_questions=chapter_result["total_questions"],
                    correct=chapter_result["correct"],
                    percent=chapter_result["percent"],
                    # Note: mastery_level is calculated dynamically in analysis, not stored
                )
                db.add(diagnostic)
                print(f"✅ Created diagnostic result for chapter {chapter_id}: {chapter_result['percent']}%")
        
        db.commit()
        db.refresh(db_result)
        
        print(f"✅ Saved placement test result for student {current.id}, level: {result['level']}")
        print(f"✅ Saved {len(result.get('chapter_results', []))} diagnostic results")
        
        # Clean up (optional, can keep for review)
        # del _placement_tests[test_id]
        
        # Return the result dict directly (matches PlacementTestResult schema)
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error evaluating placement test: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to evaluate placement test: {str(e)}")
