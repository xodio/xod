// only returning if the validation fails is an accepted pattern
// eslint-disable-next-line consistent-return
export default SanctuaryType => (props, propName, componentName) => {
  const validationResult = SanctuaryType.validate(props[propName]);

  if (validationResult.isLeft) {
    return new Error(`Invalid prop '${propName}' supplied to '${componentName}'`);
  }
};
