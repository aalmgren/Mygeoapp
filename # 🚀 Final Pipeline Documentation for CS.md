# 🚀 Final Pipeline Documentation for CSV Processing in AI Agents

## 1. Objective
The purpose of this pipeline is to process `.csv` files from mineral exploration (Collar, Survey, Assay) using AI agents to extract detailed geological information, validate, combine, and generate structured outputs ready for analysis, deposit ranking, and API integration.

---

## 2. Processing Structure

### 2.1 Input
- **Type:** Raw CSV  
- **Description:** Raw files containing drillhole data, coordinates, depth, chemical analyses, etc.  
- **Function:** Automatically classify files into one of three categories: Collar, Survey, Assay.

---

### 2.2 Individual Roots and Inferences

#### 2.2.1 Collar (Root 1)
- **Function:** Drillhole starting point, position, and basic features.  
- **Inferences:**
  - Essential columns: X, Y, Z, HoleID  
  - Local/global coordinates conversion  
  - Depth and drillhole density  
  - Drill type and drilling method  
  - Drill diameter  
  - Local topography and elevation difference  
  - Distances and pattern between neighboring holes  
  - Drill sequence and history  
  - Most densely drilled areas  
- **Validation:** Coordinate coherence, duplicates, outliers

#### 2.2.2 Survey (Root 2)
- **Function:** Drillhole geometric characteristics.  
- **Inferences:**
  - Vertical or inclined hole  
  - Inclination along the hole (curvature, deviations)  
  - Direction (positive/negative)  
  - Spatial distribution of the hole  
  - Overlap with neighboring holes  
  - Intersection with known mineralized zones  
  - Detection of child holes / bifurcations  
- **Validation:** Consistency with Collar, verification of missed or off-target holes

#### 2.2.3 Assay (Root 3)
- **Function:** Chemical and mineralogical analysis.  
- **Inferences:**
  - Elements and main minerals  
  - Probable deposit type (Lateritic, Sulfide, etc.)  
  - Ranking of probable deposits  
  - Probability for each deposit  
  - Variations of grades along depth  
  - Correlation between holes and continuity of mineral bodies  
  - Hydrothermal alteration or oxidation indicators  
  - Preliminary economic potential  
- **Validation:** Chemical outliers, consistency with regional standards  

---

### 2.3 Individual CSV Validation
- **Function:** Ensure data integrity before merging  
- **Checks:** Coherence, duplicates, outliers

---

### 2.4 Combining Roots
- **Objective:** Build a complete drillhole by interval  
- **Combined data:**
  - Coordinates X, Y, Z  
  - Depth  
  - Geometric info  
  - Chemical elements  
- **Combined inferences:**
  - Drillhole distribution in the area  
  - Probability of mineralization  
  - Density and spacing of holes  
  - Identification of priority areas  
  - 3D mapping of mineral bodies  

---

### 2.5 Final Decision / Output
- **Objective:** Produce structured outputs for APIs and future analyses  
- **Output:**
  - Stored learning  
  - Deposit ranking  
  - Ability to update hypotheses in the future (e.g., Lateritic Ni → Sulfide Ni)  
- **Recommended format:** JSON with **context** and **ranked results (probabilities)**  

---

## 3. Dynamic Growth of Inferences

### Example of Decision Tree Growth
1. **Discover X, Y, Z → 3D data**  
   - Calculate drillhole spacing  
     - If **wide spacing** → inference: exploratory holes  
     - If **dense cluster** → inference: priority target zone  
       - Compute density, average depth, correlation with Assay  
       - Detect child/bifurcated holes  

2. **Detect high chemical elements in an interval**  
   - Determine probable deposit type  
     - Ni high → Lateritic deposit  
     - Ni + Co → potential Sulfide deposit  
       - Create ranking with probabilities, keeping alternatives open  

3. **Inclined vs vertical hole**  
   - Branch to calculate curvature, 3D projection, intersections  

**At each step, new nodes appear**, creating a branching tree. Each node represents an inference with children representing possible next steps.

---

## 4. Enhanced JSON Structure for Automated Inference

### 4.0 Core Structure Components

The JSON structure is organized into three main sections for maximum automation and traceability:

