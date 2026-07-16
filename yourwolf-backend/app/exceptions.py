"""Domain exception vocabulary.

Services raise these instead of overloading builtin ``ValueError`` /
``PermissionError``, so routers no longer inspect message prose to decide a
status code. HTTP mapping lives in ``app.main``; this module stays free of
framework imports.
"""


class DomainError(Exception):
    """Base class for domain errors that map to a client-facing HTTP status."""


class NotFoundError(DomainError):
    """A requested entity does not exist. Maps to 404."""


class DomainValidationError(DomainError):
    """A request violates a domain rule. Maps to 400."""


class LockedError(DomainError):
    """A request targets an entity that forbids the operation. Maps to 403."""
