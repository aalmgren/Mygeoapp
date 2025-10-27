from abc import ABC, abstractmethod
from neo4j import GraphDatabase
import logging
import os
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseMigration(ABC):
    """Base class for all migrations."""
    
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI", "neo4j://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "knowledge_tree_2024")
        self.database = os.getenv("NEO4J_DATABASE", "geoai")
        self.driver = None
    
    @property
    @abstractmethod
    def version(self) -> str:
        """Migration version number."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Migration description."""
        pass
    
    def connect(self):
        """Connect to Neo4j database."""
        try:
            self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
            self.driver.verify_connectivity()
            logger.info(f"Connected to Neo4j database: {self.database}")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            raise
    
    def close(self):
        """Close Neo4j connection."""
        if self.driver:
            self.driver.close()
            logger.info("Closed Neo4j connection")
    
    def run_query(self, query: str, params: dict = None):
        """Run a Cypher query with parameters."""
        with self.driver.session(database=self.database) as session:
            try:
                result = session.run(query, params or {})
                return result
            except Exception as e:
                logger.error(f"Query failed: {e}")
                raise
    
    def check_if_applied(self) -> bool:
        """Check if this migration has been applied."""
        try:
            result = self.run_query("""
                MATCH (m:Migration {version: $version})
                RETURN m
            """, {"version": self.version})
            return bool(result.single())
        except Exception:
            # If table doesn't exist, migration hasn't been applied
            return False
    
    def mark_as_applied(self):
        """Mark this migration as applied."""
        self.run_query("""
            CREATE (m:Migration {
                version: $version,
                description: $description,
                applied_at: datetime()
            })
        """, {
            "version": self.version,
            "description": self.description
        })
    
    @abstractmethod
    def up(self):
        """Apply the migration."""
        pass
    
    @abstractmethod
    def down(self):
        """Revert the migration."""
        pass
    
    def migrate(self):
        """Run the migration if not already applied."""
        try:
            self.connect()
            
            if self.check_if_applied():
                logger.info(f"Migration {self.version} already applied")
                return
            
            logger.info(f"Applying migration {self.version}: {self.description}")
            self.up()
            self.mark_as_applied()
            logger.info(f"Successfully applied migration {self.version}")
            
        except Exception as e:
            logger.error(f"Migration {self.version} failed: {e}")
            raise
        finally:
            self.close()
    
    def rollback(self):
        """Rollback the migration if applied."""
        try:
            self.connect()
            
            if not self.check_if_applied():
                logger.info(f"Migration {self.version} not applied")
                return
            
            logger.info(f"Rolling back migration {self.version}")
            self.down()
            
            self.run_query("""
                MATCH (m:Migration {version: $version})
                DELETE m
            """, {"version": self.version})
            
            logger.info(f"Successfully rolled back migration {self.version}")
            
        except Exception as e:
            logger.error(f"Rollback of migration {self.version} failed: {e}")
            raise
        finally:
            self.close()
