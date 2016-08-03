
import runtime from 'raw!./runtime';
import transform from './transformer';

export default function transpile(project) {
  const transformedProject = transform(project);
  const payload = `var project = ${JSON.stringify(transformedProject)};`;
  const save = 'save();';

  return [
    payload,
    runtime,
    save,
  ].join('\n');
}
