import * as EditorSelectors from './editor/selectors';
import * as UtilsSelectors from './utils/selectors';
import * as ProcessSelectors from './processes/selectors';
import * as ProjectSelectors from './project/selectors';

import * as CoreActions from './core/actions';
import * as EditorActions from './editor/actions';
import * as ProjectActions from './project/actions';
import * as MessageActions from './messages/actions';
import * as ProcessActions from './processes/actions';
import * as ProjectBrowserActions from './projectBrowser/actions';

import * as EditorConstants from './editor/constants';
import * as UtilsConstants from './utils/constants';
import * as BrowserUtils from './utils/browser';
import * as MenuUtils from './utils/menu';
import sanctuaryPropType from './utils/sanctuaryPropType';

import App from './core/containers/App';
import Root from './core/containers/Root';
import { container as Editor, CreateNodeWidget } from './editor';
import SnackBar from './messages';
import * as MessageConstants from './messages/constants';
import Toolbar from './utils/components/Toolbar';
import PopupShowCode from './utils/components/PopupShowCode';
import PopupAlert from './utils/components/PopupAlert';
import PopupConfirm from './utils/components/PopupConfirm';
import PopupPrompt from './utils/components/PopupPrompt';
import PopupForm from './utils/components/PopupForm';
import DevTools from './core/containers/DevTools';

export * from './editor/actions';
export * from './project/actions';
export * from './messages/actions';
export * from './processes/actions';
export * from './projectBrowser/actions';

export * from './editor/selectors';
export * from './utils/selectors';
export { getUpload } from './processes/selectors';
export * from './project/selectors';

export * from './utils/browser';
export * from './utils/constants';
export { lowercaseKebabMask } from './utils/inputFormatting';
export { default as sanctuaryPropType } from './utils/sanctuaryPropType';

export { default as PopupShowCode } from './utils/components/PopupShowCode';
export { default as PopupAlert } from './utils/components/PopupAlert';
export { default as PopupConfirm } from './utils/components/PopupConfirm';
export { default as PopupPrompt } from './utils/components/PopupPrompt';
export { default as PopupForm } from './utils/components/PopupForm';
export { default as Toolbar } from './utils/components/Toolbar';

export { default as App } from './core/containers/App';
export { default as Root } from './core/containers/Root';
export { container as Editor, CreateNodeWidget } from './editor';
export { default as SnackBar } from './messages';
export * from './messages/constants';
export { default as DevTools } from './core/containers/DevTools';

export default Object.assign({
  App,
  Root,
  Editor,
  CreateNodeWidget,
  PopupShowCode,
  PopupAlert,
  PopupConfirm,
  PopupPrompt,
  PopupForm,
  SnackBar,
  DevTools,
  Toolbar,
  menu: MenuUtils,
  sanctuaryPropType,
},
  UtilsSelectors,
  EditorSelectors,
  ProcessSelectors,
  ProjectSelectors,

  CoreActions,
  EditorActions,
  ProjectActions,
  MessageActions,
  ProcessActions,
  ProjectBrowserActions,

  EditorConstants,
  MessageConstants,
  UtilsConstants,
  BrowserUtils
);
