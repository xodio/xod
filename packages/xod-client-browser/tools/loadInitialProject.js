const fs = require('fs');
const path = require('path');
const { loadProject } = require('xod-fs');

const projectDir = process.env.XOD_BROWSER_INITIAL_PROJECT_DIR
  || path.resolve(__dirname, '../../../workspace/welcome-to-xod');
const targetPath = path.resolve(__dirname, '../initialProject.json');

loadProject(projectDir)
  .then((project) => {
    const json = JSON.stringify(project, null, 2);
    fs.writeFileSync(targetPath, json);
    process.exit(0);
  });
