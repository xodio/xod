import R from 'ramda';
import React from 'react';
import cn from 'classnames';

/* eslint-disable jsx-a11y/no-static-element-interactions */

class PatchTypeSelector extends React.Component {
  constructor(props) {
    super(props);

    // TODO: enforse non-empty props.options?
    // TODO: check that initialSelectedKey is equal to one of option's keys?

    const selectedOptionKey = R.ifElse(
      R.pipe(R.prop('initialSelectedKey'), R.isNil),
      R.compose(
        R.unless(
          R.isNil,
          R.prop('key')
        ),
        R.head,
        R.prop('options')
      ),
      R.prop('initialSelectedKey')
    )(props);

    this.state = { selectedOptionKey };
  }

  onSelect(selectedOptionKey) {
    this.setState({ selectedOptionKey });
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
  options: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      key: React.PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
      name: React.PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
    })
  ).isRequired,
  children: React.PropTypes.func.isRequired,
};

export default PatchTypeSelector;
