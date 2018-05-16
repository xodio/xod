There are several ways you can contribute to XOD. This document is dedicated to
contributing to code and issues. Other ways are described in the
[Contributor’s guide](/docs/contributing/).

## Improving issues

Review the [issues](https://github.com/xodio/xod/issues) and use the GitHub
reactions to show your attitude. Issues with most reactions take a higher
development priority.

Read the issues. If you see some flaws, inconsistencies, or ambiguities point to
them in the issue’s comments.

See what’s coming next in the
[milestones](https://github.com/xodio/xod/milestones) section. If an issue is
already there, you have a final chance to say “no-oooo!”

## Creating issues

Before creating an issue check if a similar issue already exists.

There are few categories of issues in the XOD GitHub repository:

* [Bugs](https://github.com/xodio/xod/issues?q=is%3Aissue+is%3Aopen+label%3At%3Abug):
  things that are definitely broken;
* [Features](https://github.com/xodio/xod/issues?q=is%3Aissue+is%3Aopen+label%3At%3Afeat):
  new functionality for end-users;
* [Tweaks](https://github.com/xodio/xod/issues?q=is%3Aissue+is%3Aopen+label%3At%3Atweak):
  an inconvenient, annoying behavior that more looks like a bug than a missing
  feature;
* [Refactoring](https://github.com/xodio/xod/issues?q=is%3Aissue+is%3Aopen+label%3At%3Arefactor):
  notes on code improvements without changes in functionality;
* [Chore](https://github.com/xodio/xod/issues?q=is%3Aissue+is%3Aopen+label%3At%3Achore):
  repository building, testing, maintenance, and DX improvements.

Classify issue you want to create in advance. If it’s more like a feature or an
opinionated tweak, use XOD [forum](https://forum.xod.io) to discuss it.
Features come from the [Roadmap](https://github.com/xodio/xod/wiki/Roadmap) and
community brainstorms. GitHub issues are things to be scheduled, tracked, and
implemented, they are *not* a place for discussions.

New issues title and body should follow a common structure defined in
[ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE.md).

To create a new issue fill in required sections from the issue template and
delete sections irrelevant for this issue type.

## Making changes in the code

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

The type should reflect underlying issue category. Use one of: `fix` (bug fix),
`feat` (user story implementation), `tweak`, `refactor`, or `doc`.

Slug should shortly reflect the issue purpose.

Do use hyphens, lower case letters and digits, do not use slashes or any other
symbols.

### Writing code

The code should follow some stylistic rules. These rules are based on
[Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) with
slight modifications and enforcements. See
[ESLint configuration](./.eslintrc.js) for details. To verify your code follows
the rules run:

    $ yarn run lint

In addition to the style ensure that new functionality is covered by unit tests.

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

* Use imperative, present tense: “change” not “changed” nor “changes”
* Don’t capitalize the first letter
* No dot (`.`) at the end

Try to keep the whole subject line under 72 symbols.

### Rebasing on master

To keep history clean we rebase topic branches rather than merge. Once you want
to synchronize with the `master` going ahead do:

    $ git checkout master
    $ git pull
    $ git checkout <feature-branch-name>
    $ git rebase master

Follow Git hints to resolve any conflicts.

### Testing and linting changes

There is a series of checks that should be passed for the code to have a chance
to be merged into `master`. They are unit tests, linting and possibly other
things.

Run `yarn run verify` to make sure your code doesn’t break anything.

The checks are performed by
[Circle CI](https://circleci.com/gh/xodio/xod/tree/master) in any case, but
ensuring your PR would not break anything in advance is a good habit.

### Creating pull request

Use GitHub interface to create a pull request from the topic branch to the
`master` branch.

Fill in the proposed [PULL_REQUEST_TEMPLATE](.github/PULL_REQUEST_TEMPLATE.md).

### Reviewing and fixing

We strive to review any PR in one day. To be approved a PR should sustain a
review by at least one team member. Bigger PR’s are reviewed by at least two
members.

Very likely, there will be code issues that should be fixed before the merge.
We’ll try to describe them as friendly as possible. Fix the issues and add the
commits to the same PR.

It could also happen that the PR is no longer can be merged into the `master`
automatically because the HEAD went ahead. In this case, rebase on master again
and push with `--force`. Yes, you’ll rewrite a history, but as an author of the
topic branch, you’re the king of your changes.

### Merging

Once the PR is good, it would be merged into the master branch.

It’s better to delete the merged branch to keep the repository clean. Any new
contributions related to the same topic may be performed by passing the whole
pipeline again.
