import { connect } from 'react-redux';
import Patch from '../components/Patch';

const PatchContainer = connect(
  (state) => ({
    patches: state.patches,
    nodes: state.nodes,
    pins: state.pins,
    links: state.links,
    viewState: state.viewState,
  })
)(Patch);

export default PatchContainer;
