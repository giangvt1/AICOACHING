from __future__ import annotations
import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Student
from ..schemas import ExplainRequest, GenerateExercisesRequest, AssistantResponse
from ..dependencies import get_current_student

router = APIRouter(prefix="/assistant", tags=["assistant"])


def _use_gemini() -> bool:
    return bool(os.getenv("GOOGLE_API_KEY"))


def _use_openai() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))


@router.post("/explain", response_model=AssistantResponse)
def explain(payload: ExplainRequest, db: Session = Depends(get_db), current: Student = Depends(get_current_student)):
    text = payload.problem.strip()
    if not text:
        return AssistantResponse(text="Vui lòng nhập câu hỏi hoặc đề bài cần giải thích.")

    # System prompt for AI assistant
    system_prompt = """Bạn là một trợ lý AI chuyên về Toán học lớp 10, thân thiện và nhiệt tình.

NHIỆM VỤ:
- Giải thích các khái niệm Toán học một cách dễ hiểu, súc tích
- Giải chi tiết từng bước các bài toán
- Cung cấp ví dụ minh họa khi cần
- Trả lời các câu hỏi liên quan đến Toán 10

NỘI DUNG CHƯƠNG TRÌNH TOÁN 10:
1. Mệnh đề và Tập hợp
2. Bất phương trình (bậc nhất, bậc hai, chứa dấu giá trị tuyệt đối)
3. Góc lượng giác và Hệ thức lượng (sin, cos, tan, cot)
4. Vectơ (phép toán, tích vô hướng)
5. Phương trình đường thẳng và đường tròn

PHONG CÁCH:
- Sử dụng tiếng Việt rõ ràng, dễ hiểu
- Giải thích từng bước logic
- Khuyến khích học sinh tư duy
- Thân thiện, động viên
- Sử dụng emoji phù hợp 😊 📝 ✅ 💡

ĐỊNH DẠNG TRẠLỜI:
- Với bài toán: Giải từng bước rõ ràng
- Với câu hỏi lý thuyết: Giải thích khái niệm + ví dụ
- Kết luận ngắn gọn ở cuối
"""

    if _use_gemini():
        try:
            import google.generativeai as genai  # type: ignore
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            
            # Use system instruction for better context
            model = genai.GenerativeModel(
                "gemini-2.0-flash-exp",
                system_instruction=system_prompt
            )
            
            # Generate response
            resp = model.generate_content(text)
            out = resp.text or ""
            
            # Clean up response
            response_text = out.strip()
            if not response_text:
                response_text = "Xin lỗi, tôi không thể trả lời câu hỏi này. Bạn có thể diễn đạt lại được không? 🤔"
            
            return AssistantResponse(text=response_text)
        except Exception as e:
            error_msg = str(e)
            if "404" in error_msg:
                return AssistantResponse(text="⚠️ Model AI tạm thời không khả dụng. Vui lòng thử lại sau.")
            return AssistantResponse(text=f"⚠️ Có lỗi xảy ra: {error_msg}")

    if _use_openai():
        try:
            from openai import OpenAI  # type: ignore
            client = OpenAI()
            prompt = f"Giải thích từng bước bài toán Toán 10 (tiếng Việt):\n\n{text}"
            chat = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
            )
            out = (chat.choices[0].message.content or "").strip()
            return AssistantResponse(text=out)
        except Exception as e:
            return AssistantResponse(text=f"[OpenAI lỗi] {e}")

    # Fallback (no API keys)
    return AssistantResponse(
        text=(
            "[Mô phỏng] Chưa cấu hình API key. Gợi ý chung:\n"
            "1) Phân tích đề bài, xác định dữ kiện và ẩn số.\n"
            "2) Chọn công thức/định lý áp dụng.\n"
            "3) Thực hiện biến đổi, tính toán từng bước.\n"
            "4) Kết luận đáp án và kiểm tra điều kiện.\n"
        )
    )


@router.post("/generate", response_model=AssistantResponse)
def generate_exercises(payload: GenerateExercisesRequest, db: Session = Depends(get_db), current: Student = Depends(get_current_student)):
    topic = payload.topic.strip()
    n = payload.n
    dif = payload.difficulty

    if _use_gemini():
        try:
            import google.generativeai as genai  # type: ignore
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            model = genai.GenerativeModel("gemini-2.0-flash-exp")
            prompt = (
                f"Sinh {n} bài tập Toán 10 theo chủ đề '{topic}', độ khó {dif} (1-5). "
                "Định dạng: số thứ tự + nội dung ngắn gọn, tiếng Việt."
            )
            resp = model.generate_content(prompt)
            out = resp.text or ""
            return AssistantResponse(text=out.strip())
        except Exception as e:
            return AssistantResponse(text=f"[Gemini lỗi] {e}")

    if _use_openai():
        try:
            from openai import OpenAI  # type: ignore
            client = OpenAI()
            prompt = (
                f"Sinh {n} bài tập Toán 10 theo chủ đề '{topic}', độ khó {dif} (1-5). "
                "Định dạng: số thứ tự + nội dung ngắn gọn, tiếng Việt."
            )
            chat = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            out = (chat.choices[0].message.content or "").strip()
            return AssistantResponse(text=out)
        except Exception as e:
            return AssistantResponse(text=f"[OpenAI lỗi] {e}")

    # Fallback: simple template
    lines = [f"Bài {i+1}: Bài tập ngắn về {topic} (độ khó {dif})." for i in range(n)]
    return AssistantResponse(text="\n".join(lines))
