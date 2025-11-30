from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends

from ..dependencies import get_current_student
from ..models import Student
from .schemas import ChatExplainRequest, ChatExplainResponse, ContextDoc
from . import retriever
from .gemini_client import have_gemini, call_gemini_explain

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/index-stats")
def index_stats():
    return retriever.index_stats()


@router.post("/explain", response_model=ChatExplainResponse)
def chat_explain(req: ChatExplainRequest, current: Student = Depends(get_current_student)):
    # 1) Retrieve top-K chunks from artifacts
    items = retriever.retrieve(req.problem, top_k=req.top_k)
    ctxs: List[ContextDoc] = [
        ContextDoc(id=it["id"], source=it["source"], chunk_index=it["chunk_index"], preview=it["preview"]) for it in items
    ]

    # 2) If Gemini key present, call it. Else fallback to simple stitched response.
    if have_gemini():
        text = call_gemini_explain(req.problem, items)
        return ChatExplainResponse(text=text, contexts=ctxs)

    # Fallback: deterministic stitched answer with context previews
    lines = [
        "[Mô phỏng Gemini] Không có GOOGLE_API_KEY. Dưới đây là vài đoạn liên quan và gợi ý cách giải:",
        "\nTóm tắt ngữ cảnh:",
    ]
    for c in ctxs:
        lines.append(f"- ({c.chunk_index}) {c.preview}")
    lines.extend(
        [
            "\nGợi ý cách tiếp cận:",
            "1) Phân tích đề bài, xác định dữ kiện và ẩn số.",
            "2) Chọn công thức/định lý áp dụng tương ứng với chủ đề.",
            "3) Thực hiện biến đổi, tính toán từng bước.",
            "4) Viết kết luận rõ ràng và kiểm tra điều kiện.",
        ]
    )
    return ChatExplainResponse(text="\n".join(lines), contexts=ctxs)
