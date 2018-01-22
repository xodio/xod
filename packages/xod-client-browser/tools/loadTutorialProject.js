const fs = require('fs');
const path = require('path');
const { loadProject } = require('xod-fs');

const projectDir = process.env.XOD_BROWSER_INITIAL_PROJECT_DIR
  || path.resolve(__dirname, '../../../workspace/welcome-to-xod');
const workspaceDir = process.env.XOD_BROWSER_INITIAL_WORKSPACE_DIR
  || path.resolve(projectDir, '..');
const targetPath = path.resolve(__dirname, '../tutorialProject.json');

loadProject([workspaceDir], projectDir)
  .then((project) => {
    const json = JSON.stringify(project, null, 2);
    fs.writeFileSync(targetPath, json);
    process.exit(0);
  });
