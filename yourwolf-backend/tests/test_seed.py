"""Tests for seed data correctness."""

import json
from pathlib import Path
from typing import Any

import pytest
from sqlalchemy.orm import Session

from app.models.ability import Ability
from app.models.ability_step import AbilityStep, StepModifier
from app.models.role import Role, Team, Visibility
from app.models.role_dependency import DependencyType, RoleDependency
from app.models.win_condition import WinCondition
from app.seed.abilities import ABILITIES_DATA, load_ability_seed_data, seed_abilities
from app.seed.roles import (
    ROLE_DEPENDENCIES_DATA,
    ROLES_DATA,
    SeedDataError,
    load_seed_data,
    seed_role_dependencies,
    seed_roles,
)

EXPECTED_SNAPSHOT_PATH = Path(__file__).parent / "data" / "expected_seed_snapshot.json"


def _snapshot_seeded_db(db: Session) -> list[dict[str, Any]]:
    """Build a normalized snapshot of the seeded official roles.

    Volatile fields (UUIDs, timestamps) are excluded and cross-references are
    resolved back to stable names so the result is comparable across runs.

    Args:
        db: Database session containing seeded data.

    Returns:
        Role snapshots sorted by name.
    """
    ability_by_id = {a.id: a.type for a in db.query(Ability).all()}
    role_by_id = {r.id: r.name for r in db.query(Role).all()}

    snapshot: list[dict[str, Any]] = []
    for role in db.query(Role).filter(Role.visibility == Visibility.OFFICIAL).all():
        steps = (
            db.query(AbilityStep)
            .filter(AbilityStep.role_id == role.id)
            .order_by(AbilityStep.order)
            .all()
        )
        win_conditions = (
            db.query(WinCondition).filter(WinCondition.role_id == role.id).all()
        )
        deps = db.query(RoleDependency).filter(RoleDependency.role_id == role.id).all()

        snapshot.append(
            {
                "name": role.name,
                "team": role.team.value,
                "wake_order": role.wake_order,
                "wake_target": role.wake_target,
                "description": role.description,
                "votes": role.votes,
                "default_count": role.default_count,
                "min_count": role.min_count,
                "max_count": role.max_count,
                "is_primary_team_role": role.is_primary_team_role,
                "visibility": role.visibility.value,
                "is_locked": role.is_locked,
                "creator_id": role.creator_id,
                "ability_steps": [
                    {
                        "order": s.order,
                        "modifier": s.modifier.value,
                        "ability_type": ability_by_id[s.ability_id],
                        "parameters": s.parameters,
                        "is_required": s.is_required,
                        "condition_type": s.condition_type,
                        "condition_params": s.condition_params,
                    }
                    for s in steps
                ],
                "win_conditions": sorted(
                    [
                        {
                            "condition_type": w.condition_type,
                            "condition_params": w.condition_params,
                            "is_primary": w.is_primary,
                            "overrides_team": w.overrides_team,
                        }
                        for w in win_conditions
                    ],
                    key=lambda w: (w["condition_type"], w["is_primary"]),
                ),
                "dependencies": sorted(
                    [
                        {
                            "target": role_by_id[d.required_role_id],
                            "dependency_type": d.dependency_type.value,
                        }
                        for d in deps
                    ],
                    key=lambda d: (d["target"], d["dependency_type"]),
                ),
            }
        )

    snapshot.sort(key=lambda r: r["name"])
    return snapshot


@pytest.fixture
def seeded_official_db(db_session: Session) -> Session:
    """Seed a fresh database with abilities, roles, and role dependencies.

    Args:
        db_session: The test database session.

    Returns:
        The session, with the full official seed applied.
    """
    seed_abilities(db_session)
    seed_roles(db_session)
    seed_role_dependencies(db_session)
    return db_session


class TestSeedWakeOrder:
    """Tests for wake_order values in seed data."""

    def test_doppelganger_wake_order_is_1(self) -> None:
        """AC12: Doppelganger wake_order should be 1, not 0."""
        doppelganger = next(r for r in ROLES_DATA if r["name"] == "Doppelganger")
        assert doppelganger["wake_order"] == 1

    def test_copycat_wake_order_is_1(self) -> None:
        """AC13: Copycat wake_order should be 1, not 0."""
        copycat = next(r for r in ROLES_DATA if r["name"] == "Copycat")
        assert copycat["wake_order"] == 1


