/**
 * Architecture Map View - 7-Layer Interactive Diagram
 *
 * Renders the NEXUS 7-layer architecture with real-time status.
 * Each layer shows health (green/yellow/red) and data flow animation.
 *
 * @module nexus/monitor/views/architecture-map
 */

'use strict';

(function () {
  const LAYERS = [
    { id: 'L7', name: 'Protocols', desc: 'MCP Gateway + A2A Hub', ports: ['ToolExecutionPort', 'ContextEnginePort', 'PolicyPort'] },
    { id: 'L6', name: 'Observability', desc: 'Cost/Quality + Evolution', ports: ['ObservabilityPort', 'EvolutionPort'] },
    { id: 'L5', name: 'Data/RAG', desc: 'Qdrant + Memory', ports: ['RAGPort', 'MemoryPort'] },
    { id: 'L4', name: 'Orchestration', desc: 'Workflow + n8n', ports: ['WorkflowPort'] },
    { id: 'L3', name: 'Agent Frameworks', desc: 'GraphEngine + LangGraph', ports: ['AgentFrameworkPort', 'AgentLoopPort'] },
    { id: 'L2', name: 'AI Models', desc: 'Claude + Gemini + Codex + Ollama', ports: ['ModelRouterPort', 'LocalLLMPort'] },
    { id: 'L1', name: 'Infrastructure', desc: 'Docker + Services', ports: ['InfraPort'] }
  ];

  const container = document.getElementById('arch-map');
  const layerStatus = {};

  function render() {
    container.innerHTML = '';

    LAYERS.forEach((layer, i) => {
      // Layer card
      const card = document.createElement('div');
      card.className = 'layer-card';
      card.id = 'layer-' + layer.id;

      const status = layerStatus[layer.id] || 'active';
      if (status === 'active') card.classList.add('active');
      else if (status === 'warning') card.classList.add('warning');
      else if (status === 'error') card.classList.add('error');

      card.innerHTML = `
        <span class="layer-id">${layer.id}</span>
        <span class="layer-name">${layer.name} <span style="color:var(--text-secondary);font-size:11px">${layer.desc}</span></span>
        <span class="layer-ports">${layer.ports.join(', ')}</span>
        <span class="layer-status" id="status-${layer.id}"></span>
      `;
      container.appendChild(card);

      // Data flow arrow between layers
      if (i < LAYERS.length - 1) {
        const flow = document.createElement('div');
        flow.className = 'data-flow';
        flow.id = 'flow-' + layer.id;
        flow.textContent = '|  |  |';
        container.appendChild(flow);
      }
    });
  }

  function updateLayerStatus(layerId, status) {
    layerStatus[layerId] = status;
    const card = document.getElementById('layer-' + layerId);
    if (!card) return;

    card.classList.remove('active', 'warning', 'error');
    if (status === 'active') card.classList.add('active');
    else if (status === 'warning') card.classList.add('warning');
    else if (status === 'error') card.classList.add('error');

    const dot = document.getElementById('status-' + layerId);
    if (dot) {
      dot.style.background = status === 'active' ? 'var(--accent-green)' :
        status === 'warning' ? 'var(--accent-yellow)' : 'var(--accent-red)';
    }
  }

  function activateFlow(layerId) {
    const flow = document.getElementById('flow-' + layerId);
    if (flow) {
      flow.className = 'data-flow active-flow';
      flow.textContent = 'v  v  v';
      setTimeout(() => {
        flow.className = 'data-flow';
        flow.textContent = '|  |  |';
      }, 1500);
    }
  }

  // Fetch initial layer status from API
  function fetchLayerStatus() {
    fetch('/api/layers')
      .then(r => r.json())
      .then(layers => {
        layers.forEach(l => {
          layerStatus[l.id] = l.status;
        });
        render();
      })
      .catch(() => render());
  }

  // Event handler
  const prevHandler = window.onNexusEvent;
  window.onNexusEvent = function (type, data) {
    if (prevHandler) prevHandler(type, data);

    // Map events to layers
    if (type.startsWith('system:')) {
      updateLayerStatus('L1', 'active');
      activateFlow('L1');
    } else if (type.startsWith('provider:')) {
      updateLayerStatus('L2', 'active');
      activateFlow('L2');
    } else if (type.startsWith('graph:')) {
      updateLayerStatus('L3', 'active');
      activateFlow('L3');
    } else if (type.startsWith('task:')) {
      updateLayerStatus('L4', 'active');
      activateFlow('L4');
    } else if (type.startsWith('deep-agent:') || type.startsWith('subagent:')) {
      updateLayerStatus('L5', 'active');
      activateFlow('L5');
    } else if (type.startsWith('evolution:')) {
      updateLayerStatus('L6', 'active');
      activateFlow('L6');
    } else if (type.startsWith('team:') || type.startsWith('hitl:')) {
      updateLayerStatus('L7', 'active');
      activateFlow('L7');
    }

    // Error detection
    if (type.includes('failed') || type.includes('error')) {
      const layerMap = {
        'task:failed': 'L4',
        'provider:health': data && data.status === 'down' ? 'L2' : null
      };
      const target = layerMap[type];
      if (target) updateLayerStatus(target, 'error');
    }
  };

  fetchLayerStatus();
})();
