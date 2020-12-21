// Generated automatically by nearley, version 2.19.6
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var path: any;

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

interface NearleyToken {  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: NearleyToken) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    {"name": "main", "symbols": ["imports"], "postprocess": id},
    {"name": "import", "symbols": [{"literal":"import"}, (lexer.has("path") ? {type: "path"} : path), {"literal":";"}], "postprocess": ([_, path]) => Import(path.value, [])},
    {"name": "imports", "symbols": ["import"], "postprocess": ([imp]) => [imp]},
    {"name": "imports", "symbols": ["imports", "import"], "postprocess": ([es, e]) => [...es, e]}
  ],
  ParserStart: "main",
};

export default grammar;