class TestSeedDataShape:
    """Tests for the loaded seed data structures (AC4)."""

    def test_role_count_is_30(self) -> None:
        """The official seed defines exactly 30 roles."""
        assert len(ROLES_DATA) == 30

    def test_role_names_are_unique(self) -> None:
        """Role names are the cross-reference key, so they must be unique."""
        names = [r["name"] for r in ROLES_DATA]
        assert len(names) == len(set(names))

    def test_teams_are_team_enum_members(self) -> None:
        """The loader reconstructs the Team enum from its string value."""
        for role in ROLES_DATA:
            assert isinstance(role["team"], Team)

    def test_dependency_types_are_enum_members(self) -> None:
        """The loader reconstructs DependencyType from its string value."""
        for _source, _target, dep_type in ROLE_DEPENDENCIES_DATA:
            assert isinstance(dep_type, DependencyType)

    def test_dependency_count_is_9(self) -> None:
        """The official seed defines exactly 9 role dependencies."""
        assert len(ROLE_DEPENDENCIES_DATA) == 9

    def test_role_names_respect_length_bounds(self) -> None:
        """Role names fit the 2-50 character bounds enforced on the API."""
        for role in ROLES_DATA:
            assert 2 <= len(role["name"]) <= 50, role["name"]

    def test_werewolf_role_field_equality(self) -> None:
        """Full field-level equality for one role, including steps and wins."""
        werewolf = next(r for r in ROLES_DATA if r["name"] == "Werewolf")
        assert werewolf == {
            "name": "Werewolf",
            "team": Team.WEREWOLF,
            "wake_order": 1,
            "wake_target": "team.werewolf",
            "description": (
                "You wake with other werewolves. If alone, view one center card."
            ),
            "votes": 1,
            "default_count": 2,
            "min_count": 1,
            "max_count": 2,
            "is_primary_team_role": True,
            "ability_steps": [
                {
                    "order": 1,
                    "modifier": "none",
                    "ability_type": "view_awake",
                    "parameters": {"target": "team.werewolf"},
                    "is_required": True,
                },
                {
                    "order": 2,
                    "modifier": "if",
                    "ability_type": "view_card",
                    "parameters": {"target": "center.main"},
                    "condition_type": "no_other_awake",
                    "is_required": True,
                },
            ],
            "win_conditions": [
                {
                    "condition_type": "team_wins",
                    "condition_params": {"team": "werewolf"},
                    "is_primary": True,
                    "overrides_team": False,
                }
            ],
        }


class TestSeedReferentialIntegrity:
    """Tests that seed cross-references resolve (AC4)."""

    def test_every_ability_type_exists_in_abilities_data(self) -> None:
        """Every ability_type referenced by a role step is a defined ability."""
        known = {a["type"] for a in ABILITIES_DATA}
        for role in ROLES_DATA:
            for step in role["ability_steps"]:
                assert step["ability_type"] in known, (
                    f"{role['name']} references unknown ability "
                    f"{step['ability_type']!r}"
                )

    def test_every_dependency_resolves_to_a_defined_role(self) -> None:
        """Dependency sources and targets are both defined role names."""
        names = {r["name"] for r in ROLES_DATA}
        for source, target, _dep_type in ROLE_DEPENDENCIES_DATA:
            assert source in names, f"dangling dependency source {source!r}"
            assert target in names, f"dangling dependency target {target!r}"

    def test_every_step_modifier_is_valid(self) -> None:
        """Every step modifier coerces to a StepModifier member."""
        for role in ROLES_DATA:
            for step in role["ability_steps"]:
                assert StepModifier(step["modifier"]) in StepModifier

    def test_ability_step_orders_are_sequential(self) -> None:
        """Step orders start at 1 and increment without gaps."""
        for role in ROLES_DATA:
            orders = [s["order"] for s in role["ability_steps"]]
            assert orders == list(range(1, len(orders) + 1)), role["name"]

    def test_every_role_has_exactly_one_primary_win_condition(self) -> None:
        """Each role has exactly one primary win condition."""
        for role in ROLES_DATA:
            primaries = [w for w in role["win_conditions"] if w["is_primary"]]
            assert len(primaries) == 1, role["name"]


