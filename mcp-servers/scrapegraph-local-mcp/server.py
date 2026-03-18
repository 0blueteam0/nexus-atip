#!/usr/bin/env python3
"""
ScrapeGraphAI Local MCP Server
- Uses local Ollama models (FREE)
- No API key required
- Tools: smart_scraper, markdownify, search_scraper
"""

import asyncio
import json
import os
from typing import Any, Optional

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

try:
    from scrapegraphai.graphs import SmartScraperGraph, SearchGraph

    SCRAPEGRAPH_AVAILABLE = True
    SCRAPEGRAPH_IMPORT_ERROR = ""
except Exception as exc:
    SmartScraperGraph = None
    SearchGraph = None
    SCRAPEGRAPH_AVAILABLE = False
    SCRAPEGRAPH_IMPORT_ERROR = str(exc)

# Configuration
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


def missing_runtime_response() -> list[TextContent]:
    """Return a stable response when optional runtime dependencies are unavailable."""
    issues = []

    if not SCRAPEGRAPH_AVAILABLE:
        issues.append(f"scrapegraphai unavailable: {SCRAPEGRAPH_IMPORT_ERROR}")

    issues.append(f"ollama endpoint configured: {OLLAMA_BASE_URL}")

    return [
        TextContent(
            type="text",
            text=(
                "scrapegraph-local runtime is not ready. "
                + " | ".join(issues)
            ),
        )
    ]

def get_graph_config(model: str = None) -> dict:
    """Get graph configuration for Ollama"""
    return {
        "llm": {
            "model": f"ollama/{model or OLLAMA_MODEL}",
            "base_url": OLLAMA_BASE_URL,
            "model_tokens": 8192,
        },
        "verbose": False,
        "headless": True,
    }

# Create MCP server
app = Server("scrapegraph-local")

@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools"""
    return [
        Tool(
            name="smart_scraper",
            description="Extract structured data from a webpage using AI. Provide a URL and a prompt describing what to extract.",
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL of the webpage to scrape"
                    },
                    "prompt": {
                        "type": "string",
                        "description": "What information to extract (e.g., 'Extract all product names and prices')"
                    },
                    "model": {
                        "type": "string",
                        "description": "Ollama model to use (default: llama3.2)",
                        "default": "llama3.2"
                    }
                },
                "required": ["url", "prompt"]
            }
        ),
        Tool(
            name="markdownify",
            description="Convert a webpage to clean Markdown format",
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL of the webpage to convert"
                    }
                },
                "required": ["url"]
            }
        ),
        Tool(
            name="search_scraper",
            description="Search the web and extract information from results using AI",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "prompt": {
                        "type": "string",
                        "description": "What information to extract from search results"
                    },
                    "model": {
                        "type": "string",
                        "description": "Ollama model to use (default: llama3.2)",
                        "default": "llama3.2"
                    }
                },
                "required": ["query", "prompt"]
            }
        ),
        Tool(
            name="scrape_local_html",
            description="Extract data from local HTML content using AI",
            inputSchema={
                "type": "object",
                "properties": {
                    "html": {
                        "type": "string",
                        "description": "HTML content to analyze"
                    },
                    "prompt": {
                        "type": "string",
                        "description": "What information to extract"
                    },
                    "model": {
                        "type": "string",
                        "description": "Ollama model to use (default: llama3.2)",
                        "default": "llama3.2"
                    }
                },
                "required": ["html", "prompt"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Execute tool"""
    try:
        if name == "smart_scraper":
            return await smart_scraper(
                arguments["url"],
                arguments["prompt"],
                arguments.get("model")
            )
        elif name == "markdownify":
            return await markdownify(arguments["url"])
        elif name == "search_scraper":
            return await search_scraper(
                arguments["query"],
                arguments["prompt"],
                arguments.get("model")
            )
        elif name == "scrape_local_html":
            return await scrape_local_html(
                arguments["html"],
                arguments["prompt"],
                arguments.get("model")
            )
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    except Exception as e:
        return [TextContent(type="text", text=f"Error: {str(e)}")]

async def smart_scraper(url: str, prompt: str, model: str = None) -> list[TextContent]:
    """Smart scraper using ScrapeGraphAI"""
    if not SCRAPEGRAPH_AVAILABLE:
        return missing_runtime_response()

    config = get_graph_config(model)

    graph = SmartScraperGraph(
        prompt=prompt,
        source=url,
        config=config
    )

    # Run in thread pool to avoid blocking
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, graph.run)

    return [TextContent(
        type="text",
        text=json.dumps(result, indent=2, ensure_ascii=False)
    )]

async def markdownify(url: str) -> list[TextContent]:
    """Convert webpage to Markdown"""
    if not SCRAPEGRAPH_AVAILABLE:
        return missing_runtime_response()

    config = get_graph_config()

    graph = SmartScraperGraph(
        prompt="Convert this entire webpage to clean, well-formatted Markdown. Preserve all text content, headings, lists, and links.",
        source=url,
        config=config
    )

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, graph.run)

    if isinstance(result, dict):
        result = result.get("markdown", str(result))

    return [TextContent(type="text", text=str(result))]

async def search_scraper(query: str, prompt: str, model: str = None) -> list[TextContent]:
    """Search and extract information"""
    if not SCRAPEGRAPH_AVAILABLE:
        return missing_runtime_response()

    config = get_graph_config(model)

    graph = SearchGraph(
        prompt=f"Search for: {query}. Then {prompt}",
        config=config
    )

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, graph.run)

    return [TextContent(
        type="text",
        text=json.dumps(result, indent=2, ensure_ascii=False)
    )]

async def scrape_local_html(html: str, prompt: str, model: str = None) -> list[TextContent]:
    """Scrape local HTML content"""
    if not SCRAPEGRAPH_AVAILABLE:
        return missing_runtime_response()

    config = get_graph_config(model)

    graph = SmartScraperGraph(
        prompt=prompt,
        source=html,
        config=config
    )

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, graph.run)

    return [TextContent(
        type="text",
        text=json.dumps(result, indent=2, ensure_ascii=False)
    )]

async def main():
    """Run the MCP server"""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())
