from __future__ import annotations
import os
import json
import re
import threading
from typing import List, Dict, Any, Tuple

# Simple file-based retriever over artifacts json/**/chunks.json
# No DB, no vector index: we token-match and score by overlap frequency + phrase bonus.

_LOCK = threading.Lock()
_INDEX: List[Dict[str, Any]] | None = None
_INDEX_ROOT: str | None = None


def _default_artifacts_root() -> str:
    # Prefer env ARTIFACTS_ROOT; else default to backend/artifacts/json relative to this file
    app_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))  # backend/app
    backend_dir = os.path.abspath(os.path.join(app_dir, os.pardir))               # backend
    root = os.getenv("ARTIFACTS_ROOT") or os.path.join(backend_dir, "artifacts", "json")
    return os.path.abspath(root)


def _tokenize(s: str) -> List[str]:
    s = s.lower()
    # replace diacritics-insensitive: keep simple by removing non-word; Vietnamese remains but okay
    toks = re.split(r"[^\w]+", s)
    return [t for t in toks if t]


def _score(query: str, text: str) -> float:
    if not query or not text:
        return 0.0
    q = query.strip().lower()
    t = text.lower()
    q_toks = _tokenize(q)
    if not q_toks:
        return 0.0
    score = 0.0
    # token overlap
    t_toks = _tokenize(t)
    if not t_toks:
        return 0.0
    tf: Dict[str, int] = {}
    for tok in t_toks:
        tf[tok] = tf.get(tok, 0) + 1
    for tok in q_toks:
        score += tf.get(tok, 0)
    # phrase bonus for contiguous substring
    if q in t:
        score += 5.0
    # shortness prior: prefer shorter chunks (normalize by sqrt length)
    norm = max(1.0, (len(t) ** 0.5) / 20.0)
    return score / norm


def _iter_chunk_files(root: str):
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn == "chunks.json":
                yield os.path.join(dirpath, fn)


def _load_index(root: str) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    for path in _iter_chunk_files(root):
        try:
            with open(path, "r", encoding="utf-8") as f:
                arr = json.load(f)
            for obj in arr:
                # expected keys: {chunk_index, text}
                chunk_index = obj.get("chunk_index")
                text = obj.get("text", "")
                if text:
                    items.append(
                        {
                            "id": f"{path}#c{chunk_index}",
                            "source": path,
                            "chunk_index": chunk_index,
                            "text": text,
                            "preview": text[:280].strip().replace("\n", " ")
                            .replace("  ", " "),
                        }
                    )
        except Exception:
            continue
    return items


def ensure_index(root: str | None = None) -> None:
    global _INDEX, _INDEX_ROOT
    with _LOCK:
        r = root or _default_artifacts_root()
        r = os.path.abspath(r)
        if _INDEX is not None and _INDEX_ROOT == r:
            return
        _INDEX = _load_index(r)
        _INDEX_ROOT = r


def retrieve(query: str, top_k: int = 4, root: str | None = None) -> List[Dict[str, Any]]:
    ensure_index(root)
    if not _INDEX:
        return []
    scored: List[Tuple[float, Dict[str, Any]]] = []
    for item in _INDEX:
        s = _score(query, item.get("text", ""))
        if s > 0:
            scored.append((s, item))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [it for _, it in scored[:top_k]]


def index_stats() -> Dict[str, Any]:
    return {"root": _INDEX_ROOT, "chunks": 0 if _INDEX is None else len(_INDEX)}
