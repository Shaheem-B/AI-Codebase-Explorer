import os
from pathlib import Path
from typing import List, Dict

IGNORE_DIRS = {
    ".git",
    "__pycache__",
    "node_modules",
    ".next",
    "dist",
    "build",
    ".venv",
    "venv",
}

ALLOWED_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".java",
    ".kt",
    ".go",
    ".rs",
    ".php",
    ".rb",
    ".c",
    ".cpp",
    ".cs",
    ".json",
    ".md",
    ".yml",
    ".yaml",
    ".toml",
    ".env",
    ".txt",
}


def should_ignore_dir(name: str) -> bool:
    return name in IGNORE_DIRS


def should_include_file(path: Path) -> bool:
    if path.name.lower() in {
        "dockerfile",
        "requirements.txt",
        "package.json",
        "package-lock.json",
        "readme.md",
        ".gitignore",
        ".env.example",
    }:
        return True

    return path.suffix.lower() in ALLOWED_EXTENSIONS


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 200) -> List[str]:
    chunks = []
    start = 0

    while start < len(text):
        end = min(len(text), start + chunk_size)
        chunks.append(text[start:end])

        if end == len(text):
            break

        start = end - overlap

    return chunks


def build_code_chunks(repo_path: str) -> List[Dict]:
    repo = Path(repo_path)
    chunks = []

    for root, dirs, files in os.walk(repo):
        dirs[:] = [d for d in dirs if not should_ignore_dir(d)]

        for file_name in files:
            file_path = Path(root) / file_name

            if not should_include_file(file_path):
                continue

            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue

            if not content.strip():
                continue

            relative_path = file_path.relative_to(repo).as_posix()
            split_chunks = chunk_text(content)

            for idx, chunk in enumerate(split_chunks):
                chunks.append(
                    {
                        "file_path": relative_path,
                        "chunk_id": idx,
                        "content": chunk,
                    }
                )

    return chunks


def score_chunk(query: str, chunk: Dict) -> int:
    query_terms = [term.lower() for term in query.split() if term.strip()]
    haystack = f"{chunk['file_path']} {chunk['content']}".lower()

    score = 0
    for term in query_terms:
        score += haystack.count(term) * 3

    important_terms = [
        "auth",
        "login",
        "token",
        "api",
        "chat",
        "memory",
        "repo",
        "analyze",
        "summary",
        "diagram",
        "gemini",
        "service",
        "route",
        "main",
        "app",
    ]

    for term in important_terms:
        if term in query.lower() and term in haystack:
            score += 5

    return score


def retrieve_relevant_chunks(repo_path: str, query: str, top_k: int = 5) -> List[Dict]:
    chunks = build_code_chunks(repo_path)

    scored = []
    for chunk in chunks:
        score = score_chunk(query, chunk)
        if score > 0:
            scored.append((score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)

    return [item[1] for item in scored[:top_k]]

def get_file_content(repo_path: str, file_path: str) -> str:
    """
    Load a specific repository file safely.
    """
    repo = Path(repo_path)
    target = repo / file_path

    if not target.exists() or not target.is_file():
        return ""

    try:
        return target.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""