1. **Data Nodes (`data_nodes`)**
   - Defines all available input data
   - Specifies data types (numeric/categorical)
   - Maps to source columns
   - Groups by category (coordinates, assay, geology, drilling)

2. **Inference Rules (`inference_rules`)**
   - Defines conditions for generating inferences
   - Lists required data sources
   - Specifies trigger conditions
   - Details concrete actions to take

3. **Active Inferences (`inferences`)**
   - Stores currently active inferences
   - Maintains relationships between nodes
   - Tracks inference history

### Key Advantages

1. **Automation Ready**
   - Structured for AI agent processing
   - Clear input-output relationships
   - Deterministic rule triggers
   - Standardized action formats

2. **Full Traceability**
   - Every inference links to source data
   - Decision paths are recorded
   - Evidence chain is maintained
   - Impact tracking for each decision

3. **Actionable Outputs**
   - Concrete actions instead of descriptions
   - Clear implementation steps
   - Measurable outcomes
   - Direct API integration points

4. **Priority Management**
   - Action importance levels
   - Resource allocation guidance
   - Critical path identification
   - Risk-based prioritization

5. **Impact Assessment**
   - Affected areas are identified
   - Cross-dependencies tracked
   - Cascade effects documented
   - Resource estimation implications

---

## 5. Modular Architecture & Domain-Agnostic Design

### 5.1 Code Refactoring

The codebase has been refactored into a modular architecture for better maintainability and reusability:

**File Structure:**
```
tree/
├── decision_tree.html         # Minimal orchestrator (loads main.js)
├── context.json               # Data & inference rules (domain-specific)
├── styles/
│   └── styles.css             # All visual styles
└── src/
    ├── main.js                # Application entry point
    ├── transform/
    │   └── transformContextToTree.js    # JSON → D3 hierarchy
    ├── animation/
    │   └── growthController.js          # Organic growth animation
    └── render/
        ├── treeRender.js                # Main tree visualization
        └── inferencesOverlay.js         # Dynamic inference nodes
```

**Key Benefits:**
- **Separation of Concerns**: Each module has a single responsibility
- **Reusability**: Modules can be imported in different contexts
- **Testability**: Individual functions can be tested in isolation
- **Maintainability**: Changes are localized to specific modules

### 5.2 Domain-Agnostic Inference Engine

The inference system is now **100% data-driven** and domain-agnostic:

**Before (Hardcoded):**
```javascript
// Geology-specific logic in JavaScript
if (niNode && niLateriticoNode) {
  const trendNode = { inference: 'Trend Vertical', ... };
  // Hardcoded text about lateritic deposits
}
```

**After (Data-Driven):**
```javascript
// Generic logic reads from JSON
Object.entries(contextData.inferences).forEach(([key, inf]) => {
  const sources = inf.sources.map(path => byPath(path));
  if (allSourcesVisible) createInferenceNode(inf);
});
```

**JSON Structure:**
```json
{
  "inferences": {
    "trend_vertical": {
      "type": "inference",
      "title": "Trend Vertical",
      "sources": ["inferences.ni_lateritico", "elements.Ni"],
      "evidence": { "tipo": "Depósito laterítico" },
      "implications": ["Análise por bench", "..."]
    }
  }
}
```

**Advantages:**
1. **Domain Independence**: Change geology → chemistry by replacing JSON
2. **No Code Changes**: Add new inferences without touching JavaScript
3. **Inference Chaining**: Inferences reference other inferences (`inferences.ni_lateritico`)
4. **Visual Consistency**: All inference nodes render identically
5. **Full Traceability**: Every node links back to source data/inferences

### 5.3 Inference Path Resolution

The system supports two types of source references:

1. **Data Paths**: `"elements.Ni"` → finds "Ni" node in tree
2. **Inference Paths**: `"inferences.variograma"` → finds inference by title

This enables complex inference chains:
```
Ni + Si + Mg + Lithology 
  → Ni Laterítico 
    → Variograma Anisotropico 
      → Krigagem Anisotropica
```

All connections are automatically drawn when source nodes become visible.

### 5.4 Generic Render Types

All node rendering is now controlled by `render_type` in the JSON, eliminating hardcoded conditions:

**Available Render Types:**

