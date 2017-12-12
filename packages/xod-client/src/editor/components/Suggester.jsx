import React from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames';
import Autosuggest from 'react-autosuggest';
import Highlighter from 'react-highlight-words';
import regExpEscape from 'escape-string-regexp';

import { isAmong } from 'xod-func-tools';

import { KEYCODE } from '../../utils/constants';
import SuggesterContainer from './SuggesterContainer';

const getSuggestionValue = ({ item }) => item.path;

class Suggester extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      suggestions: [],
    };

    this.input = null;
  }

  componentDidMount() {
    if (this.input) {
      // A hack to avoid typing "i" into input when pressing Hotkey
      setTimeout(() => {
        this.input.focus();
        this.props.onInitialFocus();
      }, 1);
    }
  }

  onChange = (e, { newValue, method }) => {
    if (isAmong(['up', 'down', 'click'], method)) return;

    this.setState({ value: newValue });
  };

  onSelect(value) {
    this.props.onAddNode(value);
  }

  onSuggestionsFetchRequested = ({ value, reason }) => {
    if (reason === 'suggestion-selected') return;

    this.setState({
      suggestions: this.getSuggestions(value),
    });
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  onSuggestionSelected = (event, { suggestionValue }) => {
    this.onSelect(suggestionValue);
  };

  onSuggestionHighlighted = ({ suggestion }) => {
    if (suggestion) {
      this.props.onHighlight(getSuggestionValue(suggestion));
    }
  };

  getSuggestions(value) {
    const { index } = this.props;
    const inputValue = value.trim().toLowerCase();

    if (inputValue.length === 0) { return []; }
    return index.search(regExpEscape(inputValue));
  }

  storeInputReference = (autosuggest) => {
    if (autosuggest !== null) {
      this.input = autosuggest.input;
    }
  };

  renderItem = ({ item }, { isHighlighted }) => {
    const cls = classNames('Suggester-item', {
      'is-highlighted': isHighlighted,
    });
    const value = regExpEscape(this.state.value);

    return (
      <div className={cls}>
        <Highlighter
          className="path"
          searchWords={[value]}
          textToHighlight={item.path}
        />
        <Highlighter
          className="description"
          searchWords={[value]}
          textToHighlight={item.description}
        />
      </div>
    );
  };

  render() {
    const { value, suggestions } = this.state;

    const inputProps = {
      placeholder: 'Search nodes',
      value,
      onChange: this.onChange,
      onKeyDown: (event) => {
        const code = event.keyCode || event.which;
        if (code === KEYCODE.ESCAPE && event.target.value === '') {
          this.props.onBlur();
        }
      },
      onBlur: () => this.props.onBlur(),
      type: 'search',
    };

    const cls = `Suggester ${this.props.addClassName}`;
    return (
      <div className={cls}>
        <Autosuggest
          suggestions={suggestions}
          value={value}
          inputProps={inputProps}
          alwaysRenderSuggestions
          highlightFirstSuggestion
          getSuggestionValue={getSuggestionValue}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          onSuggestionSelected={this.onSuggestionSelected}
          onSuggestionHighlighted={this.onSuggestionHighlighted}
          renderSuggestion={this.renderItem}
          renderSuggestionsContainer={({ containerProps, children }) => (
            <SuggesterContainer containerProps={containerProps}>
              {children}
            </SuggesterContainer>
          )}
          ref={this.storeInputReference}
        />
      </div>
    );
  }
}

Suggester.defaultProps = {
  addClassName: '',
  onBlur: () => {},
  onHighlight: () => {},
  onInitialFocus: () => {},
};

Suggester.propTypes = {
  addClassName: PropTypes.string,
  index: PropTypes.object,
  onAddNode: PropTypes.func.isRequired,
  onHighlight: PropTypes.func,
  onBlur: PropTypes.func,
  onInitialFocus: PropTypes.func,
};

export default Suggester;
