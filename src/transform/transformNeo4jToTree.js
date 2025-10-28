import { neo4jClient } from '../data/neo4jClient.js';

function buildTreeFromNodes(dataNodes, inferences) {
    console.log('🔨 Building tree from:', { 
        dataNodesCount: dataNodes.length,
        inferencesCount: inferences.length
    });
    
    // Primeiro, vamos organizar os nós por seu caminho completo
    const nodesByPath = new Map();
    
    // Processar todos os nós de dados
    dataNodes.forEach(node => {
        const parts = node.id.split('.');
        const root = parts[0];
        
        // Ignorar nós que não são dos tipos principais
        if (!['collar', 'survey', 'assay', 'lithology'].includes(root)) {
            return;
        }
        
        // Ignorar subnodes (stats, distribution)
        if (parts[parts.length - 1] === 'stats' || parts[parts.length - 1] === 'distribution') return;
        
                // Criar ou atualizar nó
        const treeNode = {
            inference: parts[parts.length - 1],
            id: node.id,
            children: [],
            render_type: node.render_type,
            column: node.column,
            type: node.type
        };

        // Determinar qual propriedade usar (prioridade: stats > distribution > value)
        if (node.stats) {
            treeNode.stats = typeof node.stats === 'string' ? JSON.parse(node.stats) : node.stats;
            treeNode.result = formatStats(treeNode.stats);
        } else if (node.distribution) {
            treeNode.distribution = typeof node.distribution === 'string' ? JSON.parse(node.distribution) : node.distribution;
            treeNode.result = formatDistribution(treeNode.distribution);
        } else if (node.value !== undefined) {
            treeNode.value = node.value;
            treeNode.result = String(node.value);
        }
        

        // Adicionar nó ao mapa
        nodesByPath.set(node.id, treeNode);
        
        // Se o nó tem filhos, criar entradas para eles também
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(childId => {
                const childNode = dataNodes.find(n => n.id === childId);
                if (childNode) {
                    const childParts = childId.split('.');
                    const childTreeNode = {
                        inference: childParts[childParts.length - 1],
                        id: childId,
                        children: [],
                        render_type: childNode.render_type,
                        column: childNode.column,
                        type: childNode.type
                    };

                    // Determinar qual propriedade usar (prioridade: stats > distribution > value)
                    if (childNode.stats) {
                        childTreeNode.stats = typeof childNode.stats === 'string' ? JSON.parse(childNode.stats) : childNode.stats;
                        childTreeNode.result = formatStats(childTreeNode.stats);
                    } else if (childNode.distribution) {
                        childTreeNode.distribution = typeof childNode.distribution === 'string' ? JSON.parse(childNode.distribution) : childNode.distribution;
                        childTreeNode.result = formatDistribution(childTreeNode.distribution);
                    } else if (childNode.value !== undefined) {
                        childTreeNode.value = childNode.value;
                        childTreeNode.result = String(childNode.value);
                    }
                    nodesByPath.set(childId, childTreeNode);
                }
            });
        }
    });
    
    // Construir a hierarquia
    const rootNodes = {
        collar: { inference: 'Collar', children: [] },
        survey: { inference: 'Survey', children: [] },
        assay: { inference: 'Assay', children: [] },
        lithology: { inference: 'Lithology', children: [] }
    };
    
    // Conectar os nós
    for (const [path, node] of nodesByPath) {
        const parts = path.split('.');
        if (parts.length === 1) continue; // Skip root nodes
        
        const parentPath = parts.slice(0, -1).join('.');
        const parent = parts.length === 2 ? rootNodes[parts[0]] : nodesByPath.get(parentPath);
        
        if (parent && !parent.children.some(child => child.id === node.id)) {
            parent.children.push(node);
        }
    }
    
    console.log('📊 Raw inferences from Neo4j:', inferences);

            // Processar inferências com estrutura correta e logging
            const inferenceNodes = inferences.map(inference => {
                console.log('🔄 Processing inference from Neo4j:', inference);
                console.log('  → type field:', inference.type, typeof inference.type);

                // Parse JSON strings if needed
                const evidence = typeof inference.evidence === 'string' ? 
                    JSON.parse(inference.evidence || '{}') : (inference.evidence || {});
                const implications = typeof inference.implications === 'string' ? 
                    JSON.parse(inference.implications || '[]') : (inference.implications || []);
                const recommendations = typeof inference.recommendations === 'string' ? 
                    JSON.parse(inference.recommendations || '[]') : (inference.recommendations || []);
                const metadata = typeof inference.metadata === 'string' ? 
                    JSON.parse(inference.metadata || '{}') : (inference.metadata || {});

                // Log para debug
                console.log('✨ Transformed inference:', {
                    id: inference.id,
                    title: inference.title,
                    type: inference.type,
                    sources: inference.sources,
                    targets: inference.targets,
                    evidence,
                    implications,
                    recommendations,
                    metadata
                });

        // Ensure all required fields are present and correctly formatted
        if (!inference.id || !inference.title || !inference.sources) {
            console.warn('⚠️ Invalid inference data:', inference);
            return null;
        }

                return {
                    title: inference.title,
                    id: inference.id,
                    type: inference.type,
                    isInference: true,
                    evidence,
                    implications,
                    recommendations,
                    metadata,
                    sources: inference.sources.map(s => s.trim()).filter(Boolean),
                    targets: inference.targets?.map(t => t.trim()).filter(Boolean) || [],
                    result: formatInferenceContent({ evidence, implications, recommendations })
                };
    });
    
    const result = {
        children: ['collar', 'survey', 'assay', 'lithology']
            .map(key => rootNodes[key])
            .filter(Boolean),
        inferenceNodes
    };

    console.log('🌳 Final tree structure:', {
        dataNodes: result.children.length,
        inferenceNodes: result.inferenceNodes.length,
        structure: {
            children: result.children.map(n => ({
                id: n.id,
                type: n.inference,
                childCount: n.children?.length || 0
            })),
            inferences: result.inferenceNodes.map(n => ({
                id: n.id,
                title: n.title,
                sourceCount: n.sources?.length || 0,
                targetCount: n.targets?.length || 0
            }))
        }
    });

    return result;
}

