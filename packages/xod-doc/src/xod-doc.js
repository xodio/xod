import path from 'path';
import { loadProjectWithLibs, pack, writeJSON } from 'xod-fs';
import handlebars from 'handlebars';
import fs from 'fs';
import ncp from 'recursive-copy';
import rimraf from 'rimraf';

function prepareJSON(data, libName, userName) {
  const res = [];
  const keys = Object.keys(data).sort();
  keys.forEach(key => {
    const patch = data[key];
    patch.label = patch.label || key.replace('@/', '');
    let link = key.replace('/', '-').replace('@-', '');
    link = `nodes/${link}.html`;
    const fullPath = key.replace('@', `${userName}/${libName}`);
    const inputs = [];
    const outputs = [];
    const { pins } = patch;
    Object.keys(pins).forEach(pin => {
      pins[pin].label = pins[pin].label || pins[pin].pinLabel;
      if (pins[pin].direction === 'input') {
        inputs.push(pins[pin]);
      } else {
        outputs.push(pins[pin]);
      }
    });
    patch.fullPath = fullPath;
    patch.pins = {
      inputs,
      outputs,
    };
    patch.link = link;
    res.push(patch);
  });
  return res;
}

function renderToString(source, data) {
  const template = handlebars.compile(source);
  const outputString = template(data);
  return outputString;
}

function readFileAsync(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function getAllTemplates(singleTpl, listTpl, outputPath, templatesPath) {
  return Promise.all([
    readFileAsync(singleTpl),
    readFileAsync(listTpl),
    ncp(path.join(templatesPath, 'assets'), path.join(outputPath, 'assets'))]);
}

export default (outputDir, templatesDir, projectDir, programm) => {
  const clearDestination = programm.clear;
  const outputPath = path.resolve(outputDir);
  const templatesPath = path.resolve(templatesDir);
  const projectPath = path.resolve(projectDir);
  const workspace = path.resolve(projectDir, '..');


  const libName = path.basename(projectPath);
  const userName = path.basename(workspace);

  const singleTpl = path.join(templatesPath, 'single.html');
  const listTpl = path.join(templatesPath, 'list.html');

  if (clearDestination) {
    if (fs.existsSync(outputPath)) {
      rimraf(outputPath, () => fs.mkdir(outputPath));
    } else {
      fs.mkdir(outputPath);
    }
  } else if (!fs.existsSync(outputPath)) {
    fs.mkdir(outputPath);
  }

  return loadProjectWithLibs(projectPath, workspace)
   .then(({ project, libs }) => pack(project, libs))
    .then(packed => getAllTemplates(singleTpl, listTpl, outputPath, templatesPath).then(results => {
      const singleSource = results[0].toString();
      const listSource = results[1].toString();
      const preparedJSON = prepareJSON(packed.nodeTypes, libName, userName);
      preparedJSON.forEach(patch => {
        if (!fs.existsSync(path.join(outputPath, 'nodes'))) {
          fs.mkdir(path.join(outputPath, 'nodes'));
        }
        fs.writeFile(path.join(outputPath, patch.link), renderToString(singleSource, patch),
          singleError => {
            if (singleError) console.error(singleError);
          });
      });
      fs.writeFile(path.join(outputPath, 'index.html'), renderToString(listSource, preparedJSON),
        indexError => {
          if (indexError) console.error(indexError);
        });
    })
  )
  .catch(err => {
    console.error('err', err);
    process.exit(1);
  });
};
