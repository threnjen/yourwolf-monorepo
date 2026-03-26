"""Tests for database models."""

import pytest
from sqlalchemy.orm import Session

from app.models.ability import Ability
from app.models.ability_step import AbilityStep, StepModifier
from app.models.role import Role, Team, Visibility
from app.models.role_dependency import DependencyType, RoleDependency
from app.models.win_condition import WinCondition


class TestRoleModel:
    """Tests for the Role model."""

    def test_create_role(self, db_session: Session) -> None:
        """Test creating a role."""
        role = Role(
            name="Test Role",
            description="Test description",
            team=Team.VILLAGE,
        )
        db_session.add(role)
        db_session.commit()
        db_session.refresh(role)

        assert role.id is not None
        assert role.name == "Test Role"
        assert role.team == Team.VILLAGE
        assert role.created_at is not None

    def test_role_default_values(self, db_session: Session) -> None:
        """Test role default values are set correctly."""
        role = Role(
            name="Default Role",
            description="Testing defaults",
            team=Team.VILLAGE,
        )
        db_session.add(role)
        db_session.commit()
        db_session.refresh(role)

        assert role.votes == 1
        assert role.is_locked is False
        assert role.vote_score == 0
        assert role.use_count == 0
        assert role.visibility == Visibility.PRIVATE
        assert role.default_count == 1
        assert role.min_count == 1
        assert role.max_count == 1

    def test_role_all_teams(self, db_session: Session) -> None:
        """Test all team values work."""
        teams = [Team.VILLAGE, Team.WEREWOLF, Team.VAMPIRE, Team.ALIEN, Team.NEUTRAL]
        for team in teams:
            role = Role(
                name=f"{team.value} Role",
                description=f"Team: {team.value}",
                team=team,
            )
            db_session.add(role)
        db_session.commit()

        roles = db_session.query(Role).all()
        assert len(roles) == len(teams)

    def test_role_visibility_values(self, db_session: Session) -> None:
        """Test all visibility values work."""
        visibilities = [Visibility.PRIVATE, Visibility.PUBLIC, Visibility.OFFICIAL]
        for vis in visibilities:
            role = Role(
                name=f"{vis.value} Role",
                description=f"Visibility: {vis.value}",
                team=Team.VILLAGE,
                visibility=vis,
            )
            db_session.add(role)
        db_session.commit()

        roles = db_session.query(Role).all()
        assert len(roles) == len(visibilities)

    def test_role_is_primary_team_role_defaults_false(
        self, db_session: Session
    ) -> None:
        """Test that is_primary_team_role defaults to False."""
        role = Role(
            name="Minion",
            description="A minion",
            team=Team.WEREWOLF,
        )
        db_session.add(role)
        db_session.commit()
        db_session.refresh(role)

        assert role.is_primary_team_role is False

    def test_role_is_primary_team_role_set_true(self, db_session: Session) -> None:
        """Test that is_primary_team_role can be set to True and persists."""
        role = Role(
            name="Werewolf",
            description="A werewolf",
            team=Team.WEREWOLF,
            is_primary_team_role=True,
        )
        db_session.add(role)
        db_session.commit()
        db_session.refresh(role)

        assert role.is_primary_team_role is True

    def test_role_card_count_custom(self, db_session: Session) -> None:
        """Test creating a role with custom card counts."""
        role = Role(
            name="Werewolf",
            description="A werewolf",
            team=Team.WEREWOLF,
            default_count=2,
            min_count=1,
            max_count=2,
        )
        db_session.add(role)
        db_session.commit()
        db_session.refresh(role)

        assert role.default_count == 2
        assert role.min_count == 1
        assert role.max_count == 2


class TestAbilityModel:
    """Tests for the Ability model."""

    def test_create_ability(self, db_session: Session) -> None:
        """Test creating an ability."""
        ability = Ability(
            type="test_ability",
            name="Test Ability",
            description="A test ability",
            parameters_schema={"param1": {"type": "string"}},
        )
        db_session.add(ability)
        db_session.commit()
        db_session.refresh(ability)

        assert ability.id is not None
        assert ability.type == "test_ability"
        assert ability.is_active is True

    def test_ability_type_unique(self, db_session: Session) -> None:
        """Test that ability type must be unique."""
        ability1 = Ability(
            type="unique_type",
            name="First",
            description="First ability",
        )
        db_session.add(ability1)
        db_session.commit()

        ability2 = Ability(
            type="unique_type",
            name="Second",
            description="Second ability",
        )
        db_session.add(ability2)
        with pytest.raises(Exception):
            db_session.commit()


