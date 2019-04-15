import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { PopupForm } from 'xod-client';

import { ENUMERATING_BOARDS } from '../../shared/messages';
import { updateIndexFiles } from '../arduinoCli';

import PortSelect from './PortSelect';

class PopupUploadConfig extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedBoard: null, // or { index: Number, options: Map OptionId OptionValue }
      boards: null,
      doCompileInCloud: false,
      debugAfterUpload: props.initialDebugAfterUpload,
    };

    this.onClose = this.onClose.bind(this);
    this.onBoardChanged = this.onBoardChanged.bind(this);
    this.onUploadClicked = this.onUploadClicked.bind(this);
    this.onCloudCompilationChanged = this.onCloudCompilationChanged.bind(this);
    this.onDebugCheckboxChanged = this.onDebugCheckboxChanged.bind(this);

    this.changeBoard = this.changeBoard.bind(this);
    this.changeBoardOption = this.changeBoardOption.bind(this);

    this.updateIndexes = this.updateIndexes.bind(this);
  }

  componentDidMount() {
    this.getSelectedBoard().then(selectedBoard =>
      this.getBoards(selectedBoard)
    );
    this.props.updateCompileLimit();
  }

  onClose() {
    this.props.onClose();
  }

  onBoardChanged(event) {
    this.changeBoard(parseInt(event.target.value, 10) || 0);
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
            installed: R.map(R.over(R.lensProp('name'), R.concat(R.__, ' 📦'))),
          })
        )
      )
      .then(R.sortBy(R.pipe(R.prop('name'), R.toLower)))
      .then(R.tap(boards => this.setState({ boards })))
      .then(boards => {
        const doesSelectedBoardExist =
          isBoardSelected && boards[selectedBoard.index];

        const defaultBoardIndex = R.compose(
          R.when(R.equals(-1), R.always(0)),
          R.findIndex(
            R.either(
              // If arduino:avr is not installed yet:
              R.propEq('name', 'Arduino/Genuino Uno'),
              // If it already installed:
              R.propEq('fqbn', 'arduino:avr:uno')
            )
          )
        )(boards);

        if (!isBoardSelected || !doesSelectedBoardExist) {
          this.changeBoard(defaultBoardIndex);
        }
      })
      .catch(this.props.onError);
  }

  getSelectedBoardIndex() {
    return R.pathOr(0, ['selectedBoard', 'index'], this.state);
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
      .catch(err => {
        this.props.onError(err);
        this.setState({ boards: oldBoards });
      });
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

  render() {
    const boards = this.renderBoardSelect();
    const boardOptions = this.renderBoardOptions();

    return (
      <PopupForm
        isVisible
        title="Upload project to Arduino"
        onClose={this.onClose}
      >
        <div className="ModalContent">
          {boards}
          {boardOptions}
        </div>
        <div className="ModalContent">
          <PortSelect
            selectedPort={this.props.selectedPort}
            listPorts={this.props.listPorts}
            onPortChanged={this.props.onPortChanged}
          />
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
  isDeploymentInProgress: PropTypes.bool,
  initialDebugAfterUpload: PropTypes.bool,
  selectedPort: PropTypes.object,
  updateCompileLimit: PropTypes.func,
  getSelectedBoard: PropTypes.func,
  listBoards: PropTypes.func,
  listPorts: PropTypes.func,
  onBoardChanged: PropTypes.func,
  onPortChanged: PropTypes.func,
  onUpload: PropTypes.func,
  onClose: PropTypes.func,
  onError: PropTypes.func,
};

PopupUploadConfig.defaultProps = {
  isVisible: false,
  isDeploymentInProgress: false,
  initialDebugAfterUpload: false,
};

export default PopupUploadConfig;
