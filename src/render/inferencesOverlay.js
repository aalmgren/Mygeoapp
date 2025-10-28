// Generic, domain-agnostic inference overlay renderer with collision detection
// Reads inference_rules from context.json and dynamically creates nodes/links

import { showClusterMap } from '../interactions/clusterMap.js';

// 🔥 CACHE GLOBAL para evitar duplicação
const createdInferenceNodes = new Map();
const placedInferenceNodes = [];
const createdLinks = new Set(); // Links já criados

export function applyInferencesOverlay({ g, currentNodes, visibleNodes, inferenceNodes, curvedLink, readyForInferences, tooltip }) {
  if (!Array.isArray(currentNodes) || !Array.isArray(inferenceNodes)) {
    return;
  }

  // Se não estiver pronto para mostrar inferências, limpar tudo e resetar cache
  if (!readyForInferences) {
    g.selectAll('.inference-node').remove();
    g.selectAll('.inference-link').remove();
    createdInferenceNodes.clear();
    placedInferenceNodes.length = 0;
    createdLinks.clear();
    return;
  }

  // Collision detection constants
  const MIN_DISTANCE = 100;
  const CARD_WIDTH = 120;
  const CARD_HEIGHT = 40;
  const MAX_ATTEMPTS = 50;
  const VERTICAL_SPACING = 120;

  // Helper: find node by path
  const byPath = (path) => {
    if (path.startsWith('inferences.')) {
      const inferenceId = path.split('.')[1];
      if (createdInferenceNodes.has(inferenceId)) {
        return createdInferenceNodes.get(inferenceId);
      }
      return null;
    }
    return currentNodes.find((d) => d && d.data && d.data.id === path);
  };

  // Collision detection: check if position collides with existing nodes
  function hasCollision(x, y, existingNodes) {
    for (const node of existingNodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < MIN_DISTANCE) {
        return true;
      }
    }
    return false;
  }

  // Find collision-free position using spiral search
  function findCollisionFreePosition(initialX, initialY, existingNodes) {
    // Try initial position first
    if (!hasCollision(initialX, initialY, existingNodes)) {
      return { x: initialX, y: initialY };
    }

    // Spiral search pattern
    const angleStep = Math.PI / 6; // 30 degrees
    const radiusStep = 60;
    
    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
      const angle = angleStep * attempt;
      const radius = radiusStep * Math.ceil(attempt / 12); // Increase radius every 12 attempts
      
      const x = initialX + radius * Math.cos(angle);
      const y = initialY + radius * Math.sin(angle);
      
      if (!hasCollision(x, y, existingNodes)) {
        return { x, y };
      }
    }

    // Fallback: offset significantly if no position found
    console.warn(`Could not find collision-free position for inference at (${initialX}, ${initialY})`);
    return { 
      x: initialX + (Math.random() - 0.5) * 200, 
      y: initialY + 150 
    };
  }

  // SIMPLIFICADO: 3 passes para resolver dependências
  // Pass 1: Inferências sem dependências de outras inferências
  // Pass 2: Inferências que dependem de Pass 1
  // Pass 3: Inferências que dependem de Pass 2
  
  for (let pass = 0; pass < 3; pass++) {
    inferenceNodes.forEach(inference => {
      if (!inference || !inference.sources || !Array.isArray(inference.sources)) {
        return;
      }

      // Pular se já foi criada (verificar cache E DOM)
      if (createdInferenceNodes.has(inference.id)) {
        return;
      }
      
      // Verificar se já existe no DOM usando atributo data-inference-id
      const existsInDOM = g.select(`[data-inference-id="${inference.id}"]`).size() > 0;
      
      if (existsInDOM) {
        return;
      }

      // Find all source nodes
      const sourceNodes = inference.sources
        .map(byPath)
        .filter(Boolean);

      // Pular se não encontrou todos os sources
      if (sourceNodes.length !== inference.sources.length) {
        return;
      }

    // Calculate initial position based on inference type and level
    let avgX = sourceNodes.reduce((sum, n) => sum + n.x, 0) / sourceNodes.length;
    const maxY = Math.max(...sourceNodes.map((n) => n.y));
    
    // Determine inference level (how many steps from raw data)
    let level = 1;
    if (inference.sources.some(s => s.startsWith('inferences.'))) {
      level = 2; // Inferência baseada em outra inferência
    }
    if (inference.id === 'krigagem' || inference.id === 'trend_vertical') {
      level = 3; // Inferências finais
    }
    
    // Adjust position based on level and type
    const levelOffset = level * VERTICAL_SPACING;
    let xOffset = 0;
    
    // Specific positioning rules
    switch (inference.id) {
      case 'ni_lateritico':
        xOffset = -100;
        break;
      case 'variograma':
        xOffset = 100;
        break;
      case 'krigagem':
        xOffset = 200;
        break;
      case 'trend_vertical':
        xOffset = -200;
        break;
      case 'underground':
        xOffset = -150;
        break;
      case 'capping':
        xOffset = 150;
        break;
      case 'area_analysis':
        xOffset = 180;
        break;
      case 'cluster_analysis':
        xOffset = 180;
        break;
    }
    
    const initialX = avgX + xOffset;
    const initialY = maxY + levelOffset;

    // Find collision-free position
    const position = findCollisionFreePosition(initialX, initialY, [
      ...currentNodes.filter(n => !n.data.isInference), // Avoid regular nodes
      ...placedInferenceNodes, // Avoid other inference nodes
      ...Array.from(createdInferenceNodes.values()) // Avoid inferences created in this loop
    ]);

    // Build tooltip content from standardized fields: evidence, implications, recommendations
    let tooltipHTML = '';
    
    // 1. EVIDENCE (Evidências)
    if (inference.evidence) {
      tooltipHTML += `<strong>Evidências:</strong><br>`;
      if (typeof inference.evidence === 'object' && !Array.isArray(inference.evidence)) {
        // Special handling for cluster visualization
        if (inference.id === 'cluster_analysis' && inference.evidence.visualization) {
          const viz = inference.evidence.visualization;
          tooltipHTML += Object.entries(inference.evidence)
            .filter(([k]) => k !== 'visualization') // Skip visualization object in regular list
            .map(([k, v]) => `• ${k}: ${v}`)
            .join('<br>');
          tooltipHTML += `<br><br><div class="cluster-map" style="width:300px;height:200px;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <div style="text-align:center;">
              <div style="font-size:24px;color:#666;margin-bottom:8px;">📊</div>
              Click to view clusters map<br>
              <small style="color:#666;">(X-Y plot colored by target)</small>
            </div>
          </div>`;
        } else {
          tooltipHTML += Object.entries(inference.evidence)
            .map(([k, v]) => `• ${k}: ${v}`)
            .join('<br>');
        }
      } else if (Array.isArray(inference.evidence)) {
        tooltipHTML += inference.evidence.map(e => `• ${e}`).join('<br>');
      } else {
        tooltipHTML += `• ${inference.evidence}`;
      }
      tooltipHTML += '<br><br>';
    }

    // 2. IMPLICATIONS (Implicações)
    if (inference.implications) {
      tooltipHTML += `<strong>Implicações:</strong><br>`;
      tooltipHTML += (Array.isArray(inference.implications) ? inference.implications : [inference.implications])
        .map((imp) => `• ${imp}`)
        .join('<br>');
      tooltipHTML += '<br><br>';
    }

    // 3. RECOMMENDATIONS (Recomendações)
    if (inference.recommendations) {
      tooltipHTML += `<strong>Recomendações:</strong><br>`;
      tooltipHTML += (Array.isArray(inference.recommendations) ? inference.recommendations : [inference.recommendations])
        .map((rec) => `• ${rec}`)
        .join('<br>');
    }

    // Create inference node with collision-free position
    const inferenceNode = {
      x: position.x,
      y: position.y,
      data: {
        inference: inference.title,
        result: tooltipHTML.trim(),
        isInference: true,
        id: inference.id,
      },
    };

    // Adicionar ao cache
    createdInferenceNodes.set(inference.id, inferenceNode);

    // Create node group (after data nodes)
    const nodeGroup = g.append('g')
      .lower() // Move para trás dos nós de dados
      .attr('class', 'node inference-node')
      .attr('data-inference-id', inference.id) // ID único para detecção
      .attr('transform', `translate(${position.x},${position.y})`)
      .datum(inferenceNode);

    // Determinar cor baseada no type [V1.0.7]
    console.log(`🎨 [V1.0.7] Renderizando "${inference.id}" com type="${inference.type}"`);
    const colors = {
      'interpretation': { fill: '#2196F3', stroke: '#1976D2' },  // Azul
      'action': { fill: '#9C27B0', stroke: '#7B1FA2' }  // Roxo
    };
    const color = colors[inference.type] || colors['interpretation'];
    console.log(`  → Cor: ${color.fill} (${inference.type === 'action' ? 'ROXO' : 'AZUL'})`);

    // Add círculo (bolinha) em vez de retângulo
    nodeGroup.append('circle')
      .attr('r', 0)
      .style('fill', color.fill)
      .style('stroke', color.stroke)
      .style('stroke-width', '2px')
      .transition()
      .duration(600)
      .ease(d3.easeBackOut.overshoot(1.2))
      .attr('r', 8);

    // Add text (label)
    nodeGroup.append('text')
      .attr('dy', -15)
      .attr('text-anchor', 'middle')
      .style('fill', '#333')
      .style('font-size', '12px')
      .style('opacity', 0)
      .text(inference.title)
      .transition()
      .duration(500)
      .style('opacity', 1);

    // Add click handler for cluster map
    if (inference.id === 'cluster_analysis') {
      nodeGroup
        .style('cursor', 'pointer')
        .on('click', () => showClusterMap());
    }

    // Add tooltip for mouseover
    nodeGroup
      .on('mouseover', (event) => {
        tooltip
          .style('opacity', 1)
          .html(`<strong>${inference.title}</strong><br><br>${inferenceNode.data.result}`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px');
      })
      .on('mouseout', () => tooltip.style('opacity', 0));

    // Add to currentNodes and tracking array
    currentNodes.push(inferenceNode);
    placedInferenceNodes.push(inferenceNode);

    // Create links from all sources to this inference
    sourceNodes.forEach((sourceNode) => {
      if (!sourceNode || !sourceNode.x || !sourceNode.y) return;

      const linkId = `${sourceNode.data.id}->${inference.id}`;
      if (createdLinks.has(linkId)) return;

      g.append('path')
        .attr('class', 'inference-link')
        .attr('d', curvedLink(sourceNode, inferenceNode))
        .style('opacity', 0)
        .transition()
        .duration(600)
        .style('opacity', 1);
      
      createdLinks.add(linkId);
    });

    // Add links to target nodes (other inferences)
    if (inference.targets && Array.isArray(inference.targets)) {
      inference.targets.forEach(targetId => {
        if (!targetId) return;

        let targetNode = createdInferenceNodes.get(targetId);
        if (!targetNode) {
          targetNode = currentNodes.find(n => n.data && n.data.id === targetId);
        }
        
        if (!targetNode || !targetNode.x || !targetNode.y) return;

        const linkId = `${inference.id}->${targetId}`;
        if (createdLinks.has(linkId)) return;

        g.append('path')
          .attr('class', 'inference-link')
          .attr('d', curvedLink(inferenceNode, targetNode))
          .style('opacity', 0)
          .transition()
          .duration(600)
          .style('opacity', 1);
        
        createdLinks.add(linkId);
      });
    }
    }); // Fim do forEach
  } // Fim do for (3 passes)
  
  console.log('✅ Inferências criadas:', createdInferenceNodes.size, 'de', inferenceNodes.length);
}
