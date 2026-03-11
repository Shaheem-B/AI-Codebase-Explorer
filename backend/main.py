import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
import google.generativeai as genai

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from services.code_indexer import retrieve_relevant_chunks, get_file_content
from services.repo_analyzer import analyze_repo
from services.ai_summary import build_ai_summary_prompt, parse_ai_summary_text
from services.summarizer import generate_summary
from services.readme_analyzer import analyze_readme
from services.dep_graph import build_architecture_graph

load_dotenv()


# =========================
# Gemini Configuration
# =========================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

gemini_model = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-2.5-flash")


def generate_with_gemini(prompt: str) -> str:
    """
    Send a prompt to Gemini and return plain text.
    """
    if gemini_model is None:
        raise RuntimeError("GEMINI_API_KEY is missing. Add it to backend/.env")

    response = gemini_model.generate_content(prompt)
    text = getattr(response, "text", None)

    if text and isinstance(text, str):
        return text.strip()

    return ""


# =========================
# FastAPI App
# =========================
app = FastAPI(title="Codebase Understanding AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# Models
# =========================
class RepoRequest(BaseModel):
    repo_url: str = Field(..., min_length=1)


# =========================
# Helpers
# =========================
def extract_repo_name(repo_url: str) -> str:
    """
    Extract clean repository name from a GitHub URL.

    Examples:
    - https://github.com/user/repo -> repo
    - https://github.com/user/repo/ -> repo
    - https://github.com/user/repo.git -> repo
    """
    parsed = urlparse(repo_url)
    path_parts = [part for part in parsed.path.strip("/").split("/") if part]

    if len(path_parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid GitHub repository URL.")

    repo_name = path_parts[-1]
    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]

    if not repo_name:
        raise HTTPException(
            status_code=400,
            detail="Could not extract repository name from URL.",
        )

    return repo_name


def build_repo_path(repo_name: str) -> str:
    return str(Path("repos") / repo_name)


def ensure_repo_available(repo_url: str, repo_path: str):
    """
    Ensure repository exists locally. If not, analyze_repo() will clone/reuse it.
    """
    if not Path(repo_path).exists():
        analyze_repo(repo_url)


def build_repo_tree(repo_path: str):
    """
    Build a simple nested repository tree.
    """
    root_path = Path(repo_path)

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

    def walk(path: Path):
        children = []

        try:
            entries = sorted(
                path.iterdir(),
                key=lambda p: (p.is_file(), p.name.lower())
            )
        except Exception:
            return []

        for entry in entries:
            if entry.name in IGNORE_DIRS:
                continue

            node = {
                "name": entry.name,
                "path": entry.relative_to(root_path).as_posix(),
                "type": "directory" if entry.is_dir() else "file",
            }

            if entry.is_dir():
                node["children"] = walk(entry)

            children.append(node)

        return children

    return walk(root_path)


# =========================
# Routes
# =========================
@app.get("/")
def root():
    return {"message": "Backend is running ✅"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze_repository(request: RepoRequest):
    """
    Flow:
    1) Clone repo / reuse repo via analyze_repo()
    2) Analyze repository stats
    3) Generate structured summary
    4) Parse README
    5) Build architecture graph
    6) Retrieve important code chunks
    7) Generate AI summary with Gemini
    """
    try:
        repo_name = extract_repo_name(request.repo_url)
        repo_path = build_repo_path(repo_name)

        analysis_result = analyze_repo(request.repo_url)
        summary_result = generate_summary(repo_path)
        readme_result = analyze_readme(repo_path)
        diagram_result = build_architecture_graph(repo_path, repo_name)
        relevant_chunks = retrieve_relevant_chunks(
            repo_path,
            "project overview architecture main flow key modules important files",
            top_k=5,
        )

        ai_summary = None

        if gemini_model is not None:
            try:
                print("Generating AI summary with Gemini...")

                prompt = build_ai_summary_prompt(
                    repo_name=repo_name,
                    analysis_result=analysis_result,
                    summary_result=summary_result,
                    readme_result=readme_result,
                    diagram_result=diagram_result,
                    relevant_chunks=relevant_chunks,
                )

                raw_text = generate_with_gemini(prompt)

                print("AI summary raw response:", raw_text[:1000])

                ai_summary = parse_ai_summary_text(raw_text)

                if not ai_summary:
                    ai_summary = {
                        "project_title": repo_name,
                        "project_purpose": "AI summary generation returned an empty result.",
                        "executive_summary": (
                            "The repository was analyzed, but the AI summary could "
                            "not be generated from the model response."
                        ),
                        "architecture_style": summary_result.get("architecture_style", "General"),
                        "main_flow": [],
                        "key_capabilities": [],
                        "core_modules": [],
                        "tech_stack": readme_result.get("summary", {}).get("tech_stack", []),
                        "important_files": [],
                        "developer_insights": [],
                        "notable_observations": [],
                    }

            except Exception as e:
                print("AI summary generation failed:", str(e))

                ai_summary = {
                    "project_title": repo_name,
                    "project_purpose": "AI summary generation is temporarily unavailable.",
                    "executive_summary": (
                        "The repository was analyzed successfully, but Gemini could "
                        "not generate the detailed AI summary at this time."
                    ),
                    "architecture_style": summary_result.get("architecture_style", "General"),
                    "main_flow": [],
                    "key_capabilities": readme_result.get("summary", {}).get("features", []),
                    "core_modules": [],
                    "tech_stack": readme_result.get("summary", {}).get("tech_stack", []),
                    "important_files": [],
                    "developer_insights": [],
                    "notable_observations": [f"Gemini error: {str(e)}"],
                }
        else:
            ai_summary = {
                "project_title": repo_name,
                "project_purpose": "Gemini client is not configured.",
                "executive_summary": (
                    "The repository was analyzed successfully, but no Gemini API key "
                    "is available, so the AI summary could not be generated."
                ),
                "architecture_style": summary_result.get("architecture_style", "General"),
                "main_flow": [],
                "key_capabilities": readme_result.get("summary", {}).get("features", []),
                "core_modules": [],
                "tech_stack": readme_result.get("summary", {}).get("tech_stack", []),
                "important_files": [],
                "developer_insights": [],
                "notable_observations": [],
            }

        return {
            "analysis": analysis_result,
            "summary": summary_result,
            "readme_analysis": readme_result,
            "diagram": diagram_result,
            "ai_summary": ai_summary,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analyze failed: {str(e)}")


@app.post("/diagram")
def generate_diagram(request: RepoRequest):
    try:
        repo_name = extract_repo_name(request.repo_url)
        repo_path = build_repo_path(repo_name)

        ensure_repo_available(request.repo_url, repo_path)

        result = build_architecture_graph(repo_path, repo_name)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagram generation failed: {str(e)}")


@app.post("/chat")
def chat_with_repo(payload: dict = Body(...)):
    """
    Gemini-powered repo chatbot with code retrieval.
    """
    try:
        if gemini_model is None:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY is missing. Add it to backend/.env",
            )

        message = str(payload.get("message", "")).strip()
        repo_url = str(payload.get("repo_url", "")).strip()

        if not message:
            raise HTTPException(status_code=400, detail="Message is required.")

        if not repo_url:
            raise HTTPException(status_code=400, detail="Repository URL is required.")

        repo_name = extract_repo_name(repo_url)
        repo_path = build_repo_path(repo_name)

        analysis_result = analyze_repo(repo_url)
        summary_result = generate_summary(repo_path)
        readme_result = analyze_readme(repo_path)
        relevant_chunks = retrieve_relevant_chunks(repo_path, message, top_k=5)

        readme_summary = readme_result.get("summary", {}) if isinstance(readme_result, dict) else {}

        chunk_text = "\n\n".join(
            [
                f"FILE: {chunk['file_path']}\nCHUNK:\n{chunk['content']}"
                for chunk in relevant_chunks
            ]
        )

        prompt = f"""
You are an expert AI codebase assistant.

Answer the user's question using:
1. repository analysis
2. README summary
3. retrieved code/file snippets

Be accurate and grounded.
If the answer is uncertain, say so.
When useful, mention which files are relevant.

Repository name:
{repo_name}

Repository analysis:
{analysis_result}

Repository summary:
{summary_result}

README summary:
{readme_summary}

Relevant code/file snippets:
{chunk_text}

User question:
{message}
"""

        text = generate_with_gemini(prompt)

        if not text:
            text = "I could not generate a grounded answer from the repository context."

        return {
            "response": text,
            "evidence": [
                {
                    "file_path": chunk["file_path"],
                    "chunk_id": chunk["chunk_id"],
                }
                for chunk in relevant_chunks
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@app.post("/explain-file")
def explain_file_with_ai(payload: dict = Body(...)):
    """
    Explain a specific file from the repository using Gemini.
    """
    try:
        if gemini_model is None:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY is missing. Add it to backend/.env",
            )

        repo_url = str(payload.get("repo_url", "")).strip()
        file_path = str(payload.get("file_path", "")).strip()

        if not repo_url:
            raise HTTPException(status_code=400, detail="Repository URL is required.")

        if not file_path:
            raise HTTPException(status_code=400, detail="File path is required.")

        repo_name = extract_repo_name(repo_url)
        repo_path = build_repo_path(repo_name)

        content = get_file_content(repo_path, file_path)

        if not content:
            raise HTTPException(status_code=404, detail="Could not load file content.")

        truncated_content = content[:12000]

        prompt = f"""
You are an expert AI codebase assistant.

Explain this file clearly for a developer.
Your answer should include:
1. What this file is responsible for
2. Key functions / logic inside it
3. How it connects to the repository architecture
4. Important implementation notes

Repository: {repo_name}
File path: {file_path}

File content:
{truncated_content}
"""

        explanation = generate_with_gemini(prompt)

        if not explanation:
            explanation = "I could not generate an explanation for this file."

        return {
            "file_path": file_path,
            "content": truncated_content,
            "explanation": explanation,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File explanation failed: {str(e)}")


@app.post("/repo-tree")
def get_repository_tree(request: RepoRequest):
    try:
        repo_name = extract_repo_name(request.repo_url)
        repo_path = build_repo_path(repo_name)

        ensure_repo_available(request.repo_url, repo_path)

        tree = build_repo_tree(repo_path)

        return {
            "repository": repo_name,
            "tree": tree,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Repo tree generation failed: {str(e)}")


@app.post("/architecture-intel")
def architecture_intel(payload: dict = Body(...)):
    """
    Generate AI-powered architecture intelligence for the repository.
    """
    try:
        if gemini_model is None:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY is missing. Add it to backend/.env",
            )

        repo_url = str(payload.get("repo_url", "")).strip()

        if not repo_url:
            raise HTTPException(status_code=400, detail="Repository URL is required.")

        repo_name = extract_repo_name(repo_url)
        repo_path = build_repo_path(repo_name)

        analysis_result = analyze_repo(repo_url)
        summary_result = generate_summary(repo_path)
        readme_result = analyze_readme(repo_path)
        diagram_result = build_architecture_graph(repo_path, repo_name)

        key_files = diagram_result.get("key_files", {}) if isinstance(diagram_result, dict) else {}

        prompt = f"""
You are an expert software architect.

Analyze this repository and produce a concise but useful architecture intelligence summary.

Return your answer in this exact JSON format:

{{
  "system_overview": "...",
  "request_flow": ["step 1", "step 2", "step 3"],
  "core_modules": [
    {{"name": "...", "role": "..."}},
    {{"name": "...", "role": "..."}}
  ],
  "architecture_notes": [
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

Detected key files:
{key_files}
"""

        try:
            text = generate_with_gemini(prompt)

            if not text:
                text = "Architecture intelligence could not be generated for this repository."

            return {
                "raw_response": text
            }

        except Exception:
            return {
                "raw_response": (
                    "Architecture intelligence is temporarily unavailable because the AI model "
                    "is currently under high demand. Please try again shortly."
                )
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Architecture intelligence failed: {str(e)}")