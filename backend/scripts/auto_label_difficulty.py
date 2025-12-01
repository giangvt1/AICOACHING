"""
Auto-label difficulty for all questions using Gemini AI
Phân loại độ khó tự động cho 471 câu hỏi Toán 10
"""

import json
import os
import sys
import time
from typing import Dict, Any, List

# Add parent directory to path to import config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Load .env file from both locations
from dotenv import load_dotenv
backend_dir = os.path.dirname(os.path.dirname(__file__))
app_dir = os.path.join(backend_dir, "app")

# Load from backend/.env first, then backend/app/.env (override)
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv(os.path.join(app_dir, ".env"))

import google.generativeai as genai

# Configure Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    print("❌ GOOGLE_API_KEY not found in environment")
    print("💡 Please set it in backend/app/.env file:")
    print("   GOOGLE_API_KEY=your-api-key-here")
    sys.exit(1)

print(f"✅ Found GOOGLE_API_KEY: {GOOGLE_API_KEY[:20]}...")
genai.configure(api_key=GOOGLE_API_KEY)

# Use gemini-2.5-flash-lite for better quota and quality
model = genai.GenerativeModel("gemini-2.5-flash-lite")

# System prompt for difficulty classification
SYSTEM_PROMPT = """Bạn là giáo viên Toán chuyên nghiệp, chuyên đánh giá độ khó của câu hỏi trắc nghiệm Toán lớp 10.

NHIỆM VỤ: Phân tích câu hỏi và đánh giá độ khó từ 1-5.

TIÊU CHÍ ĐÁNH GIÁ:

**Độ khó 1 (Very Easy):**
- Nhận biết định nghĩa cơ bản
- Nhớ công thức đơn giản
- Ví dụ: "Phủ định của mệnh đề là gì?", "Công thức sin(a+b) = ?"

**Độ khó 2 (Easy):**
- Vận dụng trực tiếp công thức/định nghĩa
- 1 bước tính toán đơn giản
- Ví dụ: "Tính sin(30°)", "Tìm phủ định của mệnh đề đã cho"

**Độ khó 3 (Medium):**
- Vận dụng công thức qua 2-3 bước
- Kết hợp 1-2 kiến thức
- Ví dụ: "Giải bất phương trình bậc nhất", "Tính góc trong tam giác"

**Độ khó 4 (Hard):**
- Kết hợp nhiều kiến thức khác nhau
- Suy luận logic phức tạp
- Cần biến đổi hoặc chứng minh
- Ví dụ: "Chứng minh tính chất vectơ", "Giải hệ bất phương trình phức tạp"

**Độ khó 5 (Very Hard):**
- Tích hợp nhiều chương
- Suy luận cao cấp, bài toán tổng hợp
- Cần kỹ thuật đặc biệt
- Ví dụ: "Bài toán hình học kết hợp vectơ và lượng giác", "Chứng minh nâng cao"

ĐỊNH DẠNG TRẢ LỜI:
```json
{
  "difficulty": <số từ 1-5>,
  "difficulty_label": "<easy|medium|hard|very_hard>",
  "reasoning": "<giải thích ngắn gọn 1 câu>"
}
```

CHÚ Ý:
- Chỉ trả về JSON, không giải thích thêm
- reasoning: tiếng Việt, ngắn gọn
- Phân bố cân đối: 20% easy, 40% medium, 30% hard, 10% very_hard
"""


