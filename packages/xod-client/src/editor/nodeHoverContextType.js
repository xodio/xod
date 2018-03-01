import PropTypes from 'prop-types';

export default PropTypes.shape({
  nodeId: PropTypes.string,
  onMouseOver: PropTypes.func,
  onMouseLeave: PropTypes.func,
});
