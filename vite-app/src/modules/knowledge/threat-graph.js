/**
 * NEXUS ATIP V2.0 - Threat Knowledge Graph
 * STIX 2.1 relationship mapping + MITRE ATT&CK correlation
 */

import { eventBus, EVENTS } from '../../core/event-bus.js';
import { dataStore } from '../../core/data-store.js';
import ATIP_CONFIG from '../../core/config.js';

class ThreatGraph {
  constructor() {
    this._nodes = new Map();
    this._edges = [];
    this._clusters = new Map();
    this._correlations = [];
  }

  async init() {
    // Listen for new threat data
    eventBus.on(EVENTS.THREAT_NEW, (data) => this._onNewThreat(data));
    eventBus.on(EVENTS.IOC_ENRICHED, (data) => this._onIoCEnriched(data));
  }

  /**
   * Add a node to the knowledge graph
   * @param {Object} entity - STIX 2.1 object
   */
  addNode(entity) {
    const id = entity.id || entity._id;
    if (!id) return null;

    const node = {
      id,
      type: entity.type || 'unknown',
      name: entity.name || entity.value || id,
      properties: { ...entity },
      edges: [],
      addedAt: Date.now()
    };

    this._nodes.set(id, node);
    return node;
  }

  /**
   * Add a relationship (edge) between two nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @param {string} relationship - STIX 2.1 relationship type
   * @param {Object} properties - Additional edge properties
   */
  addEdge(sourceId, targetId, relationship, properties = {}) {
    const edge = {
      id: `rel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: sourceId,
      target: targetId,
      relationship,
      ...properties,
      createdAt: Date.now()
    };

    this._edges.push(edge);

    // Update node edge references
    const sourceNode = this._nodes.get(sourceId);
    const targetNode = this._nodes.get(targetId);
    if (sourceNode) sourceNode.edges.push(edge.id);
    if (targetNode) targetNode.edges.push(edge.id);

    return edge;
  }

  /**
   * Build relationships from STIX 2.1 SRO (Relationship Objects)
   * @param {Array} stixObjects - Array of STIX objects
   */
  buildFromSTIX(stixObjects) {
    const stats = { nodes: 0, edges: 0 };

    // First pass: add all SDOs as nodes
    stixObjects.forEach(obj => {
      if (obj.type !== 'relationship' && obj.type !== 'sighting') {
        this.addNode(obj);
        stats.nodes++;
      }
    });

    // Second pass: add SROs as edges
    stixObjects.forEach(obj => {
      if (obj.type === 'relationship') {
        this.addEdge(obj.source_ref, obj.target_ref, obj.relationship_type, {
          description: obj.description,
          confidence: obj.confidence
        });
        stats.edges++;
      } else if (obj.type === 'sighting') {
        this.addEdge(obj.sighting_of_ref, obj.observed_data_refs?.[0], 'sighted', {
          count: obj.count,
          first_seen: obj.first_seen,
          last_seen: obj.last_seen
        });
        stats.edges++;
      }
    });

    eventBus.emit(EVENTS.GRAPH_UPDATED, stats);
    return stats;
  }

  /**
   * Find correlations between threat entities
   * @param {string} nodeId - Starting node ID
   * @param {number} depth - Traversal depth (default 2)
   */
  findCorrelations(nodeId, depth = 2) {
    const visited = new Set();
    const correlations = [];

    const traverse = (currentId, currentDepth) => {
      if (currentDepth > depth || visited.has(currentId)) return;
      visited.add(currentId);

      const relatedEdges = this._edges.filter(
        e => e.source === currentId || e.target === currentId
      );

      relatedEdges.forEach(edge => {
        const neighborId = edge.source === currentId ? edge.target : edge.source;
        const neighbor = this._nodes.get(neighborId);

        if (neighbor) {
          correlations.push({
            from: currentId,
            to: neighborId,
            relationship: edge.relationship,
            node: neighbor,
            depth: currentDepth
          });

          traverse(neighborId, currentDepth + 1);
        }
      });
    };

    traverse(nodeId, 0);

    if (correlations.length > 0) {
      eventBus.emit(EVENTS.CORRELATION_FOUND, {
        rootNode: nodeId,
        correlations: correlations.length,
        depth
      });
    }

    return correlations;
  }

  /**
   * Cluster related entities (campaign grouping)
   */
  clusterByAttribution() {
    this._clusters.clear();

    this._nodes.forEach((node, id) => {
      const attribution = node.properties.attributed_to ||
                          node.properties.origin ||
                          node.properties.created_by_ref;

      if (attribution) {
        if (!this._clusters.has(attribution)) {
          this._clusters.set(attribution, []);
        }
        this._clusters.get(attribution).push(id);
      }
    });

    return Object.fromEntries(this._clusters);
  }

  /**
   * Map nodes to MITRE ATT&CK tactics
   */
  mapToMitre() {
    const matrix = {};
    ATIP_CONFIG.mitre.tactics.forEach(tactic => {
      matrix[tactic] = [];
    });

    this._nodes.forEach((node) => {
      const tactics = node.properties.mitre_attack?.tactics ||
                      node.properties.kill_chain_phases?.map(p => p.phase_name) || [];

      tactics.forEach(tactic => {
        if (matrix[tactic]) {
          matrix[tactic].push({
            id: node.id,
            name: node.name,
            type: node.type,
            techniques: node.properties.mitre_attack?.techniques || []
          });
        }
      });
    });

    return matrix;
  }

  /**
   * Get graph statistics
   */
  getStats() {
    return {
      nodes: this._nodes.size,
      edges: this._edges.length,
      clusters: this._clusters.size,
      correlations: this._correlations.length,
      nodeTypes: this._countByType()
    };
  }

  _countByType() {
    const counts = {};
    this._nodes.forEach(node => {
      counts[node.type] = (counts[node.type] || 0) + 1;
    });
    return counts;
  }

  /**
   * Get nodes for visualization
   */
  getVisualizationData() {
    return {
      nodes: Array.from(this._nodes.values()).map(n => ({
        id: n.id,
        label: n.name,
        type: n.type,
        group: n.properties.origin || n.type
      })),
      edges: this._edges.map(e => ({
        source: e.source,
        target: e.target,
        label: e.relationship
      }))
    };
  }

  _onNewThreat(data) {
    if (data.collection && data.item) {
      this.addNode(data.item);
    }
  }

  _onIoCEnriched(data) {
    if (data.indicator && data.enrichment) {
      const node = this._nodes.get(data.indicator.id);
      if (node) {
        Object.assign(node.properties, data.enrichment);
      }
    }
  }

  destroy() {
    this._nodes.clear();
    this._edges = [];
    this._clusters.clear();
  }
}

export const threatGraph = new ThreatGraph();
export default threatGraph;
