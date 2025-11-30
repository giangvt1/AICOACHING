#!/usr/bin/env python3
"""
Import merged MCQs and (optionally) content into the database from JSON artifacts
produced by the dataset ingestion step.

Usage (from project root):
  conda run -n base python backend/ingest/import_json_to_db.py \
    --artifacts-root backend/artifacts/json \
    --create-missing-topics

Notes
- Topic strategy: by default we derive topic name from the lesson folder name.
  E.g. "Bài 12. Tọa độ vectơ" -> "Tọa độ vectơ".
- Idempotency: we skip inserting a question if another with SAME (topic_id, text)
  already exists.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from typing import List, Dict

# Ensure we can import the 'app' package when running as a script
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, os.pardir))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import Base, engine, SessionLocal
from app.models import Topic, Question


def lesson_to_topic_name(lesson_folder: str) -> str:
    # Remove leading "Bài <num>. " if present
    m = re.match(r"^\s*Bài\s*\d+\.?\s*(.*)$", lesson_folder, flags=re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return lesson_folder.strip()


def load_merged(path: str) -> List[Dict]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def upsert_topic(db, name: str) -> Topic:
    t = db.query(Topic).filter(Topic.name == name).first()
    if t:
        return t
    # Default difficulty 3, order_index = max+1
    last = db.query(Topic).order_by(Topic.order_index.desc()).first()
    order_index = (last.order_index + 1) if last else 1
    t = Topic(name=name, difficulty=3, is_core=False, order_index=order_index)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


def insert_questions(db, topic: Topic, items: List[Dict]) -> int:
    import json as _json
    created = 0
    for it in items:
        text = (it.get("text") or "").strip()
        if not text:
            continue
        # de-dup by (topic_id, text)
        exists = db.query(Question).filter(Question.topic_id == topic.id, Question.text == text).first()
        if exists:
            continue
        options = it.get("options") or []
        correct_index = it.get("correct_index")
        if correct_index is None:
            # fallback when answer key missing
            correct_index = 0
        q = Question(
            topic_id=topic.id,
            text=text,
            options_json=_json.dumps(options, ensure_ascii=False),
            correct_index=int(correct_index),
            difficulty=3,
        )
        db.add(q)
        created += 1
    db.commit()
    return created


def process_artifacts(root: str, alias_map: Dict[str, str] | None = None) -> Dict[str, int]:
    stats = {"topics_created": 0, "questions_created": 0, "files_processed": 0}
    with SessionLocal() as db:
        # ensure tables exist
        Base.metadata.create_all(bind=engine)
        for dirpath, _, filenames in os.walk(root):
            if "merged_mcq.json" not in filenames:
                continue
            stats["files_processed"] += 1
            merged_path = os.path.join(dirpath, "merged_mcq.json")
            lesson_folder = os.path.basename(dirpath)
            raw_name = lesson_to_topic_name(lesson_folder)
            topic_name = raw_name
            # apply alias mapping if provided
            if alias_map and raw_name in alias_map:
                topic_name = alias_map[raw_name]
            # upsert topic
            before = db.query(Topic).count()
            topic = upsert_topic(db, topic_name)
            after = db.query(Topic).count()
            if after > before:
                stats["topics_created"] += 1
            # insert questions
            items = load_merged(merged_path)
            created = insert_questions(db, topic, items)
            stats["questions_created"] += created
    return stats


def main():
    parser = argparse.ArgumentParser(description="Import JSON artifacts into DB")
    parser.add_argument("--artifacts-root", default="backend/artifacts/json", help="Path to artifacts root")
    parser.add_argument("--topic-aliases", default=None, help="Optional JSON file mapping lesson names to canonical Topic names")
    args = parser.parse_args()

    root = os.path.abspath(args.artifacts_root)
    alias_map = None
    if args.topic_aliases and os.path.exists(args.topic_aliases):
        with open(args.topic_aliases, "r", encoding="utf-8") as f:
            alias_map = json.load(f)
    stats = process_artifacts(root, alias_map=alias_map)
    print("[IMPORT DONE]", stats)


if __name__ == "__main__":
    main()
