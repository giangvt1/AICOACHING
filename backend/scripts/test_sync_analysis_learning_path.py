"""
Test script to verify Analysis and Learning Path synchronization
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import Student, DiagnosticResult, LearningPathItem

db = SessionLocal()

print("=" * 70)
print("Testing Analysis & Learning Path Synchronization")
print("=" * 70)

# Get a student with diagnostic results
student = db.query(Student).join(DiagnosticResult).first()

if not student:
    print("\nNo student with diagnostic results found!")
    print("Please run placement test first.")
    db.close()
    sys.exit(1)

print(f"\nStudent: {student.email} (ID: {student.id})")

# Get diagnostic results
diag_results = db.query(DiagnosticResult).filter(
    DiagnosticResult.student_id == student.id
).all()

print(f"\n{'='*70}")
print("1. DIAGNOSTIC RESULTS")
print(f"{'='*70}")
for dr in diag_results:
    print(f"  Chapter {dr.topic_id}: {dr.correct}/{dr.total_questions} = {dr.percent:.1f}%")

# Calculate priorities (same as analysis.py)
print(f"\n{'='*70}")
print("2. ANALYSIS PRIORITY CALCULATION")
print(f"{'='*70}")
priorities = []
for dr in diag_results:
    priority = 100.0 - dr.percent
    priorities.append((dr.topic_id, dr.percent, priority))

# Sort by priority (weakest first)
priorities.sort(key=lambda x: x[2], reverse=True)

print("\nPriority Order (weakest to strongest):")
for chapter_id, percent, priority in priorities:
    print(f"  Chapter {chapter_id}: {percent:.1f}% (priority: {priority:.1f})")

# Get learning path
learning_path = db.query(LearningPathItem).filter(
    LearningPathItem.student_id == student.id
).order_by(LearningPathItem.priority_rank.asc()).all()

print(f"\n{'='*70}")
print("3. LEARNING PATH")
print(f"{'='*70}")
if learning_path:
    for item in learning_path:
        # Get diagnostic result for this chapter
        dr = next((d for d in diag_results if d.topic_id == item.topic_id), None)
        percent_str = f"{dr.percent:.1f}%" if dr else "N/A"
        print(f"  Rank {item.priority_rank}: Chapter {item.topic_id} ({item.phase}) - {percent_str}")
else:
    print("  No learning path generated yet!")
    print("  Generate learning path: POST /learning-path/generate")

# Verify synchronization
print(f"\n{'='*70}")
print("4. VERIFICATION")
print(f"{'='*70}")

if learning_path:
    expected_order = [ch_id for ch_id, _, _ in priorities]
    actual_order = [item.topic_id for item in learning_path]
    
    print(f"\nExpected order (from Analysis): {expected_order}")
    print(f"Actual order (from Learning Path): {actual_order}")
    
    if expected_order == actual_order:
        print("\n✅ SYNCHRONIZED! Analysis and Learning Path match perfectly!")
    else:
        print("\n❌ NOT SYNCHRONIZED! Orders don't match!")
        print("\nDifferences:")
        for i, (exp, act) in enumerate(zip(expected_order, actual_order)):
            if exp != act:
                print(f"  Position {i+1}: Expected Chapter {exp}, Got Chapter {act}")
else:
    print("\n⚠️  Cannot verify - Learning path not generated yet")
    print("   Please generate learning path first")

# Check phase distribution
if learning_path:
    print(f"\n{'='*70}")
    print("5. PHASE DISTRIBUTION")
    print(f"{'='*70}")
    
    phase_count = {}
    for item in learning_path:
        phase_count[item.phase] = phase_count.get(item.phase, 0) + 1
    
    print("\nPhases:")
    for phase, count in sorted(phase_count.items()):
        print(f"  {phase}: {count} chapter(s)")
    
    print("\nExpected:")
    print("  foundation: 2 chapters (weakest)")
    print("  focus: 2 chapters (middle)")
    print("  review: 1 chapter (strongest)")

print(f"\n{'='*70}")

db.close()

