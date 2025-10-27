// Growth controller for sequential DFS animation

export function initGrowthController({
  allNodes,
  visibleNodes,
  draw,
  durationSliderId = 'durationSlider',
  durationValueId = 'durationValue',
  defaultDurationSec = 10,
}) {
  let totalDurationMs = defaultDurationSec * 1000;

  const durationSlider = document.getElementById(durationSliderId);
  const durationValue = document.getElementById(durationValueId);
  if (durationSlider && durationValue) {
    durationSlider.value = String(defaultDurationSec);
    durationValue.textContent = String(defaultDurationSec);
    durationSlider.addEventListener('input', () => {
      durationValue.textContent = durationSlider.value;
      totalDurationMs = Number(durationSlider.value) * 1000;
    });
  }

  const perNodeMs = () => Math.max(120, Math.floor(totalDurationMs / Math.max(allNodes.length, 1)));

  // Separar nós regulares e inferências
  const regularNodes = allNodes.filter(n => !n.node.data?.isInference);
  const inferenceNodes = allNodes.filter(n => n.node.data?.isInference);
  
  // Ordenar inferências baseado em suas dependências
  const orderedInferences = [];
  const remainingInferences = [...inferenceNodes];
  const processedIds = new Set();

  function getInferenceDependencies(node) {
    if (!node.node.data?.sources) return [];
    return node.node.data.sources
      .filter(s => s.startsWith('inferences.'))
      .map(s => s.split('.')[1]);
  }

  function canProcessInference(node) {
    const deps = getInferenceDependencies(node);
    return deps.every(id => processedIds.has(id));
  }

  while (remainingInferences.length > 0) {
    const processableIndex = remainingInferences.findIndex(canProcessInference);
    if (processableIndex === -1) break; // Evitar loop infinito se houver dependência circular
    
    const inference = remainingInferences.splice(processableIndex, 1)[0];
    orderedInferences.push(inference);
    processedIds.add(inference.node.data.id);
  }
  
  let currentNodeIndex = 0;
  let currentLevel = 0;
  let showingInferences = false;
  
  const maxRegularLevel = Math.max(...regularNodes.map(n => n.level));
  const maxInferenceLevel = Math.max(...orderedInferences.map(n => n.level));

  function findNextNode() {
    const currentArray = showingInferences ? orderedInferences : regularNodes;
    const maxLevel = showingInferences ? maxInferenceLevel : maxRegularLevel;

    // First, try to find a node at the current level
    while (currentNodeIndex < currentArray.length) {
      const candidate = currentArray[currentNodeIndex];
      if (candidate.level === currentLevel) {
        currentNodeIndex++;
        return candidate.node;
      }
      currentNodeIndex++;
    }

    // If we've checked all nodes at this level, move to next level
    if (currentLevel < maxLevel) {
      currentLevel++;
      currentNodeIndex = 0;
      return findNextNode();
    }

    // If we finished regular nodes, switch to inferences
    if (!showingInferences) {
      showingInferences = true;
      currentNodeIndex = 0;
      currentLevel = 0;
      return findNextNode();
    }

    return null;
  }

  function step() {
    const nextNode = findNextNode();
    if (!nextNode) return;

    // Check if parent is visible
    if (nextNode.parent && !visibleNodes.some((v) => v.data === nextNode.parent.data)) {
      setTimeout(step, 50);
      return;
    }

    // Check if all required source nodes are visible for inferences
    if (nextNode.data?.isInference && nextNode.data.sources) {
      const allSourcesVisible = nextNode.data.sources.every(sourcePath => 
        visibleNodes.some(v => v.data && v.data.id === sourcePath)
      );
      if (!allSourcesVisible) {
        // Put this node back at the end of the queue
        inferenceNodes.push({ node: nextNode, level: currentLevel });
        setTimeout(step, 50);
        return;
      }
    }

    visibleNodes.push(nextNode);
    draw();
    setTimeout(step, perNodeMs());
  }

  // initial render and start
  draw();
  step();
}


