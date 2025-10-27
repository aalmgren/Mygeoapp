// Generic, domain-agnostic inference overlay renderer with collision detection
// Reads inference_rules from context.json and dynamically creates nodes/links

import { showClusterMap } from '../interactions/clusterMap.js';

export function applyInferencesOverlay({ g, currentNodes, visibleNodes, inferenceNodes, curvedLink }) {
  console.log('🔍 Applying inferences overlay:', {
    currentNodesCount: currentNodes?.length || 0,
    visibleNodesCount: visibleNodes?.length || 0,
    inferenceNodesCount: inferenceNodes?.length || 0
  });

  if (!Array.isArray(currentNodes) || !Array.isArray(inferenceNodes)) {
    console.warn('❌ Invalid input:', { currentNodes, inferenceNodes });
    return;
  }

  // Collision detection constants
  const MIN_DISTANCE = 200; // Aumentado para evitar sobreposição
  const CARD_WIDTH = 120; // Aumentado para textos maiores
  const CARD_HEIGHT = 40; // Aumentado para melhor visibilidade
  const MAX_ATTEMPTS = 100; // Mais tentativas para encontrar posição
  const VERTICAL_SPACING = 180; // Espaçamento vertical entre níveis de inferência

  // Helper: find node by label (exact match)
  const byLabel = (label) => currentNodes.find((d) => d && d.data && d.data.inference === label);

  // Helper: find node by path (e.g., "assay.elements.Ni" → "Ni" or "inferences.ni_lateritico" → by title)
  const byPath = (path) => {
    // Check if it's a reference to another inference
    if (path.startsWith('inferences.')) {
      const inferenceId = path.split('.')[1];
      // Procurar nó por ID nas inferências fornecidas
      const inference = inferenceNodes.find(inf => inf.id === inferenceId);
      if (inference) {
        // Procurar nó por título
        const node = currentNodes.find((d) => 
          d && d.data && d.data.inference === inference.title
        );
        return node;
      }
      return null;
    }
    
    // Otherwise, find by full path
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

  // Track already placed inference nodes for collision detection
  const placedInferenceNodes = [];

  // Process each inference node
  // Primeiro, ordenar inferências baseado em suas dependências
  const orderedInferences = [];
  const remainingInferences = [...inferenceNodes].filter(Boolean);
  const processedIds = new Set();

  function canProcessInference(inference) {
    if (!inference.sources) return true;
    return inference.sources.every(sourcePath => {
      if (sourcePath.startsWith('inferences.')) {
        const inferenceId = sourcePath.split('.')[1];
        return processedIds.has(inferenceId);
      }
      return visibleNodes.some(v => v.data && v.data.id === sourcePath);
    });
  }

  // Ordenar inferências baseado em suas dependências
  while (remainingInferences.length > 0) {
    const processableIndex = remainingInferences.findIndex(canProcessInference);
    if (processableIndex === -1) break; // Evitar loop infinito se houver dependência circular
    
    const inference = remainingInferences.splice(processableIndex, 1)[0];
    orderedInferences.push(inference);
    processedIds.add(inference.id);
  }

  // Processar inferências na ordem correta
  orderedInferences.forEach(inference => {
      if (!inference.sources || !Array.isArray(inference.sources)) {
        console.warn('⚠️ Invalid inference sources:', inference);
        return;
      }

  // Find all source nodes
  console.log('🔄 Processing inference:', {
    id: inference.id,
    title: inference.title,
    sources: inference.sources,
    targets: inference.targets
  });

  const sourceNodes = inference.sources
    .map((sourcePath) => {
      // Ajustar caminhos para corresponder aos nós reais
      const adjustedPath = sourcePath
        .replace('data_nodes.coordinates.', 'collar.')
        .replace('data_nodes.geology.', 'lithology.')
        .replace('data_nodes.assay.', 'assay.elements.');
      
      const node = byPath(adjustedPath);
      console.log(`🔍 Looking for source node '${adjustedPath}':`, node ? '✅ Found' : '❌ Not found');
      return node;
    })
    .filter(Boolean); // Remove nulls

  // Only create inference if we have at least one source
  if (sourceNodes.length === 0) {
    console.warn('⚠️ No source nodes found for inference:', inference.id);
    return;
  }

  console.log('✅ Found source nodes:', sourceNodes.map(n => n.data.id));

    // CRITICAL: Check if ALL source nodes are actually visible in animation
    // This ensures organic growth: green nodes appear first, then blue inference nodes
    const allSourcesVisible = sourceNodes.every((sourceNode) => 
      visibleNodes.some((visibleNode) => visibleNode.data === sourceNode.data)
    );

    console.log('👀 Checking source nodes visibility:', {
      inference: inference.id,
      sourceNodes: sourceNodes.map(n => n.data.id),
      visibleNodes: visibleNodes.map(n => n.data.id),
      allSourcesVisible
    });

    if (!allSourcesVisible) {
      console.log('⏳ Waiting for source nodes to appear:', 
        sourceNodes
          .filter(sourceNode => !visibleNodes.some(v => v.data === sourceNode.data))
          .map(n => n.data.id)
      );
      return;
    }

    // Check if inference node already exists
    if (byLabel(inference.title)) return;

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
      ...placedInferenceNodes // Avoid other inference nodes
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

    console.log('🎨 Creating inference node:', {
      inference: inference.id,
      position,
      sourceNodes: sourceNodes.map(n => n.data.id)
    });

    // Create node group (after data nodes)
    const nodeGroup = g.append('g')
      .lower() // Move para trás dos nós de dados
      .attr('class', 'node inference-node')
      .attr('transform', `translate(${position.x},${position.y})`);

    // Add background rectangle
    nodeGroup.append('rect')
      .attr('x', -60)
      .attr('y', -20)
      .attr('width', 120)
      .attr('height', 40)
      .attr('rx', 5)
      .attr('ry', 5)
      .style('fill', '#e3f2fd')
      .style('stroke', '#2196F3')
      .style('stroke-width', '2px')
      .style('stroke-dasharray', '5,5');

    // Add text
    nodeGroup.append('text')
      .attr('dy', '0.3em')
      .attr('text-anchor', 'middle')
      .style('fill', '#1976D2')
      .style('font-size', '14px')
      .text(inference.title);

    // Add click handler for cluster map
    if (inference.id === 'cluster_analysis') {
      nodeGroup
        .style('cursor', 'pointer')
        .on('click', () => showClusterMap());
    }

    // Add to currentNodes and tracking array
    currentNodes.push(inferenceNode);
    placedInferenceNodes.push(inferenceNode);

    // Create links from all sources to this inference
    sourceNodes.forEach((sourceNode) => {
      if (!sourceNode || !sourceNode.x || !sourceNode.y) {
        console.warn('⚠️ Invalid source node:', sourceNode);
        return;
      }

      console.log('🔗 Creating link:', {
        from: sourceNode.data.id,
        to: inferenceNode.data.id,
        sourcePos: { x: sourceNode.x, y: sourceNode.y },
        targetPos: { x: inferenceNode.x, y: inferenceNode.y }
      });

      g.append('path')
        .attr('class', 'inference-link')
        .attr('d', curvedLink(sourceNode, inferenceNode))
        .style('opacity', 0)
        .transition()
        .duration(600)
        .style('opacity', 1);
    });

    // Add links to target nodes (other inferences)
    if (inference.targets && Array.isArray(inference.targets)) {
      inference.targets.forEach(targetId => {
        if (!targetId) {
          console.warn('⚠️ Invalid target ID:', targetId);
          return;
        }

        const targetNode = currentNodes.find(n => n.data && n.data.id === targetId);
        if (!targetNode) {
          console.warn('⚠️ Target node not found:', targetId);
          return;
        }

        if (!targetNode.x || !targetNode.y) {
          console.warn('⚠️ Target node has no position:', targetNode);
          return;
        }

        console.log('🔗 Creating target link:', {
          from: inferenceNode.data.id,
          to: targetNode.data.id,
          sourcePos: { x: inferenceNode.x, y: inferenceNode.y },
          targetPos: { x: targetNode.x, y: targetNode.y }
        });

        g.append('path')
          .attr('class', 'inference-link')
          .attr('d', curvedLink(inferenceNode, targetNode))
          .style('opacity', 0)
          .transition()
          .duration(600)
          .style('opacity', 1);
      });
    }
  });
}
