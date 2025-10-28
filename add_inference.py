#!/usr/bin/env python3
"""
Script rápido para adicionar novas inferências ao Neo4j.
Lê new_inference.json e cria a inferência + relacionamentos.

Uso:
    python add_inference.py
"""

import json
import sys
from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

load_dotenv()

def add_inference():
    # Ler arquivo JSON
    try:
        with open('new_inference.json', 'r') as f:
            inference = json.load(f)
    except FileNotFoundError:
        print("❌ Arquivo 'new_inference.json' não encontrado!")
        sys.exit(1)
    except json.JSONDecodeError:
        print("❌ Erro ao ler JSON. Verifique o formato!")
        sys.exit(1)
    
    # Validar campos obrigatórios
    required = ['id', 'title', 'evidence', 'implications', 'recommendations', 'sources']
    for field in required:
        if field not in inference:
            print(f"❌ Campo obrigatório '{field}' não encontrado no JSON!")
            sys.exit(1)
    
    # Conectar ao Neo4j
    uri = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "knowledge_tree_2024")
    database = os.getenv("NEO4J_DATABASE", "geoai")
    
    driver = GraphDatabase.driver(uri, auth=(user, password))
    
    try:
        with driver.session(database=database) as session:
            # 1. Deletar se já existe (para atualizar)
            session.run(
                "MATCH (i:Inference {id: $id}) DETACH DELETE i",
                {"id": inference['id']}
            )
            print(f"🗑️  Removida inferência anterior (se existia)...")
            
            # 2. Criar nova inferência
            session.run(
                """
                CREATE (i:Inference {
                    id: $id,
                    title: $title,
                    evidence: $evidence,
                    implications: $implications,
                    recommendations: $recommendations
                })
                """,
                {
                    "id": inference['id'],
                    "title": inference['title'],
                    "evidence": json.dumps(inference['evidence']),
                    "implications": json.dumps(inference['implications']),
                    "recommendations": json.dumps(inference['recommendations'])
                }
            )
            print(f"✅ Criada inferência: {inference['title']} (ID: {inference['id']})")
            
            # 3. Conectar aos nós de dados (SUPPORTS)
            for source in inference.get('sources', []):
                session.run(
                    """
                    MATCH (n:DataNode {id: $source})
                    MATCH (i:Inference {id: $inference_id})
                    MERGE (n)-[:SUPPORTS]->(i)
                    """,
                    {"source": source, "inference_id": inference['id']}
                )
                print(f"  🔗 Conectado: {source} → {inference['id']}")
            
            # 4. Conectar a outras inferências (LEADS_TO)
            for target in inference.get('targets', []):
                session.run(
                    """
                    MATCH (i:Inference {id: $inference_id})
                    MATCH (target:Inference {id: $target_id})
                    MERGE (i)-[:LEADS_TO]->(target)
                    """,
                    {"inference_id": inference['id'], "target_id": target}
                )
                print(f"  🔗 Conectado: {inference['id']} → {target}")
            
            print(f"\n✨ Pronto! Inferência '{inference['title']}' adicionada com sucesso!")
            print(f"📄 Próximo passo: Refresh no navegador (Ctrl + Shift + R)")
            
    except Exception as e:
        print(f"❌ Erro ao adicionar inferência: {e}")
        sys.exit(1)
    finally:
        driver.close()

if __name__ == "__main__":
    add_inference()
