// Transform context.json into D3 hierarchy-friendly structure
// 100% data-driven: uses render_type and display_mode from JSON

function makeNode(key, value) {
  if (key.startsWith('_')) return null;

  const title = key.charAt(0).toUpperCase() + key.slice(1);
  if (!value) return { inference: title, result: '', children: [] };

  if (Array.isArray(value)) {
    return { inference: title, result: `Array[${value.length}]`, children: [] };
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([k]) => !k.startsWith('_'));
    const node = { inference: title, result: '', children: [] };

    // Check for render_type or display_mode in the object
    const renderType = value.render_type || value.display_mode;
    
    if (renderType === 'distribution') {
      // Generic distribution rendering
      node.column = value.column;
      const dist = value.distribution || {};
      node.result = `<strong>Distribution:</strong><br>` + 
        Object.entries(dist).map(([k, v]) => `${k}: ${v}%`).join('<br>');
      return node;
    }

    if (renderType === 'pie_chart') {
      // Generic pie chart rendering
      node.column = value.column;
      node.renderPieChart = true;
      node.pieData = value.distribution || value.data || {};
      node.result = Object.entries(node.pieData).map(([k, v]) => `${k}: ${v}%`).join('<br>');
      return node;
    }

    if (renderType === 'stats_summary') {
      // Generic statistical summary
      node.column = value.column;
      const stats = value.stats || value;
      const statsSummary = Object.entries(stats)
        .filter(([k]) => !['column', 'render_type', 'display_mode'].includes(k))
        .map(([k, v]) => `${k}: ${v}`)
        .join('<br>');
      node.result = statsSummary;
      node.children = [];
      return node;
    }

    if (renderType === 'simple_value') {
      // Generic simple value display
      node.column = value.column;
      node.result = String(value.value);
      return node;
    }

    // Legacy support: column + stats (auto-detect)
    if ('column' in value) {
      node.column = value.column;
      
      if ('stats' in value) {
        const stats = value.stats;
        const statsSummary = Object.entries(stats).map(([k, v]) => `${k}: ${v}`).join('<br>');
        node.result = statsSummary;
        node.children = [];
        return node;
      }
      
      if ('value' in value && !value.stats && !value.distribution) {
        node.result = String(value.value);
        return node;
      }
    }

    // Recursively process children
    for (const [k, v] of entries) {
      if (!['render_type', 'display_mode', 'column', 'distribution', 'stats', 'value', 'data'].includes(k)) {
        const child = makeNode(k, v);
        if (child) node.children.push(child);
      }
    }
    
    return node;
  }

  return { inference: title, result: value === null ? 'null' : String(value), children: [] };
}

export function transformContextToTree(contextData) {
  if (!contextData || typeof contextData !== 'object') {
    console.error('Invalid context data:', contextData);
    return { inference: 'Error', result: '', children: [] };
  }

  const root = { inference: 'Input CSV', result: '', children: [] };
  
  // Use display_order from JSON if available, otherwise default order
  const displayOrder = contextData.display_order || ['collar', 'survey', 'assay', 'lithology'];
  
  for (const key of displayOrder) {
    if (key in contextData && typeof contextData[key] === 'object' && contextData[key] !== null) {
      const node = makeNode(key, contextData[key]);
      if (node) root.children.push(node);
    }
  }
  
  return root;
}
