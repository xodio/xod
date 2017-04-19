import * as ab from 'xod-arduino-builder';
import * as messages from './messages';

function run(promise, { success, error }) {
  promise.then((response) => {
    if (response && response.data) {
      messages.notice(JSON.stringify(response.data, null, 2));
    }
    if (success) {
      messages.success(success);
    }
  }).catch(() => {
    messages.error(error);
    process.exit(1);
  });
}

export function setExecutable(path) {
  run(ab.setArduinoIdePathExecutable(path), {
    success: `Successfully set path to Arduino IDE executable to "${path}".`,
    error: `Could not set path to Arduino IDE executable to "${path}".`,
  });
}

export function setPackages(path) {
  run(ab.setArduinoIdePathPackages(path), {
    success: `Successfully set path to Arduino IDE packages to "${path}".`,
    error: `Could not set path to Arduino IDE packages to "${path}".`,
  });
}

export function listIndex() {
  run(ab.listPackageIndex(), {
    error: 'Could not list the raw official Arduino package index.',
  });
}

export function listPavs() {
  run(ab.listPAVs(), {
    error: 'Could not list the processed official Arduino package index.',
  });
}

export function listPorts() {
  run(ab.listPorts(), {
    error: 'Could not list the available ports.',
  });
}

export function listBoards(package$, architecture, version) {
  run(ab.listPAVBoards({ package: package$, architecture, version }), {
    error: `Could not list the boards supported by the "${package$}:${architecture}:${version}".`,
  });
}

export function installPav(package$, architecture, version) {
  run(ab.installPAV({ package: package$, architecture, version }), {
    success: `Successfully installed "${package$}:${architecture}:${version}".`,
    error: `Could not install "${package$}:${architecture}:${version}".`,
  });
}

export function compile(package$, architecture, board, file) {
  run(ab.verify({ package: package$, architecture, board }, file), {
    success: `Successfully compiled "${file}" for ${package$}:${architecture}:${board}".`,
    error: `Could not compile "${file}" for "${package$}:${architecture}:${board}".`,
  });
}

export function upload(package$, architecture, board, port, file) {
  run(ab.upload({ package: package$, architecture, board }, port, file), {
    success: `Successfully uploaded "${file}" for ${package$}:${architecture}:${board}" to "${port}".`,
    error: `Could not upload "${file}" for "${package$}:${architecture}:${board}" to "${port}".`,
  });
}
