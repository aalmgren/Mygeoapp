# 📦 Module Documentation

Technical reference for all JavaScript modules in the system.

---

## Table of Contents

1. [main.js](#mainjs) - Application orchestrator
2. [transformContextToTree.js](#transformcontexttotreejs) - Data transformation
3. [treeRender.js](#treerenderjs) - Visualization renderer
4. [inferencesOverlay.js](#inferencesoverlayjs) - Dynamic inference nodes
5. [growthController.js](#growthcontrollerjs) - Animation controller

---

## `src/main.js`

### Purpose
Application entry point that orchestrates data loading, transformation, and rendering.

### Exports
None (runs immediately on import)

### Dependencies
```javascript
import { transformContextToTree } from './transform/transformContextToTree.js';
import { initGrowthController } from './animation/growthController.js';
import { initTreeRender } from './render/treeRender.js';
```

### External Dependencies
- D3.js v7 (loaded via CDN in HTML)

### Global Variables
```javascript
const width = window.innerWidth - 120;   // Canvas width
const height = window.innerHeight - 160;  // Canvas height
const margin = { top: 40, right: 40, bottom: 40, left: 40 };
```

### Main Execution Flow

```javascript
// 1. Setup SVG and tooltip
const svg = d3.select('#tree-svg');
const tooltip = d3.select('.tooltip');

// 2. Initialize tree renderer
const { g, draw: drawTree } = initTreeRender({ svg, tooltip, margin, width, height });

// 3. Load data
fetch('context.json')
  .then(response => response.json())
  .then(contextData => {
    // 4. Transform data
    const treeData = transformContextToTree(contextData);
    const root = d3.hierarchy(treeData);

    // 5. Collect nodes via DFS
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

    // 6. Initialize visibility tracking
    const visibleNodes = [root];

    // 7. Define draw function
    function draw() {
      drawTree({ visibleNodes, contextData });
    }

    // 8. Start animation
    initGrowthController({
      allNodes,
      visibleNodes,
      draw,
      defaultDurationSec: 10,
    });
  })
  .catch(error => console.error('Error loading context.json:', error));
```

### Error Handling
- Catches and logs fetch errors
- Displays error in console if JSON parsing fails

---

## `src/transform/transformContextToTree.js`

### Purpose
Transforms raw `context.json` data into D3.js-compatible hierarchical structure.

### Exports

#### `transformContextToTree(contextData)`

**Signature**:
```typescript
function transformContextToTree(contextData: object): TreeNode
```

**Parameters**:
- `contextData` (object): Full JSON object from `context.json`

**Returns**: 
```typescript
{
  inference: string,      // Node label
  result: string,         // Tooltip content (HTML)
  children: TreeNode[],   // Child nodes
  column?: string,        // Column name (optional)
  renderPieChart?: boolean,  // Flag for pie chart rendering (optional)
  pieData?: object        // Pie chart data (optional)
}
```

**Logic**:
1. Validates input
2. Creates root node with label "Input CSV"
3. Reads `display_order` from JSON (default: `['collar', 'survey', 'assay', 'lithology']`)
4. Processes each top-level key in order via `makeNode()`
5. Returns complete tree

**Error Handling**:
```javascript
if (!contextData || typeof contextData !== 'object') {
  console.error('Invalid context data:', contextData);
  return { inference: 'Error', result: '', children: [] };
}
```

### Internal Functions

#### `makeNode(key, value)`

**Signature**:
```typescript
function makeNode(key: string, value: any): TreeNode | null
```

**Parameters**:
- `key` (string): Property name
- `value` (any): Property value

**Returns**: TreeNode object or `null` if node should be hidden

**Logic Flow**:

```
1. Check if key starts with '_' → return null (hidden)
2. Capitalize key for display
3. Check value type:
   ├── null/undefined → simple node
   ├── Array → array info node
   └── Object → complex processing
       ├── Check render_type
       │   ├── 'distribution' → format as distribution
       │   ├── 'pie_chart' → setup pie chart data
       │   ├── 'stats_summary' → format statistics
       │   └── 'simple_value' → extract value
       ├── Legacy support for 'column' + 'stats'
       └── Recurse for remaining properties
```

**Render Type Handling**:

```javascript
const renderType = value.render_type || value.display_mode;

switch (renderType) {
  case 'distribution':
    node.result = `<strong>Distribution:</strong><br>` + 
      Object.entries(value.distribution)
        .map(([k, v]) => `${k}: ${v}%`)
        .join('<br>');
    break;
    
  case 'pie_chart':
    node.renderPieChart = true;
    node.pieData = value.distribution || value.data || {};
    node.result = Object.entries(node.pieData)
      .map(([k, v]) => `${k}: ${v}%`)
      .join('<br>');
    break;
    
  case 'stats_summary':
    const stats = value.stats || value;
    node.result = Object.entries(stats)
      .filter(([k]) => !['column', 'render_type', 'display_mode'].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join('<br>');
    break;
    
  case 'simple_value':
    node.result = String(value.value);
    break;
}
```

**Filtering**:
```javascript
// Prevent certain keys from becoming child nodes
if (!['render_type', 'display_mode', 'column', 'distribution', 'stats', 'value', 'data'].includes(k)) {
  const child = makeNode(k, v);
  if (child) node.children.push(child);
}
```

---

## `src/render/treeRender.js`

### Purpose
Core visualization engine - renders tree structure, nodes, links, and applies inference overlay.

### Exports

#### `initTreeRender({ svg, tooltip, margin, width, height })`

**Signature**:
```typescript
function initTreeRender(config: {
  svg: D3Selection,
  tooltip: D3Selection,
  margin: { top: number, right: number, bottom: number, left: number },
  width: number,
  height: number
}): { g: D3Selection, draw: Function }
```

**Parameters**:
- `svg`: D3 selection of SVG element
- `tooltip`: D3 selection of tooltip div
- `margin`: Canvas margins
- `width`: Canvas width
- `height`: Canvas height

**Returns**:
```typescript
{
  g: D3Selection,           // Main SVG group (for external manipulation)
  draw: (config) => void    // Rendering function
}
```

**Initialization**:
```javascript
// 1. Create main group
const g = svg.append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);

// 2. Setup zoom behavior
const zoom = d3.zoom()
  .scaleExtent([0.5, 2])
  .on('zoom', (event) => {
    g.attr('transform', event.transform);
  });
svg.call(zoom);

// 3. Configure tree layout
const treeLayout = d3.tree()
  .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
  .separation((a, b) => (a.parent === b.parent ? 4 : 6))
  .nodeSize([50, 120]);
```

### Tree Layout Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `separation` (siblings) | 4 | Space between nodes with same parent |
| `separation` (cousins) | 6 | Space between nodes with different parents |
| `nodeSize` (horizontal) | 50px | Horizontal spacing between nodes |
| `nodeSize` (vertical) | 120px | Vertical spacing between levels |

### Path Generators

#### `curvedPath(d)`
Generates smooth Bézier curves for parent-child links.

**Algorithm**: Cubic Bézier with vertical control points
```javascript
M x0,y0              // Start at parent
C x0,mx x1,mx x1,y1  // Curve to child (control points at midY)
```

**Code**:
```javascript
function curvedPath(d) {
  const x0 = d.source.x, y0 = d.source.y;
  const x1 = d.target.x, y1 = d.target.y;
  const mx = (y0 + y1) / 2;  // Midpoint for control points
  return `M${x0},${y0} C${x0},${mx} ${x1},${mx} ${x1},${y1}`;
}
```

#### `curvedLink(source, target)`
Generates arced paths for inference connections.

**Algorithm**: Circular arc based on distance
```javascript
dr = distance × 1.5  // Arc radius (150% of straight-line distance)
```

**Code**:
```javascript
function curvedLink(source, target) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
  return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
}
```

### Draw Function

#### `draw({ visibleNodes, contextData })`

**Parameters**:
- `visibleNodes` (array): Nodes currently visible in animation
- `contextData` (object): Full JSON data (for inference overlay)

**Process**:

```javascript
// 1. Create D3 hierarchy from visible nodes
const hierarchy = d3.hierarchy(visibleNodes[0].data);
const tree = treeLayout(hierarchy);

// 2. Filter nodes (visible + ancestors)
const visibleSet = new Set(visibleNodes.map((n) => n.data));
let currentNodes = tree.descendants().filter((d) => {
  const isVisible = visibleSet.has(d.data);
  return isVisible || isAncestorOfVisible(d);
});

// 3. Apply inference overlay (adds inference nodes)
applyInferencesOverlay({ g, currentNodes, contextData, curvedLink });

// 4. Generate links
const currentLinks = currentNodes
  .filter((n) => n.parent && currentNodes.includes(n.parent))
  .map((n) => ({ source: n.parent, target: n }));

// 5. Render links with animation
const linkEnter = g.selectAll('.link')
  .data(currentLinks)
  .enter()
  .append('path')
  .attr('class', 'link')
  .attr('d', startPath)  // Start at parent
  .transition()
  .duration(900)
  .attrTween('d', animateToTarget);  // Animate to child

// 6. Render nodes
const nodeEnter = g.selectAll('.node')
  .data(currentNodes)
  .enter()
  .append('g')
  .attr('class', 'node')
  .attr('transform', parentPosition)  // Start at parent
  .transition()
  .duration(600)
  .attr('transform', finalPosition);  // Move to final position

// 7. Add node visuals based on type
nodeEnter.each(function(d) {
  if (d.data.isInference) {
    // Render inference card
  } else if (d.data.renderPieChart) {
    // Render pie chart
  } else {
    // Render circle
  }
});

// 8. Add labels (excluding inference nodes)
nodeEnter
  .filter((d) => !d.data.isInference)
  .append('text')
  .attr('dy', -15)
  .text((d) => d.data.inference);
```

### Node Rendering Types

#### 1. Inference Nodes
```javascript
if (d.data.isInference) {
  const ng = nodeGroup.append('g').attr('class', 'inference-node');
  
  // Rectangle card
  ng.append('rect')
    .attr('x', -50).attr('y', -15)
    .attr('width', 100).attr('height', 30);
  
  // Text inside card
  ng.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 5)
    .text(d.data.inference);
  
  // Tooltip
  ng.on('mouseover', (event) => { /* show tooltip */ })
    .on('mouseout', () => { /* hide tooltip */ });
}
```

#### 2. Pie Chart Nodes
```javascript
else if (d.data.renderPieChart && d.data.pieData) {
  const pieData = Object.entries(d.data.pieData)
    .map(([key, value]) => ({ label: key, value }));
  
  // D3 pie generator
  const pie = d3.pie().value(dd => dd.value);
  const arc = d3.arc().innerRadius(0).outerRadius(30);
  
  // Render pie slices
  const pieGroup = nodeGroup.append('g')
    .attr('transform', `translate(60, 0)`);
  
  pieGroup.selectAll('path')
    .data(pie(pieData))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', (dd, i) => d3.schemeCategory10[i]);
  
  // Still add circle at node position
  nodeGroup.append('circle').attr('r', 6);
}
```

#### 3. Default Circle Nodes
```javascript
else {
  nodeGroup.append('circle')
    .attr('r', 0)
    .on('mouseover', showTooltip)
    .on('mouseout', hideTooltip)
    .transition()
    .duration(600)
    .ease(d3.easeBackOut.overshoot(1.2))
    .attr('r', 6);
}
```

### Tooltip Format
```javascript
const title = `<strong>${d.data.inference}</strong>`;
const column = d.data.column ? `<br><strong>Column:</strong> ${d.data.column}` : '';
const content = d.data.result ? `<br><br>${d.data.result}` : '';
tooltip.html(title + column + content);
```

---

## `src/render/inferencesOverlay.js`

### Purpose
Dynamically generates and positions inference nodes with automatic collision detection.

### Exports

#### `applyInferencesOverlay({ g, currentNodes, contextData, curvedLink })`

**Signature**:
```typescript
function applyInferencesOverlay(config: {
  g: D3Selection,
  currentNodes: TreeNode[],
  contextData: object,
  curvedLink: (source, target) => string
}): void
```

**Parameters**:
- `g`: SVG group for rendering
- `currentNodes`: Array of currently visible nodes (mutated by function)
- `contextData`: Full JSON data
- `curvedLink`: Path generator function

**Returns**: void (mutates `currentNodes` in-place)

### Constants

```javascript
const MIN_DISTANCE = 180;    // Minimum spacing between inference nodes (px)
const CARD_WIDTH = 100;      // Inference card width (px)
const CARD_HEIGHT = 30;      // Inference card height (px)
const MAX_ATTEMPTS = 50;     // Maximum collision-free search attempts
```

### Core Functions

#### `byLabel(label)`
Finds node by exact label match.

```javascript
const byLabel = (label) => 
  currentNodes.find((d) => d && d.data && d.data.inference === label);
```

#### `byPath(path)`
Resolves source references (data paths or inference paths).

**Supported Path Types**:
1. **Data Path**: `"elements.Ni"` → finds node labeled "Ni"
2. **Inference Path**: `"inferences.ni_lateritico"` → finds inference by title

**Algorithm**:
```javascript
if (path.startsWith('inferences.')) {
  // Extract inference key
  const inferenceKey = path.split('.')[1];
  
  // Find inference in JSON
  const inference = contextData.inferences[inferenceKey];
  
  // Find node by inference title
  return byLabel(inference.title);
} else {
  // Extract final label from path
  const parts = path.split('.');
  const finalLabel = parts[parts.length - 1];
  
  // Capitalize and find
  return byLabel(finalLabel.charAt(0).toUpperCase() + finalLabel.slice(1));
}
```

#### `hasCollision(x, y, existingNodes)`
Checks if position collides with existing nodes.

**Algorithm**: Euclidean distance check
```javascript
function hasCollision(x, y, existingNodes) {
  for (const node of existingNodes) {
    const dx = x - node.x;
    const dy = y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < MIN_DISTANCE) {
      return true;  // Collision detected
    }
  }
  return false;  // Clear
}
```

**Time Complexity**: O(n) where n = number of existing nodes

#### `findCollisionFreePosition(initialX, initialY, existingNodes)`
Finds collision-free position using spiral search.

**Algorithm**: Outward spiral with increasing radius

```
Attempt 1:  angle = 30°,  radius = 60px   (try 12 positions)
Attempt 13: angle = 390°, radius = 120px  (try 12 more positions)
Attempt 25: angle = 750°, radius = 180px  (try 12 more positions)
...
Attempt 49: angle = 1470°, radius = 300px
```

**Code**:
```javascript
function findCollisionFreePosition(initialX, initialY, existingNodes) {
  // Try initial position
  if (!hasCollision(initialX, initialY, existingNodes)) {
    return { x: initialX, y: initialY };
  }

  // Spiral search
  const angleStep = Math.PI / 6;  // 30 degrees
  const radiusStep = 60;
  
  for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
    const angle = angleStep * attempt;
    const radius = radiusStep * Math.ceil(attempt / 12);
    
    const x = initialX + radius * Math.cos(angle);
    const y = initialY + radius * Math.sin(angle);
    
    if (!hasCollision(x, y, existingNodes)) {
      return { x, y };
    }
  }

  // Fallback with warning
  console.warn(`Could not find collision-free position at (${initialX}, ${initialY})`);
  return { 
    x: initialX + (Math.random() - 0.5) * 200, 
    y: initialY + 150 
  };
}
```

**Visualization**:
```
        +-------+
        |  12   |  Radius 60px
    +---+-------+---+
    | 11|  Initial  | 1
+---+---+--(x,y)----+---+---+
| 10| 9 |   8   | 2 | 3 |    Radius 120px
+---+---+-------+---+---+
    | 7 |   6   | 4 |
    +---+-------+---+
        |   5   |        And so on...
        +-------+
```

### Main Processing Loop

**Pseudocode**:
```
For each inference in contextData.inferences:
  1. Skip if type ≠ 'inference'
  2. Resolve all source nodes
  3. Skip if not all sources visible
  4. Skip if inference already rendered
  5. Calculate initial position:
     - x = average of source X positions
     - y = max source Y + 100px
  6. Find collision-free position
  7. Build tooltip HTML from inference properties
  8. Create inference node object
  9. Add to currentNodes array
  10. Draw curved links from sources to inference
```

**Full Code**:
```javascript
Object.entries(contextData.inferences).forEach(([inferenceKey, inference]) => {
  // 1. Type check
  if (inference.type !== 'inference') return;

  // 2. Resolve sources
  const sourceNodes = inference.sources
    .map((sourcePath) => byPath(sourcePath))
    .filter(Boolean);

  // 3. Check all sources visible
  if (sourceNodes.length === 0) return;
  if (sourceNodes.length !== inference.sources.length) return;

  // 4. Check not already rendered
  if (byLabel(inference.title)) return;

  // 5. Calculate initial position
  const avgX = sourceNodes.reduce((sum, n) => sum + n.x, 0) / sourceNodes.length;
  const maxY = Math.max(...sourceNodes.map((n) => n.y));
  const initialY = maxY + 100;

  // 6. Find collision-free position
  const position = findCollisionFreePosition(avgX, initialY, [
    ...currentNodes.filter(n => !n.data.isInference),
    ...placedInferenceNodes
  ]);

  // 7. Build tooltip
  let tooltipHTML = buildTooltipHTML(inference);

  // 8. Create node
  const inferenceNode = {
    x: position.x,
    y: position.y,
    data: {
      inference: inference.title,
      result: tooltipHTML.trim(),
      isInference: true,
    },
  };

  // 9. Add to tracking
  currentNodes.push(inferenceNode);
  placedInferenceNodes.push(inferenceNode);

  // 10. Draw links
  sourceNodes.forEach((sourceNode) => {
    g.append('path')
      .attr('class', 'inference-link')
      .attr('d', curvedLink(sourceNode, inferenceNode))
      .style('opacity', 0)
      .transition()
      .duration(600)
      .style('opacity', 1);
  });
});
```

### Tooltip Generation

**Supported Fields** (in order):
1. `evidence`: Key findings
2. `conclusions`: Derived conclusions
3. `ranking`: Probability distribution
4. `implications`: Impacts and consequences
5. `strategy`: Recommended actions
6. `risks`: Potential issues
7. `recommendation`: Specific advice
8. `expectations`: Predicted outcomes

**Format**:
```javascript
if (inference.evidence) {
  tooltipHTML += `<strong>Evidence:</strong><br>`;
  
  // Handle object
  if (typeof inference.evidence === 'object' && !Array.isArray(inference.evidence)) {
    tooltipHTML += Object.entries(inference.evidence)
      .map(([k, v]) => `• ${k}: ${v}`)
      .join('<br>');
  }
  // Handle array
  else if (Array.isArray(inference.evidence)) {
    tooltipHTML += inference.evidence.map(e => `• ${e}`).join('<br>');
  }
  // Handle string
  else {
    tooltipHTML += `• ${inference.evidence}`;
  }
  
  tooltipHTML += '<br><br>';
}
```

---

## `src/animation/growthController.js`

### Purpose
Controls organic tree growth animation with sequential node appearance.

### Exports

#### `initGrowthController({ allNodes, visibleNodes, draw, defaultDurationSec })`

**Signature**:
```typescript
function initGrowthController(config: {
  allNodes: Array<{ node: TreeNode, level: number }>,
  visibleNodes: TreeNode[],
  draw: Function,
  defaultDurationSec: number
}): void
```

**Parameters**:
- `allNodes`: Array of all nodes with level info (from DFS traversal)
- `visibleNodes`: Array to track currently visible nodes (mutated)
- `draw`: Callback function to trigger re-render
- `defaultDurationSec`: Initial animation duration

**Returns**: void

### Implementation

**Setup**:
```javascript
// Duration slider
const slider = document.getElementById('durationSlider');
const durationDisplay = document.getElementById('durationValue');

slider.value = defaultDurationSec;
durationDisplay.textContent = defaultDurationSec;

let totalDuration = defaultDurationSec;

// Update on slider change
slider.addEventListener('input', (e) => {
  totalDuration = parseInt(e.target.value, 10);
  durationDisplay.textContent = totalDuration;
});
```

**Animation Logic**:
```javascript
let currentIndex = 0;

function step() {
  // Check if animation complete
  if (currentIndex >= allNodes.length) return;
  
  // Get next node
  const item = allNodes[currentIndex];
  
  // Add to visible array
  visibleNodes.push(item.node);
  
  // Trigger re-render
  draw();
  
  // Increment
  currentIndex++;
  
  // Calculate delay to next node
  const interval = (totalDuration * 1000) / allNodes.length;
  
  // Schedule next step
  setTimeout(() => requestAnimationFrame(step), interval);
}

// Start animation
requestAnimationFrame(step);
```

**Timing Calculation**:
```
interval = (totalDuration × 1000ms) / totalNodes

Examples:
- 10 seconds, 50 nodes → 200ms per node
- 5 seconds, 100 nodes → 50ms per node
- 20 seconds, 200 nodes → 100ms per node
```

### Animation Behavior

**Sequence**:
1. Root node appears
2. First-level children appear sequentially
3. For each first-level node:
   - All its descendants appear (via DFS)
   - Then move to next first-level node

**Example**:
```
Input CSV
├── Collar
│   ├── X
│   ├── Y
│   └── Z
├── Survey
│   └── Dip
└── Assay
    └── Ni

Order: Input CSV → Collar → X → Y → Z → Survey → Dip → Assay → Ni
```

**DFS Collection** (in `main.js`):
```javascript
function dfs(node, level = 0) {
  allNodes.push({ node, level });
  if (node.children) {
    for (const child of node.children) {
      dfs(child, level + 1);
    }
  }
}
```

### Performance

- **Non-blocking**: Uses `requestAnimationFrame`
- **Dynamic speed**: Adjustable during animation
- **Smooth**: 60 FPS rendering
- **Memory**: O(n) where n = total nodes

---

## Cross-Module Communication

### Data Flow Diagram

```
context.json
    ↓
main.js (fetch)
    ↓
transformContextToTree.js (parse & structure)
    ↓
main.js (d3.hierarchy + DFS)
    ↓
┌───────────────────┬─────────────────────┐
│                   │                     │
treeRender.js   ←──┤   growthController.js
    ↓              (triggers draw)
inferencesOverlay.js
    ↓
(mutates currentNodes)
    ↓
treeRender.js
    ↓
Visual Output (SVG)
```

### Shared Data Structures

#### TreeNode
```typescript
interface TreeNode {
  inference: string;         // Display label
  result: string;            // Tooltip content (HTML)
  children: TreeNode[];      // Child nodes
  column?: string;           // Column name
  renderPieChart?: boolean;  // Pie chart flag
  pieData?: Record<string, number>;  // Pie chart data
  isInference?: boolean;     // Inference node flag
}
```

#### D3 Hierarchy Node
```typescript
interface D3Node {
  data: TreeNode;
  parent: D3Node | null;
  children: D3Node[];
  x: number;  // Computed by layout
  y: number;  // Computed by layout
}
```

### Event Flow

```
User loads page
    → main.js executes
    → Fetches context.json
    → transformContextToTree() parses data
    → d3.hierarchy() creates tree
    → DFS collects all nodes
    → initTreeRender() sets up SVG
    → initGrowthController() starts animation
    → step() function runs every N milliseconds
    → visibleNodes.push(nextNode)
    → draw() renders tree
    → applyInferencesOverlay() adds inference nodes
    → D3 animations transition nodes/links
    → User sees organic growth
```

---

## Module Dependencies Graph

```
decision_tree.html
    ↓ (imports)
main.js
    ├── transformContextToTree.js
    ├── growthController.js
    └── treeRender.js
            └── inferencesOverlay.js

External:
    - D3.js v7 (CDN)
    - styles.css

Data:
    - context.json
```

---

## Testing Checklist

### transformContextToTree.js
- [ ] Handles missing `context.json`
- [ ] Ignores `_` prefixed keys
- [ ] Supports all render types
- [ ] Processes nested objects recursively
- [ ] Respects `display_order`

### treeRender.js
- [ ] Renders circles for default nodes
- [ ] Renders rectangles for inference nodes
- [ ] Renders pie charts correctly
- [ ] Curved paths don't overlap
- [ ] Tooltips display properly
- [ ] Zoom/pan works smoothly

### inferencesOverlay.js
- [ ] Resolves data paths correctly
- [ ] Resolves inference paths correctly
- [ ] Detects collisions accurately
- [ ] Finds collision-free positions
- [ ] Chains inferences (A → B → C)
- [ ] Draws curved links correctly

### growthController.js
- [ ] Respects user-set duration
- [ ] Nodes appear sequentially
- [ ] DFS order is correct
- [ ] Animation is smooth (60 FPS)
- [ ] Slider updates work

---

**Last Updated**: 2025-10-26
**Version**: 2.0 (Modular Architecture)