class TestAbilityStepModel:
    """Tests for the AbilityStep model."""

    def test_create_ability_step(
        self,
        db_session: Session,
        sample_role: Role,
        sample_ability: Ability,
    ) -> None:
        """Test creating an ability step."""
        step = AbilityStep(
            role_id=sample_role.id,
            ability_id=sample_ability.id,
            order=1,
            modifier=StepModifier.NONE,
            is_required=True,
            parameters={"target": "player"},
        )
        db_session.add(step)
        db_session.commit()
        db_session.refresh(step)

        assert step.id is not None
        assert step.order == 1
        assert step.modifier == StepModifier.NONE

    def test_step_modifiers(
        self,
        db_session: Session,
        sample_role: Role,
        sample_ability: Ability,
    ) -> None:
        """Test all step modifier values."""
        modifiers = [
            StepModifier.NONE,
            StepModifier.AND,
            StepModifier.OR,
            StepModifier.IF,
        ]
        for i, mod in enumerate(modifiers, 1):
            step = AbilityStep(
                role_id=sample_role.id,
                ability_id=sample_ability.id,
                order=i,
                modifier=mod,
            )
            db_session.add(step)
        db_session.commit()

        steps = db_session.query(AbilityStep).all()
        assert len(steps) == len(modifiers)


class TestWinConditionModel:
    """Tests for the WinCondition model."""

    def test_create_win_condition(
        self,
        db_session: Session,
        sample_role: Role,
    ) -> None:
        """Test creating a win condition."""
        wc = WinCondition(
            role_id=sample_role.id,
            condition_type="team_wins",
            condition_params={"team": "village"},
            is_primary=True,
            overrides_team=False,
        )
        db_session.add(wc)
        db_session.commit()
        db_session.refresh(wc)

        assert wc.id is not None
        assert wc.condition_type == "team_wins"
        assert wc.is_primary is True

    def test_win_condition_defaults(
        self,
        db_session: Session,
        sample_role: Role,
    ) -> None:
        """Test win condition default values."""
        wc = WinCondition(
            role_id=sample_role.id,
            condition_type="simple_win",
        )
        db_session.add(wc)
        db_session.commit()
        db_session.refresh(wc)

        assert wc.is_primary is True
        assert wc.overrides_team is False


class TestTeamEnum:
    """Tests for Team enum."""

    def test_team_values(self) -> None:
        """Test team enum values."""
        assert Team.VILLAGE.value == "village"
        assert Team.WEREWOLF.value == "werewolf"
        assert Team.VAMPIRE.value == "vampire"
        assert Team.ALIEN.value == "alien"
        assert Team.NEUTRAL.value == "neutral"

    def test_team_is_string_enum(self) -> None:
        """Test team is a string enum."""
        for team in Team:
            assert isinstance(team.value, str)


class TestVisibilityEnum:
    """Tests for Visibility enum."""

    def test_visibility_values(self) -> None:
        """Test visibility enum values."""
        assert Visibility.PRIVATE.value == "private"
        assert Visibility.PUBLIC.value == "public"
        assert Visibility.OFFICIAL.value == "official"


class TestStepModifierEnum:
    """Tests for StepModifier enum."""

    def test_step_modifier_values(self) -> None:
        """Test step modifier enum values."""
        assert StepModifier.NONE.value == "none"
        assert StepModifier.AND.value == "and"
        assert StepModifier.OR.value == "or"
        assert StepModifier.IF.value == "if"


class TestDependencyTypeEnum:
    """Tests for DependencyType enum."""

    def test_dependency_type_values(self) -> None:
        """Test dependency type enum values."""
        assert DependencyType.REQUIRES.value == "requires"
        assert DependencyType.RECOMMENDS.value == "recommends"

    def test_dependency_type_is_string_enum(self) -> None:
        """Test dependency type is a string enum."""
        for dep_type in DependencyType:
            assert isinstance(dep_type.value, str)


