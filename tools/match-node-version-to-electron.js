#! /usr/bin/env node

/**
 * This script ensures that `engines.node` field of `package.json`
 * and `.nvmrc` contain the exact same version of node.js
 * that ships with the current Electron version we're using.
 *
 * Should be run in CI after installing node modules
 * and before "verify-git-clean" step,
 * or manually after updating electron.
 */

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const electronVersion = require('electron/package.json').version;

function updateEngines(nodeVersion) {
  const pathToPackageJson = path.resolve(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(pathToPackageJson));
  packageJson.engines.node = nodeVersion;
  fs.writeFileSync(pathToPackageJson, JSON.stringify(packageJson, null, 2));
}

function updateNvmrc(nodeVersion) {
  fs.writeFileSync(path.resolve(__dirname, '..', '.nvmrc'), `${nodeVersion}\n`);
}

fetch('https://unpkg.com/electron-releases/lite.json')
  .then(response => response.json())
  .then(electronReleases => {
    const release = electronReleases.find(
      ({ version }) => version === electronVersion
    );

    if (!release)
      throw new Error(`Can't find electron release ${electronVersion}`);

    const nodeVersion = release.deps.node;
    updateNvmrc(nodeVersion);
    updateEngines(nodeVersion);

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
