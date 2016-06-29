import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import EventListener from 'react-event-listener';
import SVGLayer from '../components/SVGlayer';
import Node from '../components/Node';
import Link from '../components/Link';
import * as Actions from '../actions';
import Selectors from '../selectors';

const KEYCODE_DELETE = 46;
const KEYCODE_BACKSPACE = 8;
const KEYCODE_ESCAPE = 27;

const LAYERNAME_BACKGROUND = 'background';
const LAYERNAME_LINKS = 'links';
const LAYERNAME_NODES = 'nodes';

const CLICK_SAFEZONE = 3; // How far user should drag a node to prevent selecting by click

const backgroundStyle = {
  fill: '#eee',
};
const preventSelectStyle = {
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  UserSelect: 'none',
};

const findParentByClassName = (element, className) => {
  let result = null;
  if (element.classList.contains(className)) {
    result = element;
  } else if (element.parentNode) {
    result = findParentByClassName(element.parentNode, className);
  }
  return result;
};

class Patch extends React.Component {
  constructor(props) {
    super(props);

    this.dragging = {};
    this.state = {
      clickNodeId: null,
      dragNodeId: null,
    };

    this.createLayers();

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    this.deselectAll = this.deselectAll.bind(this);
  }

  onNodeMouseUp(id) {
    this.props.dispatch(Actions.clickNode(id));
  }
  onNodeMouseDown(event, id) {
    const node = Selectors.ViewState.getNodeState()(this.props.project, { id });

    this.dragging = {
      mousePosition: {
        x: event.clientX,
        y: event.clientY,
      },
      elementPosition: node.position,
    };

    this.setState(
      R.merge(
        this.state,
        {
          clickNodeId: id,
          dragNodeId: id,
        }
      )
    );
  }
  onPinMouseUp(id) {
    this.props.dispatch(Actions.clickPin(id));
  }
  onLinkClick(id) {
    this.props.dispatch(Actions.clickLink(id));
  }

  onMouseMove(event) {
    if (this.state.dragNodeId !== null) {
      const dragId = this.state.dragNodeId;
      const draggedNode = Selectors.ViewState.getNodeState()(this.props.project, { id: dragId });
      const mousePosition = {
        x: event.clientX,
        y: event.clientY,
      };

      const deltaPosition = {
        x: mousePosition.x - this.dragging.mousePosition.x,
        y: mousePosition.y - this.dragging.mousePosition.y,
      };

      this.dragging = R.set(
        R.lensProp('mousePosition'),
        mousePosition,
        this.dragging
      );

      const newPosition = draggedNode.bbox.translate(deltaPosition).getPosition();
      this.props.dispatch(Actions.dragNode(dragId, newPosition));

      if (
        R.all(
          R.flip(
            R.gte(CLICK_SAFEZONE)
          ),
          newPosition
        )
      ) {
        this.setClickNodeId(null);
      }
    }
  }
  onMouseUp() {
    if (this.state.dragNodeId !== null) {
      const dragId = this.state.dragNodeId;
      const draggedNode = Selectors.ViewState.getNodeState()(this.props.project, { id: dragId });

      this.setDragNodeId(null);
      this.props.dispatch(Actions.moveNode(dragId, draggedNode.bbox.getPosition()));
    }

    this.dragging = {};
  }

  onKeyDown(event) {
    const keycode = event.keyCode || event.which;
    const selection = Selectors.Editor.getSelection(this.props.editor);
    if (selection.length > 0) {
      if (keycode === KEYCODE_BACKSPACE || keycode === KEYCODE_DELETE) {
        selection.forEach((select) => {
          // Deleting nodes is disabled
          // Until they are not able to delete children pins and connected links
          if (select.entity !== 'Node') {
            const delAction = `delete${select.entity}`;
            this.props.dispatch(Actions[delAction](select.id));
          }
        });
      }
      if (keycode === KEYCODE_ESCAPE) {
        this.deselectAll();
      }
    }
  }

