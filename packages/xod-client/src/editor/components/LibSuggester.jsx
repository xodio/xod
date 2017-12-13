import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames';
import Autosuggest from 'react-autosuggest';
import Highlighter from 'react-highlight-words';
import { Icon } from 'react-fa';
import debounce from 'throttle-debounce/debounce';

import { fetchLibData, getLibVersion, isLibQueryValid } from 'xod-pm';
import { isAmong } from 'xod-func-tools';

import { getPmSwaggerUrl } from '../../utils/urls';
import { KEYCODE } from '../../utils/constants';
import SuggesterContainer from './SuggesterContainer';
import * as MSG from '../messages';

const getSuggestionValue = R.prop('requestParams');

const renderNothingFound = () => (
  <div className="error">
    {MSG.LIB_SUGGESTER_NOTHING_FOUND}
  </div>
);

const renderTypeToBegin = () => (
  <div className="hint">
    {MSG.LIB_SUGGESTER_TYPE_TO_BEGIN}
  </div>
);

class LibSuggester extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      notFound: false,
      value: '',
      suggestions: [],
      loading: false,
    };

    this.input = null;

    this.renderItem = this.renderItem.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
    this.storeInputReference = this.storeInputReference.bind(this);
    this.renderContent = this.renderContent.bind(this);

    // call it once to prepare debounced function
    this.fetchLibData = debounce(500, this.fetchLibData.bind(this));
  }

  componentDidMount() {
    if (this.input) {
      // A hack to avoid typing any character into input when pressing Hotkey
      setTimeout(() => this.input.focus(), 1);
    }
  }

  onChange(e, { newValue, method }) {
    if (isAmong(['up', 'down', 'click'], method)) return;

    this.setState({
      value: newValue,
      notFound: (newValue === '') ? false : this.state.notFound,
    });
  }

  onSelect(value) {
    this.props.onInstallLibrary(value);
  }

  onSuggestionsFetchRequested({ reason, value }) {
    if (reason !== 'input-changed') return;
    if (isLibQueryValid(value)) {
      this.fetchLibData();
    }
  }

  onSuggestionsClearRequested() {
    this.setState({
      suggestions: [],
    });
  }

  onSuggestionSelected(event, { suggestionValue }) {
    this.onSelect(suggestionValue);
  }

  fetchLibData() {
    const request = this.state.value;
    this.setState({
      loading: true,
      suggestions: [],
      notFound: false,
    });
    fetchLibData(getPmSwaggerUrl(), request)
      .then(R.of) // TODO: Once it will become an array
      .catch(R.always([]))
      .then(
        data => this.setState({
          suggestions: data,
          loading: false,
          notFound: (data.length === 0),
        })
      );
  }

  storeInputReference(autosuggest) {
    if (autosuggest !== null) {
      this.input = autosuggest.input;
    }
  }

  isNothingFound() {
    return (
      this.state.notFound &&
      this.state.value !== '' &&
      this.state.suggestions.length === 0 &&
      !this.state.loading
    );
  }
  isNothingSearched() {
    return (
      !this.state.notFound &&
      this.state.suggestions.length === 0 &&
      !this.state.loading
    );
  }

  renderItem(item, { isHighlighted }) {
    const cls = classNames('Suggester-item Suggester-item--library', {
      'is-highlighted': isHighlighted,
    });

    const license = (item.license)
      ? <span className="license">{item.license}</span>
      : null;

    const libName = `${item.owner}/${item.libname}`;

    return (
      <div className={cls} title={libName}>
        <span className="path">
          <Highlighter
            searchWords={[this.state.value]}
            textToHighlight={libName}
          />
          <span className="version">{getLibVersion(item)}</span>
        </span>
        <div className="add">
          <span className="author">by {item.owner}</span>
          {license}
        </div>
        <Highlighter
          className="description"
          searchWords={[this.state.value]}
          textToHighlight={item.description}
        />
      </div>
    );
  }

  renderContent(children) {
    if (this.isNothingFound()) {
      return renderNothingFound();
    }
    if (this.isNothingSearched()) {
      return renderTypeToBegin();
    }

    return children;
  }

  render() {
    const { value, suggestions } = this.state;

    const inputProps = {
      placeholder: 'Search libraries',
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

    const loading = (this.state.loading) ? (
      <div className="loading-icon">
        <Icon
          name="circle-o-notch"
          spin
        />
      </div>
    ) : null;

    const cls = `Suggester Suggester-libs ${this.props.addClassName}`;

    return (
      <div className={cls}>
        {loading}
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
          renderSuggestion={this.renderItem}
          renderSuggestionsContainer={({ containerProps, children }) => (
            <SuggesterContainer containerProps={containerProps}>
              {this.renderContent(children)}
            </SuggesterContainer>
          )}
          ref={this.storeInputReference}
        />
      </div>
    );
  }
}

LibSuggester.defaultProps = {
  addClassName: '',
  onBlur: () => {},
};

LibSuggester.propTypes = {
  addClassName: PropTypes.string,
  onInstallLibrary: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
};

export default LibSuggester;
