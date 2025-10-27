from neo4j import GraphDatabase
import logging
import os
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def show_nodes():
    uri = os.getenv("NEO4J_URI", "neo4j://localhost:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "knowledge_tree_2024")
    database = os.getenv("NEO4J_DATABASE", "geoai")

    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        with driver.session(database=database) as session:
            # Query all nodes with their relationships
            result = session.run("""
                MATCH (n)
                OPTIONAL MATCH (n)-[r]->(m)
                RETURN DISTINCT 
                    labels(n) as labels,
                    n.id as id,
                    n.title as title,
                    collect(DISTINCT type(r)) as relationship_types,
                    collect(DISTINCT m.id) as connected_to
                ORDER BY n.id
            """)
            
            print("\n📊 Nodes in database:")
            print("=" * 80)
            
            for record in result:
                labels = record['labels']
                node_id = record['id']
                title = record['title']
                rels = record['relationship_types']
                targets = record['connected_to']
                
                print(f"\n🔵 Node: {node_id}")
                print(f"  Labels: {', '.join(labels)}")
                if title:
                    print(f"  Title: {title}")
                if rels and rels[0]:
                    print(f"  Relationships: {', '.join(rels)}")
                if targets and targets[0]:
                    print(f"  Connected to: {', '.join(targets)}")
            
            # Count nodes by label
            counts = session.run("""
                MATCH (n)
                RETURN 
                    labels(n) as labels,
                    count(*) as count
                ORDER BY count DESC
            """)
            
            print("\n📈 Node counts by type:")
            print("=" * 80)
            for record in counts:
                labels = record['labels']
                count = record['count']
                print(f"{', '.join(labels)}: {count}")
            
        driver.close()
        
    except Exception as e:
        logger.error(f"Error querying Neo4j: {e}")
        raise

if __name__ == "__main__":
    show_nodes()
