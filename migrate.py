"""
Migration runner for Neo4j knowledge tree.
"""

import logging
from migrations.m001_initial_structure import InitialStructureMigration
from migrations.m002_inferences import InferencesMigration

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# List all migrations in order
MIGRATIONS = [
    InitialStructureMigration(),
    InferencesMigration()
]

def run_migrations():
    """Run all pending migrations."""
    try:
        for migration in MIGRATIONS:
            migration.migrate()
        logger.info("✨ All migrations completed successfully!")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise

def rollback_all():
    """Rollback all migrations in reverse order."""
    try:
        for migration in reversed(MIGRATIONS):
            migration.rollback()
        logger.info("✨ All migrations rolled back successfully!")
    except Exception as e:
        logger.error(f"Rollback failed: {e}")
        raise

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--rollback":
        rollback_all()
    else:
        run_migrations()