class TestSeedEquality:
    """Seeding a fresh database reproduces the pre-refactor outcome (AC3)."""

    def test_fresh_seed_matches_pre_refactor_snapshot(
        self,
        seeded_official_db: Session,
    ) -> None:
        """A fresh seed matches the snapshot captured from the old code path.

        The expected snapshot was generated from the pre-refactor Python
        literals in ``app/seed/roles.py`` before it became a loader, so this
        is a true equality check against the previous behavior.
        """
        expected = json.loads(EXPECTED_SNAPSHOT_PATH.read_text())
        actual = _snapshot_seeded_db(seeded_official_db)
        assert actual == expected

    def test_seed_creates_30_official_roles(
        self,
        seeded_official_db: Session,
    ) -> None:
        """Seeding a fresh database creates 30 official roles."""
        count = (
            seeded_official_db.query(Role)
            .filter(Role.visibility == Visibility.OFFICIAL)
            .count()
        )
        assert count == 30

    def test_seed_creates_9_role_dependencies(
        self,
        seeded_official_db: Session,
    ) -> None:
        """Seeding a fresh database creates 9 role dependencies."""
        assert seeded_official_db.query(RoleDependency).count() == 9

    def test_seed_is_idempotent(self, seeded_official_db: Session) -> None:
        """Re-running the seed creates nothing and changes nothing."""
        before = _snapshot_seeded_db(seeded_official_db)

        assert seed_roles(seeded_official_db) == 0
        assert seed_role_dependencies(seeded_official_db) == 0

        assert _snapshot_seeded_db(seeded_official_db) == before


