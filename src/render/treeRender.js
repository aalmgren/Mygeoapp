import { applyInferencesOverlay } from './inferencesOverlay.js';

// Initialize tree renderer (layout, group, zoom) and expose a draw method
export function initTreeRender({ svg, tooltip, margin, width, height }) {
  // Centralizar o conteúdo
  const g = svg.append('g').attr('transform', `translate(${width/2},${50})`);

  // zoom/pan com centralização automática
  const zoom = d3.zoom()
    .scaleExtent([0.3, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
  svg.call(zoom);

  const treeLayout = d3
    .tree()
    .size([width * 0.9, height * 0.7])
    .separation((a, b) => (a.parent === b.parent ? 1.2 : 2))
    .nodeSize([25, 80]);

  function curvedPath(d) {
    const x0 = d.source.x,
      y0 = d.source.y;
    const x1 = d.target.x,
      y1 = d.target.y;
    const mx = (y0 + y1) / 2;
    return `M${x0},${y0} C${x0},${mx} ${x1},${mx} ${x1},${y1}`;
  }

  function curvedLink(source, target) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
    return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
  }

  function draw({ visibleNodes, currentNodes, inferenceNodes, readyForInferences }) {
    const hierarchy = d3.hierarchy(visibleNodes[0].data);
    const tree = treeLayout(hierarchy);

    const visibleSet = new Set(visibleNodes.map((n) => n.data));
    function isAncestorOfVisible(node) {
      for (const vn of visibleNodes) {
        let p = vn;
        while (p) {
          if (p.data === node.data) return true;
          p = p.parent;
        }
      }
      return false;
    }

    let treeNodes = tree.descendants().filter((d) => {
      const isVisible = visibleSet.has(d.data);
      return isVisible || isAncestorOfVisible(d);
    });

    // Apply special inference overlay (adds nodes/links)
    applyInferencesOverlay({ 
      g, 
      currentNodes: treeNodes, 
      visibleNodes, 
      inferenceNodes: inferenceNodes || [],
      curvedLink,
      readyForInferences
    });

    const currentLinks = treeNodes
      .filter((n) => n.parent && treeNodes.includes(n.parent))
      .map((n) => ({ source: n.parent, target: n }));

    // Links
    const link = g.selectAll('.link').data(currentLinks, (d) => d.target.data.inference);
    const linkEnter = link
      .enter()
      .append('path')
      .attr('class', (d) => (d.isInference ? 'inference-link' : 'link'))
      .attr('d', (d) => `M${d.source.x},${d.source.y}L${d.source.x},${d.source.y}`);
    linkEnter
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attrTween('d', function (d) {
        const interp = d3.interpolateNumber(0, 1);
        return function (t) {
          const p = interp(t);
          const partial = {
            source: d.source,
            target: {
              x: d.source.x + (d.target.x - d.source.x) * p,
              y: d.source.y + (d.target.y - d.source.y) * p,
            },
          };
          return curvedPath(partial);
        };
      });

    // Nodes
    const node = g.selectAll('.node').data(treeNodes, (d) => d?.data?.inference || d?.data?.id || Math.random());
    const nodeEnter = node
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.parent ? d.parent.x : d.x},${d.parent ? d.parent.y : d.y})`);

    // Inference card nodes
    const nodeData = nodeEnter.data()[0];
    if (nodeData && nodeData.data && nodeData.data.isInference) {
      const ng = nodeEnter.append('g').attr('class', 'inference-node');
      ng.append('rect').attr('x', -50).attr('y', -15).attr('width', 100).attr('height', 30).attr('opacity', 0).transition().duration(600).attr('opacity', 1);
      ng.append('text').attr('text-anchor', 'middle').attr('dy', 5).text(nodeData.data.inference).attr('opacity', 0).transition().duration(600).attr('opacity', 1);
      ng
        .on('mouseover', (event) => {
          tooltip
            .style('opacity', 1)
            .html(`<strong>${nodeData.data.inference}</strong><br><br>${nodeData.data.result}`)
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 10 + 'px');
        })
        .on('mouseout', () => tooltip.style('opacity', 0));
    } else {
      // Default circle nodes
      nodeEnter
        .append('circle')
        .attr('r', 0)
        .on('mouseover', (event, d) => {
          const title = `<strong>${d.data.inference}</strong>`;
          const column = d.data.column ? `<br><strong>Column:</strong> ${d.data.column}` : '';
          const content = d.data.result ? `<br><br>${d.data.result}` : '';
          tooltip.style('opacity', 1).html(title + column + content).style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px');
        })
        .on('mouseout', () => tooltip.style('opacity', 0))
        .transition()
        .duration(600)
        .ease(d3.easeBackOut.overshoot(1.2))
        .attr('r', 6);
    }

    nodeEnter
      .append('text')
      .attr('dy', -15)
      .text((d) => d.data.inference)
      .style('opacity', 0)
      .transition()
      .duration(500)
      .style('opacity', 1);

    nodeEnter.transition().duration(600).attr('transform', (d) => `translate(${d.x},${d.y})`);
  }

  return { g, draw };
}


