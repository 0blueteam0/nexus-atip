# Decision Log

1. Chose v1.1 balanced filenames instead of overwriting v1.0 or light copies.
2. DOCX target set to a middle range between original and light. Actual result: 91 paragraphs, 1366 tokenish words.
3. PPTX target set to 14 slides. Actual result: 14 slides, 711 tokenish words.
4. Used structural QA because rendered visual QA tooling was unavailable in PATH.
5. Did not install global MCP/Office tools because current Python Office libraries were sufficient and user preference discourages automatic installation unless necessary.
