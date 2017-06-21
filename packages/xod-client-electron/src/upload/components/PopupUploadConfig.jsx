import R from 'ramda';
import React from 'react';
import { PopupForm } from 'xod-client';

import { ENUMERATING_PORTS, ENUMERATING_BOARDS, NO_PORTS_FOUND } from '../../shared/messages';

class PopupUploadConfig extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisible: props.isVisible,
      selectedBoard: null,
      boards: null,
      ports: null,
    };

    this.onClose = this.onClose.bind(this);
    this.onBoardChanged = this.onBoardChanged.bind(this);
    this.onPortChanged = this.onPortChanged.bind(this);
    this.onRefreshPortsClicked = this.onRefreshPortsClicked.bind(this);
    this.onUploadClicked = this.onUploadClicked.bind(this);

    this.changeBoard = this.changeBoard.bind(this);
    this.changePort = this.changePort.bind(this);
  }

  componentDidMount() {
    this.getSelectedBoard()
      .then(selectedBoard => this.getBoards(selectedBoard));
    this.getPorts();
  }

  onClose() {
    this.props.onClose();
  }

  onBoardChanged(event) {
    this.changeBoard(event.target.value);
  }

  onPortChanged(event) {
    const selectedPort = R.find(R.propEq('comName', event.target.value), this.state.ports);
    this.changePort(selectedPort);
  }

  onRefreshPortsClicked() {
    this.getPorts();
  }

  onUploadClicked() {
    this.props.onUpload(this.state.selectedBoard, this.props.selectedPort);
  }

  getBoards(selectedBoard = this.state.selectedBoard) {
    const boardSelected = (selectedBoard !== null);

    this.props.listBoards()
      .then(R.tap(boards => this.setState({ boards })))
      .then((boards) => {
        const doesSelectedBoardExist = (
          boardSelected && R.contains(selectedBoard, boards)
        );
        const defaultBoardIndex = R.compose(
          R.defaultTo(0),
          R.findIndex(R.propEq('board', 'Arduino/Genuino Uno'))
        )(boards);

        if (!boardSelected || !doesSelectedBoardExist) {
          this.changeBoard(defaultBoardIndex);
        }
      });
  }

  getPorts() {
    this.props.listPorts()
      .then(R.tap(ports => this.setState({ ports })))
      .then((ports) => {
        const hasSelectedPort = R.contains(this.props.selectedPort, ports);
        if (!hasSelectedPort) {
          const portToSelect = (ports && ports.length > 0) ? ports[0] : null;
          this.changePort(portToSelect);
        }
      });
  }

  getSelectedBoardIndex() {
    return R.compose(
      R.when(
        R.equals(-1),
        R.always(0)
      ),
      R.findIndex(R.equals(this.state.selectedBoard)),
      R.defaultTo([])
    )(this.state.boards);
  }

  getSelectedPortName() {
    return R.compose(
      R.propOr('', 'comName')
    )(this.props.selectedPort);
  }

  getSelectedBoard() {
    return this.props.getSelectedBoard()
      .then(R.tap(board => this.setState({ selectedBoard: board })));
  }

  changeBoard(boardIndex) {
    if (this.state.boards) {
      const board = this.state.boards[boardIndex] || this.state.boards[0];
      this.props.onBoardChanged(board);
      this.setState({ selectedBoard: board });
    }
  }

  changePort(port) {
    this.props.onPortChanged(port);
  }

  canUnpload() {
    return (this.state.selectedBoard && this.props.selectedPort);
  }

  renderBoardSelect() {
    const select = (this.state.boards === null) ? (
      <select
        id="targetBoard"
        className="inspectorSelectInput inspectorInput--full-width"
        disabled
      >
        <option>{ENUMERATING_BOARDS}</option>
      </select>
    ) : (
      <select
        id="targetBoard"
        className="inspectorSelectInput inspectorInput--full-width"
        onChange={this.onBoardChanged}
        value={this.getSelectedBoardIndex()}
      >
        {this.state.boards.map((board, ix) => (
          <option key={`${board.board}_${ix}`} value={ix}>
            {board.board}
          </option>
        ))}
      </select>
    );

    return (
      <div>
        <label htmlFor="targetBoard">Board model:</label>
        <div>
          {select}
        </div>
      </div>
    );
  }

  renderPortSelect() {
    const isSelecting = (this.state.ports === null);
    const hasPorts = (this.state.ports !== null && this.state.ports.length > 0);

    const select = (hasPorts) ? (
      <select
        id="targetPort"
        className="inspectorSelectInput inspectorInput--full-width"
        onChange={this.onPortChanged}
        value={this.getSelectedPortName()}
      >
        {this.state.ports.map(port => (
          <option key={port.comName} value={port.comName}>
            {port.comName} {port.manufacturer ? `(${port.manufacturer})` : ''}
          </option>
        ))}
      </select>
    ) : (
      <select
        id="targetPort"
        className="inspectorSelectInput"
        disabled
      >
        <option>
          {(this.state.ports === null) ? ENUMERATING_PORTS : NO_PORTS_FOUND}
        </option>
      </select>
    );

    return (
      <div>
        <label htmlFor="targetPort">Serial port:</label>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          {select}
          <button
            className="Button Button--small"
            style={{ marginLeft: '1em' }}
            onClick={this.onRefreshPortsClicked}
            disabled={isSelecting}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  render() {
    const boards = this.renderBoardSelect();
    const ports = this.renderPortSelect();

    return (
      <PopupForm
        isVisible={this.props.isVisible}
        title="Upload project to Arduino"
        onClose={this.onClose}
      >
        <div className="ModalContent">
          {boards}
        </div>
        <div className="ModalContent">
          {ports}
        </div>
        <div className="ModalFooter">
          <button onClick={this.onUploadClicked} className="Button" disabled={!this.canUnpload()}>
            Upload
          </button>
        </div>
      </PopupForm>
    );
  }
}

PopupUploadConfig.propTypes = {
  isVisible: React.PropTypes.bool,
  selectedPort: React.PropTypes.object,
  getSelectedBoard: React.PropTypes.func,
  listBoards: React.PropTypes.func,
  listPorts: React.PropTypes.func,
  onBoardChanged: React.PropTypes.func,
  onPortChanged: React.PropTypes.func,
  onUpload: React.PropTypes.func,
  onClose: React.PropTypes.func,
};

PopupUploadConfig.defaultProps = {
  isVisible: false,
};

export default PopupUploadConfig;
