// Mock data for the cluster map
const mockClusterData = {
  clusters: [
    { id: 1, name: 'North Target', color: '#1f77b4', points: 250 },
    { id: 2, name: 'South Target', color: '#ff7f0e', points: 180 },
    { id: 3, name: 'East Target', color: '#2ca02c', points: 120 },
    { id: 4, name: 'West Target', color: '#d62728', points: 90 }
  ]
};

export function showClusterMap() {
  // Create modal container
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  // Create modal content
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 80%;
    max-width: 800px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
  `;

  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    background: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
  `;
  closeBtn.onclick = () => modal.remove();

  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Target Clusters Analysis';
  title.style.cssText = `
    margin: 0 0 20px 0;
    color: #333;
    font-size: 20px;
  `;

  // Create SVG for the map
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '400');
  svg.style.border = '1px solid #ddd';
  svg.style.borderRadius = '4px';
  svg.style.marginBottom = '20px';

  // Add mock cluster visualization
  const clusters = mockClusterData.clusters;
  clusters.forEach((cluster, i) => {
    const x = 150 + Math.cos(i * Math.PI/2) * 100;
    const y = 200 + Math.sin(i * Math.PI/2) * 100;
    
    // Add cluster circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', Math.sqrt(cluster.points) * 0.8);
    circle.setAttribute('fill', cluster.color);
    circle.setAttribute('opacity', '0.7');
    svg.appendChild(circle);
    
    // Add cluster label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y - 20);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#333');
    text.textContent = cluster.name;
    svg.appendChild(text);
    
    // Add points count
    const count = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    count.setAttribute('x', x);
    count.setAttribute('y', y + 5);
    count.setAttribute('text-anchor', 'middle');
    count.setAttribute('fill', '#fff');
    count.setAttribute('font-weight', 'bold');
    count.textContent = cluster.points;
    svg.appendChild(count);
  });

  // Add legend
  const legend = document.createElement('div');
  legend.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
    margin-top: 20px;
  `;

  clusters.forEach(cluster => {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
    `;

    const color = document.createElement('div');
    color.style.cssText = `
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${cluster.color};
    `;

    const info = document.createElement('div');
    info.innerHTML = `
      <div style="font-weight:500">${cluster.name}</div>
      <div style="font-size:12px;color:#666">${cluster.points} points</div>
    `;

    item.appendChild(color);
    item.appendChild(info);
    legend.appendChild(item);
  });

  // Add statistics
  const stats = document.createElement('div');
  stats.style.cssText = `
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 4px;
    font-size: 14px;
  `;
  stats.innerHTML = `
    <div style="font-weight:500;margin-bottom:10px">Cluster Statistics:</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px">
      <div>• Total points: 640</div>
      <div>• Average points per cluster: 160</div>
      <div>• Largest cluster: North (250)</div>
      <div>• Smallest cluster: West (90)</div>
    </div>
  `;

  // Assemble modal
  content.appendChild(closeBtn);
  content.appendChild(title);
  content.appendChild(svg);
  content.appendChild(legend);
  content.appendChild(stats);
  modal.appendChild(content);
  document.body.appendChild(modal);

  // Add click handler to close modal when clicking outside
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}
