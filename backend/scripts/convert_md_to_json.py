"""
Convert Markdown MCQ files to JSON format
Parse 100 MCQs per chapter from MD files
"""
import json
import re
from pathlib import Path
from typing import List, Dict

def parse_mcq_from_md(md_content: str) -> List[Dict]:
    """Parse MCQ questions from markdown content."""
    questions = []
    
    # Split by "Câu X." pattern (without requiring newline)
    pattern = r'Câu\s+(\d+)\.(.*?)(?=Câu\s+\d+\.|$)'
    matches = re.findall(pattern, md_content, re.DOTALL)
    
    for question_num, content in matches:
        try:
            # Extract question text (before options)
            question_match = re.search(r'^(.*?)(?=[A-D]\.)', content, re.DOTALL)
            if not question_match:
                continue
            
            question_text = question_match.group(1).strip()
            
            # Extract options
            options = []
            for letter in ['A', 'B', 'C', 'D']:
                option_pattern = f'{letter}\\.\\s*"?(.*?)"?\\s*(?=[A-D]\\.|Lời giải|$)'
                option_match = re.search(option_pattern, content, re.DOTALL)
                if option_match:
                    option_text = option_match.group(1).strip().strip('"').strip()
                    options.append(f"{letter}. {option_text}")
            
            if len(options) < 4:
                continue
            
            # Extract correct answer - try multiple patterns
            correct_match = None
            patterns = [
                r'Đáp án đúng:\s*([A-D])\.',  # Pattern 1: Standard
                r'Chọn đáp án\s*\[([A-D])\]',  # Pattern 2: In brackets
                r'Lời giải chi tiết:\s*Đáp án đúng:\s*([A-D])\.',  # Pattern 3: Same line
            ]
            
            for pattern in patterns:
                correct_match = re.search(pattern, content)
                if correct_match:
                    break
            
            if not correct_match:
                continue
            
            correct_letter = correct_match.group(1)
            correct_index = ord(correct_letter) - ord('A')
            
            # Extract explanation
            explanation_pattern = r'Lời giải chi tiết:\s*(.*?)(?=Câu\s+\d+\.|$)'
            explanation_match = re.search(explanation_pattern, content, re.DOTALL)
            explanation = explanation_match.group(1).strip() if explanation_match else ""
            
            # Extract analysis section
            analysis_pattern = r'Phân tích:\s*(.*?)(?=Kết luận:|Câu\s+\d+\.|$)'
            analysis_match = re.search(analysis_pattern, explanation, re.DOTALL)
            analysis = analysis_match.group(1).strip() if analysis_match else explanation
            
            # Create MCQ object
            mcq = {
                'id': f'q{question_num}',
                'type': 'question',
                'text': question_text,
                'options': options,
                'answer_type': 'mcq',
                'correct_index': correct_index,
                'answer': {
                    'correct': correct_letter,
                    'explanation': analysis[:500] if analysis else explanation[:500],  # Limit length
                    'solution_steps': [],
                    'key_concepts': [],
                    'difficulty_level': 'medium',
                    'source': 'user_provided_md'
                }
            }
            
            questions.append(mcq)
            
        except Exception as e:
            print(f"  ⚠️  Error parsing question {question_num}: {e}")
            continue
    
    return questions

def convert_all_md_files():
    """Convert all MD files to JSON."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    question_dir = project_root / 'artifacts' / 'question'
    output_dir = project_root / 'artifacts' / 'production'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    chapter_map = {
        'I': 'chuong_1',
        'II': 'chuong_2',
        'III': 'chuong_3',
        'IV': 'chuong_4',
        'V': 'chuong_5'
    }
    
    print("="*60)
    print("📝 CONVERTING MD TO JSON")
    print("="*60)
    
    total_questions = 0
    
    for roman, chapter_name in chapter_map.items():
        md_file = question_dir / f'{roman}.md'
        
        if not md_file.exists():
            print(f"⚠️  {md_file.name} not found, skipping...")
            continue
        
        print(f"\n📄 Processing {md_file.name}...")
        
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        questions = parse_mcq_from_md(content)
        
        if questions:
            output_file = output_dir / f'{chapter_name}.json'
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(questions, f, ensure_ascii=False, indent=2)
            
            total_questions += len(questions)
            print(f"  ✅ {len(questions)} MCQs converted → {output_file.name}")
        else:
            print(f"  ❌ No questions found in {md_file.name}")
    
    print("\n" + "="*60)
    print(f"🎉 CONVERSION COMPLETE!")
    print(f"✅ Total: {total_questions} MCQs converted")
    print(f"📁 Output: {output_dir}")
    print("="*60)

if __name__ == '__main__':
    convert_all_md_files()

