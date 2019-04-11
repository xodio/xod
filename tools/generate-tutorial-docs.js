#! /usr/bin/env node

/**
 * This scripts auto-generates tutorial documentation from the
 * `welcome-to-xod` multi-file project.
 *
 * Also it glues a content of `before-1st-h2.md` from the patch directory
 * to the tutorial contents before first H2 or in the end of the article.
 *
 * It generates tutorial with steps:
 * 1. Extracts comments' content to the RAM
 * 2. Remove all comments
 * 3. Save project without comments as `welcome-to-xod.xodball`
 * 4. Generate `README.md` for every patch in the project
 * 5. Generate a script for the screenshotter
 * 6. Run the screenshotter
 *
 * Run:
 * `./tools/generate-tutorial-docs.js 2.0.1 /path/to/welcome-to-xod /path/to/docs/tutorial/`
 *
 * Options:
 * `--no-screenshots` - to run all steps without running screenshotter (last step)
 */

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

const os = require('os');
const path = require('path');
const fs = require('fs').promises;
const fse = require('fs-extra');
const exec = require('child_process').exec;
const R = require('ramda');
const { loadProject, saveProjectAsXodball } = require('xod-fs');

// =============================================================================
const PROJECT_NAME = 'welcome-to-xod';
const NO_SCREENSHOTS_FLAG = '--no-screenshots';

const GENERATED_FILE_COMMENT = `
<!--
This file is auto-generated from the 'welcome-to-xod' project.
Do not change this file manually because your changes may be lost after
the tutorial update.

To make changes, change the 'welcome-to-xod' contents or 'before-1st-h2.md'.

If you want to change a Fritzing scheme or comments for it, change the
'before-1st-h2.md' in the documentation directory for the patch.

Then run auto-generator tool (xod/tools/generate-tutorial-docs.js).
-->
`;

// Map that will hold a map of comments sorted by X,Y
// to autogenerate docs
// :: Map PatchName String
const comments = {};

// =============================================================================
// Arguments parsing
// =============================================================================
const argsWithoutOptional = R.reject(
  R.equals(NO_SCREENSHOTS_FLAG),
  process.argv
);

if (argsWithoutOptional.length < 5) {
  console.log('Usage: ');
  console.log(
    './tools/generate-tutorial-docs.js 2.0.1 /path/to/project/welcome-to-xod/ /output/path/to/docs/tutorial-dir/'
  );
  console.log('Optional flags: ');
  console.log(
    '--no-screenshots — to generate screenshotter script but do not execute it'
  );

  process.exit(1);
}

const options = {
  noScreenshots: process.argv.indexOf(NO_SCREENSHOTS_FLAG) > -1,
  version: argsWithoutOptional[2],
  input: argsWithoutOptional[3],
  output: argsWithoutOptional[4],
};

// =============================================================================
// Utilities
// =============================================================================

// Promised `exec`
const execP = (cmd, opts = {}) =>
  new Promise((resolve, reject) => {
    exec(cmd, opts, (err, stdout, stderr) => {
      if (err) reject(err);
      resolve({ stdout, stderr });
    });
  });

