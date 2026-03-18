#!/usr/bin/env python3
"""
Marker PDF MCP Server
PDF to Markdown conversion with structure preservation
"""

import sys
import json
import os
from pathlib import Path

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Lazy load marker
_converter = None

def get_converter():
    """Get or create Marker converter"""
    global _converter
    if _converter is None:
        from marker.converters.pdf import PdfConverter
        from marker.models import create_model_dict
        _converter = PdfConverter(artifact_dict=create_model_dict())
    return _converter

# Create server
app = Server("marker-mcp")

@app.list_tools()
async def list_tools():
    """List available PDF tools"""
    return [
        Tool(
            name="convert_pdf",
            description="Convert PDF to Markdown with structure preservation",
            inputSchema={
                "type": "object",
                "properties": {
                    "pdf_path": {
                        "type": "string",
                        "description": "Path to PDF file"
                    },
                    "output_format": {
                        "type": "string",
                        "enum": ["markdown", "json", "html"],
                        "default": "markdown"
                    },
                    "extract_images": {
                        "type": "boolean",
                        "default": False,
                        "description": "Extract images from PDF"
                    }
                },
                "required": ["pdf_path"]
            }
        ),
        Tool(
            name="extract_text",
            description="Extract plain text from PDF",
            inputSchema={
                "type": "object",
                "properties": {
                    "pdf_path": {
                        "type": "string",
                        "description": "Path to PDF file"
                    },
                    "page_range": {
                        "type": "string",
                        "description": "Page range (e.g., '1-5' or '1,3,5')"
                    }
                },
                "required": ["pdf_path"]
            }
        ),
        Tool(
            name="analyze_structure",
            description="Analyze PDF document structure (headings, tables, images)",
            inputSchema={
                "type": "object",
                "properties": {
                    "pdf_path": {
                        "type": "string",
                        "description": "Path to PDF file"
                    }
                },
                "required": ["pdf_path"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    """Execute PDF tool"""
    try:
        if name == "convert_pdf":
            return await convert_pdf(arguments)
        elif name == "extract_text":
            return await extract_text(arguments)
        elif name == "analyze_structure":
            return await analyze_structure(arguments)
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    except Exception as e:
        return [TextContent(type="text", text=f"Error: {str(e)}")]

async def convert_pdf(args: dict):
    """Convert PDF to markdown"""
    pdf_path = args['pdf_path']
    output_format = args.get('output_format', 'markdown')
    
    if not os.path.exists(pdf_path):
        return [TextContent(type="text", text=f"File not found: {pdf_path}")]
    
    converter = get_converter()
    rendered = converter(pdf_path)
    
    result = {
        "success": True,
        "format": output_format,
        "content": rendered.markdown if output_format == "markdown" else rendered.document.model_dump()
    }
    
    return [TextContent(
        type="text",
        text=json.dumps(result, ensure_ascii=False, indent=2)
    )]

async def extract_text(args: dict):
    """Extract text from PDF"""
    pdf_path = args['pdf_path']
    
    if not os.path.exists(pdf_path):
        return [TextContent(type="text", text=f"File not found: {pdf_path}")]
    
    from pdftext.extraction import plain_text_output
    
    text = plain_text_output(pdf_path)
    
    return [TextContent(
        type="text",
        text=json.dumps({
            "success": True,
            "text": text,
            "char_count": len(text)
        }, ensure_ascii=False, indent=2)
    )]

async def analyze_structure(args: dict):
    """Analyze PDF structure"""
    pdf_path = args['pdf_path']
    
    if not os.path.exists(pdf_path):
        return [TextContent(type="text", text=f"File not found: {pdf_path}")]
    
    converter = get_converter()
    rendered = converter(pdf_path)
    
    # Analyze structure
    structure = {
        "pages": len(rendered.document.pages) if hasattr(rendered.document, 'pages') else 0,
        "has_tables": "table" in rendered.markdown.lower(),
        "has_images": "![" in rendered.markdown,
        "headings": [],
        "word_count": len(rendered.markdown.split())
    }
    
    # Extract headings
    for line in rendered.markdown.split('\n'):
        if line.startswith('#'):
            level = len(line.split()[0])
            title = line.lstrip('#').strip()
            structure["headings"].append({"level": level, "title": title})
    
    return [TextContent(
        type="text",
        text=json.dumps({
            "success": True,
            "structure": structure
        }, ensure_ascii=False, indent=2)
    )]

async def main():
    """Run the MCP server"""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
