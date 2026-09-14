# Project Learnings

## Nullable JSON fields need explicit engine parity tests

- **An optional TypeScript property does not model a runtime JSON `null` value.** When a backend schema accepts both omitted and `null`, add a null-input test and normalize it before spreading or iterating. The signal is a nullable transport field entering a pure engine contract that only declares `field?: T`.

## Coverage comparisons need clean source trees

- **Run paired V8 coverage from clean writable exports, not a development checkout with generated output.** Generated `dist/` or prior `coverage/` JavaScript can enter the measured file set and lower repository totals even when every source test passes. The signal is a coverage table that lists generated directories or configuration files as zero-percent application code.
