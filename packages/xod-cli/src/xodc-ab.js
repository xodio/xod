import { pipeP } from 'ramda';
import * as ab from 'xod-arduino-builder';
import * as messages from './messages';

function run(promiseFn, { success, error }) {
  const promise = promiseFn();

  promise.then((value) => {
    if (value) {
      messages.notice(JSON.stringify(value, null, 2));
    }
    if (success) {
      messages.success(success);
    }
  }).catch((err) => {
    messages.notice(err.message);
    messages.error(error);
    process.exit(1);
  });
}

const getArduinoIDE = pipeP(
  ab.loadConfig,
  ab.getArduinoIdePathExecutable
);

export function setExecutable(path) {
  run(
    pipeP(
      ab.loadConfig,
      ab.setArduinoIdePathExecutable(path),
      ab.saveConfig
    ),
    {
      success: `Successfully set path to Arduino IDE executable to "${path}".`,
      error: `Could not set path to Arduino IDE executable to "${path}".`,
    }
  );
}

export function setPackages(path) {
  run(
    pipeP(
      ab.loadConfig,
      ab.setArduinoIdePathPackages(path),
      ab.saveConfig
    ),
    {
      success: `Successfully set path to Arduino IDE packages to "${path}".`,
      error: `Could not set path to Arduino IDE packages to "${path}".`,
    }
  );
}

export function listIndex() {
  run(
    ab.loadPackageIndex,
    {
      error: 'Could not list the raw official Arduino package index.',
    }
  );
}

export function listPavs() {
  run(
    pipeP(
      ab.loadPackageIndex,
      ab.listPAVs
    ),
    {
      error: 'Could not list the processed official Arduino package index.',
    }
  );
}

export function listPorts() {
  run(
    ab.listPorts,
    {
      error: 'Could not list the available ports.',
    }
  );
}

export function listBoards(package$, architecture, version) {
  run(
    pipeP(
      ab.loadConfig,
      ab.getArduinoIdePathPackages,
      ab.loadPAVBoards({ package: package$, architecture, version })
    ),
    {
      error: `Could not list the boards supported by the "${package$}:${architecture}:${version}".`,
    }
  );
}

export function installPav(package$, architecture, version) {
  run(
    pipeP(
      getArduinoIDE,
      ab.installPAV({ package: package$, architecture, version })
    ),
    {
      success: `Successfully installed "${package$}:${architecture}:${version}".`,
      error: `Could not install "${package$}:${architecture}:${version}".`,
    }
  );
}

export function compile(package$, architecture, board, file) {
  run(
    pipeP(
      getArduinoIDE,
      ab.verify({ package: package$, architecture, board }, file)
    ),
    {
      success: `Successfully compiled "${file}" for ${package$}:${architecture}:${board}".`,
      error: `Could not compile "${file}" for "${package$}:${architecture}:${board}".`,
    }
  );
}

export function upload(package$, architecture, board, port, file) {
  run(
    pipeP(
      getArduinoIDE,
      ab.upload({ package: package$, architecture, board }, port, file)
    ),
    {
      success: `Successfully uploaded "${file}" for ${package$}:${architecture}:${board}" to "${port}".`,
      error: `Could not upload "${file}" for "${package$}:${architecture}:${board}" to "${port}".`,
    }
  );
}
