from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from services.repo_analyzer import analyze_repository


def generate_summary(repo_path: str) -> Dict[str, Any]:
    analysis = analyze_repository(Path(repo_path))

    repository = analysis.get("repository", "Unknown Repository")
    total_files = analysis.get("total_files", 0)
    total_folders = analysis.get("total_folders", 0)
    dominant_language = analysis.get("dominant_language", "Unknown")
    architecture_style = analysis.get("architecture_style", "General")
    top_level_folders = analysis.get("top_level_folders", [])
    top_level_files = analysis.get("top_level_files", [])
    languages = analysis.get("languages", {})

    top_languages = list(languages.items())[:5]
    top_languages_text = ", ".join([f"{name} ({count})" for name, count in top_languages])

    summary_text = (
        f"{repository} appears to be a {architecture_style.lower()} codebase with "
        f"{total_files} files across {total_folders} folders. "
        f"The dominant technology is {dominant_language}. "
        f"Top-level folders include: {', '.join(top_level_folders[:6]) if top_level_folders else 'none detected'}. "
        f"Notable top-level files include: {', '.join(top_level_files[:6]) if top_level_files else 'none detected'}. "
        f"Most common file categories are: {top_languages_text if top_languages_text else 'not enough data'}."
    )

    return {
        "main_language": dominant_language,
        "architecture_style": architecture_style,
        "top_level_folders": top_level_folders,
        "top_level_files": top_level_files,
        "top_languages": top_languages,
        "summary_text": summary_text,
    }