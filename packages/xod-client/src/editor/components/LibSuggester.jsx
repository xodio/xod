import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { Maybe } from 'ramda-fantasy';

import classNames from 'classnames';
import Autosuggest from 'react-autosuggest';
import Highlighter from 'react-highlight-words';
import { Icon } from 'react-fa';
import debounce from 'throttle-debounce/debounce';

import { fetchLibData, searchLibraries, parseLibQuery } from 'xod-pm';
import { foldMaybe, isAmong } from 'xod-func-tools';

import { getPmSwaggerUrl } from '../../utils/urls';
import { KEYCODE } from '../../utils/constants';
import { restoreFocusOnApp } from '../../utils/browser';
import SuggesterContainer from './SuggesterContainer';
import * as MSG from '../messages';

const composeValue = R.curry((suggestion, version) => ({
  owner: suggestion.owner,
  libname: suggestion.libname,
  version,
}));

const getSuggestionValue = R.curry((searchQuery, suggestion) =>
  R.compose(
    foldMaybe(
      composeValue(suggestion, suggestion.versions[0]),
      composeValue(suggestion)
    ),
    R.chain(({ version }) => {
      if (version === 'latest') return Maybe.of(suggestion.versions[0]);
      if (R.contains(version, suggestion.versions)) return Maybe.of(version);
      return Maybe.Nothing();
    }),
    parseLibQuery
  )(searchQuery)
);

const getLibVersion = R.compose(R.prop('version'), getSuggestionValue);

const renderNothingFound = () => (
  <div className="error">{MSG.LIB_SUGGESTER_NOTHING_FOUND}</div>
);

const renderTypeToBegin = () => (
  <div className="hint">{MSG.LIB_SUGGESTER_TYPE_TO_BEGIN}</div>
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
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(
      this
    );
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(
      this
    );
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
    this.storeInputReference = this.storeInputReference.bind(this);
    this.renderContent = this.renderContent.bind(this);

    // call it once to prepare debounced function
    this.fetchLibData = debounce(500, this.fetchLibData.bind(this));
  }

  componentDidMount() {
    if (this.input) {
      // A hack to avoid typing any character into input when pressing Hotkey
      setTimeout(() => {
        this.input.focus();
        this.props.onInitialFocus();
      }, 1);
    }
  }

  componentWillUnmount() {
    // A hack to make hotkeys work after focused input is destroyed
    setTimeout(restoreFocusOnApp, 1);
  }

  onChange(e, { newValue, method }) {
    if (isAmong(['up', 'down', 'click'], method)) return;

    this.setState({
      value: newValue,
      notFound: newValue === '' ? false : this.state.notFound,
    });
  }

  onSelect(value) {
    this.props.onInstallLibrary(value);
  }

  onSuggestionsFetchRequested({ reason, value }) {
    if (reason !== 'input-changed') return;
    if (value.length > 3) this.fetchLibData();
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
    const query = this.state.value;

    this.setState({
      loading: true,
      suggestions: [],
      notFound: false,
    });

    const swaggerUrl = getPmSwaggerUrl();
    // Search the exact library
    const exactOne = fetchLibData(swaggerUrl, query)
      .then(R.of) // TODO: Once it will become an array
      .catch(R.always([]))
      .then(
        R.tap(data =>
          this.setState(
            R.evolve({
              suggestions: R.concat(R.__, data),
            })
          )
        )
      );

    // Search others
    const otherLibs = searchLibraries(swaggerUrl, query)
      .catch(R.always([]))
      .then(
        R.tap(data =>
          this.setState(
            R.evolve({
              suggestions: R.concat(R.__, data),
            })
          )
        )
      );

    // TODO: Replace these two requests with one,
    //       when searchLibraries endpoint will be fixed:
    //       https://github.com/xodio/services.xod.io/issues/919
    return Promise.all([exactOne, otherLibs]).then(([exact, found]) =>
      this.setState(
        R.evolve({
          loading: R.always(false),
          notFound: () => exact.length === 0 && found.length === 0,
        })
      )
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
    const query = this.state.value;
    const cls = classNames('Suggester-item Suggester-item--library', {
      'is-highlighted': isHighlighted,
    });

    const license = item.license ? (
      <span className="license">{item.license}</span>
    ) : null;

    const libName = `${item.owner}/${item.libname}`;

    return (
      <div className={cls} title={libName}>
        <span className="path">
          <Highlighter
            searchWords={[this.state.value]}
            textToHighlight={libName}
          />
          <span className="version">{getLibVersion(query, item)}</span>
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
      onKeyDown: event => {
        const code = event.keyCode || event.which;
        if (code === KEYCODE.ESCAPE && event.target.value === '') {
          this.props.onBlur();
        }
      },
      onBlur: () => this.props.onBlur(),
      type: 'search',
    };

    const loading = this.state.loading ? (
      <div className="loading-icon">
        <Icon name="circle-o-notch" spin />
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
          getSuggestionValue={getSuggestionValue(value)}
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
  onInitialFocus: () => {},
};

LibSuggester.propTypes = {
  addClassName: PropTypes.string,
  onInstallLibrary: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  onInitialFocus: PropTypes.func,
};

export default LibSuggester;
