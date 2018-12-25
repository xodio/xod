import React from 'react';
import * as R from 'ramda';
import PropTypes from 'prop-types';
import cn from 'classnames';
import ReactDataSheet from 'react-datasheet';

const trimGrid = R.compose(
  R.dropLastWhile(R.isEmpty),
  R.map(R.dropLastWhile(R.anyPass([R.isEmpty, R.isNil])))
);

const EXTRA_ROWS = 2;
const EXTRA_COLS = 2;

const padGrid = grid => {
  const trimmedGrid = trimGrid(grid);

  const maxTrimmedCols = R.reduce(
    (maxLength, currentRow) => R.max(maxLength, R.length(currentRow)),
    0,
    trimmedGrid
  );

  const desiredColsNumber = maxTrimmedCols + EXTRA_COLS;

  return R.compose(
    R.map(row =>
      R.concat(row, R.repeat('', desiredColsNumber - R.length(row)))
    ),
    R.concat(R.__, R.repeat([], EXTRA_ROWS))
  )(trimmedGrid);
};

const gridToTsv = R.compose(R.join('\n'), R.map(R.join('\t')), trimGrid);

const TabtestEditor = ({
  patchPath,
  isActive,
  source,
  isInDebuggerTab,
  onChange,
  onClose,
}) => {
  const cells = R.compose(
    R.map(R.map(R.objOf('value'))),
    padGrid,
    R.map(R.split('\t')),
    R.split('\n')
  )(source);

  const onCellsChanged = (changes, additions = []) => {
    R.compose(
      onChange,
      gridToTsv,
      R.map(R.map(R.prop('value'))),
      R.reduce(
        (acc, { row, col, value }) => R.assocPath([row, col], { value }, acc),
        cells
      ),
      R.concat
    )(changes, additions);
  };

  return (
    <div
      className={cn('AttachmentEditor', {
        isActive,
        isInDebuggerTab,
      })}
    >
      <div className="Breadcrumbs Breadcrumbs--codeEditor">
        <ul>
          <li>
            <button className="back-button" onClick={onClose} />
          </li>
          <li>
            <button className="Breadcrumbs-chunk-button" onClick={onClose}>
              {patchPath}
            </button>
          </li>
          <li>
            <button className="Breadcrumbs-chunk-button is-tail is-active">
              Tabtest
            </button>
          </li>
        </ul>
      </div>
      <div className="tabtest-editor">
        <ReactDataSheet
          data={cells}
          valueRenderer={R.prop('value')}
          overflow={'nowrap'}
          onCellsChanged={onCellsChanged}
        />
      </div>
    </div>
  );
};

TabtestEditor.propTypes = {
  patchPath: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  source: PropTypes.string.isRequired,
  isInDebuggerTab: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TabtestEditor;
