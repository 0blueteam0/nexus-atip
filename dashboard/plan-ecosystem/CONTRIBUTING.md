# Contributing to Plan Ecosystem Dashboard

Thank you for your interest in contributing!

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Access at http://localhost:7847

## Project Structure

```
collectors/     # Data collection modules
public/js/      # Frontend JavaScript
public/css/     # Stylesheets
plugins/        # Optional plugins
```

## Code Style

- Use ES6+ syntax
- Follow existing patterns in codebase
- Add JSDoc comments for new functions
- Use meaningful variable names

## Adding New Features

### New Collector

1. Create `collectors/my-collector.js`
2. Export collection functions
3. Import in `server.js`
4. Add API endpoints

### New UI Tab

1. Add tab button in `public/index.html`
2. Add content section with `id="content-tabname"`
3. Create `public/js/my-component.js`
4. Add to `switchTab()` in `app.js`
5. Include script in `index.html`

## Design Guidelines

### Colors (Anti-AI-Slop)

Use these colors only:

| Color | Hex | Usage |
|-------|-----|-------|
| Teal | #0F766E | Primary actions |
| Emerald | #059669 | Success states |
| Sky | #0284C7 | Links, info |
| Amber | #D97706 | Warnings |
| Red | #DC2626 | Errors |
| Slate | #475569 | Neutral |

**Prohibited**: Purple, Indigo, Violet gradients

### CSS Classes

Use Tailwind utility classes. Prefer:
- `bg-slate-800` for cards
- `border-slate-700` for borders
- `text-slate-200` for text
- `rounded-lg` for corners

## Pull Request Process

1. Create feature branch from `main`
2. Make changes with clear commits
3. Test locally with Docker
4. Submit PR with description
5. Wait for review

## Testing

```bash
# Run E2E API tests
curl http://localhost:7847/api/stats

# Verify all tabs load
# Check browser console for errors
```

## Questions?

Open an issue for discussion.
