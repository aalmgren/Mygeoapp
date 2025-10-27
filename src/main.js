// Main orchestrator - initializes the entire visualization
import { transformNeo4jToTree } from './transform/transformNeo4jToTree.js';
import { initGrowthController } from './animation/growthController.js';
import { initTreeRender } from './render/treeRender.js';
import { initValidationFooter } from './validation/validation_footer.js';

// Setup dimensions
const width = Math.min(window.innerWidth - 80, 1400); // Aumentar largura máxima
const height = Math.min(window.innerHeight - 120, 1000); // Aumentar altura máxima
const margin = { top: 30, right: 30, bottom: 30, left: 30 }; // Reduzir margens

// Setup D3 selections
const svg = d3.select('#tree-svg');
const tooltip = d3.select('.tooltip');

// Initialize tree renderer
const { g, draw: drawTree } = initTreeRender({ svg, tooltip, margin, width, height });

// Load data and start visualization
// Initialize visualization
// Load data from Neo4j
console.log('Connecting to Neo4j...');
transformNeo4jToTree().then(treeData => {
    console.log('Data loaded from Neo4j');
    console.log('Tree data:', treeData);
    
    if (!treeData.children || !Array.isArray(treeData.children)) {
      throw new Error('Tree data is empty or not in the expected format');
    }
    
    // Create a root node to hold the forest
    const rootNode = {
      inference: 'Root',
      children: treeData.children,
      inferenceNodes: treeData.inferenceNodes // Important: keep inference nodes at root level
    };
    
    console.log('🌳 Root node structure:', {
      childrenCount: rootNode.children.length,
      inferenceCount: rootNode.inferenceNodes.length,
      inferences: rootNode.inferenceNodes.map(n => n.id)
    });
    
    const root = d3.hierarchy(rootNode);

    // Collect all nodes using DFS
    let allNodes = [];
    function dfs(node, level = 0) {
      if (!node) return;
      allNodes.push({ node, level });
      if (node.children) {
        for (const child of node.children) dfs(child, level + 1);
      }
    }
    allNodes.push({ node: root, level: 0 });
    if (root.children) {
      for (const firstLevel of root.children) dfs(firstLevel, 1);
    }

    // Track visible nodes
    const visibleNodes = [root];

    // Draw function
function draw({ readyForInferences = false } = {}) {
  // Log para debug
  console.log('🎨 Drawing tree state:', {
    visibleNodesCount: visibleNodes.length,
    totalNodes: allNodes.length,
    progress: `${visibleNodes.length}/${allNodes.length}`,
    currentVisible: visibleNodes.map(n => n.data.id),
    inferenceNodesCount: rootNode.inferenceNodes?.length || 0,
    inferenceNodes: rootNode.inferenceNodes?.map(n => n.id) || []
  });
  
  drawTree({ 
    visibleNodes, 
    currentNodes: allNodes.map(n => ({
      ...n.node,
      data: {
        ...n.node.data,
        id: n.node.data.id || n.node.data.inference // Ensure we have an ID
      }
    })),
    inferenceNodes: rootNode.inferenceNodes || [],
    readyForInferences
  });
    }

    // Initialize growth animation controller
    initGrowthController({
      allNodes,
      visibleNodes,
      draw,
      defaultDurationSec: 10,
    });

    // Initialize validation footer
    initValidationFooter();
  })
  .catch(error => {
    console.error('Error loading data from Neo4j:', error);
    document.body.innerHTML += `
        <div style="color: red; padding: 20px; background: #fee; border: 1px solid #faa; margin: 20px;">
            <h3>❌ Error connecting to Neo4j</h3>
            <p>${error.message}</p>
            <p>Please check:</p>
            <ul>
                <li>Neo4j is running</li>
                <li>Database "geoai" exists</li>
                <li>Credentials are correct</li>
            </ul>
        </div>
    `;
});
