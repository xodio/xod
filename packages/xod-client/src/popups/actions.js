import {
  HIDE_ALL_POPUPS,
  SHOW_PROJECT_PREFERENCES,
  HIDE_PROJECT_PREFERENCES,
} from './actionTypes';

export const hideAllPopups = () => ({
  type: HIDE_ALL_POPUPS,
});

export const showProjectPreferences = () => ({
  type: SHOW_PROJECT_PREFERENCES,
});

export const hideProjectPreferences = () => ({
  type: HIDE_PROJECT_PREFERENCES,
});

export default {};
