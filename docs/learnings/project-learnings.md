# Project Learnings

## Nullable JSON fields need explicit engine parity tests

- **An optional TypeScript property does not model a runtime JSON `null` value.** When a backend schema accepts both omitted and `null`, add a null-input test and normalize it before spreading or iterating. The signal is a nullable transport field entering a pure engine contract that only declares `field?: T`.
