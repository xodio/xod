import * as R from 'ramda';
import {
  SELECT_SERIAL_PORT,
} from '../upload/actionTypes';

const initialState = {
  selectedSerialPort: null,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SELECT_SERIAL_PORT:
      return R.assoc('selectedSerialPort', action.payload.port, state);

    default:
      return state;
  }
};