class TestSeedDataLoader:
    """Fail-fast validation in the data-file loader (Section B)."""

    def _write(self, tmp_path: Path, payload: Any) -> Path:
        """Write a JSON payload to a temporary data file."""
        path = tmp_path / "roles.json"
        path.write_text(json.dumps(payload))
        return path

    def test_missing_file_raises(self, tmp_path: Path) -> None:
        """A missing data file fails fast with a clear error."""
        with pytest.raises(SeedDataError, match="not found"):
            load_seed_data(tmp_path / "does_not_exist.json")

    def test_malformed_json_raises(self, tmp_path: Path) -> None:
        """Malformed JSON fails fast with a clear error."""
        path = tmp_path / "roles.json"
        path.write_text("{not valid json")
        with pytest.raises(SeedDataError, match="not valid JSON"):
            load_seed_data(path)

    def test_missing_roles_section_raises(self, tmp_path: Path) -> None:
        """A data file without a 'roles' list fails fast."""
        path = self._write(tmp_path, {"role_dependencies": []})
        with pytest.raises(SeedDataError, match="'roles'"):
            load_seed_data(path)

    def test_missing_dependencies_section_raises(self, tmp_path: Path) -> None:
        """A data file without a 'role_dependencies' list fails fast."""
        path = self._write(tmp_path, {"roles": []})
        with pytest.raises(SeedDataError, match="'role_dependencies'"):
            load_seed_data(path)

    def test_unknown_team_raises(self, tmp_path: Path) -> None:
        """An unknown Team value fails fast with a clear error."""
        path = self._write(
            tmp_path,
            {
                "roles": [
                    {
                        "name": "Bogus",
                        "team": "wombat",
                        "wake_order": None,
                        "wake_target": None,
                        "description": "d",
                        "votes": 1,
                        "ability_steps": [],
                        "win_conditions": [],
                    }
                ],
                "role_dependencies": [],
            },
        )
        with pytest.raises(SeedDataError, match="team"):
            load_seed_data(path)

    def test_unknown_step_modifier_raises(self, tmp_path: Path) -> None:
        """An unknown StepModifier value fails fast with a clear error."""
        path = self._write(
            tmp_path,
            {
                "roles": [
                    {
                        "name": "Bogus",
                        "team": "village",
                        "wake_order": None,
                        "wake_target": None,
                        "description": "d",
                        "votes": 1,
                        "ability_steps": [
                            {
                                "order": 1,
                                "modifier": "maybe",
                                "ability_type": "view_card",
                                "parameters": {},
                                "is_required": True,
                            }
                        ],
                        "win_conditions": [],
                    }
                ],
                "role_dependencies": [],
            },
        )
        with pytest.raises(SeedDataError, match="modifier"):
            load_seed_data(path)

    def test_unknown_ability_type_raises(self, tmp_path: Path) -> None:
        """A dangling ability_type reference fails fast with a clear error."""
        path = self._write(
            tmp_path,
            {
                "roles": [
                    {
                        "name": "Bogus",
                        "team": "village",
                        "wake_order": None,
                        "wake_target": None,
                        "description": "d",
                        "votes": 1,
                        "ability_steps": [
                            {
                                "order": 1,
                                "modifier": "none",
                                "ability_type": "summon_kraken",
                                "parameters": {},
                                "is_required": True,
                            }
                        ],
                        "win_conditions": [],
                    }
                ],
                "role_dependencies": [],
            },
        )
        with pytest.raises(SeedDataError, match="summon_kraken"):
            load_seed_data(path)

    def test_dangling_dependency_target_raises(self, tmp_path: Path) -> None:
        """A dependency pointing at an undefined role fails fast."""
        path = self._write(
            tmp_path,
            {
                "roles": [
                    {
                        "name": "Villager",
                        "team": "village",
                        "wake_order": None,
                        "wake_target": None,
                        "description": "d",
                        "votes": 1,
                        "ability_steps": [],
                        "win_conditions": [],
                    }
                ],
                "role_dependencies": [
                    {
                        "source": "Villager",
                        "target": "Nonexistent",
                        "dependency_type": "requires",
                    }
                ],
            },
        )
        with pytest.raises(SeedDataError, match="Nonexistent"):
            load_seed_data(path)

    def test_unknown_dependency_type_raises(self, tmp_path: Path) -> None:
        """An unknown DependencyType value fails fast with a clear error."""
        path = self._write(
            tmp_path,
            {
                "roles": [
                    {
                        "name": "Villager",
                        "team": "village",
                        "wake_order": None,
                        "wake_target": None,
                        "description": "d",
                        "votes": 1,
                        "ability_steps": [],
                        "win_conditions": [],
                    }
                ],
                "role_dependencies": [
                    {
                        "source": "Villager",
                        "target": "Villager",
                        "dependency_type": "insists_upon",
                    }
                ],
            },
        )
        with pytest.raises(SeedDataError, match="dependency_type"):
            load_seed_data(path)

    def test_role_missing_seeder_required_field_raises(self, tmp_path: Path) -> None:
        """A role omitting a field seed_roles() indexes fails at load, not seed.

        Without this, the role loads cleanly and seed_roles() raises KeyError
        part-way through the insert loop.
        """
        path = self._write(
            tmp_path,
            {
                "roles": [
                    {
                        "name": "Bogus",
                        "team": "village",
                        "ability_steps": [],
                        "win_conditions": [],
                    }
                ],
                "role_dependencies": [],
            },
        )
        with pytest.raises(SeedDataError, match="missing required field"):
            load_seed_data(path)

    def test_role_missing_win_conditions_raises(self, tmp_path: Path) -> None:
        """A role with no 'win_conditions' section fails fast at load."""
        path = self._write(
            tmp_path,
            {
                "roles": [
                    {
                        "name": "Bogus",
                        "team": "village",
                        "wake_order": None,
                        "wake_target": None,
                        "description": "d",
                        "votes": 1,
                        "ability_steps": [],
                    }
                ],
                "role_dependencies": [],
            },
        )
        with pytest.raises(SeedDataError, match="win_conditions"):
            load_seed_data(path)

    def test_non_object_ability_step_raises(self, tmp_path: Path) -> None:
        """A non-object ability step raises SeedDataError, not AttributeError."""
        path = self._write(
            tmp_path,
            {
                "roles": [
                    {
                        "name": "Bogus",
                        "team": "village",
                        "wake_order": None,
                        "wake_target": None,
                        "description": "d",
                        "votes": 1,
                        "ability_steps": ["not an object"],
                        "win_conditions": [],
                    }
                ],
                "role_dependencies": [],
            },
        )
        with pytest.raises(SeedDataError, match="non-object"):
            load_seed_data(path)

    def test_non_list_ability_steps_raises(self, tmp_path: Path) -> None:
        """A scalar 'ability_steps' raises SeedDataError, not AttributeError."""
        path = self._write(
            tmp_path,
            {
                "roles": [
                    {
                        "name": "Bogus",
                        "team": "village",
                        "wake_order": None,
                        "wake_target": None,
                        "description": "d",
                        "votes": 1,
                        "ability_steps": "nope",
                        "win_conditions": [],
                    }
                ],
                "role_dependencies": [],
            },
        )
        with pytest.raises(SeedDataError, match="ability_steps"):
            load_seed_data(path)

    def test_step_missing_required_field_raises(self, tmp_path: Path) -> None:
        """An ability step omitting a field seed_roles() indexes fails fast."""
        path = self._write(
            tmp_path,
            {
                "roles": [
                    {
                        "name": "Bogus",
                        "team": "village",
                        "wake_order": None,
                        "wake_target": None,
                        "description": "d",
                        "votes": 1,
                        "ability_steps": [
                            {
                                "order": 1,
                                "modifier": "none",
                                "ability_type": "view_card",
                            }
                        ],
                        "win_conditions": [],
                    }
                ],
                "role_dependencies": [],
            },
        )
        with pytest.raises(SeedDataError, match="missing required field"):
            load_seed_data(path)

    def test_win_condition_missing_required_field_raises(self, tmp_path: Path) -> None:
        """A win condition omitting a field seed_roles() indexes fails fast."""
        path = self._write(
            tmp_path,
            {
                "roles": [
                    {
                        "name": "Bogus",
                        "team": "village",
                        "wake_order": None,
                        "wake_target": None,
                        "description": "d",
                        "votes": 1,
                        "ability_steps": [],
                        "win_conditions": [{"condition_type": "team_wins"}],
                    }
                ],
                "role_dependencies": [],
            },
        )
        with pytest.raises(SeedDataError, match="missing required field"):
            load_seed_data(path)

    def test_shipped_data_file_loads(self) -> None:
        """The data file shipped with the package loads and validates."""
        roles, deps = load_seed_data()
        assert len(roles) == 30
        assert len(deps) == 9


