import PropTypes from 'prop-types';

export default PropTypes.exact({
  hsl: PropTypes.arrayOf(PropTypes.number),
  hex: PropTypes.string,
});