  setDragNodeId(id) {
    this.setState(
      R.set(
          R.lensProp('dragNodeId'),
          id,
          this.state
        )
    );
  }
  setClickNodeId(id) {
    const st = R.set(
      R.lensProp('clickNodeId'),
      id,
      this.state
    );
    this.setState(st);
  }

  deselectAll() {
    this.props.dispatch(Actions.deselectAll());
  }

  createLayers() {
    this.layers = {
      background: {
        name: LAYERNAME_BACKGROUND,
        factory: () => this.createBackground(),
      },
      links: {
        name: LAYERNAME_LINKS,
        factory: () => this.createLinks(
          this.props.project.links
        ),
      },
      nodes: {
        name: LAYERNAME_NODES,
        factory: () => this.createNodes(
          this.props.project.nodes
        ),
      },
    };
  }
  createNodes(nodes) {
    const nodeFactory = React.createFactory(Node);
    let comparator = R.comparator();

    if (this.state.dragNodeId) {
      comparator = (a) => ((a.id === this.state.dragNodeId) ? 1 : 0);
    }

    return R.pipe(
      R.values,
      R.sort(comparator),
      R.reduce((p, node) => {
        const n = p;
        const selectedPin = this.props.editor.selectedPin;
        const viewstate = Selectors.ViewState.getNodeState()(
          this.props.project,
          {
            id: node.id,
          }
        );

        viewstate.key = node.id;
        viewstate.onMouseUp = this.onNodeMouseUp.bind(this);
        viewstate.onMouseDown = this.onNodeMouseDown.bind(this);
        viewstate.onPinMouseUp = this.onPinMouseUp.bind(this);
        viewstate.draggable = this.isEditMode();
        viewstate.isDragged = (this.state.dragNodeId === node.id);
        viewstate.isClicked = (this.state.clickNodeId === node.id);

        viewstate.selected = Selectors.Editor.checkSelection(this.props.editor, 'Node', node.id);

        if (selectedPin && viewstate.pins && viewstate.pins[selectedPin]) {
          viewstate.pins[selectedPin].selected = true;
        }

        n.push(
          nodeFactory(viewstate)
        );

        return n;
      }, [])
    )(nodes);
  }

  createLinks(links) {
    const linkFactory = React.createFactory(Link);

    return R.pipe(
      R.values,
      R.reduce((p, link) => {
        const n = p;
        const viewstate = Selectors.ViewState.getLinkState()(
          this.props.project,
          {
            id: link.id,
            pins: [link.fromPinId, link.toPinId],
          }
        );
        viewstate.key = link.id;
        viewstate.onClick = this.onLinkClick.bind(this);
        viewstate.selected = Selectors.Editor.checkSelection(this.props.editor, 'Link', link.id);

        n.push(linkFactory(viewstate));

        return n;
      }, [])
    )(links);
  }

  createBackground() {
    const bgChildren = [];

    bgChildren.push(
      <rect
        key="bg" x="0" y="0"
        width={this.props.size.width} height={this.props.size.height}
        style={backgroundStyle}
        onClick={this.deselectAll}
      />
    );

    return bgChildren;
  }

  isEditMode() {
    return (this.props.editor.mode === 'edit');
  }

  isViewMode() {
    return (this.props.editor.mode === 'view');
  }

  render() {
    this.createLayers();

    const patchName = this.props.project.patches[this.props.editor.currentPatchId].name;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${this.props.size.width} ${this.props.size.height}`}
        width={this.props.size.width}
        height={this.props.size.height}
        style={preventSelectStyle}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
      >
        <EventListener target={document} onKeyDown={this.onKeyDown} />
        {R.values(this.layers).map(layer =>
          <SVGLayer key={layer.name} name={layer.name}>
            {layer.factory()}
          </SVGLayer>
        )}
        <text x="5" y="20">{`Patch: ${patchName}`}</text>
      </svg>
    );
  }
}

Patch.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  size: React.PropTypes.any.isRequired,
  project: React.PropTypes.any.isRequired,
  editor: React.PropTypes.any.isRequired,
};

export default connect(state => state)(Patch);
