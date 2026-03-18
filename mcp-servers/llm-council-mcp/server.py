"""
LLM Council MCP Server - Karpathy's 3-Stage Deliberation System

This MCP server wraps the llm-council library to provide Claude Code with
access to multi-model deliberation capabilities through the MCP protocol.

Key Features:
- 3-stage deliberation: Individual responses → Anonymous peer review → Chairman synthesis
- Multiple frontier models (GPT-5.1, Gemini-3-Pro, Claude-Sonnet-4.5, Grok-4)
- Anonymous peer review prevents model favoritism
- Aggregate rankings show consensus quality

Tools Provided:
- council_ask: Full 3-stage deliberation process
- council_quick: Stage 1 only (quick opinion collection)
"""

import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Any

# Add llm-council backend to path
LLM_COUNCIL_PATH = Path(__file__).parent.parent.parent / "llm-council"
sys.path.insert(0, str(LLM_COUNCIL_PATH))

try:
    from dotenv import load_dotenv
    script_dir = Path(__file__).parent
    env_file = script_dir / ".env"
    if env_file.exists():
        load_dotenv(dotenv_path=env_file)
    # Also try llm-council's .env
    council_env = LLM_COUNCIL_PATH / ".env"
    if council_env.exists():
        load_dotenv(dotenv_path=council_env)
except ImportError:
    pass

from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.types import (
    ServerCapabilities,
    TextContent,
    Tool,
    ToolsCapability,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

# Create MCP server
server: Server = Server("llm-council")

# Version
__version__ = "1.0.0"


def get_council_tools() -> list[Tool]:
    """Define available council tools."""
    return [
        Tool(
            name="council_ask",
            description="""Full 3-stage LLM Council deliberation for complex questions.

Stage 1: Parallel queries to multiple frontier models (GPT-5.1, Gemini-3-Pro, Claude-Sonnet-4.5, Grok-4)
Stage 2: Anonymous peer review - each model ranks others' responses without knowing who wrote them
Stage 3: Chairman model synthesizes final answer considering all responses and rankings

Best for: Complex decisions, controversial topics, questions needing multiple perspectives.
Returns: Individual responses, peer rankings, aggregate scores, and synthesized final answer.""",
            inputSchema={
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The question to deliberate on"
                    }
                },
                "required": ["question"]
            }
        ),
        Tool(
            name="council_quick",
            description="""Quick opinion collection from multiple models (Stage 1 only).

Queries multiple frontier models in parallel and returns their individual responses.
No peer review or synthesis - just raw opinions from each model.

Best for: Quick sanity checks, gathering diverse perspectives, time-sensitive questions.
Returns: Individual responses from each council model.""",
            inputSchema={
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The question to ask all models"
                    }
                },
                "required": ["question"]
            }
        ),
        Tool(
            name="council_config",
            description="""View current council configuration.

Shows which models are in the council and who is the chairman.""",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        )
    ]


@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    """List available council tools."""
    logger.info("MCP client requested tool list")
    return get_council_tools()


