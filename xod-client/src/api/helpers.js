import * as Selectors from 'xod-client/user/selectors';
import { STATUS } from 'xod-client/utils/constants';

const isSucceeded = (action) => (action.meta && action.meta.status === STATUS.SUCCEEDED);
const hasResponse = (action) => (action.payload && action.payload.response);
const completedResponse = (action) => isSucceeded(action) && hasResponse(action);
const currentUser = (action, state) => (
  hasResponse(action) &&
  action.payload.response.id === Selectors.userId(state)
);

const isError = (action) => (action.error === true);

export default {
  isSucceeded,
  hasResponse,
  completedResponse,
  currentUser,
  isError,
};
