
export * from './editor/actions';
export * from './project/actions';
export * from './messages/actions';
export * from './processes/actions';

export * from './editor/selectors';
export * from './utils/selectors';
export { getUpload } from './processes/selectors';

export * from './utils/browser';

export { default as PopupShowCode } from './utils/components/PopupShowCode';
export { default as Toolbar } from './utils/components/Toolbar';

export { default as Root } from './core/containers/Root';
export { container as Editor, CreateNodeWidget } from './editor';
export { SnackBar } from './messages';
export { UserPanel } from './user';
export { default as PopupUploadProject } from './processes/components/PopupUploadProject';
export { default as DevTools } from './core/containers/DevTools';

import * as EditorSelectors from './editor/selectors';
import * as UtilsSelectors from './utils/selectors';
import * as ProcessSelectors from './processes/selectors';

import * as EditorActions from './editor/actions';
import * as ProjectActions from './project/actions';
import * as MessageActions from './messages/actions';
import * as ProcessActions from './processes/actions';

import * as EditorConstants from './editor/constants';
import * as UtilsConstants from './utils/constants';
import * as BrowserUtils from './utils/browser';

import Root from './core/containers/Root';
import { container as Editor, CreateNodeWidget } from './editor';
import { SnackBar } from './messages';
import { UserPanel } from './user';
import Toolbar from './utils/components/Toolbar';
import PopupShowCode from './utils/components/PopupShowCode';
import PopupUploadProject from './processes/components/PopupUploadProject';
import DevTools from './core/containers/DevTools';

export default Object.assign({
  Root,
  Editor,
  CreateNodeWidget,
  SnackBar,
  UserPanel,
  PopupUploadProject,
  DevTools,
  Toolbar,
  PopupShowCode,
},
  UtilsSelectors,
  EditorSelectors,
  ProcessSelectors,

  EditorActions,
  ProjectActions,
  MessageActions,
  ProcessActions,

  EditorConstants,
  UtilsConstants,
  BrowserUtils
);
