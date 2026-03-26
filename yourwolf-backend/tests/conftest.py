"""Pytest fixtures for testing."""

import os
import uuid
from collections.abc import Generator
from typing import Any

# Set test environment variables BEFORE importing any app modules.
# This MUST happen at module level before the imports below,
# preventing the database module from trying to connect to PostgreSQL.
# Note: pytest_configure() cannot be used here because Python executes
# module-level imports before pytest invokes the hook.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["ENVIRONMENT"] = "test"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.ability import Ability
from app.models.ability_step import AbilityStep, StepModifier
from app.models.role import Role, Team, Visibility
from app.models.role_dependency import DependencyType, RoleDependency
from app.models.win_condition import WinCondition


# Create an in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, Any, None]:
    """Create a fresh database session for each test.

    Yields:
        Session: SQLAlchemy database session.
    """
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, Any, None]:
    """Create a test client with a mocked database session.

    Args:
        db_session: The test database session.

    Yields:
        TestClient: FastAPI test client.
    """

    def override_get_db() -> Generator[Session, Any, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_ability(db_session: Session) -> Ability:
    """Create a sample ability for testing.

    Args:
        db_session: The test database session.

    Returns:
        Ability: A sample ability instance.
    """
    ability = Ability(
        id=uuid.uuid4(),
        type="view_card",
        name="View Card",
        description="View a card",
        parameters_schema={"target": {"type": "string"}},
        is_active=True,
    )
    db_session.add(ability)
    db_session.commit()
    db_session.refresh(ability)
    return ability


@pytest.fixture
def sample_abilities(db_session: Session) -> list[Ability]:
    """Create multiple sample abilities for testing.

    Args:
        db_session: The test database session.

    Returns:
        List of sample abilities.
    """
    abilities_data = [
        ("view_card", "View Card", "View a card"),
        ("swap_card", "Swap Card", "Swap two cards"),
        ("take_card", "Take Card", "Take a card"),
        ("flip_card", "Flip Card", "Flip a card face up/down"),
        ("copy_role", "Copy Role", "Copy another role's ability"),
    ]
    abilities = []
    for ability_type, name, description in abilities_data:
        ability = Ability(
            id=uuid.uuid4(),
            type=ability_type,
            name=name,
            description=description,
            parameters_schema={},
            is_active=True,
        )
        db_session.add(ability)
        abilities.append(ability)
    db_session.commit()
    for ability in abilities:
        db_session.refresh(ability)
    return abilities


@pytest.fixture
def sample_role(db_session: Session) -> Role:
    """Create a sample role for testing.

    Args:
        db_session: The test database session.

    Returns:
        Role: A sample role instance.
    """
    role = Role(
        id=uuid.uuid4(),
        name="Villager",
        description="A simple villager",
        team=Team.VILLAGE,
        wake_order=None,
        wake_target=None,
        votes=1,
        visibility=Visibility.OFFICIAL,
        is_locked=True,
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def sample_unlocked_role(db_session: Session) -> Role:
    """Create a sample unlocked role for testing updates/deletes.

    Args:
        db_session: The test database session.

    Returns:
        Role: An unlocked role instance.
    """
    role = Role(
        id=uuid.uuid4(),
        name="Custom Role",
        description="A custom role that can be modified",
        team=Team.VILLAGE,
        wake_order=5,
        votes=1,
        visibility=Visibility.PRIVATE,
        is_locked=False,
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def sample_roles(db_session: Session) -> list[Role]:
    """Create multiple sample roles for testing pagination.

    Args:
        db_session: The test database session.

    Returns:
        List of sample roles.
    """
    roles_data = [
        ("Villager", Team.VILLAGE, Visibility.OFFICIAL),
        ("Werewolf", Team.WEREWOLF, Visibility.OFFICIAL),
        ("Seer", Team.VILLAGE, Visibility.OFFICIAL),
        ("Robber", Team.VILLAGE, Visibility.OFFICIAL),
        ("Tanner", Team.NEUTRAL, Visibility.OFFICIAL),
        ("Minion", Team.WEREWOLF, Visibility.OFFICIAL),
        ("Custom1", Team.VILLAGE, Visibility.PRIVATE),
        ("Custom2", Team.WEREWOLF, Visibility.PUBLIC),
    ]
    roles = []
    for name, team, visibility in roles_data:
        role = Role(
            id=uuid.uuid4(),
            name=name,
            description=f"{name} description",
            team=team,
            visibility=visibility,
            is_locked=visibility == Visibility.OFFICIAL,
        )
        db_session.add(role)
        roles.append(role)
    db_session.commit()
    for role in roles:
        db_session.refresh(role)
    return roles


@pytest.fixture
def sample_role_with_steps(
    db_session: Session,
    sample_ability: Ability,
) -> Role:
    """Create a role with ability steps and win conditions.

    Args:
        db_session: The test database session.
        sample_ability: A sample ability to reference.

    Returns:
        Role: A role with ability steps and win conditions.
    """
    role = Role(
        id=uuid.uuid4(),
        name="Seer",
        description="View another player's card",
        team=Team.VILLAGE,
        wake_order=4,
        visibility=Visibility.OFFICIAL,
        is_locked=True,
    )
    db_session.add(role)
    db_session.flush()

    # Add ability step
    step = AbilityStep(
        id=uuid.uuid4(),
        role_id=role.id,
        ability_id=sample_ability.id,
        order=1,
        modifier=StepModifier.NONE,
        is_required=True,
        parameters={"target": "player"},
    )
    db_session.add(step)

    # Add win condition
    win_condition = WinCondition(
        id=uuid.uuid4(),
        role_id=role.id,
        condition_type="team_wins",
        condition_params={"team": "village"},
        is_primary=True,
        overrides_team=False,
    )
    db_session.add(win_condition)

    db_session.commit()
    db_session.refresh(role)
    return role


@pytest.fixture
def seeded_roles(db_session: Session) -> list[Role]:
    """Create roles with abilities for game service testing.

    Provides 8+ roles: Werewolf, Seer, Insomniac, Robber, Troublemaker,
    Villager (x3). Roles have wake_order, abilities, and ability steps
    so that script generation tests work correctly.

    Args:
        db_session: The test database session.

    Returns:
        List of roles ready for game creation.
    """
    # Create abilities first
    abilities = {}
    abilities_data = [
        ("view_card", "View Card", "View a card"),
        ("swap_card", "Swap Card", "Swap two cards"),
        ("view_awake", "View Awake", "See who else is awake"),
    ]
    for ability_type, name, description in abilities_data:
        ability = Ability(
            id=uuid.uuid4(),
            type=ability_type,
            name=name,
            description=description,
            parameters_schema={},
            is_active=True,
        )
        db_session.add(ability)
        abilities[ability_type] = ability
    db_session.flush()

    # Create roles
    roles_data = [
        ("Werewolf", Team.WEREWOLF, 1, "team.werewolf"),
        ("Seer", Team.VILLAGE, 4, "player.self"),
        ("Insomniac", Team.VILLAGE, 9, "player.self"),
        ("Robber", Team.VILLAGE, 3, "player.self"),
        ("Troublemaker", Team.VILLAGE, 5, "player.self"),
        ("Villager", Team.VILLAGE, None, None),
        ("Villager2", Team.VILLAGE, None, None),
        ("Villager3", Team.VILLAGE, None, None),
    ]

    roles = []
    for name, team, wake_order, wake_target in roles_data:
        display_name = "Villager" if name.startswith("Villager") else name
        role = Role(
            id=uuid.uuid4(),
            name=display_name,
            description=f"{display_name} description",
            team=team,
            wake_order=wake_order,
            wake_target=wake_target,
            visibility=Visibility.OFFICIAL,
            is_locked=True,
        )
        db_session.add(role)
        roles.append(role)
    db_session.flush()

    # Add ability steps to waking roles
    step_configs = [
        # Werewolf: view_awake (look for other werewolves)
        (roles[0], abilities["view_awake"], 1, StepModifier.NONE, {}),
        # Seer: view_card (look at another player's card)
        (
            roles[1],
            abilities["view_card"],
            1,
            StepModifier.NONE,
            {"target": "player.other", "count": 1},
        ),
        # Seer: OR view_card (look at two center cards)
        (
            roles[1],
            abilities["view_card"],
            2,
            StepModifier.OR,
            {"target": "center.main", "count": 2},
        ),
        # Insomniac: view_card (look at own card)
        (
            roles[2],
            abilities["view_card"],
            1,
            StepModifier.NONE,
            {"target": "player.self"},
        ),
        # Robber: swap_card (swap with another player)
        (
            roles[3],
            abilities["swap_card"],
            1,
            StepModifier.NONE,
            {"target_a": "player.self", "target_b": "player.other"},
        ),
        # Troublemaker: swap_card (swap two other players)
        (
            roles[4],
            abilities["swap_card"],
            1,
            StepModifier.NONE,
            {"target_a": "player.other", "target_b": "player.other"},
        ),
    ]

    for role, ability, order, modifier, parameters in step_configs:
        step = AbilityStep(
            id=uuid.uuid4(),
            role_id=role.id,
            ability_id=ability.id,
            order=order,
            modifier=modifier,
            is_required=True,
            parameters=parameters,
        )
        db_session.add(step)

    db_session.commit()
    for role in roles:
        db_session.refresh(role)
    return roles


@pytest.fixture
def seeded_roles_with_deps(db_session: Session) -> dict[str, Any]:
    """Create roles with card counts, dependencies, and ability steps.

    Provides a rich setup for testing card count validation and
    dependency enforcement in game creation.

    Returns:
        Dict with 'roles' list and 'role_map' (name -> Role).
    """
    # Create abilities
    abilities = {}
    abilities_data = [
        ("view_card", "View Card", "View a card"),
        ("swap_card", "Swap Card", "Swap two cards"),
        ("view_awake", "View Awake", "See who else is awake"),
        ("thumbs_up", "Thumbs Up", "Signal other players"),
    ]
    for ability_type, name, description in abilities_data:
        ability = Ability(
            id=uuid.uuid4(),
            type=ability_type,
            name=name,
            description=description,
            parameters_schema={},
            is_active=True,
        )
        db_session.add(ability)
        abilities[ability_type] = ability
    db_session.flush()

    # Create roles with card counts
    # (name, team, wake_order, wake_target, default_count, min_count, max_count)
    roles_data = [
        ("Werewolf", Team.WEREWOLF, 1, "team.werewolf", 2, 1, 2),
        ("Seer", Team.VILLAGE, 4, "player.self", 1, 1, 1),
        ("Insomniac", Team.VILLAGE, 9, "player.self", 1, 1, 1),
        ("Robber", Team.VILLAGE, 3, "player.self", 1, 1, 1),
        ("Troublemaker", Team.VILLAGE, 5, "player.self", 1, 1, 1),
        ("Mason", Team.VILLAGE, 3, "player.self", 2, 2, 2),
        ("Villager", Team.VILLAGE, None, None, 3, 1, 3),
        ("Minion", Team.WEREWOLF, 2, "player.self", 1, 1, 1),
        ("Tanner", Team.NEUTRAL, None, None, 1, 1, 1),
        ("Apprentice Tanner", Team.NEUTRAL, 2, "player.self", 1, 1, 1),
        ("Beholder", Team.VILLAGE, 4, "player.self", 1, 1, 1),
    ]

    roles = []
    role_map: dict[str, Role] = {}
    for name, team, wake_order, wake_target, dcount, minc, maxc in roles_data:
        role = Role(
            id=uuid.uuid4(),
            name=name,
            description=f"{name} description",
            team=team,
            wake_order=wake_order,
            wake_target=wake_target,
            visibility=Visibility.OFFICIAL,
            is_locked=True,
            default_count=dcount,
            min_count=minc,
            max_count=maxc,
        )
        db_session.add(role)
        roles.append(role)
        role_map[name] = role
    db_session.flush()

    # Add ability steps for waking roles
    step_configs = [
        (role_map["Werewolf"], abilities["view_awake"], 1, StepModifier.NONE, {}),
        (
            role_map["Seer"],
            abilities["view_card"],
            1,
            StepModifier.NONE,
            {"target": "player.other", "count": 1},
        ),
        (
            role_map["Insomniac"],
            abilities["view_card"],
            1,
            StepModifier.NONE,
            {"target": "player.self"},
        ),
        (
            role_map["Robber"],
            abilities["swap_card"],
            1,
            StepModifier.NONE,
            {"target_a": "player.self", "target_b": "player.other"},
        ),
        (
            role_map["Troublemaker"],
            abilities["swap_card"],
            1,
            StepModifier.NONE,
            {"target_a": "player.other", "target_b": "player.other"},
        ),
    ]

    for role, ability, order, modifier, parameters in step_configs:
        step = AbilityStep(
            id=uuid.uuid4(),
            role_id=role.id,
            ability_id=ability.id,
            order=order,
            modifier=modifier,
            is_required=True,
            parameters=parameters,
        )
        db_session.add(step)

    # Add dependencies
    dep_data = [
        # Apprentice Tanner requires Tanner
        (role_map["Apprentice Tanner"], role_map["Tanner"], DependencyType.REQUIRES),
        # Minion recommends Werewolf
        (role_map["Minion"], role_map["Werewolf"], DependencyType.RECOMMENDS),
        # Beholder recommends Seer
        (role_map["Beholder"], role_map["Seer"], DependencyType.RECOMMENDS),
    ]
    for source, target, dep_type in dep_data:
        dep = RoleDependency(
            id=uuid.uuid4(),
            role_id=source.id,
            required_role_id=target.id,
            dependency_type=dep_type,
        )
        db_session.add(dep)

    db_session.commit()
    for role in roles:
        db_session.refresh(role)

    return {"roles": roles, "role_map": role_map}
