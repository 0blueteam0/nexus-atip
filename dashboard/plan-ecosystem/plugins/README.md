# Dashboard Plugins

## Overview
Custom collectors and UI extensions for Plan Ecosystem Dashboard v3.0.

## Plugin Structure

```
plugins/
  my-plugin/
    manifest.json    # Plugin metadata (required)
    collector.js     # Data collector (optional)
    router.js        # Express router (optional)
    ui.html          # Custom UI fragment (optional)
```

## manifest.json Format

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Your Name",
  "main": "collector.js",
  "router": "router.js",
  "api": "/api/plugins/my-plugin",
  "tab": {
    "id": "my-tab",
    "label": "My Tab",
    "icon": "star"
  },
  "dependencies": []
}
```

## Creating a Plugin

### 1. Create Directory
```bash
mkdir plugins/my-plugin
```

### 2. Create manifest.json
Define your plugin metadata.

### 3. Create collector.js (optional)
```javascript
// plugins/my-plugin/collector.js
function collectData() {
    return { message: 'Hello from plugin!' };
}

module.exports = { collectData };
```

### 4. Create router.js (optional)
```javascript
// plugins/my-plugin/router.js
const express = require('express');
const router = express.Router();
const { collectData } = require('./collector');

router.get('/', (req, res) => {
    res.json(collectData());
});

module.exports = router;
```

## API Reference

### Plugin Loader
Plugins are loaded automatically on server start from `plugins/` directory.

### Events
Plugins can emit Socket.io events:
```javascript
// In router.js
router.post('/action', (req, res) => {
    req.io.emit('plugin-event', { data: 'something' });
    res.json({ success: true });
});
```

### Accessing Main Data
Plugins can import main collectors:
```javascript
const { collectAllPlans } = require('../../collectors/plan-collector');
```

## Example Plugin
See `plugins/example/` for a complete example.

## Loading Plugins
Plugins are loaded automatically. Check server logs for:
```
[+] Plugin loaded: my-plugin (v1.0.0)
```

## Disabling Plugins
Rename the plugin directory or add `"enabled": false` to manifest.json.
