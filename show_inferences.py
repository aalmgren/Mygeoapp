from neo4j import GraphDatabase
import logging
import os
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def show_inferences():
    uri = os.getenv("NEO4J_URI", "neo4j://127.0.0.1:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "knowledge_tree_2024")
    database = os.getenv("NEO4J_DATABASE", "geoai")

    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        with driver.session(database=database) as session:
            # Query inferences with their relationships
            result = session.run("""
                MATCH (i:Inference)
                OPTIONAL MATCH (source)-[r:SUPPORTS]->(i)
                OPTIONAL MATCH (i)-[l:LEADS_TO]->(target:Inference)
                RETURN 
                    i.id as id,
                    i.title as title,
                    i.evidence as evidence,
                    i.implications as implications,
                    collect(DISTINCT source.id) as sources,
                    collect(DISTINCT target.id) as targets
                ORDER BY i.id
            """)
            
            print("\nInferências e suas conexões:")
            print("----------------------------")
            
            for record in result:
                print(f"\n📊 {record['title']} (ID: {record['id']})")
                
                # Mostrar origens (sources)
                if record['sources']:
                    print("  📥 Origem dos dados:")
                    for source in record['sources']:
                        if source:  # Alguns podem ser null
                            print(f"    • {source}")
                
                # Mostrar alvos (outras inferências que esta leva a)
                if record['targets']:
                    print("  📤 Leva a:")
                    for target in record['targets']:
                        if target:  # Alguns podem ser null
                            print(f"    • {target}")
                
                # Mostrar evidências
                if record['evidence']:
                    print("  🔍 Evidências:")
                    evidence = record['evidence']
                    if isinstance(evidence, str):
                        import json
                        evidence = json.loads(evidence)
                    for key, value in evidence.items():
                        print(f"    • {key}: {value}")
                
                # Mostrar implicações
                if record['implications']:
                    print("  💡 Implicações:")
                    implications = record['implications']
                    if isinstance(implications, str):
                        import json
                        implications = json.loads(implications)
                    for imp in implications:
                        print(f"    • {imp}")
            
        driver.close()
        
    except Exception as e:
        logger.error(f"Error querying Neo4j: {e}")
        raise

if __name__ == "__main__":
    show_inferences()
