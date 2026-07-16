"""Shared pagination arithmetic for list endpoints.

``RoleService.list_roles`` and ``GameService.list_games`` both derived their
page metadata with the same ``count -> ceil(total / limit) -> offset`` block.
That single copy now lives here; callers apply their own eager loads and
ordering before slicing with :attr:`PageMeta.offset`.

This lives beside the services rather than next to ``app.schemas.base`` because
it takes a SQLAlchemy ``Query`` — keeping ORM imports out of the schema layer.
"""

import math
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Query


@dataclass(frozen=True)
class PageMeta:
    """Page metadata derived from a query and the requested slice.

    The first four fields map straight onto ``PaginatedResponse``; ``offset`` is
    for the caller's own ``.offset(...)`` call.

    Attributes:
        total: Rows matching the query, ignoring the page slice.
        page: The requested page, echoed back.
        limit: The requested page size, echoed back.
        pages: Page count for ``total``, or 1 when there are no rows.
        offset: Rows to skip to reach the requested page.
    """

    total: int
    page: int
    limit: int
    pages: int
    offset: int


def paginate(query: Query[Any], page: int, limit: int) -> PageMeta:
    """Count a query and derive the metadata for one page of it.

    Args:
        query: The filtered query to count. Not sliced or executed here beyond
            the count.
        page: Page number (1-indexed).
        limit: Items per page.

    Returns:
        Page metadata for the requested slice.

    Raises:
        ZeroDivisionError: If ``limit`` is 0 and the query matches any rows.
            Both list routers declare ``limit`` as ``ge=1``, so this is
            unreachable over HTTP; it is preserved from the original inline
            implementation rather than newly guarded.
    """
    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit
    return PageMeta(
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        offset=offset,
    )
