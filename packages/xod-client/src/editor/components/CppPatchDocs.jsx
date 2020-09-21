import React from 'react';
import PT from 'prop-types';
import * as R from 'ramda';
import * as XP from 'xod-project';
import { cppEscape } from 'xod-func-tools';
import Icon from 'react-fa';

import { getUtmSiteUrl } from '../../utils/urls';

const getPinLabel = R.compose(cppEscape, XP.getPinLabel);

const formatPinLabel = pin =>
  [
    XP.isConstantType(pin.type) ? 'constant_' : '',
    XP.getPinDirection(pin),
    '_',
    getPinLabel(pin),
  ].join('');

const formatConstantOutputNotice = pin =>
  XP.isConstantType(pin.type) ? (
    <span className="constant-notice">
      <Icon name="warning" /> Must be defined as
      <code>
        <span className="keyword">static constexpr </span>
        <span className="type">typeof_{getPinLabel(pin)} </span>
        <span className="variable">{formatPinLabel(pin)} </span>
        =
      </code>
    </span>
  ) : null;

const CppPatchDocs = ({ patch }) => {
  const [inputPins, outputPins] = R.compose(
    R.map(R.sort(R.ascend(XP.getPinOrder))),
    R.partition(XP.isInputPin),
    XP.normalizeEmptyPinLabels,
    XP.listPins
  )(patch);

  return (
    <div className="CppPatchDocs">
      <span className="title">C++ Cheatsheet</span>
      {inputPins.length === 0 ? null : (
        <div>
          <span className="pin-direction">Inputs:</span>
          <ul>
            {inputPins.map(pin => (
              <li key={XP.getPinKey(pin)}>
                <span className="pin-label">{formatPinLabel(pin)}</span>
                <span className={`pin-type ${XP.getPinType(pin)}`}>
                  {XP.getPinType(pin)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {outputPins.length === 0 ? null : (
        <div className="outputs">
          <span className="pin-direction">Outputs:</span>
          <ul>
            {outputPins.map(pin => (
              <li key={XP.getPinKey(pin)}>
                <span className="pin-label">{formatPinLabel(pin)}</span>
                <span className={`pin-type ${XP.getPinType(pin)}`}>
                  {XP.getPinType(pin)}
                </span>
                {formatConstantOutputNotice(pin)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <a
        href={getUtmSiteUrl(
          '/docs/reference/node-cpp-api/',
          'docs',
          'quick-help'
        )}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="external-link" />
        C++ Node API Reference
      </a>
    </div>
  );
};

CppPatchDocs.propTypes = {
  patch: PT.object.isRequired,
};

export default CppPatchDocs;
