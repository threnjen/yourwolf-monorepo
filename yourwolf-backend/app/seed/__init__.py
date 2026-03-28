"""Seed data package for initializing the database."""

import logging

from app.database import SessionLocal
from app.seed.abilities import seed_abilities
from app.seed.roles import seed_role_dependencies, seed_roles
from sqlalchemy import exc as sa_exc
from sqlalchemy.orm import Session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_seed() -> None:
    """Run all seed functions to populate the database.

    This function is idempotent - it checks for existing data before inserting.
    """
    logger.info("Starting database seeding...")

    db = SessionLocal()
    try:
        # Seed abilities first (roles depend on them)
        abilities_created = seed_abilities(db)
        logger.info("Abilities seeding complete. Created: %d", abilities_created)

        # Seed official roles
        roles_created = seed_roles(db)
        logger.info("Roles seeding complete. Created: %d", roles_created)

        # Seed role dependencies
        deps_created = seed_role_dependencies(db)
        logger.info("Role dependencies seeding complete. Created: %d", deps_created)

        logger.info("Database seeding completed successfully!")
    except sa_exc.SQLAlchemyError as e:
        logger.error("Error during seeding: %s", e)
        db.rollback()
        raise
    finally:
        db.close()
