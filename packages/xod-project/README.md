XOD-PROJECT
===========

This is a core-package that provides an API to work with XOD projects.

## Project structure
```
> Project
  > Patch
    > Link
    > Node
      > Pin
```

## Basic principles of the API

1. **Composability of methods** *(ramda-friendly)*
   That means every method should take context as latest argument.
   For example, `getPinType(key, node)`.

2. **Immutability of data**
   So every method returns new copy with applied changes.

3. **Functional style**
   API could be used in compositions and etc, so there is no exceptions, nulls or undefined returns.
   Instead of them there will be monads: Either, Maybe and maybe some more.
   Learn more about monads here: [ramda-fantasy](https://github.com/ramda/ramda-fantasy)

4. **Pure methods only**
   In this package should be no side-effects, async data-flow and etc.
   So every method of this API should be a pure function.

5. **Atomic operations**
   Each method should return a consistent part of project (or whole project).

## Naming conventions

   * **Clear naming**
     The method name should clearly inform about the expected result.
     And always should begins with the predicate and ends with the subject.
     The predicate may be abbreviated verb (like `assoc`).
     For example, `createLink`, `rebasePatch`, `getPinType`, `assocNode`.

   * **Getters and Setters for primitive properties**
     Should looks like `getSomeoneSomething` or `setSomeoneSomething`.
     For example, `getNodeLabel` and `setNodeLabel`.

   * **Getters for lists**
     Should begin with `list` and ends with the word in the plural form.
     For example, `listNodes`.

   * **Getters for entities**
     In spite of the relationship of entities among themselves as nested
     within each other — we obtain them using only the name of the entity,
     regardless of their parents.
     For example, `listPatches`, `listNodes`.

   * **Getters with conditions**
     This is a common rule for all getters.
     If getter have any condition it should ends with this condition.
     Begin condition with prepositions `by`, `with` and `without`.
     For example, `getPatchByPath`, `listPatchWithNodes`.

   * **Check methods**
     If method checks something and returns boolean, it should begin with `is` word,
     contain the subject and ends with participle.
     For example, `isPinCurried`.
