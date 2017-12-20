import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames';
import Autosuggest from 'react-autosuggest';
import Highlighter from 'react-highlight-words';
import regExpEscape from 'escape-string-regexp';

import { isAmong } from 'xod-func-tools';

import { KEYCODE } from '../../utils/constants';
import { triggerUpdateHelpboxPositionViaSuggester } from '../../editor/utils';
import SuggesterContainer from './SuggesterContainer';

const getSuggestionValue = ({ item }) => item.path;

const getSuggestionIndex = R.uncurryN(2, suggestion => R.findIndex(R.equals(suggestion)));

class Suggester extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      suggestions: [],
      mouseInteraction: true,
    };

    // `mouseInteraction` is about can User interact with
    // suggestions using mouse or not. It avoid bug when
    // User scrolls suggestions using keyboard and dont
    // touching mouse at all.
    // It will be turned on when User moves mouse
    // over SuggesterContainer.

    this.input = null;

    this.renderItem = this.renderItem.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onItemMouseOver = this.onItemMouseOver.bind(this);
    this.onContainerMouseMove = this.onContainerMouseMove.bind(this);
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
    this.onSuggestionHighlighted = this.onSuggestionHighlighted.bind(this);
    this.storeRef = this.storeRef.bind(this);
  }

  componentDidMount() {
    if (this.input) {
      // A hack to avoid typing "i" into input when pressing Hotkey
      setTimeout(() => {
        this.input.focus();
      }, 1);
    }
  }

  onChange(e, { newValue, method }) {
    if (isAmong(['up', 'down'], method)) {
      this.setState({
        mouseInteraction: false,
      });
      return;
    }
    this.setState({ value: newValue });
  }

  onSelect(value) {
    this.props.onAddNode(value);
  }

  onSuggestionsFetchRequested({ value, reason }) {
    if (reason === 'suggestion-selected') return;

    this.setState({
      suggestions: this.getSuggestions(value),
    });
  }

  onSuggestionsClearRequested() {
    this.setState({
      suggestions: [],
    });
  }

  onSuggestionSelected(event, { suggestionValue }) {
    this.onSelect(suggestionValue);
  }

  onSuggestionHighlighted({ suggestion }) {
    if (suggestion) {
      this.autosuggest.updateHighlightedSuggestion(
        null,
        getSuggestionIndex(suggestion, this.state.suggestions)
      );
      this.props.showHelpbox();
      this.props.onHighlight(getSuggestionValue(suggestion));
      setTimeout(triggerUpdateHelpboxPositionViaSuggester, 1);
    }
  }

  onItemMouseOver(suggestion) {
    return () => {
      if (this.state.mouseInteraction) {
        this.onSuggestionHighlighted({ suggestion });
      }
    };
  }
  onContainerMouseMove() {
    this.setState({
      mouseInteraction: true,
    });
  }

  getSuggestions(value) {
    const { index } = this.props;
    const inputValue = value.trim().toLowerCase();

    if (inputValue.length === 0) { return []; }
    return index.search(regExpEscape(inputValue));
  }

  storeRef(autosuggest) {
    if (autosuggest !== null) {
      this.autosuggest = autosuggest;
      this.input = autosuggest.input;
    }
  }

  renderItem(suggestion, { isHighlighted }) {
    const cls = classNames('Suggester-item', {
      'is-highlighted': isHighlighted,
    });
    const value = regExpEscape(this.state.value);
    const { item } = suggestion;

    return (
      <div // eslint-disable-line jsx-a11y/no-static-element-interactions
        role="button"
        className={cls}
        onClick={() => this.onSelect(item.path)}
        onMouseOver={this.onItemMouseOver(suggestion)}
      >
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
  }

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

    const cls = `Suggester ${this.props.extraClassName}`;
    return (
      <div className={cls} id="Suggester">
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
            <SuggesterContainer
              containerProps={containerProps}
              onScroll={triggerUpdateHelpboxPositionViaSuggester}
              onMouseMove={this.onContainerMouseMove}
            >
              {children}
            </SuggesterContainer>
          )}
          ref={this.storeRef}
        />
      </div>
    );
  }
}

Suggester.defaultProps = {
  extraClassName: '',
  onBlur: () => {},
  onHighlight: () => {},
};

Suggester.propTypes = {
  extraClassName: PropTypes.string,
  index: PropTypes.object,
  onAddNode: PropTypes.func.isRequired,
  onHighlight: PropTypes.func,
  onBlur: PropTypes.func,
  showHelpbox: PropTypes.func,
};

export default Suggester;
