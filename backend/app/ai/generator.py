from __future__ import annotations
import os
import re
import json
import uuid
import datetime as dt
from typing import List, Dict, Any, Tuple

from ..chat.retriever import retrieve
from ..chat.gemini_client import have_gemini
from .artifact_loader import load_exercises_from_artifacts


DATA_ROOT = os.path.join(os.path.dirname(__file__), ".data")


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _extract_json_block(text: str) -> str | None:
    """Extract a JSON array/object from model text output.
    Supports fenced code blocks and plain text containing a single JSON array.
    """
    if not text:
        return None
    # Try code fence ```json ... ```
    m = re.search(r"```json\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    # Try to find first [ ... ] balanced array
    m = re.search(r"\[.*\]", text, re.DOTALL)
    if m:
        return m.group(0).strip()
    # Try to find { ... } (object) and wrap into list if needed
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        return m.group(0).strip()
    return None


def _normalize_items(raw: Any, n: int, fmt: str, difficulty: int) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    if isinstance(raw, dict):
        raw = [raw]
    if isinstance(raw, list):
        for r in raw:
            if not isinstance(r, dict):
                continue
            q = str(r.get("question") or r.get("q") or r.get("text") or "").strip()
            if not q:
                continue
            typ = (r.get("type") or fmt or "open").lower()
            if typ not in ("open", "mcq"):
                typ = "open"
            item: Dict[str, Any] = {
                "question": q,
                "type": typ,
                "difficulty": int(r.get("difficulty") or difficulty or 3),
            }
            if typ == "mcq":
                opts = r.get("options") or r.get("choices")
                if isinstance(opts, list) and all(isinstance(x, str) for x in opts):
                    item["options"] = opts[:6]
                ci = r.get("correct_index")
                if isinstance(ci, int):
                    item["correct_index"] = ci
            sol = r.get("solution") or r.get("answer")
            if isinstance(sol, str):
                item["solution"] = sol
            items.append(item)
    # Final cap/pad
    items = items[:n]
    if not items:
        # Minimal fallback one item
        items = [{"question": "Hãy trình bày khái niệm liên quan đến chủ đề này.", "type": "open", "difficulty": difficulty}]
    return items


def _build_generate_prompt(topic: str, n: int, difficulty: int, fmt: str, contexts: List[Dict[str, Any]]) -> str:
    ctx_lines: List[str] = []
    for c in contexts:
        ctx_lines.append(f"- ({c.get('chunk_index')}) {c.get('preview','')}")
    ctx = "\n".join(ctx_lines) if ctx_lines else "(no context)"
    schema = (
        "Xuất ra JSON THUẦN (không có giải thích), là một mảng các object.\n"
        "Mỗi object có các field: question (string), type (\"open\"|\"mcq\"), difficulty (1..5),\n"
        "options (array<string>, optional, chỉ khi type=mcq), correct_index (int, optional), solution (string, optional).\n"
    )
    guide = (
        f"Chủ đề: {topic}\nSố lượng: {n}\nĐộ khó (1-5): {difficulty}\nĐịnh dạng: {fmt}\n"
        "Câu hỏi ngắn gọn, rõ ràng, tiếng Việt. Nếu mcq, mỗi câu 3-5 lựa chọn.\n"
    )
    return (
        "Bạn là trợ lý tạo bài tập Toán 10. Dựa vào bối cảnh dưới đây, sinh bài tập phù hợp năng lực.\n"
        + schema
        + "\nBối cảnh:\n"
        + ctx
        + "\n\nYêu cầu đầu ra:\n"
        + guide
    )


def _call_gemini_json(prompt: str, model_name: str = "gemini-2.5-flash-lite") -> Any:
    try:
        import google.generativeai as genai  # type: ignore
    except Exception:
        return None
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    try:
        # Prefer JSON output if supported
        resp = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.3,
            },
        )
        text = getattr(resp, "text", None) or ""
        block = _extract_json_block(text)
        if not block:
            # In case model returned pure JSON without fences
            block = text.strip()
        return json.loads(block)
    except Exception:
        return None


