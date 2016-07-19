
import runtime from 'raw!./runtime.js';

export default function transpile(project) {
  const payload = `var project = ${project};`;

  return [
    payload,
    runtime,
  ].join('\n');
}
