// Using global neo4j object from CDN
const globalNeo4j = window.neo4j;

class Neo4jClient {
    constructor() {
        // Load from environment variables in production
        this.uri = "bolt://127.0.0.1:7687";
        this.user = "neo4j";
        this.password = "knowledge_tree_2024";
        this.database = "geoai";
        this.driver = null;
        this._connectionPromise = null;
    }

    async connect() {
        // Return existing connection if already connecting/connected
        if (this._connectionPromise) {
            return this._connectionPromise;
        }

        // Create new connection
        this._connectionPromise = (async () => {
            try {
                if (!globalNeo4j) {
                    throw new Error("Neo4j driver not loaded. Please check if the script is included in the HTML.");
                }
                this.driver = globalNeo4j.driver(
                    this.uri,
                    globalNeo4j.auth.basic(this.user, this.password),
                    { disableLosslessIntegers: true }
                );
                await this.driver.verifyConnectivity();
                console.log("Connected to Neo4j");
            } catch (error) {
                this._connectionPromise = null;
                console.error("Error connecting to Neo4j:", error);
                throw error;
            }
        })();

        return this._connectionPromise;
    }

    async getDataNodes() {
        const session = await this.getSession();
        try {
            const result = await session.run(`
                MATCH (n:DataNode)
                OPTIONAL MATCH (n)-[r:CONTAINS]->(child:DataNode)
                WITH DISTINCT n, collect(DISTINCT child.id) as children
                RETURN DISTINCT
                       n.id as id,
                       n.title as title,
                       n.stats as stats,
                       n.distribution as distribution,
                       n.value as value,
                       n.render_type as render_type,
                       n.column as column,
                       n.type as type,
                       children
                ORDER BY n.id
            `);
            const nodes = result.records.map(record => {
                const node = {
                    id: record.get('id'),
                    title: record.get('title'),
                    stats: record.get('stats'),
                    distribution: record.get('distribution'),
                    value: record.get('value'),
                    render_type: record.get('render_type'),
                    column: record.get('column'),
                    type: record.get('type'),
                    children: record.get('children')
                };
                console.log('Raw node from Neo4j:', node);
                return node;
            });
            console.log('All nodes from Neo4j:', nodes);
            return nodes;
        } finally {
            await session.close();
        }
    }

    async getInferences() {
        console.log('🚀 getInferences() v1.0.6 - Buscando com campo TYPE');
        const session = await this.getSession();
        try {
            // Buscar inferências com todas as relações em uma única query
            const result = await session.run(`
                // Get all inferences and their relationships in a single query
                MATCH (i:Inference)
                
                // Get data nodes that support this inference
                OPTIONAL MATCH (source:DataNode)-[:SUPPORTS]->(i)
                WITH DISTINCT i, collect(DISTINCT source.id) as data_sources
                
                // Get inference nodes that lead to this one
                OPTIONAL MATCH (source_inf:Inference)-[:LEADS_TO]->(i)
                WITH DISTINCT i, data_sources, 
                     collect(DISTINCT 'inferences.' + source_inf.id) as inference_sources
                
                // Get target inferences that this one leads to
                OPTIONAL MATCH (i)-[:LEADS_TO]->(target:Inference)
                WITH DISTINCT i, 
                     data_sources + inference_sources as all_sources,
                     collect(DISTINCT target.id) as targets
                
                RETURN DISTINCT
                    i.id as id,
                    i.title as title,
                    i.type as type,
                    i.evidence as evidence,
                    i.implications as implications,
                    i.recommendations as recommendations,
                    i.metadata as metadata,
                    all_sources as sources,
                    targets
                ORDER BY i.id
            `);

            const inferences = result.records.map(record => {
                // Parse JSON strings
                const parseJson = (value, defaultValue) => {
                    if (!value) return defaultValue;
                    try {
                        return typeof value === 'string' ? JSON.parse(value) : value;
                    } catch (e) {
                        console.warn('Failed to parse JSON:', value);
                        return defaultValue;
                    }
                };

                // Get and clean up values - V1.0.6 WITH TYPE FIELD
                const id = record.get('id');
                const title = record.get('title');
                const typeRaw = record.get('type');
                const type = typeRaw; // Preserve original value
                
                // DEBUG INTENSO: Ver TUDO que está vindo
                console.log(`🔍 [v1.0.6] Neo4j record for "${id}":`, {
                    raw_type: typeRaw,
                    type_value: type,
                    type_typeof: typeof type,
                    record_keys: record.keys,
                    has_type_key: record.keys.includes('type')
                });
                
                const evidence = parseJson(record.get('evidence'), {});
                const implications = parseJson(record.get('implications'), []);
                const recommendations = parseJson(record.get('recommendations'), []);
                const metadata = parseJson(record.get('metadata'), {});
                const sources = record.get('sources').filter(Boolean);
                const targets = record.get('targets').filter(Boolean);

                console.log(`✅ [v1.0.6] Inference "${id}" parsed with type="${type}"`);

                return {
                    id,
                    title,
                    type,
                    evidence,
                    implications,
                    recommendations,
                    metadata,
                    sources,
                    targets
                };
            });

            console.log('All inferences loaded:', inferences.length);
            return inferences;
        } finally {
            await session.close();
        }
    }

    async close() {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
            this._connectionPromise = null;
            console.log("Disconnected from Neo4j");
        }
    }

    // Get a session, creating connection if needed
    async getSession() {
        if (!this.driver) {
            await this.connect();
        }
        return this.driver.session({ database: this.database });
    }
}

export const neo4jClient = new Neo4jClient();
