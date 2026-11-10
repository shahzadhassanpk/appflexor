---
name: Tab checkbox initialization
description: Imperative native checkbox state must survive Radix tab panel remounts.
---

Initialize native checkbox indeterminate state through its DOM ref callback when
the checkbox lives inside a conditionally mounted tab panel.

**Why:** Radix presence can mount the panel after the parent effect has run.
An effect keyed to selection and active tab missed the new element, so returning
to Available displayed an unchecked Select all despite a partial selection.

**How to apply:** derive mixed state from current selection and apply it whenever
the DOM node attaches; verify switching away and back, not just initial selection.
