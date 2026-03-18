#!/usr/bin/env python3
"""
PaddleOCR MCP Server
Multi-language OCR with table extraction support
"""

import sys
import json
import base64
import os
from pathlib import Path

# Suppress warnings
os.environ['PADDLE_SILENCE'] = '1'

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Lazy load PaddleOCR to speed up startup
_ocr = None
_table_engine = None

def get_ocr(lang='en'):
    """Get or create PaddleOCR instance"""
    global _ocr
    if _ocr is None:
        from paddleocr import PaddleOCR
        _ocr = PaddleOCR(use_angle_cls=True, lang=lang, show_log=False)
    return _ocr

def get_table_engine():
    """Get or create PPStructure instance for table extraction"""
    global _table_engine
    if _table_engine is None:
        from paddleocr import PPStructure
        _table_engine = PPStructure(show_log=False)
    return _table_engine

# Create server
app = Server("paddleocr-mcp")

@app.list_tools()
async def list_tools():
    """List available OCR tools"""
    return [
        Tool(
            name="ocr_image",
            description="Extract text from image using PaddleOCR. Supports 80+ languages.",
            inputSchema={
                "type": "object",
                "properties": {
                    "image_path": {
                        "type": "string",
                        "description": "Path to image file (provide either image_path or image_base64)"
                    },
                    "image_base64": {
                        "type": "string",
                        "description": "Base64 encoded image (alternative to image_path)"
                    },
                    "lang": {
                        "type": "string",
                        "description": "Language code (en, ch, korean, japan, etc.)",
                        "default": "en"
                    }
                }
            }
        ),
        Tool(
            name="extract_table",
            description="Extract table structure from document image",
            inputSchema={
                "type": "object",
                "properties": {
                    "image_path": {
                        "type": "string",
                        "description": "Path to image file containing table"
                    },
                    "output_format": {
                        "type": "string",
                        "enum": ["html", "markdown", "json"],
                        "default": "markdown"
                    }
                },
                "required": ["image_path"]
            }
        ),
        Tool(
            name="detect_language",
            description="Detect text language in image",
            inputSchema={
                "type": "object",
                "properties": {
                    "image_path": {
                        "type": "string",
                        "description": "Path to image file"
                    }
                },
                "required": ["image_path"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    """Execute OCR tool"""
    try:
        if name == "ocr_image":
            return await ocr_image(arguments)
        elif name == "extract_table":
            return await extract_table(arguments)
        elif name == "detect_language":
            return await detect_language(arguments)
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    except Exception as e:
        return [TextContent(type="text", text=f"Error: {str(e)}")]

async def ocr_image(args: dict):
    """Extract text from image"""
    import tempfile

    # Validate: at least one of image_path or image_base64 must be provided
    if 'image_path' not in args and 'image_base64' not in args:
        return [TextContent(
            type="text",
            text=json.dumps({
                "success": False,
                "error": "Either 'image_path' or 'image_base64' must be provided"
            }, ensure_ascii=False)
        )]

    lang = args.get('lang', 'en')
    ocr = get_ocr(lang)

    # Handle base64 or file path
    if 'image_base64' in args:
        img_data = base64.b64decode(args['image_base64'])
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
            f.write(img_data)
            img_path = f.name
    else:
        img_path = args['image_path']
    
    # Run OCR
    result = ocr.ocr(img_path, cls=True)
    
    # Extract text
    texts = []
    if result and result[0]:
        for line in result[0]:
            if line and len(line) >= 2:
                texts.append(line[1][0])
    
    return [TextContent(
        type="text",
        text=json.dumps({
            "success": True,
            "text": "\n".join(texts),
            "lines": len(texts),
            "lang": lang
        }, ensure_ascii=False, indent=2)
    )]

async def extract_table(args: dict):
    """Extract table from image"""
    img_path = args['image_path']
    output_format = args.get('output_format', 'markdown')
    
    engine = get_table_engine()
    result = engine(img_path)
    
    tables = []
    for item in result:
        if item.get('type') == 'table':
            if output_format == 'html':
                tables.append(item.get('res', {}).get('html', ''))
            elif output_format == 'markdown':
                # Convert HTML table to markdown
                html = item.get('res', {}).get('html', '')
                tables.append(f"```html\n{html}\n```")
            else:
                tables.append(item.get('res', {}))
    
    return [TextContent(
        type="text",
        text=json.dumps({
            "success": True,
            "tables_found": len(tables),
            "tables": tables
        }, ensure_ascii=False, indent=2)
    )]

async def detect_language(args: dict):
    """Detect language in image"""
    img_path = args['image_path']
    
    # Try different language models
    languages = ['en', 'ch', 'korean', 'japan']
    best_lang = 'en'
    best_score = 0
    
    for lang in languages:
        try:
            ocr = get_ocr(lang)
            result = ocr.ocr(img_path, cls=True)
            if result and result[0]:
                # Calculate average confidence
                scores = [line[1][1] for line in result[0] if line and len(line) >= 2]
                if scores:
                    avg_score = sum(scores) / len(scores)
                    if avg_score > best_score:
                        best_score = avg_score
                        best_lang = lang
        except:
            continue
    
    return [TextContent(
        type="text",
        text=json.dumps({
            "detected_language": best_lang,
            "confidence": best_score
        }, ensure_ascii=False, indent=2)
    )]

async def main():
    """Run the MCP server"""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
