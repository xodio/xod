import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import ReactDataSheet from 'react-datasheet';
import { Icon } from 'react-fa';

import * as Actions from '../actions';
import * as DebuggerSelectors from '../../debugger/selectors';

import { addConfirmation } from '../../messages/actions';
import {
  LOG_COPIED,
  LOG_COPY_NOT_SUPPORTED,
  logCopyError,
  logSaveError,
} from '../../debugger/messages';

// :: [[String]] -> [[{ value, readOnly }]]
const tableLogToDataSheet = R.map(
  R.map(
    R.applySpec({
      value: R.identity,
      readOnly: R.T,
    })
  )
);

const gridToTsv = R.compose(R.join('\n'), R.map(R.join('\t')));

class TableLog extends React.Component {
  constructor(props) {
    super(props);

    this.getSheet = this.getSheet.bind(this);

    this.onPrevSheetClick = this.onPrevSheetClick.bind(this);
    this.onNextSheetClick = this.onNextSheetClick.bind(this);
    this.onCopyLogClicked = this.onCopyLogClicked.bind(this);
    this.onSaveLogClicked = this.onSaveLogClicked.bind(this);
    this.onChangeSource = this.onChangeSource.bind(this);
  }

  onPrevSheetClick() {
    const prevSheetIndex = R.max(0, this.props.sheetIndex - 1);
    this.props.actions.changeActiveSheet(
      this.props.tabId, // TODO: what's about debugger?
      this.props.nodeId,
      prevSheetIndex
    );
  }

  onNextSheetClick() {
    const nextSheetIndex = R.unless(R.equals(this.getSheetsAmount()), R.add(1))(
      this.props.sheetIndex
    );
    this.props.actions.changeActiveSheet(
      this.props.tabId,
      this.props.nodeId,
      nextSheetIndex
    );
  }

  onCopyLogClicked() {
    const copy = R.path(['navigator', 'clipboard', 'writeText'], window);
    if (!copy) {
      this.props.actions.addError(LOG_COPY_NOT_SUPPORTED);
      return;
    }

    const tsv = gridToTsv(this.getSheet());
    window.navigator.clipboard.writeText(tsv).then(
      () => {
        this.props.actions.addConfirmation(LOG_COPIED);
      },
      err => {
        this.props.actions.addError(logCopyError(err));
      }
    );
  }

  onSaveLogClicked() {
    const tsv = gridToTsv(this.getSheet());
    const defaultFilename = `log-${this.getNodeLabel()}-${
      this.props.sheetIndex
    }.txt`;

    try {
      const data = new window.Blob([tsv], { type: 'text/plain' });
      const file = window.URL.createObjectURL(data);

      const link = document.createElement('a');
      link.download = defaultFilename;
      link.href = file;
      link.click();

      // We need to manually revoke the object URL to avoid memory leaks.
      window.URL.revokeObjectURL(file);
    } catch (err) {
      this.props.actions.addError(logSaveError(err));
    }
  }

  onChangeSource(event) {
    const sourceNodeId = event.target.value;
    this.props.actions.changeSource(this.props.tabId, sourceNodeId);
  }

  getSheet() {
    return R.propOr([], this.props.sheetIndex, this.props.document);
  }

  getSheetsAmount() {
    return this.props.document.length;
  }

  getNodeLabel() {
    return R.compose(
      R.propOr('unknown', 'label'),
      R.find(R.propEq('nodeId', this.props.nodeId))
    )(this.props.sources);
  }

  isEmptySheet() {
    return this.getSheet().length === 0;
  }

  render() {
    const hasNoSources = this.props.sources.length === 0;
    const sheetAmount =
      this.getSheetsAmount() === 0 ? 1 : this.getSheetsAmount();

    return (
      <div className="TableLog">
        <div className="TableLog-header">
          <div className="sourceSelector">
            <select
              id="tablelog-source"
              value={this.props.nodeId}
              onChange={this.onChangeSource}
              disabled={hasNoSources}
            >
              {hasNoSources ? <option>No logs</option> : null}
              {this.props.sources.map(({ nodeId, label }) => (
                <option key={nodeId} value={nodeId}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="sheets">
            <button
              className="prev Button Button--light Button--inline"
              onClick={this.onPrevSheetClick}
              disabled={this.props.sheetIndex === 0}
            >
              <Icon name="angle-left" />
            </button>
            <div className="currentSheet">
              {this.props.sheetIndex + 1} / {sheetAmount}
            </div>
            <button
              className="next Button Button--light Button--inline"
              onClick={this.onNextSheetClick}
              disabled={this.props.sheetIndex >= this.getSheetsAmount() - 1}
            >
              <Icon name="angle-right" />
            </button>
          </div>
          <div className="actions">
            <button
              className="copy-log Button Button--light Button--inline"
              onClick={this.onCopyLogClicked}
              disabled={this.isEmptySheet()}
            >
              <Icon name="copy" title="Download Log" />
              Copy
            </button>
            <button
              className="save-log Button Button--light Button--inline"
              onClick={this.onSaveLogClicked}
              disabled={this.isEmptySheet()}
            >
              <Icon name="save" title="Download Log" />
              Save
            </button>
          </div>
        </div>
        <div className="TableLog-content">
          {this.isEmptySheet() ? (
            <span className="no-data">No data stored</span>
          ) : (
            <ReactDataSheet
              className="tablelog-grid"
              data={tableLogToDataSheet(this.getSheet())}
              valueRenderer={cell => cell.value}
              overflow={'nowrap'}
            />
          )}
        </div>
      </div>
    );
  }
}

TableLog.propTypes = {
  // from parent
  tabId: PropTypes.string.isRequired,
  // connect
  sources: PropTypes.arrayOf(PropTypes.object).isRequired,
  document: PropTypes.array.isRequired,
  nodeId: PropTypes.string.isRequired,
  sheetIndex: PropTypes.number.isRequired,
  actions: PropTypes.objectOf(PropTypes.func),
};

const mapStateToProps = (state, { nodeId }) =>
  R.applySpec({
    sources: DebuggerSelectors.getTableLogSources,
    document: DebuggerSelectors.getTableLogsByNodeId(nodeId),
  })(state);

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      changeActiveSheet: Actions.changeActiveSheet,
      changeSource: Actions.changeTableLogSource,
      addConfirmation,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(TableLog);
