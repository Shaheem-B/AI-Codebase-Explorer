from __future__ import annotations

import os
import subprocess
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List

IGNORE_DIRS = {
    ".git",
    "__pycache__",
    "node_modules",
    ".next",
    "dist",
    "build",
    ".venv",
    "venv",
    ".idea",
    ".vscode",
    ".DS_Store",
}

EXTENSION_LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "React JSX",
    ".ts": "TypeScript",
    ".tsx": "React TSX",
    ".json": "JSON",
    ".md": "Markdown",
    ".txt": "Text",
    ".yml": "YAML",
    ".yaml": "YAML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".sass": "Sass",
    ".html": "HTML",
    ".htm": "HTML",
    ".cjs": "CommonJS",
    ".mjs": "ES Module",
    ".jpg": "JPG Image",
    ".jpeg": "JPEG Image",
    ".png": "PNG Image",
    ".svg": "SVG Image",
    ".gif": "GIF Image",
    ".env": "Environment File",
    ".toml": "TOML",
    ".ini": "INI",
    ".cfg": "Config",
    ".conf": "Config",
    ".sql": "SQL",
    ".java": "Java",
    ".kt": "Kotlin",
    ".go": "Go",
    ".rs": "Rust",
    ".cpp": "C++",
    ".c": "C",
    ".cs": "C#",
    ".php": "PHP",
    ".rb": "Ruby",
    ".sh": "Shell",
    ".bat": "Batch",
    ".ps1": "PowerShell",
    ".lock": "Lock File",
}

SPECIAL_FILENAME_MAP = {
    "dockerfile": "Dockerfile",
    ".gitignore": ".gitignore",
    ".dockerignore": ".dockerignore",
    "package-lock.json": "NPM Lock File",
    "package.json": "NPM Package Manifest",
    "requirements.txt": "Python Requirements",
    "readme.md": "Markdown",
    "license": "License File",
}


def should_ignore_dir(dir_name: str) -> bool:
    return dir_name in IGNORE_DIRS


def classify_file(file_path: Path) -> str:
    file_name = file_path.name.lower()

    if file_name in SPECIAL_FILENAME_MAP:
        return SPECIAL_FILENAME_MAP[file_name]

    suffix = file_path.suffix.lower()
    if suffix in EXTENSION_LANGUAGE_MAP:
        return EXTENSION_LANGUAGE_MAP[suffix]

    if suffix:
        return suffix.replace(".", "").upper()

    return "Other"


def clone_repo_if_needed(repo_url: str) -> Path:
    repo_name = repo_url.rstrip("/").split("/")[-1]
    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]

    repos_dir = Path("repos")
    repos_dir.mkdir(parents=True, exist_ok=True)

    repo_path = repos_dir / repo_name

    if not repo_path.exists():
        subprocess.run(
            ["git", "clone", repo_url, str(repo_path)],
            check=True,
            capture_output=True,
            text=True,
        )

    return repo_path


def analyze_repository(repo_path: str | Path) -> Dict[str, Any]:
    repo = Path(repo_path)

    if not repo.exists() or not repo.is_dir():
        raise FileNotFoundError(f"Repository path not found: {repo}")

    file_counter: Counter[str] = Counter()
    total_files = 0
    total_folders = 0
    all_files: List[str] = []

    for root, dirs, files in os.walk(repo):
        dirs[:] = [d for d in dirs if not should_ignore_dir(d)]
        total_folders += len(dirs)

        for file_name in files:
            file_path = Path(root) / file_name
            relative_path = file_path.relative_to(repo).as_posix()

            file_type = classify_file(file_path)
            file_counter[file_type] += 1
            total_files += 1
            all_files.append(relative_path)

    top_level_folders = sorted(
        [
            item.name
            for item in repo.iterdir()
            if item.is_dir() and not should_ignore_dir(item.name)
        ]
    )

    top_level_files = sorted([item.name for item in repo.iterdir() if item.is_file()])

    dominant_language = "Unknown"
    if file_counter:
        dominant_language = file_counter.most_common(1)[0][0]

    frontend_indicators = {"React JSX", "JavaScript", "TypeScript", "React TSX", "CSS", "HTML"}
    backend_indicators = {"Python", "Java", "Go", "PHP", "Rust", "C#", "SQL"}

    has_frontend = any(lang in file_counter for lang in frontend_indicators)
    has_backend = any(lang in file_counter for lang in backend_indicators)

    architecture_style = "General"
    if has_frontend and has_backend:
        architecture_style = "Full Stack"
    elif has_frontend:
        architecture_style = "Frontend Application"
    elif has_backend:
        architecture_style = "Backend Application"

    return {
        "repository": repo.name,
        "total_files": total_files,
        "total_folders": total_folders,
        "languages": dict(sorted(file_counter.items(), key=lambda x: x[1], reverse=True)),
        "dominant_language": dominant_language,
        "architecture_style": architecture_style,
        "top_level_folders": top_level_folders,
        "top_level_files": top_level_files,
        "sample_files": all_files[:30],
    }


def analyze_repo(repo_url: str) -> Dict[str, Any]:
    """
    This wrapper keeps compatibility with main.py, which imports analyze_repo.
    """
    repo_path = clone_repo_if_needed(repo_url)
    return analyze_repository(repo_path)