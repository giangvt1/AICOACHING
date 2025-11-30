from __future__ import annotations
import os
from typing import Any, Dict, List


def have_gemini() -> bool:
    return bool(os.getenv("GOOGLE_API_KEY"))


def build_explain_prompt(problem: str, contexts: List[Dict[str, Any]]) -> str:
    ctx_lines: List[str] = []
    for c in contexts:
        src = c.get("source", "")
        idx = c.get("chunk_index", -1)
        preview = c.get("preview", "")
        ctx_lines.append(f"- [{idx}] {preview}")
    ctx_block = "\n".join(ctx_lines) if ctx_lines else "(no context)"
    system = (
        "Bạn là trợ lý Toán 10 nói tiếng Việt. Dựa vào bối cảnh (context) sau, giải thích bài toán từng bước,\n"
        "ngắn gọn, súc tích, không lan man. Nếu bối cảnh không đủ, ghi rõ giả định hợp lý trước khi giải.\n"
        "Cuối cùng tóm tắt lời giải ngắn gọn.\n"
    )
    user = f"Bối cảnh:\n{ctx_block}\n\nĐề bài:\n{problem.strip()}"
    return system + "\n\n" + user


def call_gemini_explain(problem: str, contexts: List[Dict[str, Any]], model_name: str = "gemini-2.0-flash-exp") -> str:
    """Call Gemini to explain a math problem with provided contexts.
    Returns plain text.
    """
    try:
        import google.generativeai as genai  # type: ignore
    except Exception:
        return "[Gemini SDK not installed]"

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return "[GOOGLE_API_KEY not configured]"

    genai.configure(api_key=api_key)
    prompt = build_explain_prompt(problem, contexts)
    try:
        model = genai.GenerativeModel(model_name)
        resp = model.generate_content(prompt)
        return (getattr(resp, "text", None) or "").strip()
    except Exception as e:
        return f"[Gemini error] {e}"
