import { sep, normalize } from 'path';
import { assert } from 'chai';

import { composeCommand } from '../src/uploader';

describe('Uploader', () => {
  it('should compose right commands', () => {
    // This is config that should be returned from endpoint (getUploadConfig)
    // But it doesn't contain information that needless for composing command
    const uno = {
      tool: {
        exe: {
          darwin: 'bin/avrdude',
          linux: 'bin/avrdude',
          win32: 'bin/avrdude.exe',
        },
        name: 'avrdude',
        version: '6.3.0-arduino9',
      },
      cmdTemplate:
        '"{TOOL_PATH}{TOOL_EXEC}" -p atmega328p -C "{TOOL_PATH}etc{/}avrdude.conf" -c arduino -b 115200 -P "{PORT}" -D -U flash:w:{ARTIFACT_PATH}:i',
    };

    const cfg = {
      toolPath: normalize('/a/b/c/tools'),
      port: '/dev/tty.usbmodem1421',
      artifactPath: normalize('/a/b/c/artifacts/firmware.hex'),
    };

    const toolExecPath = normalize(
      '/a/b/c/tools/avrdude/6.3.0-arduino9/bin/avrdude'
    );
    const toolPath = normalize(`${cfg.toolPath}/avrdude/6.3.0-arduino9/`);

    const cmd = composeCommand(uno, cfg);
    assert.equal(
      cmd,
      `"${toolExecPath}" -p atmega328p -C "${toolPath}etc${sep}avrdude.conf" -c arduino -b 115200 -P "${
        cfg.port
      }" -D -U flash:w:${cfg.artifactPath}:i`
    );
  });
});