class TestRoleDependencyModel:
    """Tests for the RoleDependency model."""

    def test_create_requires_dependency(self, db_session: Session) -> None:
        """Test creating a requires dependency between two roles."""
        role_a = Role(
            name="Apprentice Tanner",
            description="See who the Tanner is",
            team=Team.NEUTRAL,
        )
        role_b = Role(
            name="Tanner",
            description="You hate your job",
            team=Team.NEUTRAL,
        )
        db_session.add_all([role_a, role_b])
        db_session.flush()

        dep = RoleDependency(
            role_id=role_a.id,
            required_role_id=role_b.id,
            dependency_type=DependencyType.REQUIRES,
        )
        db_session.add(dep)
        db_session.commit()
        db_session.refresh(dep)

        assert dep.id is not None
        assert dep.role_id == role_a.id
        assert dep.required_role_id == role_b.id
        assert dep.dependency_type == DependencyType.REQUIRES

    def test_create_recommends_dependency(self, db_session: Session) -> None:
        """Test creating a recommends dependency."""
        minion = Role(
            name="Minion",
            description="See the wolves",
            team=Team.WEREWOLF,
        )
        werewolf = Role(
            name="Werewolf",
            description="A werewolf",
            team=Team.WEREWOLF,
        )
        db_session.add_all([minion, werewolf])
        db_session.flush()

        dep = RoleDependency(
            role_id=minion.id,
            required_role_id=werewolf.id,
            dependency_type=DependencyType.RECOMMENDS,
        )
        db_session.add(dep)
        db_session.commit()
        db_session.refresh(dep)

        assert dep.dependency_type == DependencyType.RECOMMENDS

    def test_cascade_delete_on_role_removal(self, db_session: Session) -> None:
        """Test that deleting a role cascades to its dependency rows."""
        role_a = Role(
            name="Source Role",
            description="Has dependency",
            team=Team.VILLAGE,
        )
        role_b = Role(
            name="Target Role",
            description="Is depended upon",
            team=Team.VILLAGE,
        )
        db_session.add_all([role_a, role_b])
        db_session.flush()

        dep = RoleDependency(
            role_id=role_a.id,
            required_role_id=role_b.id,
            dependency_type=DependencyType.REQUIRES,
        )
        db_session.add(dep)
        db_session.commit()

        db_session.delete(role_a)
        db_session.commit()

        remaining = db_session.query(RoleDependency).all()
        assert len(remaining) == 0

    def test_dependency_relationship_on_role(self, db_session: Session) -> None:
        """Test that Role.dependencies relationship loads correctly."""
        role_a = Role(
            name="Beholder",
            description="Sees seers",
            team=Team.VILLAGE,
        )
        role_b = Role(
            name="Seer",
            description="Sees cards",
            team=Team.VILLAGE,
        )
        db_session.add_all([role_a, role_b])
        db_session.flush()

        dep = RoleDependency(
            role_id=role_a.id,
            required_role_id=role_b.id,
            dependency_type=DependencyType.RECOMMENDS,
        )
        db_session.add(dep)
        db_session.commit()
        db_session.refresh(role_a)

        assert len(role_a.dependencies) == 1
        assert role_a.dependencies[0].required_role_id == role_b.id

    def test_unique_constraint_prevents_duplicates(self, db_session: Session) -> None:
        """Test that the same role pair cannot be added twice."""
        role_a = Role(
            name="Role A",
            description="First",
            team=Team.VILLAGE,
        )
        role_b = Role(
            name="Role B",
            description="Second",
            team=Team.VILLAGE,
        )
        db_session.add_all([role_a, role_b])
        db_session.flush()

        dep1 = RoleDependency(
            role_id=role_a.id,
            required_role_id=role_b.id,
            dependency_type=DependencyType.REQUIRES,
        )
        db_session.add(dep1)
        db_session.commit()

        dep2 = RoleDependency(
            role_id=role_a.id,
            required_role_id=role_b.id,
            dependency_type=DependencyType.RECOMMENDS,
        )
        db_session.add(dep2)
        with pytest.raises(Exception):
            db_session.commit()