def generate_answer_for_question(question_data: Dict[str, Any]) -> Dict[str, Any] | None:
    """
    AI tự động tạo đáp án cho câu hỏi chưa có answer.
    
    Args:
        question_data: Dictionary chứa thông tin câu hỏi (text, options, answer_type, etc.)
    
    Returns:
        Dictionary chứa answer với format chuẩn, hoặc None nếu không generate được
    """
    if not have_gemini():
        return None
    
    question_text = question_data.get("text", "")
    answer_type = question_data.get("answer_type", "open")
    options = question_data.get("options", [])
    chapter = question_data.get("chapter", "")
    
    if not question_text:
        return None
    
    # Build prompt dựa trên loại câu hỏi
    if answer_type == "multiple_choice" and options:
        options_text = "\n".join(options)
        prompt = f"""Bạn là giáo viên Toán 10 chuyên nghiệp. Hãy trả lời câu hỏi trắc nghiệm sau với đáp án chi tiết.

Chương: {chapter}

Câu hỏi:
{question_text}

Các đáp án:
{options_text}

Hãy trả về JSON với format sau (KHÔNG thêm markdown code blocks):
{{
  "correct": "A",
  "explanation": "Giải thích ngắn gọn tại sao đáp án này đúng",
  "solution_steps": [
    "Bước 1: ...",
    "Bước 2: ...",
    "Bước 3: ..."
  ],
  "key_concepts": ["Khái niệm 1", "Khái niệm 2"],
  "difficulty_level": "easy"
}}

Lưu ý:
- "correct" chỉ là chữ cái A, B, C, hoặc D
- "explanation" giải thích tại sao đáp án đúng (1-2 câu)
- "solution_steps" là mảng các bước giải chi tiết
- "key_concepts" là mảng các khái niệm toán học liên quan
- "difficulty_level" là "easy", "medium", hoặc "hard"
"""
    else:
        # Open question
        prompt = f"""Bạn là giáo viên Toán 10 chuyên nghiệp. Hãy trả lời câu hỏi tự luận sau với đáp án chi tiết.

Chương: {chapter}

Câu hỏi:
{question_text}

Hãy trả về JSON với format sau (KHÔNG thêm markdown code blocks):
{{
  "correct": "Đáp án đúng đầy đủ ở đây",
  "explanation": "Giải thích ngắn gọn",
  "solution_steps": [
    "Bước 1: ...",
    "Bước 2: ...",
    "Bước 3: ..."
  ],
  "key_concepts": ["Khái niệm 1", "Khái niệm 2"],
  "difficulty_level": "medium"
}}

Lưu ý:
- "correct" là câu trả lời đầy đủ, chi tiết
- "explanation" giải thích logic của đáp án (1-2 câu)
- "solution_steps" là mảng các bước giải chi tiết
- "key_concepts" là mảng các khái niệm toán học liên quan
- "difficulty_level" là "easy", "medium", hoặc "hard"
"""
    
    try:
        result = _call_gemini_json(prompt, model_name="gemini-2.0-flash-exp")
        
        # Validate result structure
        if result and isinstance(result, dict):
            required_fields = ["correct", "explanation", "solution_steps", "key_concepts", "difficulty_level"]
            if all(field in result for field in required_fields):
                return result
        
        return None
    except Exception as e:
        print(f"❌ Error generating answer: {str(e)}")
        return None


def generate_exercises(topic: str, n: int, difficulty: int, fmt: str, top_k: int) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], str]:
    contexts = retrieve(topic, top_k=top_k)
    model_used = "artifacts"
    items: List[Dict[str, Any]] = []
    
    # Priority 1: Try to load from artifacts first (real data!)
    print(f"🔍 Trying to load exercises from artifacts for topic: {topic}")
    artifact_items = load_exercises_from_artifacts(topic, n, difficulty, fmt)
    if artifact_items:
        items = artifact_items
        model_used = "artifacts"
        print(f"✅ Loaded {len(items)} exercises from artifacts")
    
    # Priority 2: If no artifacts, try Gemini AI
    if not items and have_gemini():
        print(f"🤖 No artifacts found, trying Gemini AI...")
        prompt = _build_generate_prompt(topic, n, difficulty, fmt, contexts)
        raw = _call_gemini_json(prompt)
        if raw is not None:
            items = _normalize_items(raw, n, fmt, difficulty)
            model_used = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
            print(f"✅ Generated {len(items)} exercises with AI")
    
    # Priority 3: Fallback deterministic items
    if not items:
        print(f"⚠️ Using fallback placeholder exercises")
        for i in range(n):
            items.append({
                "question": f"[{topic}] Bài {i+1}: Hãy trình bày/giải một bài ngắn phù hợp độ khó {difficulty}.",
                "type": fmt if fmt in ("open", "mcq") else "open",
                "difficulty": difficulty,
            })
            if items[-1]["type"] == "mcq":
                items[-1]["options"] = ["A", "B", "C", "D"]
                items[-1]["correct_index"] = 0
        model_used = "fallback"
    
    return items, contexts, model_used


def save_exercise_set(user_id: int, topic: str, difficulty: int, fmt: str, items: List[Dict[str, Any]], contexts: List[Dict[str, Any]], model_used: str) -> Tuple[str, Dict[str, Any]]:
    created = dt.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    set_id = f"ex_{created}_{uuid.uuid4().hex[:8]}"
    user_dir = os.path.join(DATA_ROOT, str(user_id), "exercises")
    _ensure_dir(user_dir)
    doc = {
        "id": set_id,
        "user_id": user_id,
        "topic": topic,
        "difficulty": difficulty,
        "format": fmt,
        "items": items,
        "contexts": contexts,
        "used_model": model_used,
        "created_at": created,
    }
    path = os.path.join(user_dir, f"{set_id}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
    return path, doc


def list_user_sets(user_id: int) -> List[Dict[str, Any]]:
    user_dir = os.path.join(DATA_ROOT, str(user_id), "exercises")
    out: List[Dict[str, Any]] = []
    if not os.path.isdir(user_dir):
        return out
    for fn in os.listdir(user_dir):
        if not fn.endswith(".json"):
            continue
        path = os.path.join(user_dir, fn)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                out.append({
                    "id": data.get("id"),
                    "topic": data.get("topic"),
                    "difficulty": data.get("difficulty"),
                    "format": data.get("format"),
                    "used_model": data.get("used_model"),
                    "created_at": data.get("created_at"),
                    "path": path,
                })
        except Exception:
            continue
    # sort by created_at desc
    out.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return out


def load_user_set(user_id: int, set_id: str) -> Dict[str, Any] | None:
    path = os.path.join(DATA_ROOT, str(user_id), "exercises", f"{set_id}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