// Returns H1 without `#` and trim spaces
// :: String -> String
const getH1 = R.compose(
  R.trim,
  R.replace(/^#\s+/g, ''),
  R.defaultTo(''),
  R.head,
  R.match(/^# (.+)$/gm)
);

// Lists patch directories
const getProjectPatchDirs = projectPath =>
  fs
    .readdir(projectPath)
    .then(R.reject(R.anyPass([R.equals('project.xod'), R.equals('.DS_Store')])))
    .then(R.map(p => path.join(projectPath, p)));

// Saves a multifile project as Xodball
const saveAsXodball = source => {
  const output = path.resolve(options.output, `${PROJECT_NAME}.xodball`);
  const bundledWs = path.resolve(__dirname, '..', 'workspace');
  return loadProject([bundledWs], source).then(saveProjectAsXodball(output));
};

// :: PatchPath -> Boolean
const isIntroPart = R.test(/^\d00-/);

// =============================================================================
// Project converters & comment extractors
// =============================================================================
const extractCommentsFromPatch = xodpPath =>
  fs
    .readFile(xodpPath)
    .then(str => JSON.parse(str))
    .then(
      R.tap(content => {
        const patchName = path.basename(path.dirname(xodpPath));
        comments[patchName] = R.compose(
          R.join('\n\n'),
          R.pluck('content'),
          R.sortWith([
            R.ascend(R.path(['position', 'x'])),
            R.ascend(R.path(['position', 'y'])),
          ]),
          R.propOr([], 'comments')
        )(content);
      })
    )
    .then(R.omit(['comments']))
    .then(content => JSON.stringify(content, null, 2))
    .then(content => fs.writeFile(xodpPath, content));

const extractCommentsFromProject = projectPath =>
  getProjectPatchDirs(projectPath)
    .then(R.map(p => path.join(p, 'patch.xodp')))
    .then(xodpFiles => Promise.all(R.map(extractCommentsFromPatch, xodpFiles)));

// =============================================================================
// Screenshotter command generator
// =============================================================================

const formatScreenshotCommand = patchName =>
  `"$SHOT" "$SRC" ${patchName} ./${patchName}/${patchName}.patch.png`;

const generateScreenshotScript = projectPath =>
  getProjectPatchDirs(projectPath)
    .then(R.map(p => path.basename(p)))
    .then(patchNames =>
      fs.writeFile(
        path.join(options.output, 'update-screenshots.sh'),
        [
          '#!/bin/sh',
          '',
          `SRC=${PROJECT_NAME}.xodball`,
          '',
          R.compose(
            R.join('\n\n'),
            R.map(formatScreenshotCommand),
            R.reject(isIntroPart)
          )(patchNames),
        ].join('\n')
      )
    );

// =============================================================================
// Tutorial content generators
// =============================================================================

// :: Nullable String -> Nullable String -> String
const generatePaginator = (prev, next) => `

<div class="ui grid">
  <div class="five wide column left aligned ">
    ${prev ? `<a href="../${prev}/">← Previous lesson</a>` : ''}
  </div>
  <div class="six wide column center aligned ">
    <a href="../">Index</a>
  </div>
  <div class="five wide column right aligned ">
    ${next ? `<a href="../${next}/">Next lesson →</a>` : ''}
  </div>
</div>

`;

const generateTutorials = projectPath =>
  getProjectPatchDirs(projectPath).then(patchPaths =>
    Promise.all(
      R.map(async patchPath => {
        const patchName = path.basename(patchPath);
        const patchContent = comments[patchName];
        if (!patchContent) return Promise.resolve();

        // For paginator
        const lessonsOrdered = R.compose(
          R.pluck(0),
          R.sortBy(R.head),
          R.toPairs
        )(comments);
        const curLessonIndex = R.indexOf(patchName, lessonsOrdered);
        const prevLesson =
          curLessonIndex > 0 ? lessonsOrdered[curLessonIndex - 1] : null;
        const nextLesson =
          curLessonIndex < lessonsOrdered.length - 1
            ? lessonsOrdered[curLessonIndex + 1]
            : null;

        // Directory for the patch documentation
        const patchDocDir = path.join(options.output, patchName);

        // Image
        const h1 = getH1(patchContent);
        const img = isIntroPart(patchName)
          ? ''
          : `![Screenshot of ${patchName}](./${patchName}.patch.png)`;
        const imgPos = patchContent.indexOf(h1) + h1.length;

        // H2
        const h2 = R.match(/^##\s.+$/gm, patchContent);
        const h2PosI = patchContent.indexOf(h2);
        const h2Pos = h2PosI > -1 ? h2PosI : patchContent.length;

        // Content parts
        const beforeImg = patchContent.slice(0, imgPos);
        const introduction = patchContent.slice(imgPos, h2Pos);
        const restOfContent = patchContent.slice(h2Pos);
        const before1stH2 = await fs
          .readFile(path.join(patchDocDir, 'before-1st-h2.md'))
          .catch(() => '');

        // Write!
        await fse.ensureDir(patchDocDir);
        await fs.writeFile(
          path.join(patchDocDir, 'README.md'),
          `---
title: ${h1}
version: ${options.version}
---

${GENERATED_FILE_COMMENT}

<div class="ui segment note">
<span class="ui ribbon label">Note</span>
This is a web-version of a tutorial chapter embedded right into the XOD IDE.
To get a better learning experience we recommend to install the
<a href="/downloads/">desktop IDE</a> or start the
<a href="/ide/">browser-based IDE</a>, and you’ll see the same tutorial there.
</div>

${beforeImg}

${img}

${introduction}

${before1stH2}

${restOfContent}

${generatePaginator(prevLesson, nextLesson)}
`
        );

        return 1;
      }, patchPaths)
    )
  );

const generateRootIndex = () => {
  const patchIndex = R.compose(
    R.join('\n'),
    R.addIndex(R.map)(
      ([patchName, content], idx) =>
        `${idx}. [${getH1(content)}](./${patchName}/)`
    ),
    R.sortBy(R.head),
    R.toPairs
  )(comments);

  return fs.writeFile(
    path.join(options.output, 'README.md'),
    `---
title: Tutorial
version: ${options.version}
---

${GENERATED_FILE_COMMENT}

# Tutorial

- [Installing and running XOD](./install/)
- [Required hardware](./required-hardware/)

${patchIndex}

- [Complex projects?](./complex-projects/)
`
  );
};

// =============================================================================
// RUN
// =============================================================================

fs.mkdtemp(path.join(os.tmpdir(), 'tutorial-docs-')).then(tmpDir => {
  const CONVERTED_PROJECT = path.join(tmpDir, `${PROJECT_NAME}.w`);

  return fse
    .copy(options.input, CONVERTED_PROJECT)
    .then(() => extractCommentsFromProject(CONVERTED_PROJECT))
    .then(() => saveAsXodball(CONVERTED_PROJECT))
    .then(() => fse.ensureDir(options.output))
    .then(() => generateScreenshotScript(CONVERTED_PROJECT))
    .then(() => generateTutorials(CONVERTED_PROJECT))
    .then(() => generateRootIndex())
    .then(() =>
      execP(`chmod 777 ${path.join(options.output, 'update-screenshots.sh')}`)
    )
    .then(() => {
      if (options.noScreenshots) return 1;
      return execP(path.join(__dirname, 'update-docs-screenshots.sh'), {
        cwd: options.output,
      });
    })
    .catch(err => {
      console.error(err);
    })
    .then(() => fse.remove(tmpDir));
});
