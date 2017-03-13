import { POPUP_ID } from './constants';

export default {
  openPopups: {
    [POPUP_ID.CREATING_PATCH]: false,
    [POPUP_ID.RENAMING_PATCH]: false,
    [POPUP_ID.DELETING_PATCH]: false,

    [POPUP_ID.RENAMING_PROJECT]: false,
  },
  selectedPatchId: null,
};