@server.call_tool()
async def handle_call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Handle tool execution requests."""
    logger.info(f"Tool call: {name}")
    
    try:
        if name == "council_ask":
            return await handle_council_ask(arguments)
        elif name == "council_quick":
            return await handle_council_quick(arguments)
        elif name == "council_config":
            return await handle_council_config(arguments)
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    except Exception as e:
        logger.error(f"Tool execution error: {e}")
        return [TextContent(type="text", text=f"Error: {str(e)}")]


async def handle_council_ask(arguments: dict[str, Any]) -> list[TextContent]:
    """Execute full 3-stage council deliberation."""
    question = arguments.get("question", "")
    if not question:
        return [TextContent(type="text", text="Error: No question provided")]
    
    logger.info(f"Starting full council deliberation for: {question[:100]}...")
    
    try:
        # Import council functions
        from backend.council import run_full_council
        
        # Run the full 3-stage process
        stage1_results, stage2_results, stage3_result, metadata = await run_full_council(question)
        
        # Format the response
        output = format_council_response(
            question, stage1_results, stage2_results, stage3_result, metadata
        )
        
        return [TextContent(type="text", text=output)]
        
    except ImportError as e:
        logger.error(f"Import error: {e}")
        return [TextContent(type="text", text=f"Error importing council modules: {e}\nMake sure llm-council is properly installed.")]
    except Exception as e:
        logger.error(f"Council deliberation error: {e}")
        return [TextContent(type="text", text=f"Error during deliberation: {str(e)}")]


async def handle_council_quick(arguments: dict[str, Any]) -> list[TextContent]:
    """Execute quick Stage 1 only - parallel model queries."""
    question = arguments.get("question", "")
    if not question:
        return [TextContent(type="text", text="Error: No question provided")]
    
    logger.info(f"Starting quick council query for: {question[:100]}...")
    
    try:
        from backend.council import stage1_collect_responses
        
        # Run Stage 1 only
        stage1_results = await stage1_collect_responses(question)
        
        # Format quick response
        output = format_quick_response(question, stage1_results)
        
        return [TextContent(type="text", text=output)]
        
    except ImportError as e:
        logger.error(f"Import error: {e}")
        return [TextContent(type="text", text=f"Error importing council modules: {e}")]
    except Exception as e:
        logger.error(f"Quick query error: {e}")
        return [TextContent(type="text", text=f"Error during quick query: {str(e)}")]


async def handle_council_config(arguments: dict[str, Any]) -> list[TextContent]:
    """Show current council configuration."""
    try:
        from backend.config import COUNCIL_MODELS, CHAIRMAN_MODEL
        
        output = "## LLM Council Configuration\n\n"
        output += "### Council Members\n"
        for i, model in enumerate(COUNCIL_MODELS, 1):
            output += f"{i}. {model}\n"
        output += f"\n### Chairman Model\n{CHAIRMAN_MODEL}\n"
        output += "\n### Process\n"
        output += "1. Stage 1: All council members answer independently\n"
        output += "2. Stage 2: Each member anonymously ranks others' responses\n"
        output += "3. Stage 3: Chairman synthesizes final answer\n"
        
        return [TextContent(type="text", text=output)]
        
    except ImportError as e:
        return [TextContent(type="text", text=f"Error loading config: {e}")]


def format_council_response(
    question: str,
    stage1_results: list,
    stage2_results: list,
    stage3_result: dict,
    metadata: dict
) -> str:
    """Format the full council response."""
    output = "# LLM Council Deliberation Results\n\n"
    output += f"**Question:** {question}\n\n"
    
    # Stage 1: Individual Responses
    output += "---\n## Stage 1: Individual Model Responses\n\n"
    for result in stage1_results:
        model = result.get('model', 'Unknown')
        response = result.get('response', 'No response')
        output += f"### {model}\n{response}\n\n"
    
    # Stage 2: Peer Rankings
    output += "---\n## Stage 2: Anonymous Peer Rankings\n\n"
    label_to_model = metadata.get('label_to_model', {})
    
    for result in stage2_results:
        model = result.get('model', 'Unknown')
        parsed = result.get('parsed_ranking', [])
        output += f"### {model}'s Ranking\n"
        if parsed:
            for i, label in enumerate(parsed, 1):
                real_model = label_to_model.get(label, label)
                output += f"{i}. {label} ({real_model})\n"
        output += "\n"
    
    # Aggregate Rankings
    output += "### Aggregate Rankings (Average Position)\n"
    aggregate = metadata.get('aggregate_rankings', [])
    for rank in aggregate:
        model = rank.get('model', 'Unknown')
        avg = rank.get('average_rank', 0)
        count = rank.get('rankings_count', 0)
        output += f"- **{model}**: {avg:.2f} (from {count} votes)\n"
    output += "\n"
    
    # Stage 3: Final Synthesis
    output += "---\n## Stage 3: Chairman's Final Synthesis\n\n"
    chairman = stage3_result.get('model', 'Chairman')
    synthesis = stage3_result.get('response', 'No synthesis available')
    output += f"**Chairman ({chairman}):**\n\n{synthesis}\n"
    
    return output


def format_quick_response(question: str, stage1_results: list) -> str:
    """Format quick Stage 1 only response."""
    output = "# Quick Council Opinions\n\n"
    output += f"**Question:** {question}\n\n"
    output += "---\n"
    
    for result in stage1_results:
        model = result.get('model', 'Unknown')
        response = result.get('response', 'No response')
        output += f"## {model}\n{response}\n\n---\n"
    
    return output


async def main():
    """Main entry point for the MCP server."""
    # Check for API key
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        logger.warning("OPENROUTER_API_KEY not set - council tools will fail")
    else:
        logger.info("OPENROUTER_API_KEY found")
    
    logger.info(f"LLM Council MCP Server v{__version__} starting...")
    logger.info(f"Council path: {LLM_COUNCIL_PATH}")
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="llm-council",
                server_version=__version__,
                capabilities=ServerCapabilities(
                    tools=ToolsCapability(),
                ),
            ),
        )


def run():
    """Console script entry point."""
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    run()
