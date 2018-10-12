import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { PopupForm } from 'xod-client';

import { NO_PORTS_FOUND as NO_PORTS_FOUND_ERRCODE } from '../../shared/errorCodes';
import {
  ENUMERATING_PORTS,
  ENUMERATING_BOARDS,
  NO_PORTS_FOUND,
} from '../../shared/messages';
import { updateIndexFiles } from '../arduinoCli';

class PopupUploadConfig extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isVisible: props.isVisible,
      selectedBoard: null, // or { index: Number, options: Map OptionId OptionValue }
      boards: null,
      ports: null,
      doCompileInCloud: false,
      debugAfterUpload: props.initialDebugAfterUpload,
    };

    this.onClose = this.onClose.bind(this);
    this.onBoardChanged = this.onBoardChanged.bind(this);
    this.onPortChanged = this.onPortChanged.bind(this);
    this.onRefreshPortsClicked = this.onRefreshPortsClicked.bind(this);
    this.onUploadClicked = this.onUploadClicked.bind(this);
    this.onCloudCompilationChanged = this.onCloudCompilationChanged.bind(this);
    this.onDebugCheckboxChanged = this.onDebugCheckboxChanged.bind(this);

    this.changeBoard = this.changeBoard.bind(this);
    this.changeBoardOption = this.changeBoardOption.bind(this);
    this.changePort = this.changePort.bind(this);

    this.updateIndexes = this.updateIndexes.bind(this);
  }

  componentDidMount() {
    this.getSelectedBoard().then(selectedBoard =>
      this.getBoards(selectedBoard)
    );
    this.getPorts();
    this.props.updateCompileLimit();
  }

  onClose() {
    this.props.onClose();
  }

  onBoardChanged(event) {
    this.changeBoard(event.target.value);
  }

  onPortChanged(event) {
    const selectedPort = R.find(
      R.propEq('comName', event.target.value),
      this.state.ports
    );
    this.changePort(selectedPort);
  }

  onRefreshPortsClicked() {
    this.getPorts();
  }

  onUploadClicked() {
    const selectedBoard = this.state.selectedBoard;
    const originalBoardData = this.state.boards[selectedBoard.index];
    const boardToUpload = R.assoc(
      'selectedOptions',
      selectedBoard.options,
      originalBoardData
    );

    this.props.onUpload(
      boardToUpload,
      this.props.selectedPort,
      this.state.doCompileInCloud,
      this.state.debugAfterUpload
    );
  }

  onCloudCompilationChanged(event) {
    const val = event.target.checked;
    this.setState({ doCompileInCloud: val });
  }

  onDebugCheckboxChanged(event) {
    const val = event.target.checked;
    this.setState({ debugAfterUpload: val });
  }

  getBoards(selectedBoard = this.state.selectedBoard) {
    const isBoardSelected = selectedBoard !== null;

    this.props
      .listBoards()
      .then(
        R.compose(
          R.unnest,
          R.values,
          R.evolve({
            available: R.map(
              R.over(R.lensProp('name'), R.concat(R.__, ' (not installed)'))
            ),
          })
        )
      )
      .then(R.sortBy(R.pipe(R.prop('name'), R.toLower)))
      .then(R.tap(boards => this.setState({ boards })))
      .then(boards => {
        const doesSelectedBoardExist =
          isBoardSelected && boards[selectedBoard.index];

        const defaultBoardIndex = R.compose(
          R.defaultTo(0),
          R.findIndex(R.propEq('fqbn', 'arduino:avr:uno'))
        )(boards);

        if (!isBoardSelected || !doesSelectedBoardExist) {
          this.changeBoard(defaultBoardIndex);
        }
      });
  }

  getPorts() {
    this.setState({ ports: null });

    this.props
      .listPorts()
      .catch(
        err =>
          err.errorCode === NO_PORTS_FOUND_ERRCODE ? [] : Promise.reject(err)
      )
      .then(R.tap(ports => this.setState({ ports })))
      .then(ports => {
        const hasSelectedPort = R.contains(this.props.selectedPort, ports);
        const defaultPort = ports && ports.length > 0 ? ports[0] : null;
        const defaultPreferredPort = R.compose(
          R.defaultTo(defaultPort),
          R.find(
            R.compose(
              R.test(
                /^(\/dev\/ttyUSB|\/dev\/tty.usb|\/dev\/cu.usb|\/dev\/ttyACM)/i
              ),
              R.prop('comName')
            )
          )
        )(ports);

        if (!hasSelectedPort) {
          this.changePort(defaultPreferredPort);
        }
      });
  }

  getSelectedBoardIndex() {
    return R.pathOr(0, ['selectedBoard', 'index'], this.state);
  }

  getSelectedPortName() {
    return R.compose(R.propOr('', 'comName'))(this.props.selectedPort);
  }

  getSelectedBoard() {
    return this.props
      .getSelectedBoard()
      .then(R.tap(selBoard => this.setState({ selectedBoard: selBoard })));
  }

  updateIndexes() {
    const oldBoards = this.state.boards;
    this.setState({ boards: null });
    updateIndexFiles()
      .then(() => this.getBoards())
      .catch(() => this.setState({ boards: oldBoards }));
  }

  changeBoard(boardIndex) {
    const newBoard = R.assoc('index', boardIndex, this.state.selectedBoard);
    this.props.onBoardChanged(newBoard);
    this.setState({ selectedBoard: newBoard });
  }

  changeBoardOption(optionId, optionValue) {
    const newBoard = R.over(
      R.lensProp('options'),
      R.assoc(optionId, optionValue),
      this.state.selectedBoard
    );
    this.props.onBoardChanged(newBoard);
    this.setState({ selectedBoard: newBoard });
  }

  changePort(port) {
    this.props.onPortChanged(port);
  }

  canUnpload() {
    return (
      this.state.selectedBoard &&
      this.props.selectedPort &&
      !this.props.isDeploymentInProgress
    );
  }

  renderBoardSelect() {
    const select =
      this.state.boards === null ? (
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
            <option key={`${board.name}_${ix}`} value={ix}>
              {board.name}
            </option>
          ))}
        </select>
      );

    return (
      <div>
        <label htmlFor="targetBoard">Board model:</label>
        {/* <div>{select}</div> */}
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
            onClick={this.updateIndexes}
          >
            Update
          </button>
        </div>
      </div>
    );
  }

  renderBoardOptions() {
    const selectedBoard = this.state.selectedBoard;
    if (!selectedBoard || !this.state.boards) return null;

    const board = this.state.boards[selectedBoard.index];
    const options = R.propOr([], 'options', board);
    if (R.isEmpty(options)) return null;

    return (
      <div className="boardOptions">
        {R.map(
          opt => (
            <div key={opt.optionId}>
              <label htmlFor={`option_${opt.optionId}`}>
                {opt.optionName}:
              </label>
              <select
                id={`option_${opt.optionId}`}
                className="inspectorSelectInput inspectorInput--full-width"
                onChange={e =>
                  this.changeBoardOption(opt.optionId, e.target.value)
                }
                value={R.pathOr('', ['options', opt.optionId], selectedBoard)}
              >
                {R.map(
                  val => (
                    <option key={val.value} value={val.value}>
                      {val.name}
                    </option>
                  ),
                  opt.values
                )}
              </select>
            </div>
          ),
          options
        )}
      </div>
    );
  }

  renderPortSelect() {
    const isSelecting = this.state.ports === null;
    const hasPorts = this.state.ports !== null && this.state.ports.length > 0;

    const select = hasPorts ? (
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
      <select id="targetPort" className="inspectorSelectInput" disabled>
        <option>
          {this.state.ports === null ? ENUMERATING_PORTS : NO_PORTS_FOUND}
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
    const boardOptions = this.renderBoardOptions();
    const ports = this.renderPortSelect();
    const compileLimitLeft = this.props.compileLimitLeft;

    return (
      <PopupForm
        isVisible={this.props.isVisible}
        title="Upload project to Arduino"
        onClose={this.onClose}
      >
        <div className="ModalContent">
          {boards}
          {boardOptions}
        </div>
        <div className="ModalContent">{ports}</div>
        <div className="ModalContent">
          <input
            id="compileInCloud"
            type="checkbox"
            checked={this.state.doCompileInCloud}
            disabled={compileLimitLeft <= 0}
            onChange={this.onCloudCompilationChanged}
          />
          <label htmlFor="compileInCloud">
            Compile in the cloud&nbsp;
            {compileLimitLeft ? (
              <span>({compileLimitLeft} left)</span>
            ) : (
              <span>(currently offline)</span>
            )}
          </label>
        </div>
        <div className="ModalContent">
          <input
            id="debug"
            type="checkbox"
            checked={this.state.debugAfterUpload}
            onChange={this.onDebugCheckboxChanged}
          />
          <label htmlFor="debug">Debug after upload</label>
        </div>
        <div className="ModalFooter">
          <button
            onClick={this.onUploadClicked}
            className="Button"
            disabled={!this.canUnpload()}
          >
            Upload
          </button>
          {this.props.isDeploymentInProgress ? (
            <span className="busy-message">
              Another deployment job is in progress
            </span>
          ) : null}
        </div>
      </PopupForm>
    );
  }
}

PopupUploadConfig.propTypes = {
  isVisible: PropTypes.bool,
  isDeploymentInProgress: PropTypes.bool,
  initialDebugAfterUpload: PropTypes.bool,
  selectedPort: PropTypes.object,
  compileLimitLeft: PropTypes.number,
  updateCompileLimit: PropTypes.func,
  getSelectedBoard: PropTypes.func,
  listBoards: PropTypes.func,
  listPorts: PropTypes.func,
  onBoardChanged: PropTypes.func,
  onPortChanged: PropTypes.func,
  onUpload: PropTypes.func,
  onClose: PropTypes.func,
};

PopupUploadConfig.defaultProps = {
  isVisible: false,
  isDeploymentInProgress: false,
  initialDebugAfterUpload: false,
};

export default PopupUploadConfig;
