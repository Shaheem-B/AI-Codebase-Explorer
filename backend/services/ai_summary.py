import json
from typing import Any, Dict


def build_ai_summary_prompt(
    repo_name: str,
    analysis_result: Dict[str, Any],
    summary_result: Dict[str, Any],
    readme_result: Dict[str, Any],
    diagram_result: Dict[str, Any],
    relevant_chunks: list[dict],
) -> str:
    chunk_text = "\n\n".join(
        [
            f"FILE: {chunk.get('file_path', 'unknown')}\n{chunk.get('content', '')[:2500]}"
            for chunk in relevant_chunks[:5]
        ]
    )

    return f"""
You are an expert AI software architect and repository analyst.

Your task is to create a detailed but structured repository summary.

Return ONLY valid JSON in this exact structure:

{{
  "project_title": "...",
  "project_purpose": "...",
  "executive_summary": "...",
  "architecture_style": "...",
  "main_flow": [
    "step 1",
    "step 2",
    "step 3"
  ],
  "key_capabilities": [
    "...",
    "..."
  ],
  "core_modules": [
    {{
      "name": "...",
      "role": "..."
    }}
  ],
  "tech_stack": [
    "..."
  ],
  "important_files": [
    {{
      "file": "...",
      "why_it_matters": "..."
    }}
  ],
  "developer_insights": [
    "...",
    "..."
  ],
  "notable_observations": [
    "...",
    "..."
  ]
}}

Repository name:
{repo_name}

Repository analysis:
{analysis_result}

Repository summary:
{summary_result}

README analysis:
{readme_result}

Architecture/key files:
{diagram_result}

Relevant repository file snippets:
{chunk_text}
"""
    

def parse_ai_summary_text(raw_text: str) -> Dict[str, Any]:
    if not raw_text:
        return {}

    cleaned = (
        raw_text.replace("```json", "")
        .replace("```", "")
        .strip()
    )

    try:
        return json.loads(cleaned)
    except Exception:
        return {
            "project_title": "AI Summary Unavailable",
            "project_purpose": "",
            "executive_summary": cleaned,
            "architecture_style": "",
            "main_flow": [],
            "key_capabilities": [],
            "core_modules": [],
            "tech_stack": [],
            "important_files": [],
            "developer_insights": [],
            "notable_observations": [],
        }