class TestAbilitySeedDataLoader:
    """Fail-fast validation in the ability data-file loader."""

    def _write(self, tmp_path: Path, payload: Any) -> Path:
        """Write a JSON payload to a temporary ability data file."""
        path = tmp_path / "abilities.json"
        path.write_text(json.dumps(payload))
        return path

    def test_shipped_data_file_loads_all_abilities(self) -> None:
        """The shipped ability file preserves every ability record."""
        abilities = load_ability_seed_data()

        assert abilities == ABILITIES_DATA
        assert len(abilities) == 15

    def test_missing_file_raises(self, tmp_path: Path) -> None:
        """A missing ability data file fails fast with a clear error."""
        with pytest.raises(SeedDataError, match="not found"):
            load_ability_seed_data(tmp_path / "does_not_exist.json")

    def test_malformed_json_raises(self, tmp_path: Path) -> None:
        """Malformed ability JSON fails fast with a clear error."""
        path = tmp_path / "abilities.json"
        path.write_text("{not valid json")

        with pytest.raises(SeedDataError, match="not valid JSON"):
            load_ability_seed_data(path)

    def test_non_list_payload_raises(self, tmp_path: Path) -> None:
        """An ability data file must contain a top-level list."""
        with pytest.raises(SeedDataError, match="JSON list"):
            load_ability_seed_data(self._write(tmp_path, {"abilities": []}))

    def test_non_object_entry_raises(self, tmp_path: Path) -> None:
        """Every ability entry must be a JSON object."""
        with pytest.raises(SeedDataError, match="non-object"):
            load_ability_seed_data(self._write(tmp_path, ["not an object"]))

    def test_missing_required_field_raises(self, tmp_path: Path) -> None:
        """Every ability entry must contain all persisted fields."""
        ability = dict(ABILITIES_DATA[0])
        del ability["name"]

        with pytest.raises(SeedDataError, match="name"):
            load_ability_seed_data(self._write(tmp_path, [ability]))

    def test_invalid_field_shape_raises(self, tmp_path: Path) -> None:
        """Persisted ability fields must have their expected JSON shapes."""
        ability = dict(ABILITIES_DATA[0])
        ability["parameters_schema"] = []

        with pytest.raises(SeedDataError, match="parameters_schema"):
            load_ability_seed_data(self._write(tmp_path, [ability]))

    def test_seed_uses_all_loaded_abilities(self, db_session: Session) -> None:
        """A valid ability file seeds all 15 records."""
        assert seed_abilities(db_session) == 15
        assert db_session.query(Ability).count() == 15
