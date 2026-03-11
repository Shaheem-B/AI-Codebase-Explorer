import os
import re


def find_readme(repo_path):
    """
    Locate README file inside repository
    """
    for root, _, files in os.walk(repo_path):
        for file in files:
            if file.lower().startswith("readme"):
                return os.path.join(root, file)

    return None


def read_readme(readme_path):
    """
    Load README content
    """
    if not readme_path:
        return None

    try:
        with open(readme_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except:
        return None


def extract_sections(readme_text):
    """
    Extract common README sections
    """

    sections = {
        "title": None,
        "description": None,
        "features": [],
        "installation": None,
        "usage": None,
        "tech_stack": [],
    }

    if not readme_text:
        return sections

    lines = readme_text.split("\n")

    if lines:
        sections["title"] = lines[0].replace("#", "").strip()

    features = []
    for line in lines:
        if line.strip().startswith("-"):
            features.append(line.replace("-", "").strip())

    sections["features"] = features[:10]

    stack_keywords = [
        "python",
        "react",
        "fastapi",
        "node",
        "docker",
        "tensorflow",
        "pytorch",
        "next",
        "kotlin",
        "java",
    ]

    stack = []
    text = readme_text.lower()

    for tech in stack_keywords:
        if tech in text:
            stack.append(tech)

    sections["tech_stack"] = stack

    return sections


def analyze_readme(repo_path):

    readme_path = find_readme(repo_path)
    readme_text = read_readme(readme_path)

    sections = extract_sections(readme_text)

    return {
        "readme_found": bool(readme_path),
        "readme_path": readme_path,
        "summary": sections,
    }