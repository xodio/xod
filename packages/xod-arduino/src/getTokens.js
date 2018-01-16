/* eslint-disable max-len */

const getTokens = () => [
  {
    regex: /\b((?:input|output)_[A-Za-z0-9-_]+)\b/gm,
    token: 'tag',
  },
  {
    regex: /\b(Number|NodeId|Context|DirtyFlags|TimeMs|u?int\d{1,2}_t|size_t|XString|State|List|Iterator)\b/gm,
    token: 'type',
  },
  {
    regex: /\b(getValue|emitValue|isInputDirty|transactionTime|setTimeout|clearTimeout|isTimedOut|evaluate|getState)\b/gm,
    token: 'builtin',
  },
  {
    regex: /\b((digital|analog)(Read|Write)|pinMode|analogReference)\b/gm,
    token: 'builtin',
  },
  {
    regex: /\bGENERATED_CODE\b/gm,
    token: 'tag',
  },
];

export default getTokens;