def classify_difficulty(question_text: str, options: List[str], explanation: str, max_retries: int = 3) -> Dict[str, Any]:
    """
    Use Gemini to classify difficulty of a question with retry logic.
    
    Args:
        question_text: Câu hỏi
        options: Các đáp án
        explanation: Lời giải
        max_retries: Number of retry attempts on failure
    
    Returns:
        Dict with difficulty, difficulty_label, reasoning
    """
    # Build prompt
    options_text = "\n".join([f"{chr(65+i)}. {opt}" for i, opt in enumerate(options)])
    
    prompt = f"""Phân loại độ khó cho câu hỏi sau:

CÂU HỎI:
{question_text}

CÁC ĐÁP ÁN:
{options_text}

LỜI GIẢI:
{explanation[:500]}...

Trả về JSON theo format đã cho."""

    # Retry loop
    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                f"{SYSTEM_PROMPT}\n\n{prompt}",
                generation_config={"temperature": 0.1}
            )
            
            result_text = response.text.strip()
            
            # Extract JSON from markdown code block if present
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(result_text)
            
            # Validate result
            if "difficulty" not in result or "difficulty_label" not in result:
                if attempt < max_retries - 1:
                    print(f"⚠️  Invalid format, retry {attempt + 1}/{max_retries}...")
                    time.sleep(2)
                    continue
                else:
                    print(f"⚠️  Invalid response format after {max_retries} attempts, using default")
                    return {"difficulty": 3, "difficulty_label": "medium", "reasoning": "Default (invalid format)"}
            
            # Map difficulty number to label
            label_map = {1: "easy", 2: "easy", 3: "medium", 4: "hard", 5: "very_hard"}
            expected_label = label_map.get(result["difficulty"], "medium")
            
            # Override label if mismatch
            if result["difficulty_label"] != expected_label:
                result["difficulty_label"] = expected_label
            
            return result
            
        except json.JSONDecodeError as e:
            if attempt < max_retries - 1:
                print(f"⚠️  JSON parse error, retry {attempt + 1}/{max_retries}...")
                time.sleep(2)
                continue
            else:
                print(f"⚠️  JSON error after {max_retries} attempts: {e}")
                return {"difficulty": 3, "difficulty_label": "medium", "reasoning": "Default (JSON error)"}
        
        except Exception as e:
            error_msg = str(e)
            
            # Check if rate limit error
            if "429" in error_msg or "quota" in error_msg.lower():
                if attempt < max_retries - 1:
                    # Extract retry delay from error if available
                    retry_delay = 60  # Default 60s
                    if "retry_delay" in error_msg:
                        try:
                            # Try to extract seconds from error message
                            import re
                            match = re.search(r'seconds[:\s]+(\d+)', error_msg)
                            if match:
                                retry_delay = int(match.group(1)) + 5  # Add 5s buffer
                        except:
                            pass
                    
                    print(f"⚠️  Rate limit hit, waiting {retry_delay}s before retry {attempt + 1}/{max_retries}...")
                    time.sleep(retry_delay)
                    continue
                else:
                    print(f"⚠️  Rate limit after {max_retries} attempts")
                    return {"difficulty": 3, "difficulty_label": "medium", "reasoning": "Default (rate limit)"}
            
            # Other errors
            if attempt < max_retries - 1:
                print(f"⚠️  Error: {str(e)[:50]}..., retry {attempt + 1}/{max_retries}...")
                time.sleep(3)
                continue
            else:
                print(f"⚠️  Error after {max_retries} attempts: {str(e)[:50]}...")
                return {"difficulty": 3, "difficulty_label": "medium", "reasoning": "Default (error)"}
    
    # Should not reach here, but just in case
    return {"difficulty": 3, "difficulty_label": "medium", "reasoning": "Default (fallback)"}


