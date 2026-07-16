# AGENTS.md

Build a mobile-only prototype for a Guardian-facing dog kindergarten reservation service with class settings.

## Project Philosophy

The purpose of this prototype is to validate product behavior and user experience,
not production-ready implementation.

When multiple implementations satisfy the request, prefer the one that:

1. Preserves existing product behavior.
2. Preserves existing UI and interaction patterns.
3. Reuses existing code and styles.
4. Introduces the least new code.
5. Limits changes to the requested scope.

Consistency across the prototype is more valuable than locally optimized implementations.

## Scope

Validate Pet and Guardian information, Guardian-facing class setting and selection, Reservation creation and review, Reservation status and cancellation, and Report viewing.

Exclude member management, operator class or capacity management, and center settings. Use Guardian, Pet, Reservation, and Report consistently.

Use reference implementations only to understand behavior and visual style. Do not copy files or legacy architecture, and do not expose operator-only concepts.

## Architecture

- HTML owns stable screen structure.
- CSS owns presentation.
- JavaScript owns behavior and state.
- Business logic should remain independent from UI rendering.

## Explicit Prohibitions

Never:0
- Generate an entire screen in JavaScript when its structure can be defined in HTML.
- Mix business logic with DOM manipulation.

## Decision Principles

Before introducing anything new, determine whether the requested behavior can be achieved by extending an existing implementation.

1. Identify affected features.
2. Reuse existing components and styles where possible.
3. Keep changes focused and incremental.

Prefer:
- modifying an existing component over creating a new one.
- extending an existing style over introducing another CSS pattern.
- preserving existing naming over inventing new terminology.
- incremental changes over large rewrites.

**Only introduce new patterns when existing ones cannot reasonably satisfy the requested behavior.**

Before UI, HTML markup, or CSS work, read [UI and CSS](references/ui-and-css.md).

## Change Boundaries

Avoid unrelated changes because they make prototype validation more difficult.

Do not:
- rewrite unrelated code.
- rename existing concepts.
- refactor for personal preference.
- optimize code without a functional reason.
- introduce new UI patterns when existing ones already solve the problem.

Large-scale refactoring requires explicit approval.

## Success Criteria

A change is complete when:
- requested behavior works.
- existing behavior is preserved.
- existing UI patterns remain consistent.
- no unnecessary files were created.
- no unrelated code was modified.