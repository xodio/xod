import $ from 'sanctuary-def';

// only returning if the validation fails is an accepted pattern
// eslint-disable-next-line consistent-return
export default Type => (props, propName, componentName) => {
  const env = []; // TODO

  if (!$.test(env, Type, props[propName])) {
    return new Error(`Invalid prop '${propName}' supplied to '${componentName}'`);
  }
};