def process_chapter_file(input_path: str, output_path: str, chapter_name: str):
    """
    Process one chapter JSON file to add difficulty labels.
    
    Args:
        input_path: Input JSON file path
        output_path: Output JSON file path
        chapter_name: Chapter name for logging
    """
    print(f"\n{'='*80}")
    print(f"📚 Processing: {chapter_name}")
    print(f"{'='*80}\n")
    
    # Load questions
    with open(input_path, "r", encoding="utf-8") as f:
        questions = json.load(f)
    
    total = len(questions)
    print(f"📊 Total questions: {total}\n")
    
    # Statistics
    stats = {"easy": 0, "medium": 0, "hard": 0, "very_hard": 0}
    
    # Process each question
    for idx, q in enumerate(questions, 1):
        q_id = q.get("id", f"q{idx}")
        text = q.get("text", "")
        options = q.get("options", [])
        answer = q.get("answer", {})
        explanation = answer.get("explanation", "")
        
        # Skip if not MCQ
        if not options or not text:
            print(f"⏭️  [{idx}/{total}] {q_id}: Skipped (not MCQ)")
            continue
        
        # Classify difficulty
        print(f"🔍 [{idx}/{total}] {q_id}: Analyzing...", end=" ")
        
        classification = classify_difficulty(text, options, explanation)
        
        # Update answer with difficulty
        answer["difficulty_level"] = classification["difficulty_label"]
        answer["difficulty_number"] = classification["difficulty"]
        answer["difficulty_reasoning"] = classification["reasoning"]
        
        q["answer"] = answer
        
        # Update stats
        stats[classification["difficulty_label"]] += 1
        
        # Print result
        diff_emoji = {
            "easy": "🟢",
            "medium": "🟡", 
            "hard": "🔴",
            "very_hard": "🔴🔴"
        }
        emoji = diff_emoji.get(classification["difficulty_label"], "⚪")
        print(f"{emoji} {classification['difficulty_label']} ({classification['difficulty']}) - {classification['reasoning'][:50]}...")
        
        # Rate limiting with larger delay to avoid quota issues
        # gemini-1.5-flash: 60 RPM = 1 request/second safe
        if idx % 10 == 0:
            print(f"\n⏸️  Processed {idx}/{total}, pausing 5s to respect rate limits...\n")
            time.sleep(5)
        else:
            time.sleep(1.5)  # 1.5s between requests = ~40 RPM (safe margin)
    
    # Save updated questions
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    # Print statistics
    print(f"\n{'='*80}")
    print(f"✅ Completed: {chapter_name}")
    print(f"{'='*80}")
    print(f"\n📊 Difficulty Distribution:")
    print(f"   🟢 Easy:       {stats['easy']:3d} ({stats['easy']/total*100:5.1f}%)")
    print(f"   🟡 Medium:     {stats['medium']:3d} ({stats['medium']/total*100:5.1f}%)")
    print(f"   🔴 Hard:       {stats['hard']:3d} ({stats['hard']/total*100:5.1f}%)")
    print(f"   🔴🔴 Very Hard: {stats['very_hard']:3d} ({stats['very_hard']/total*100:5.1f}%)")
    print(f"\n💾 Saved to: {output_path}\n")


def main():
    """Main function to process all chapters."""
    print("\n" + "="*80)
    print("🤖 AUTO-LABEL DIFFICULTY FOR ALL QUESTIONS")
    print("="*80 + "\n")
    
    # Define chapters
    base_dir = os.path.join(os.path.dirname(__file__), "..", "artifacts", "production")
    
    chapters = [
        ("chuong_1.json", "Chương I: Mệnh đề và Tập hợp"),
        ("chuong_2.json", "Chương II: Bất phương trình"),
        ("chuong_3.json", "Chương III: Góc lượng giác và Hệ thức lượng"),
        ("chuong_4.json", "Chương IV: Vectơ"),
        ("chuong_5.json", "Chương V: Phương trình đường thẳng và đường tròn"),
    ]
    
    # Process each chapter
    total_questions = 0
    for filename, chapter_name in chapters:
        input_path = os.path.join(base_dir, filename)
        output_path = os.path.join(base_dir, filename)  # Overwrite same file
        
        # Backup original file
        backup_path = os.path.join(base_dir, f"{filename}.backup")
        if not os.path.exists(backup_path):
            with open(input_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            with open(backup_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"💾 Backup created: {backup_path}\n")
        
        process_chapter_file(input_path, output_path, chapter_name)
        
        # Count questions
        with open(output_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            total_questions += len(data)
    
    # Final summary
    print("\n" + "="*80)
    print("🎉 ALL CHAPTERS COMPLETED!")
    print("="*80)
    print(f"\n✅ Total questions labeled: {total_questions}")
    print(f"\n💡 Next steps:")
    print(f"   1. Review the labeled questions")
    print(f"   2. Update artifact_loader.py to read difficulty_level")
    print(f"   3. Test with different difficulty filters")
    print(f"\n🔄 To restore backup: cp *.backup *.json")
    print("="*80 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

