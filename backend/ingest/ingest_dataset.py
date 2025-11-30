#!/usr/bin/env python3
"""
Dataset → JSON Ingestion Tool

Converts all PDFs under a dataset root into structured JSON artifacts for later import
and retrieval-augmented features.

Usage (from project root):
  conda run -n base python backend/ingest/ingest_dataset.py \
    --dataset-root dataset \
    --out-dir backend/artifacts/json \
    --engine auto

Artifacts written under --out-dir mirroring the dataset folder structure.
For each source PDF, we produce:
- meta.json: basic metadata
- document.json: pages as extracted text
- chunks.json: for theory/review docs (chunked text)
- questions.json: parsed MCQs if detected
- answers_mcq.json: parsed answer keys if detected

Additionally, per lesson folder we generate merged_mcq.json after all PDFs in that folder
are processed, joining questions with answer keys by question number.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import traceback
from datetime import datetime
from typing import Dict, List


# --------------------------- PDF extraction helpers ---------------------------

def _is_available(mod_name: str) -> bool:
    try:
        __import__(mod_name)
        return True
    except Exception:
        return False


def _extract_pages_pdfplumber(pdf_path: str) -> List[str]:
    import pdfplumber  # type: ignore
    pages: List[str] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""
            pages.append(text)
    return pages


def _extract_pages_pypdf(pdf_path: str) -> List[str]:
    from pypdf import PdfReader  # type: ignore
    reader = PdfReader(pdf_path)
    pages: List[str] = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        pages.append(text)
    return pages


def extract_pages(pdf_path: str) -> List[str]:
    if _is_available("pdfplumber"):
        return _extract_pages_pdfplumber(pdf_path)
    if _is_available("pypdf"):
        return _extract_pages_pypdf(pdf_path)
    # fallback: whole doc as one page using pdfminer
    if _is_available("pdfminer.high_level"):
        from pdfminer.high_level import extract_text  # type: ignore
        txt = extract_text(pdf_path) or ""
        return [txt]
    return [""]


# --------------------------- Classification & parsing ------------------------

def classify_doc_type(file_name: str) -> str:
    n = file_name.lower()
    if "câu hỏi" in n or "cau hoi" in n or "câu-hoi" in n:
        return "questions"
    if "đáp án trắc nghiệm" in n or "dap an trac nghiem" in n:
        return "answers_mcq"
    if "đáp án tự luận" in n or "dap an tu luan" in n:
        return "answers_written"
    if "ôn tập" in n or "on tap" in n:
        return "review"
    return "theory"


def parse_mcq_questions(text: str) -> List[Dict]:
    # Split by question blocks labelled "Câu <num>"
    blocks = re.finditer(r"(?:^|\n)(?:câu|cau)\s*(\d+)\s*[:\.)-]?\s*(.*?)(?=\n(?:câu|cau)\s*\d+\s*[:\.)-]?|\Z)", text, re.IGNORECASE | re.DOTALL)
    items: List[Dict] = []
    for m in blocks:
        qnum = int(m.group(1))
        body = m.group(2).strip()
        # find options lines starting with A./B./C./D. or A)/B)/...
        opts = []
        for line in body.splitlines():
            o = re.match(r"^\s*([ABCD])\s*[\.)]\s*(.+)$", line.strip(), re.IGNORECASE)
            if o:
                opts.append(o.group(2).strip())
        # If no explicit A/B/C/D lines, try to split by A. ... B. ...
        if not opts:
            m2 = re.search(r"A[\.)]\s*(.+?)B[\.)]\s*(.+?)C[\.)]\s*(.+?)(?:D[\.)]\s*(.+))?", body, re.IGNORECASE | re.DOTALL)
            if m2:
                opts = [m2.group(1).strip(), m2.group(2).strip(), m2.group(3).strip()]
                if m2.group(4):
                    opts.append(m2.group(4).strip())
        # question stem = body without options if we detected them
        stem = body
        if opts:
            stem_lines = []
            for line in body.splitlines():
                if re.match(r"^\s*[ABCD]\s*[\.)]", line.strip(), re.IGNORECASE):
                    break
                stem_lines.append(line)
            stem = "\n".join([s for s in (l.strip() for l in stem_lines) if s])
        if len(opts) >= 2:
            items.append({"question_num": qnum, "text": stem.strip(), "options": opts})
    return items


def parse_answer_keys(text: str) -> Dict[int, int]:
    mapping = {"A": 0, "B": 1, "C": 2, "D": 3}
    keys: Dict[int, int] = {}
    for line in text.splitlines():
        m = re.match(r"^\s*(?:câu\s*)?(\d+)\s*[:\.)-]?\s*([ABCD])\b", line.strip(), re.IGNORECASE)
        if m:
            qnum = int(m.group(1))
            letter = m.group(2).upper()
            if letter in mapping:
                keys[qnum] = mapping[letter]
    return keys


# --------------------------- JSON utilities ----------------------------------

def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def write_json(path: str, data) -> None:
    ensure_dir(os.path.dirname(path))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> List[str]:
    # simple paragraph-based windowing
    paras = [p.strip() for p in text.splitlines()]
    chunks: List[str] = []
    cur: List[str] = []
    cur_len = 0
    for p in paras:
        if not p:
            continue
        if cur_len + len(p) + 1 > chunk_size and cur:
            chunks.append("\n".join(cur))
            # overlap by last few lines
            if overlap > 0:
                keep = []
                total = 0
                for line in reversed(cur):
                    if total + len(line) + 1 > overlap:
                        break
                    keep.insert(0, line)
                    total += len(line) + 1
                cur = keep
                cur_len = sum(len(x) + 1 for x in cur)
            else:
                cur = []
                cur_len = 0
        cur.append(p)
        cur_len += len(p) + 1
    if cur:
        chunks.append("\n".join(cur))
    return chunks


# --------------------------- Processing --------------------------------------

def process_single_pdf(pdf_path: str, out_root: str, dataset_root: str) -> None:
    rel = os.path.relpath(pdf_path, dataset_root)
    rel_dir = os.path.dirname(rel)
    base = os.path.splitext(os.path.basename(pdf_path))[0]
    doc_type = classify_doc_type(base)
    pages = extract_pages(pdf_path)
    full_text = "\n".join(pages)

    out_dir = os.path.join(out_root, rel_dir, base)
    ensure_dir(out_dir)
    meta = {
        "source_path": pdf_path,
        "rel_dir": rel_dir,
        "base": base,
        "doc_type": doc_type,
        "pages": len(pages),
        "created_at": datetime.now().isoformat(),
    }
    write_json(os.path.join(out_dir, "meta.json"), meta)
    write_json(os.path.join(out_dir, "document.json"), {"pages": pages})

    if doc_type in ("theory", "review"):
        chunks = chunk_text(full_text)
        write_json(os.path.join(out_dir, "chunks.json"), [{"chunk_index": i, "text": t} for i, t in enumerate(chunks)])
    elif doc_type == "questions":
        items = parse_mcq_questions(full_text)
        write_json(os.path.join(out_dir, "questions.json"), items)
    elif doc_type == "answers_mcq":
        keys = parse_answer_keys(full_text)
        write_json(os.path.join(out_dir, "answers_mcq.json"), keys)
    else:
        # answers_written or others: store as-is
        pass


def merge_questions_answers_in_dir(out_root: str, rel_dir: str) -> None:
    # Look for any questions.json and answers_mcq.json under this lesson directory and merge
    lesson_dir = os.path.join(out_root, rel_dir)
    if not os.path.isdir(lesson_dir):
        return
    q_items: List[Dict] = []
    answer_maps: List[Dict[int, int]] = []
    for name in os.listdir(lesson_dir):
        sub = os.path.join(lesson_dir, name)
        if not os.path.isdir(sub):
            continue
        q_path = os.path.join(sub, "questions.json")
        a_path = os.path.join(sub, "answers_mcq.json")
        if os.path.exists(q_path):
            try:
                with open(q_path, "r", encoding="utf-8") as f:
                    q_items.extend(json.load(f))
            except Exception:
                traceback.print_exc()
        if os.path.exists(a_path):
            try:
                with open(a_path, "r", encoding="utf-8") as f:
                    answer_maps.append(json.load(f))
            except Exception:
                traceback.print_exc()
    if not q_items:
        return
    answers: Dict[int, int] = {}
    for m in answer_maps:
        for k, v in m.items():
            answers[int(k)] = int(v)
    merged = []
    for it in q_items:
        qn = int(it.get("question_num", 0))
        merged.append({
            "question_num": qn,
            "text": it.get("text", ""),
            "options": it.get("options", []),
            "correct_index": answers.get(qn),
        })
    write_json(os.path.join(lesson_dir, "merged_mcq.json"), merged)


def process_dataset(root: str, out_dir: str) -> None:
    root = os.path.abspath(root)
    out_dir = os.path.abspath(out_dir)
    print(f"[INGEST] Scanning dataset: {root}")
    for dirpath, _, filenames in os.walk(root):
        pdfs = [f for f in filenames if f.lower().endswith(".pdf")]
        if not pdfs:
            continue
        for fname in sorted(pdfs):
            fpath = os.path.join(dirpath, fname)
            print(f"[INGEST] {fpath}")
            try:
                process_single_pdf(fpath, out_dir, root)
            except Exception:
                traceback.print_exc()
        # after a folder done, attempt merge within this relative dir
        rel_dir = os.path.relpath(dirpath, root)
        try:
            merge_questions_answers_in_dir(out_dir, rel_dir)
        except Exception:
            traceback.print_exc()


# --------------------------- CLI --------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest dataset PDFs to structured JSON")
    parser.add_argument("--dataset-root", default="dataset", help="Path to dataset folder")
    parser.add_argument("--out-dir", default="backend/artifacts/json", help="Output directory for JSON artifacts")
    args = parser.parse_args()

    process_dataset(args.dataset_root, args.out_dir)
    print(f"[DONE] JSON artifacts written under: {os.path.abspath(args.out_dir)}")


if __name__ == "__main__":
    main()
