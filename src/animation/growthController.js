// Growth controller for sequential DFS animation

export function initGrowthController({
  allNodes,
  visibleNodes,
  draw,
  defaultDurationSec = 3,
}) {
  const totalDurationMs = defaultDurationSec * 1000;
  const perNodeMs = () => Math.max(100, Math.floor(totalDurationMs / Math.max(allNodes.length, 1)));

  // Separar nós regulares e inferências
  const regularNodes = allNodes.filter(n => !n.node.data?.isInference);
  const inferenceNodes = allNodes.filter(n => n.node.data?.isInference);
  
  let currentNodeIndex = 0;
  let currentLevel = 0;
  let showingInferences = false;
  
  const maxRegularLevel = Math.max(...regularNodes.map(n => n.level));

  function findNextNode() {
    // Processar apenas nós regulares (inferências aparecem todas de uma vez)
    const currentArray = regularNodes;
    const maxLevel = maxRegularLevel;

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

    // Todos os nós regulares processados
    if (!showingInferences) {
      console.log('✅ Nós regulares completos! Mostrando TODAS as inferências...');
      showingInferences = true;
    }

    return null;
  }

  function step() {
    const nextNode = findNextNode();
    
    if (!nextNode) {
      // Todos os nós regulares foram processados
      // Mostrar TODAS as inferências de uma vez
      if (showingInferences) {
        console.log('🏁 Animação completa! Mostrando inferências...');
        draw({ readyForInferences: true });
      }
      return;
    }

    // Check if parent is visible
    if (nextNode.parent && !visibleNodes.some((v) => v.data === nextNode.parent.data)) {
      setTimeout(step, 50);
      return;
    }

    visibleNodes.push(nextNode);
    draw({ readyForInferences: false });
    setTimeout(step, perNodeMs());
  }

  // initial render and start
  draw({ readyForInferences: false });
  step();
}


