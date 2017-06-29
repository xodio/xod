import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import { noop } from '../../utils/ramda';

/* eslint-disable jsx-a11y/no-static-element-interactions */

class PatchTypeSelector extends React.Component {
  constructor(props) {
    super(props);

    // TODO: enforse non-empty props.options?
    // TODO: check that initialSelectedKey is equal to one of option's keys?

    const selectedOptionKey = R.ifElse(
      R.propSatisfies(R.isNil, 'initialSelectedKey'),
      R.path(['options', 0, 'key']),
      R.prop('initialSelectedKey')
    )(props);

    this.state = { selectedOptionKey };
  }

  onSelect(selectedOptionKey) {
    if (selectedOptionKey === this.state.selectedOptionKey) {
      return;
    }

    this.setState({ selectedOptionKey });
    this.props.onChange(selectedOptionKey);
  }

  render() {
    const { options, children } = this.props;
    const { selectedOptionKey } = this.state;

    return (
      <div className="PatchTypeSelector">
        <ul className="options">
          {options.map(({ key, name }) =>
            <li
              key={key}
              className={cn('option', { selected: key === selectedOptionKey })}
              onClick={() => this.onSelect(key)}
            >
              {name}
            </li>
          )}
        </ul>
        {children(selectedOptionKey)}
      </div>
    );
  }
}

PatchTypeSelector.displayName = 'PatchTypeSelector';

PatchTypeSelector.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
      name: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  children: PropTypes.func.isRequired,
};

PatchTypeSelector.defaultProps = {
  onChange: noop,
};

export default PatchTypeSelector;
