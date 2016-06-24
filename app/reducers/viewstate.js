import initialState from '../state';
import update from 'react-addons-update';
import ViewStateGenerator from '../utils/ViewStateGenerator';

const vsGenerator = new ViewStateGenerator();

export const viewState = (state, action) => {
  const newState = (state === undefined) ? update(state, {
    $set: vsGenerator.create(initialState),
  }) : state;
  // @TODO: Use const instead of string action name!
  switch (action.type) {
    case 'VIEWSTATE_UPDATE':
      return update(newState, {
        $set: vsGenerator.create(action.state),
      });
    default:
      return newState;
  }
};
