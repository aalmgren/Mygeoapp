// Main orchestrator - initializes the entire visualization
import { transformNeo4jToTree } from './transform/transformNeo4jToTree.js';
import { initGrowthController } from './animation/growthController.js';
import { initTreeRender } from './render/treeRender.js';
import { initValidationFooter } from './validation/validation_footer.js';

// Setup dimensions - usar viewport completo
const width = window.innerWidth - 40;
const height = window.innerHeight - 200; // Espaço para header e footer
const margin = { top: 20, right: 20, bottom: 20, left: 20 };

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

    // Inferências não precisam estar em allNodes (aparecem todas de uma vez no final)

    // Track visible nodes
    const visibleNodes = [root];

    // Draw function
function draw({ readyForInferences = false } = {}) {
  drawTree({ 
    visibleNodes, 
    currentNodes: allNodes.map(n => ({
      ...n.node,
      data: {
        ...n.node.data,
        id: n.node.data.id || n.node.data.inference
      }
    })),
    inferenceNodes: rootNode.inferenceNodes || [],
    readyForInferences
  });
    }

    // Initialize growth animation controller (3 segundos fixo)
    initGrowthController({
      allNodes,
      visibleNodes,
      draw,
      defaultDurationSec: 3,
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
