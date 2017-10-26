import { UPDATE_COMPILE_LIMIT } from './actionTypes';

const userReducer = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_COMPILE_LIMIT: {
      const limit = action.payload;
      return { ...state, limit };
    }
    default:
      return state;
  }
};

export default userReducer;
