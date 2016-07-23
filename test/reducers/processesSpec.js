import R from 'ramda';
import chai from 'chai';
import { processesReducer as reducer } from '../../app/reducers/processes';
import { getLastId } from '../../app/selectors/processes';
import * as STATUS from '../../app/constants/statuses';

describe('Processes reducer', () => {
  describe('while dispatch any process actionCreator', () => {
    const initialEmptytate = {};
    const initialStateWithProcess = {
      1: {
        type: 'TEST_PROCESS',
        status: STATUS.STARTED,
        id: 1,
      },
    };

    let emptyState;
    let stateWithProcess;

    beforeEach(
      () => {
        emptyState = R.clone(initialEmptytate);
        stateWithProcess = R.clone(initialStateWithProcess);
      }
    );

    it(`should insert a process with status ${STATUS.STARTED}`, () => {
      const newState = reducer(emptyState, {
        type: 'TEST_PROCESS',
        payload: {
          test: true,
        },
        meta: {
          status: STATUS.STARTED,
        },
      });

      const expectedState = {
        1: {
          type: 'TEST_PROCESS',
          status: STATUS.STARTED,
          id: 1,
          test: true,
        },
      };

      chai.expect(newState).to.deep.equal(expectedState);
    });

    it(`should update a process with status ${STATUS.PROGRESSED}`, () => {
      const id = getLastId(stateWithProcess);
      const newState = reducer(stateWithProcess, {
        type: 'TEST_PROCESS',
        payload: {
          id,
        },
        meta: {
          status: STATUS.PROGRESSED,
        },
      });

      const expectedState = {
        1: {
          type: 'TEST_PROCESS',
          status: STATUS.PROGRESSED,
          id,
        },
      };

      chai.expect(newState).to.deep.equal(expectedState);
    });

    it(`should update a process with status ${STATUS.SUCCEEDED}`, () => {
      const id = getLastId(stateWithProcess);
      const newState = reducer(stateWithProcess, {
        type: 'TEST_PROCESS',
        payload: {
          id,
        },
        meta: {
          status: STATUS.SUCCEEDED,
        },
      });

      const expectedState = {
        1: {
          type: 'TEST_PROCESS',
          status: STATUS.SUCCEEDED,
          id,
        },
      };

      chai.expect(newState).to.deep.equal(expectedState);
    });

    it(`should update a process with status ${STATUS.FAILED}`, () => {
      const id = getLastId(stateWithProcess);
      const newState = reducer(stateWithProcess, {
        type: 'TEST_PROCESS',
        payload: {
          id,
        },
        meta: {
          status: STATUS.FAILED,
        },
      });

      const expectedState = {
        1: {
          type: 'TEST_PROCESS',
          status: STATUS.FAILED,
          id,
        },
      };

      chai.expect(newState).to.deep.equal(expectedState);
    });


    it(`should delete a process after accepting status ${STATUS.DELETED}`, () => {
      const id = getLastId(stateWithProcess);
      const newState = reducer(stateWithProcess, {
        type: 'TEST_PROCESS',
        payload: {
          id,
        },
        meta: {
          status: STATUS.DELETED,
        },
      });

      const expectedState = {};

      chai.expect(newState).to.deep.equal(expectedState);
    });
  });
});
