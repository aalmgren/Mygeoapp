from flask import Flask, jsonify
from flask_cors import CORS
from neo4j import GraphDatabase
import os
from dotenv import load_dotenv
import logging

load_dotenv()
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_neo4j_driver():
    uri = os.getenv("NEO4J_URI", "neo4j://127.0.0.1:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "knowledge_tree_2024")
    return GraphDatabase.driver(uri, auth=(user, password))

@app.route('/api/data')
def get_data():
    try:
        driver = get_neo4j_driver()
        database = os.getenv("NEO4J_DATABASE", "geoai")
        
        with driver.session(database=database) as session:
            # Get data nodes
            result = session.run("""
                MATCH (n:DataNode)
                RETURN n
                ORDER BY n.id
            """)
            data_nodes = [record["n"] for record in result]
            
            # Get inferences with their relationships
            result = session.run("""
                MATCH (i:Inference)
                OPTIONAL MATCH (source)-[r:SUPPORTS]->(i)
                OPTIONAL MATCH (i)-[l:LEADS_TO]->(target:Inference)
                RETURN i, collect(DISTINCT source.id) as sources, collect(DISTINCT target.id) as targets
            """)
            inferences = [{
                **dict(record["i"]),
                "sources": record["sources"],
                "targets": record["targets"]
            } for record in result]
            
        driver.close()
        
        return jsonify({
            "data_nodes": [dict(node) for node in data_nodes],
            "inferences": inferences
        })
        
    except Exception as e:
        logger.error(f"Error fetching data: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
