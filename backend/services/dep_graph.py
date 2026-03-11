import os
import ast
import networkx as nx


def find_key_files(repo_path: str):
    """
    Identify important Python files in the repository and group them by role.
    """
    key_files = {
        "entrypoints": [],
        "tools": [],
        "configs": [],
        "models": [],
        "services": [],
        "routes": [],
        "prompts": [],
        "utils": [],
        "others": [],
    }

    important_entry_names = {
        "main.py",
        "app.py",
        "server.py",
        "run.py",
        "index.py",
        "agent.py",
    }

    for root, _, files in os.walk(repo_path):
        for file in files:
            if not file.endswith(".py"):
                continue

            rel_path = os.path.relpath(
                os.path.join(root, file), repo_path
            ).replace("\\", "/")

            lower_file = file.lower()

            if lower_file in important_entry_names:
                key_files["entrypoints"].append(rel_path)

            elif "tool" in lower_file or "helper" in lower_file:
                key_files["tools"].append(rel_path)

            elif "config" in lower_file or "setting" in lower_file:
                key_files["configs"].append(rel_path)

            elif "model" in lower_file:
                key_files["models"].append(rel_path)

            elif "service" in lower_file:
                key_files["services"].append(rel_path)

            elif "route" in lower_file or "api" in lower_file or "controller" in lower_file:
                key_files["routes"].append(rel_path)

            elif "prompt" in lower_file:
                key_files["prompts"].append(rel_path)

            elif "util" in lower_file:
                key_files["utils"].append(rel_path)

            else:
                key_files["others"].append(rel_path)

    return key_files


def shorten_label(path: str, max_len: int = 32):
    if len(path) <= max_len:
        return path
    return "..." + path[-(max_len - 3):]


def architecture_to_mermaid(repo_name: str, key_files: dict):
    """
    Build a neat architecture flowchart for Mermaid.
    """

    lines = [
        "flowchart TD",
        f'repo["Repository: {repo_name}"]',
    ]

    node_count = 0

    def add_group(items, prefix):
        nonlocal node_count
        nodes = []

        for item in items[:3]:
            node_id = f"{prefix}{node_count}"
            node_count += 1

            label = shorten_label(item)

            lines.append(f'{node_id}["{label}"]')
            nodes.append(node_id)

        return nodes

    entry = add_group(key_files["entrypoints"], "entry")
    routes = add_group(key_files["routes"], "route")
    services = add_group(key_files["services"], "svc")
    tools = add_group(key_files["tools"], "tool")

    for e in entry:
        lines.append(f"repo --> {e}")

    for r in routes:
        if services:
            lines.append(f"{r} --> {services[0]}")

    for s in services:
        if tools:
            lines.append(f"{s} --> {tools[0]}")

    return "\n".join(lines)


def build_architecture_graph(repo_path: str, repo_name: str):

    key_files = find_key_files(repo_path)

    mermaid = architecture_to_mermaid(repo_name, key_files)

    total_nodes = sum(min(len(v), 3) for v in key_files.values())

    return {
        "repository": repo_name,
        "key_files": key_files,
        "nodes": total_nodes,
        "edges": 0,
        "mermaid": mermaid,
    }


# --------------------------------------------------
# NEW FUNCTIONS REQUIRED BY main.py
# --------------------------------------------------


def build_python_import_graph(repo_path: str):
    """
    Build a dependency graph of Python imports.
    """

    G = nx.DiGraph()

    for root, _, files in os.walk(repo_path):

        for file in files:

            if not file.endswith(".py"):
                continue

            file_path = os.path.join(root, file)

            module_name = os.path.relpath(file_path, repo_path).replace("\\", "/")

            G.add_node(module_name)

            try:
                with open(file_path, "r", encoding="utf-8") as f:

                    tree = ast.parse(f.read())

                for node in ast.walk(tree):

                    if isinstance(node, ast.Import):

                        for n in node.names:
                            G.add_edge(module_name, n.name)

                    elif isinstance(node, ast.ImportFrom):

                        if node.module:
                            G.add_edge(module_name, node.module)

            except Exception:
                continue

    return G


def graph_to_mermaid(G):
    """
    Convert NetworkX graph into Mermaid syntax.
    """

    lines = ["flowchart TD"]

    for src, dst in G.edges():

        src_clean = src.replace(".", "_").replace("/", "_")
        dst_clean = dst.replace(".", "_").replace("/", "_")

        lines.append(f"{src_clean} --> {dst_clean}")

    return "\n".join(lines)