
import transform from './transformer';

export default function transpile({ project, runtime }) {
  const nodes = transform(project);
  const payload = [
    `var nodes = ${JSON.stringify(nodes)};`,
    'var project = new Project(nodes);',
    'function onInit() {',
    '  project.launch();',
    '}',
  ].join('\n');
  const save = 'save();';

  return [
    runtime,
    payload,
    save,
    '',
  ].join('\n');
}
