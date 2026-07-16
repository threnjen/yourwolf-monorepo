"""Tests for the shared pagination helper.

These pin the arithmetic the two list endpoints previously duplicated,
including the edge cases the original inline blocks happened to produce. The
helper is a move-only extraction, so "current behaviour" is the specification —
notably ``pages == 1`` for an empty result set (rather than 0) and the
unguarded division when ``limit`` is 0.
"""

import math

import pytest
from sqlalchemy.orm import Session

from app.models.role import Role, Visibility
from app.services.pagination import paginate


def _add_roles(db: Session, count: int) -> None:
    """Insert `count` throwaway roles so a real query has rows to page over."""
    for i in range(count):
        db.add(
            Role(
                name=f"Paged Role {i:03d}",
                description="pagination fixture",
                team="village",
                visibility=Visibility.PRIVATE,
            )
        )
    db.commit()


class TestPaginateArithmetic:
    """Total, page count, and offset derivation."""

    def test_empty_result_set_reports_one_page(self, db_session: Session) -> None:
        """An empty set reports pages=1, not pages=0."""
        meta = paginate(db_session.query(Role), page=1, limit=20)

        assert meta.total == 0
        assert meta.pages == 1
        assert meta.offset == 0

    def test_exact_multiple_of_limit(self, db_session: Session) -> None:
        """A total that divides evenly yields no trailing partial page."""
        _add_roles(db_session, 40)

        meta = paginate(db_session.query(Role), page=1, limit=20)

        assert meta.total == 40
        assert meta.pages == 2

    def test_last_partial_page_rounds_up(self, db_session: Session) -> None:
        """A trailing remainder still gets its own page."""
        _add_roles(db_session, 25)

        meta = paginate(db_session.query(Role), page=1, limit=20)

        assert meta.total == 25
        assert meta.pages == 2

    def test_single_item_yields_one_page(self, db_session: Session) -> None:
        """One row is one page."""
        _add_roles(db_session, 1)

        meta = paginate(db_session.query(Role), page=1, limit=20)

        assert meta.total == 1
        assert meta.pages == 1

    def test_offset_is_derived_from_page_and_limit(self, db_session: Session) -> None:
        """Offset skips all prior pages."""
        _add_roles(db_session, 25)

        meta = paginate(db_session.query(Role), page=3, limit=10)

        assert meta.offset == 20

    def test_out_of_range_page_keeps_real_total_and_pages(
        self, db_session: Session
    ) -> None:
        """A page past the end reports the true total and page count.

        The helper does not clamp; the caller's query simply returns no rows at
        that offset. This matches the previous inline behaviour.
        """
        _add_roles(db_session, 5)

        meta = paginate(db_session.query(Role), page=99, limit=20)

        assert meta.total == 5
        assert meta.pages == 1
        assert meta.offset == 1960

    def test_echoes_requested_page_and_limit(self, db_session: Session) -> None:
        """The requested page/limit round-trip into the response metadata."""
        meta = paginate(db_session.query(Role), page=4, limit=7)

        assert meta.page == 4
        assert meta.limit == 7


class TestPaginateFiltering:
    """The helper counts the query it is handed, filters included."""

    def test_counts_only_rows_matching_the_query_filter(
        self, db_session: Session, sample_role: Role
    ) -> None:
        """A filtered query yields a filtered total."""
        _add_roles(db_session, 10)

        query = db_session.query(Role).filter(Role.visibility == Visibility.PRIVATE)
        meta = paginate(query, page=1, limit=20)

        assert meta.total == 10


class TestPaginateLimitZero:
    """limit=0 was never guarded, and the routers make it unreachable.

    Both list endpoints declare ``limit: int = Query(..., ge=1, le=100)``, so a
    zero limit cannot arrive over HTTP. These tests pin what a direct service
    call does today rather than asserting a guard that has never existed.
    """

    def test_limit_zero_on_empty_set_short_circuits_to_one_page(
        self, db_session: Session
    ) -> None:
        """With no rows the division is skipped, so limit=0 is harmless."""
        meta = paginate(db_session.query(Role), page=1, limit=0)

        assert meta.total == 0
        assert meta.pages == 1

    def test_limit_zero_with_rows_raises_zero_division(
        self, db_session: Session
    ) -> None:
        """With rows present, limit=0 divides by zero — unchanged from before."""
        _add_roles(db_session, 3)

        with pytest.raises(ZeroDivisionError):
            paginate(db_session.query(Role), page=1, limit=0)


class TestPaginateMatchesLegacyFormula:
    """Differential check against the formula the services used inline."""

    @pytest.mark.parametrize(
        ("total", "page", "limit"),
        [
            (0, 1, 20),
            (1, 1, 20),
            (19, 1, 20),
            (20, 1, 20),
            (21, 2, 20),
            (25, 3, 10),
            (100, 5, 7),
        ],
    )
    def test_pages_and_offset_match_the_original_expressions(
        self, db_session: Session, total: int, page: int, limit: int
    ) -> None:
        """The helper reproduces the pre-extraction arithmetic exactly."""
        _add_roles(db_session, total)

        meta = paginate(db_session.query(Role), page=page, limit=limit)

        expected_pages = math.ceil(total / limit) if total > 0 else 1
        expected_offset = (page - 1) * limit
        assert meta.pages == expected_pages
        assert meta.offset == expected_offset
