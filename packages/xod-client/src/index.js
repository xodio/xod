import * as UserSelectors from './user/selectors';
import * as EditorSelectors from './editor/selectors';
import * as ProcessSelectors from './processes/selectors';
import * as ProjectSelectors from './project/selectors';
import * as PopupSelectors from './popups/selectors';
import * as DebuggerSelectors from './debugger/selectors';
import * as MessageSelectors from './messages/selectors';
import { hasUnsavedChanges, getLastSavedProject } from './core/selectors';

import * as CoreActions from './core/actions';
import * as EditorActions from './editor/actions';
import * as ProjectActions from './project/actions';
import * as MessageActions from './messages/actions';
import * as ProcessActions from './processes/actions';
import * as ProjectBrowserActions from './projectBrowser/actions';
import * as PopupActions from './popups/actions';
import * as DebuggerActions from './debugger/actions';

import {
  INSTALL_ARDUINO_DEPENDENCIES,
  CHECK_ARDUINO_DEPENDENCIES,
} from './debugger/actionTypes';

import { LOG_TAB_TYPE } from './debugger/constants';

import { MESSAGE_BUTTON_CLICKED } from './messages/actionTypes';
import { TAB_CLOSE, INSTALL_LIBRARIES_COMPLETE } from './editor/actionTypes';
import { SAVE_ALL } from './project/actionTypes';

import * as EditorConstants from './editor/constants';
import * as UtilsConstants from './utils/constants';
import * as PopupConstants from './popups/constants';

import popupsReducer, { showOnlyPopup, hideOnePopup } from './popups/reducer';

import * as siteLinkUtils from './utils/urls';
import * as BrowserUtils from './utils/browser';
import * as MenuUtils from './utils/menu';
import sanctuaryPropType from './utils/sanctuaryPropType';
import * as urlActions from './core/urlActions';
import * as coreMessages from './core/messages';

import App from './core/containers/App';
import Root from './core/containers/Root';
import { container as Editor, CreateNodeWidget } from './editor';
import SnackBar from './messages';
import composeMessage from './messages/composeMessage';
import * as MessageConstants from './messages/constants';
import Toolbar from './utils/components/Toolbar';
import PopupShowCode from './utils/components/PopupShowCode';
import PopupAlert from './utils/components/PopupAlert';
import PopupConfirm from './utils/components/PopupConfirm';
import PopupPrompt from './utils/components/PopupPrompt';
import PopupForm from './utils/components/PopupForm';

import PopupProjectPreferences from './project/components/PopupProjectPreferences';

import {
  createLogMessage,
  createSystemMessage,
  isXodMessage,
  createXodMessage,
  createErrorMessage,
  parseDebuggerMessage,
} from './debugger/debugProtocol';

import initialState from './core/state';

export * from './editor/actions';
export * from './project/actions';
export * from './messages/actions';
export * from './processes/actions';
export * from './projectBrowser/actions';
export * from './popups/actions';
export * from './debugger/actions';
export {
  INSTALL_ARDUINO_DEPENDENCIES,
  CHECK_ARDUINO_DEPENDENCIES,
} from './debugger/actionTypes';

export { LOG_TAB_TYPE } from './debugger/constants';

export { MESSAGE_BUTTON_CLICKED } from './messages/actionTypes';
export { TAB_CLOSE, INSTALL_LIBRARIES_COMPLETE } from './editor/actionTypes';
export { SAVE_ALL } from './project/actionTypes';

export * from './editor/selectors';
export { getUpload } from './processes/selectors';
export * from './project/selectors';
export * from './popups/selectors';
export * from './debugger/selectors';
export { hasUnsavedChanges, getLastSavedProject } from './core/selectors';

export * from './utils/browser';
export * from './utils/constants';
export * from './utils/urls';
export * from './popups/constants';
export { lowercaseKebabMask } from './utils/inputFormatting';
export { default as sanctuaryPropType } from './utils/sanctuaryPropType';
export * from './core/urlActions';
export const Messages = coreMessages;

export { default as PopupShowCode } from './utils/components/PopupShowCode';
export { default as PopupAlert } from './utils/components/PopupAlert';
export { default as PopupConfirm } from './utils/components/PopupConfirm';
export { default as PopupPrompt } from './utils/components/PopupPrompt';
export { default as PopupForm } from './utils/components/PopupForm';
export { default as Toolbar } from './utils/components/Toolbar';
export {
  default as PopupProjectPreferences,
} from './project/components/PopupProjectPreferences';

export { default as App } from './core/containers/App';
export { default as Root } from './core/containers/Root';
export { container as Editor, CreateNodeWidget } from './editor';
export { default as SnackBar } from './messages';
export { default as composeMessage } from './messages/composeMessage';
export * from './messages/constants';
export * from './messages/selectors';

export { default as initialState } from './core/state';

export {
  createLogMessage,
  isXodMessage,
  createXodMessage,
  createErrorMessage,
  parseDebuggerMessage,
} from './debugger/debugProtocol';

export {
  default as popupsReducer,
  showOnlyPopup,
  hideOnePopup,
} from './popups/reducer';

export default Object.assign(
  {
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
    Toolbar,
    menu: MenuUtils,
    sanctuaryPropType,
    initialState,
    popupsReducer,
    showOnlyPopup,
    hideOnePopup,
    PopupProjectPreferences,
    hasUnsavedChanges,
    getLastSavedProject,
    composeMessage,
    createLogMessage,
    createSystemMessage,
    isXodMessage,
    createXodMessage,
    createErrorMessage,
    parseDebuggerMessage,
    TAB_CLOSE,
    SAVE_ALL,
    INSTALL_LIBRARIES_COMPLETE,
    MESSAGE_BUTTON_CLICKED,
    Messages: coreMessages,
    INSTALL_ARDUINO_DEPENDENCIES,
    CHECK_ARDUINO_DEPENDENCIES,
    LOG_TAB_TYPE,
  },
  UserSelectors,
  EditorSelectors,
  ProcessSelectors,
  ProjectSelectors,
  PopupSelectors,
  DebuggerSelectors,
  MessageSelectors,

  CoreActions,
  EditorActions,
  ProjectActions,
  MessageActions,
  ProcessActions,
  ProjectBrowserActions,
  PopupActions,
  DebuggerActions,

  EditorConstants,
  MessageConstants,
  UtilsConstants,
  BrowserUtils,
  PopupConstants,

  siteLinkUtils,
  urlActions
);
