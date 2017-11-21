There are several ways you can contribute to XOD:

- Report a bug. File an issue on GitHub or open a thread on the
  [forum](https://forum.xod.io). Please follow the structure defined in the
  [ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE.md).
- Request a feature of tweak. Open a thread on the
  [forum](https://forum.xod.io). We do not use GitHub issues for discussions.
  They are only for prioritization, scheduling, and tracking. Features require
  a preliminary discussion, so we ask to describe them on the forum where they
  get better visibility.
- Fix a bug or make a feature which closes an existing issue. Open a pull
  request, follow the
  [PULL_REQUEST_TEMPLATE](.github/PULL_REQUEST_TEMPLATE.md).
- Fix grammar or improve wording in the documentation or UI. Open a pull
  request with changes. A GitHub issue is not required.
- Translate documentation article. Put the translation to the file named like
  `de.md` (where `de` is a [language
  code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)) next to the
  corresponding `README.md` and open a pull request.

## Creating issues

Before creating an issue check if a similar issue already exists.

We use [ZenHub](https://www.zenhub.com/) to prioritize and estimate issues. To
understand the whole picture take a look at Boards tab provided by the
extension.

There are few categories of [issues](https://github.com/xodio/xod/issues) in
XOD GitHub repository:

- Bug reports: things that are definitely broken;
- User stories (aka feature requests): new functionality for end-users;
- Tweak requests: an inconvenient annoying behavior that more looks like a bug
  than a missing feature;
- Refactoring requests: notes on code improvements without changes in
  functionality;
- Documentation requests: notes on missing documentation;
- Chore requests: repository building, testing, maintenance, and DX
  improvements.

Classify issue you want to create in advance. If it’s not a bug report, use XOD
[forum](https://forum.xod.io) to discuss it. Issues other than bug reports are
created by XOD team members.

New issues title and body should follow a common structure defined in
[ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE.md).

To create a new issue:

1. Fill in required sections from the issue template
2. Delete sections irrelevant for this issue type
3. Give the issue a label corresponding to its category
4. Give the issue a scope label

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

The code should follow some stylistic rules. These rules are based on [Airbnb
JavaScript Style Guide](https://github.com/airbnb/javascript) with slight
modifications and enforcements. See [ESLint configuration](./.eslintrc.js) for
details. To verify your code follows the rules run:

    $ yarn run lint

In addition to the style ensure that new functionality is covered by unit tests.

### Performing commits

Try to keep changes granular. One commit is a single completed portion of an
improvement. A commit, in general, should not break any tests or linting rules.

We use simplified
[Angular](https://gist.github.com/stephenparish/9941e89d80e2bc58a153)-alike
convention for commit messages. Subject line should have a form `<type><scope>:
<subject>`, e.g.

    fix(xod-fs): allow empty node lists to be loaded correctly

The `<type>` should be one of `fix` (bug fix), `feat` (new functionality),
`tweak`, `refactor`, `doc`, or `chore` (general code maintenance).

The `<scope>` should be a name of a package affected by the change. If the
change affects several packages, separate them with commas (no spaces).

For the `<subject>` text:

- Use imperative, present tense: “change” not “changed” nor “changes”
- Don’t capitalize the first letter
- No dot (`.`) at the end

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

The checks are performed by [Travis CI](https://travis-ci.com/xodio/xod) in any
case, but ensuring your PR would not break anything in advance is a good habit.

### Creating pull request

Use GitHub interface to create a pull request from the topic branch to the
`master` branch.

Fill in the proposed [PULL_REQUEST_TEMPLATE](.github/PULL_REQUEST_TEMPLATE.md).

### Reviewing and fixing

We strive to review any PR in one day. To be approved a PR should sustain a
review by at least two team members.

There could be code issues that should be fixed before a merge. Fix the issues
and add these commits to the same PR.

It could also happen that the PR is no longer can be merged into the `master`
automatically because the HEAD went ahead. In this case, rebase on master again
and push with `--force`. Yes, you’ll rewrite a history, but as an author of the
topic branch, you’re the king of your changes.

### Merging

Once the PR is good it would be merged into the master branch.

It’s better to delete the merged branch to keep the repository clean. Any new
contributions related to the same topic may be performed by passing the whole
pipeline again.
