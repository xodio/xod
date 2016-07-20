
import runtime from 'raw!./runtime.js';

export default function transpile(project) {
  const payload = `var project = ${project};`;
  const save = 'save();';

  return [
    payload,
    runtime,
    save,
  ].join('\n');
}
