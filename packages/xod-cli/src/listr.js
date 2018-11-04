/* eslint-disable no-console */
import Listr from 'listr';
import VerboseRenderer from 'listr-verbose-renderer';
import UpdateRenderer from 'listr-update-renderer';
import { mergeDeepRight } from 'ramda';

// here we mocks and unmocks the stdout with the stderr for the listr renderers

const stdOutWrite = process.stdout.write;
const consoleLog = console.log;

const updateRender = UpdateRenderer.prototype.render;
UpdateRenderer.prototype.render = function render() {
  process.stdout.write = (() =>
    function writeMock(buffer) {
      process.stderr.write(buffer);
    })();
  updateRender.apply(this);
};

const updateEnd = UpdateRenderer.prototype.end;
UpdateRenderer.prototype.end = function end(...args) {
  updateEnd.apply(this, args);
  process.stdout.write = stdOutWrite;
};

const verboseRender = VerboseRenderer.prototype.render;
VerboseRenderer.prototype.render = function render() {
  console.log = (() =>
    function writeMock(str) {
      console.error(str);
    })();
  verboseRender.apply(this);
};

const verboseEnd = VerboseRenderer.prototype.end;
VerboseRenderer.prototype.end = function end() {
  verboseEnd.apply(this);
  console.log = consoleLog;
};

export const getListr = (verbose = true, tasks = [], opts = {}) =>
  new Listr(
    tasks,
    mergeDeepRight(opts, {
      renderer: verbose ? UpdateRenderer : 'silent',
      nonTTYRenderer: verbose ? VerboseRenderer : 'silent',
    })
  );

export default { getListr };
