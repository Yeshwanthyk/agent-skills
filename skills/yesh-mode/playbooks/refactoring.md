# Refactoring

Use when the requested result changes structure while preserving behavior.

Identify the behavior and compatibility contracts that must remain. Capture a characterization or equivalence check where existing checks do not cover them.

Choose the smallest reshape that removes a concrete source of indirection, duplicated decisions, invalid state, or coordination. Use the [simplicity note](../principles/simplicity.md) for contested boundaries. Keep a sound abstraction even when inlining would reduce line count.

Migrate affected callers with the implementation. Remove the old internal path once no active caller or compatibility contract needs it. Check data migration and rollback before changing persistent forms.

Verify the preserved behavior on the appropriate boundary. Report the structural benefit and equivalence evidence. Unrelated cleanup stays outside the change.
