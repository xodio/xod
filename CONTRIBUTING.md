Contributing to XOD
===================

Creating Issues
---------------

Before creating an issue check if a similar issue already exists.

We use [ZenHub](https://www.zenhub.com/) to prioritize and estimate issues. To
understand the whole picture take a look on Boards tab provided by the
extension.

There are few categories of [issues](https://github.com/xodio/xod/issues) in XOD
GitHub repository:

- User stories (aka feature requests): new functionality for end-users;
- Bug reports: things that are definitely broken;
- Tweak requests: an inconvenient annoying behavior that more looks like a bug
  than a missing feature;
- Refactoring requests: notes on code improvements without changes in
  functionality;
- Documentation requests: notes on missing developer’s documentation.

You should classify issue you want to create in advance. If the issue does not
fall into any category, perhaps it should not be a GitHub issue.

New issues title and body should follow a common structure that is defined in
[ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE.md).

To create a new issue:

1. Fill in required sections from the issue template
2. Delete sections irrelevant for this issue type
3. Give the issue a label corresponding to its category
4. Give the issue a scope label

Making Changes in the Code
--------------------------

Generally, any change in code should be related to a concrete issue. The common
pipeline to get your changes into the master branch is:

1. Create a new topic branch to work on the issue
2. Write the code, do a series of commits
3. Rebase on the `master`
4. Test and lint the code
5. Create a pull request to the `master`
6. Wait for the code review, fix the code, rebase, force push
7. Merge to the `master` and delete the topic branch

These steps are described below in details.

### Creating a topic branch

Any changes are delivered to XOD via pull requests. So any work should be done
in a topic branch. Create a new branch like following:

    $ git checkout -b fix-101-delete-empty-patch

Use `<type>-<issue_number>-<slug>` notation for the branch name.

The type should be one of: `fix` (bug fix), `feat` (user story implementation),
`tweak`, `refactor`, or `doc`.

Slug should shortly reflect the issue purpose.

Do use hyphens, lower case letters and digits, do not use slashes or any other
symbols.

### Writing code

The code should follow some stylistic rules. These rules are based on
[Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) with slight
modifications and enforcements. See [ESLint configuration](./eslintrc.js) for
details. To verify your code follows the rules run:

   $ npm run lint

In addition to the style ensure that:

- Any function or another symbol that is exported out of a package is documented
  with a [JSDoc comment](http://usejsdoc.org/index.html).
- New functionality is covered with unit tests.

### Performing commits

Try to keep changes granular. One commit is a single completed portion of an
improvement. A commit, in general, should not break any tests or linting rules.

We use simplified
[Angular](https://gist.github.com/stephenparish/9941e89d80e2bc58a153)-alike
convention for commit messages. Subject line should have a form
`<type><scope>: <subject>`, e.g.

    fix(xod-fs): allow empty node lists to be loaded correctly

The `<type>` should be one of `fix` (bug fix), `feat` (new functionality),
`tweak`, `refactor`, `doc`, or `chore` (general code maintenance).

The `<scope>` should be a name of a package affected by the change. If the
change affects several packages, separate them with commas (no spaces).

For the `<subject>` text:

- Use imperative, present tense: “change” not “changed” nor “changes”
- Don’t capitalize the first letter
- No dot (`.`) at the end

Try to keep the whole subject line under 74 symbols.

### Rebasing on master

To keep history clean we rebase topic branches rather than merge. Once you
want to synchronize with the `master` going ahead do:

  $ git checkout master
  $ git pull
  $ git checkout <feature-branch-name>
  $ git rebase master

Follow Git hints to resolve any conflicts.

### Testing and linting changes

There is a series of checks that should be passed for the code to have a
chance to be merged into `master`. They are unit tests, linting and possibly
other things.

Run `npm run verify` to make sure your code doesn’t break anything.

The checks are performed by [Travis CI](https://travis-ci.com) in any case,
but ensuring your PR would not break anything in advance is a good habit.

### Creating pull request

Use GitHub interface to create a pull request from the topic branch to the
`master` branch.

Fill in the proposed [PULL_REQUEST_TEMPLATE](.github/PULL_REQUEST_TEMPLATE.md).

### Reviewing and fixing

We strive to review any PR in one day.

There could be code issues that should be fixed before a merge. Fix the issues
and add these commits to the same PR.

It could also happen that the PR is no longer can be merged into the `master`
automatically because the HEAD went ahead. In this case, rebase on master again
and push with `--force`. Yes, you’ll rewrite a history, but as an author of
the topic branch, you’re the king of your changes.

### Merging

Once the PR is good it would be merged to the master branch.

It’s better to delete the merged branch to keep the repository clean. Any new
contributions related to the same topic may be performed by passing the whole
pipeline again.
