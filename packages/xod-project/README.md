XOD-PROJECT
===========

This is a core package that provides an API to work with XOD projects.

## Project structure
```
> Project
  > Patch
    > Link
    > Node
      > Pin
```

## Golden rule

Manipulate with entities only using API functions or you can get unhandled exceptions.

## Basic principles of the API

1. **Composability of functions** *(ramda-friendly)*
   That means every function take context as latest argument.
   For example, `getPinType(key, node)`.

2. **Immutability of data**
   So every function returns new copy with applied changes.

3. **Functional style**
   API could be used in compositions and etc, so there are no nulls or undefined values.
   Also there are no exceptions if you're manipulating with entities using API (don't break objects by the hand).
   Instead, monads like Either and Maybe from [ramda-fantasy](https://github.com/ramda/ramda-fantasy) are used.

4. **Pure functions only**
   Functions of `xod-project` don’t have any side effects, state, or IO.

5. **Atomic operations**
   Each function returns a consistent part of a project (or the whole project).


-----------------------
## For contributors

### Naming conventions

   * **Clear naming**
     The function name clearly informs about the expected result.
     And always should begins with the action verb and ends with the subject.
     The action verb may be abbreviated (like `assoc`).
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

   * **Getters with filtering/grouping**
     This is a common rule for all getters.
     If getter have any filtering or grouping rule it ends with this rule.
     Begin rule with prepositions `by`, `with` and `without`.
     For example, `getPatchByPath`, `listPatchWithNodes`.

   * **Check functions**
     If function checks something and returns boolean, it looks like a question.
     For example, `isPinCurried`, `hasPins`.

### Getters, setters and their return values

   * **Property getters**
     Always returns a primitive value (not Monads).
     Use `R.prop` for returning required properties (so if user breaks object — that will be unhandled exception).
     Use `R.propOr` for returning optional properties and set default value (for example, `R.prop('', 'label')`).

   * **Property setters**
     Always returns entity with assigned new value.
     Always sets value without errors, but coerce the passed argument into required type.
     For example, `setProjectAuthors` method should coerce value into array of strings.
     So `setProjectAuthors(35, project)` will return project where `newProject.authors = ['35']`.

   * **Find something and entity getters**
     Always returns Maybe, because it may not find anything.
     For example, `getNodeById(1, patch) // Maybe<Node> or Maybe<Nothing>`.