function formatStats(stats) {
    // Ordem específica das estatísticas
    const order = ['mean', 'median', 'max', 'min', 'cv'];

    // Labels em português
    const labels = {
        'mean': 'Média',
        'median': 'Mediana',
        'max': 'Máximo',
        'min': 'Mínimo',
        'cv': 'CV'
    };

    // Formatar cada estatística em sua própria linha
    if (typeof stats === 'string') {
        try {
            stats = JSON.parse(stats);
        } catch (e) {
            console.warn('Failed to parse stats:', e);
            return stats;
        }
    }

    return order
        .filter(key => key in stats)
        .map(key => `${labels[key]}: ${stats[key]}`)
        .join('<br>');
}

function formatDistribution(distribution) {
    // Formatar cada item da distribuição em sua própria linha
    if (typeof distribution === 'string') {
        try {
            distribution = JSON.parse(distribution);
        } catch (e) {
            console.warn('Failed to parse distribution:', e);
            return distribution;
        }
    }
    return Object.entries(distribution)
        .map(([key, value]) => `${key}: ${value}%`)
        .join('<br>');
}

function formatInferenceContent(inference) {
    let content = [];
    
    if (inference.evidence) {
        content.push('Evidence:');
        if (typeof inference.evidence === 'object') {
            Object.entries(inference.evidence).forEach(([key, value]) => {
                content.push(`  ${key}: ${value}`);
            });
        } else {
            content.push(`  ${inference.evidence}`);
        }
    }
    
    if (inference.implications?.length) {
        content.push('<br>Implications:');
        inference.implications.forEach(imp => {
            content.push(`  • ${imp}`);
        });
    }
    
    if (inference.recommendations?.length) {
        content.push('<br>Recommendations:');
        inference.recommendations.forEach(rec => {
            content.push(`  • ${rec}`);
        });
    }
    
    return content.join('<br>');
}

export async function transformNeo4jToTree() {
    try {
        const [dataNodes, inferences] = await Promise.all([
            neo4jClient.getDataNodes(),
            neo4jClient.getInferences()
        ]);
        
        const tree = buildTreeFromNodes(dataNodes, inferences);
        
        console.log('Data from Neo4j:', { dataNodes, inferences });
        console.log('Transformed tree:', tree);
        
        return tree;
    } catch (error) {
        console.error('Error transforming Neo4j data to tree:', error);
        throw error;
    }
}