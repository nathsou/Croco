@preprocessor typescript

# A simple parser to parse imports

@{%
const moo = require('moo');

const lexer = moo.compile({
  ws: /[ \t]+/,
  import_: 'import',
  path: /[\.\/\\a-zA-Z0-9\-_]+/,
  varname: /[a-z]+[a-zA-Z0-9]*/,
  symb: /[A-Z0-9@][a-zA-Z0-9']*/,
  arrow: '->',
  comma: ',',
  semicolon: ';',
  lparen: '(',
  rparen: ')',
  comment: /#.*?$/,
  string: /"(?:\\["\\]|[^\n"\\])*"/,
  nl: { match: /\n/, lineBreaks: true }
});

// ignore whitespaces and newlines in output tokenization
lexer.next = (next => () => {
	let tok;
	while ((tok = next.call(lexer)) && (tok.type === 'ws' || tok.type === 'nl'));
    // console.log(tok);
	return tok;
})(lexer.next);

const Import = (path, rules) => ({ type: 'import', path, rules });
%}

@lexer lexer

main -> imports {% id %}

import -> "import" %path ";" {% ([_, path]) => Import(path.value, []) %}

imports -> import {% ([imp]) => [imp] %}
imports -> imports import {% ([es, e]) => [...es, e] %}