| `render_type` | Purpose | Required Fields | Visual Output |
|--------------|---------|-----------------|---------------|
| `simple_value` | Display single value | `value`, `column` | Circle node with value in tooltip |
| `stats_summary` | Statistical summary | `stats`, `column` | Circle node with stats in tooltip |
| `distribution` | Show distribution | `distribution`, `column` | Circle node with %distribution in tooltip |
| `pie_chart` | Pie chart visualization | `distribution`, `column` | Circle + pie chart card beside node |

**Example JSON:**
```json
{
  "drill_type": {
    "column": "DTYPE",
    "render_type": "pie_chart",
    "distribution": {
      "DDH": 50,
      "RC": 50
    }
  },
  "depth": {
    "column": "DEPTH",
    "render_type": "simple_value",
    "value": 327.5
  },
  "x": {
    "column": "XCOLLAR",
    "render_type": "stats_summary",
    "stats": {"mean": 345650, "min": 345500, "max": 345800}
  }
}
```

**Before (Hardcoded):**
```javascript
if (key === 'diameter') {
  // Special logic for diameter
}
if (key === 'drill_type') {
  // Special logic for drill_type
}
```

**After (Data-Driven):**
```javascript
const renderType = value.render_type;
if (renderType === 'pie_chart') {
  // Generic pie chart rendering
}
```

**Key Benefits:**
- No domain-specific `if` statements
- Add new visualization types by extending `render_type` options
- Consistent rendering logic across all data types
- Easy to add bar charts, histograms, scatter plots, etc.

### 5.5 Collision Detection & Automatic Layout

To ensure visual clarity as the knowledge graph grows organically, an **automatic collision detection system** prevents overlaps:

**Features:**

1. **Minimum Distance Enforcement**
   - `MIN_DISTANCE = 180px` between inference nodes
   - Prevents visual overlap and label collision

2. **Spiral Search Algorithm**
   - Attempts initial position (below source nodes)
   - If collision detected, searches in spiral pattern
   - Tries up to 50 positions before fallback

3. **Collision Detection Logic**
   ```javascript
   function hasCollision(x, y, existingNodes) {
     for (const node of existingNodes) {
       const distance = Math.sqrt((x - node.x)² + (y - node.y)²);
       if (distance < MIN_DISTANCE) return true;
     }
     return false;
   }
   ```

4. **Enhanced Tree Spacing**
   - Increased node separation: `4` (siblings) / `6` (cousins)
   - Larger node size: `50x120px` spacing
   - Prevents overlap in main tree structure

**Result:**
- ✅ No overlapping nodes or cards
- ✅ Organic growth without manual positioning
- ✅ Scales to hundreds of inference nodes
- ✅ Maintains readability as complexity increases

## 5. JSON Structure for Decision Tree and Pipeline

### 4.1 Pipeline Base JSON

```json
{
  "input": {
    "file": "file_name.csv",
    "type": "Collar | Survey | Assay",
    "timestamp": "YYYY-MM-DDTHH:MM:SSZ"
  },
  "collar": {
    "coordinates": {"x": null, "y": null, "z": null},
    "hole_id": null,
    "depth": null,
    "diameter": null,
    "drill_type": null,
    "topography": {"height": null, "delta_height": null},
    "hole_density": null,
    "grid_pattern": null,
    "history": {"sequence": null, "repeated_intervals": null}
  },
  "survey": {
    "vertical": null,
    "inclination": null,
    "curvature": null,
    "direction": null,
    "hole_overlap": null,
    "zone_intersections": null,
    "child_holes": []
  },
  "assay": {
    "elements": [],
    "minerals": [],
    "deposit_context_type": null,
    "deposit_ranking": [
      {"deposit": null, "probability": null}
    ],
    "grade_variation": [],
    "alteration_indicators": [],
    "economic_potential": null
  },
  "combined_inferences": {
    "hole_distribution": null,
    "mineralization_probability": null,
    "density_spacing": null,
    "priority_areas": []
  },
  "final_result": {
    "context": {
      "deposit_type": null,
      "alteration_zone": null,
      "hole_density": null,
      "grid_pattern": null
    },
    "results": [
      {"deposit": null, "probability": null}
    ]
  }
}
