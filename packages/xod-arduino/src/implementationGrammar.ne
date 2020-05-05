@{%
const moo = require("moo");
const R = require("ramda");

const lexer = moo.compile({
  WS: /[ \t]+/,
  lineComment: /\/\/.*?$/,
  blockComment: { match: /\/\*(?:(?:.|\n)*?)\*\//, lineBreaks: true },
  string: /"(?:\\"|[^"\r\n])*?"/,
  char: /'(?:\\'|[^'\r\n])*?'/,
  lParen: "{",
  rParen: "}",
  keyword: ["nodespace", "node", "meta"],
  NL: { match: /\n/, lineBreaks: true },
  otherCode: /[^ \t\n\{\}]+/
});

const value = R.path([0, "value"]);

const flattenNestedCodeBlock = R.pipe(
  R.pathOr([], [1]),
  R.join(''),
  code => `{${code}}`
);

const flattenCodeBlock = R.pipe(R.pathOr([], [0]), R.join(''));

const extractMetaContents = ([_kw, _ws, _paren, contents]) => contents;

const processNode = ([_kw, _ws, _paren, ...contents]) => {
  const [beforeMeta, meta, afterMeta] = contents.map(x => x == null ? '' : x);

  return {
    type: 'node',
    meta,
    contents: beforeMeta.concat(afterMeta),
  }
}

const processNodespace = ([_kw, _ws, _paren, contents]) => ({
    type: 'nodespace',
    contents: contents == null ? '' : contents,
  });

const markGlobalBlocks = R.pipe(
    R.reject(R.isNil),
    R.map(block => (typeof block === 'string') ? ({ type: 'global', contents: block }) : block),
  );

%}

@lexer lexer

main -> codeBlock:? nodespace:? codeBlock:? node codeBlock:? {% markGlobalBlocks %}

whitespaceOrComments ->
      %WS {% value %}
    | %NL {% value %}
    | %lineComment {% value %}
    | %blockComment {% value %}

codeBlock -> (
    whitespaceOrComments {% id %}
    | %string {% value %}
    | %char {% value %}
    | %otherCode {% value %}
    | %lParen (null | codeBlock) %rParen {% flattenNestedCodeBlock %}
  ):+ {% flattenCodeBlock %}

meta -> "meta" whitespaceOrComments:* "{" codeBlock:? "}" {% extractMetaContents %}

node -> "node" whitespaceOrComments:* "{" codeBlock:? meta:? codeBlock:? "}" {% processNode %}

nodespace -> "nodespace" whitespaceOrComments:* "{" codeBlock:? "}" {% processNodespace %}
