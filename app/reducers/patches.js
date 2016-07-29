import R from 'ramda';
import applyReducers from '../utils/applyReducers';
import { pins } from './pins';
import { links } from './links';
import { nodes } from './nodes';

export const patches = () => {
  const reducers = {
    links,
    pins,
    nodes,
  };

  return (state = {}, action) => R.pipe(
    R.values,
    R.reduce((p, cur) =>
      R.assoc(
        cur.id,
        applyReducers(reducers, cur, action, 'PATCHES'),
        p
      ),
      {}
    )
  )(state);
};
