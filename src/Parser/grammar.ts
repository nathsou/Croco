// Generated automatically by nearley, version 2.19.6
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var lbracket: any;
declare var rbracket: any;
declare var symb: any;
declare var nil: any;
declare var varname: any;
declare var nl: any;

const moo = require('moo');

const lexer = moo.compile({
  ws: /[ \t]+/,
  if_: 'if',
  then: 'then',
  else_: 'else',
  let_: 'let',
  in_: 'in',
  varname: /[a-z]+[a-zA-Z0-9]*/,
  symb: /[A-Z0-9@][a-zA-Z0-9']*/,
  arrow: '->',
  binop: ['+', '-', '*', '/', '%', '**', '<', '<=', '>', '>=', '==', ':'],
  comma: ',',
  assign: '=',
  lparen: '(',
  rparen: ')',
  nil: '[]',
  lbracket: '[',
  rbracket: ']',
  lambda: '\\',
  nl: { match: /\n/, lineBreaks: true },
});

// ignore whitespaces and newlines in output tokenization
lexer.next = (next => () => {
	let tok;
	while ((tok = next.call(lexer)) && tok.type === 'ws');
    // console.log(tok);
	return tok;
})(lexer.next);

const Fun = (name, ...args) => ({ type: 'fun', name, args });
const App = (f, x) => Fun('app', f, x);
const Lambda = (x, expr) => ({ type: 'lambda', x, expr });
const LetIn = (x, val, rhs) => App(Lambda(x, rhs), val);

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
    {"name": "main", "symbols": ["rules"], "postprocess": id},
    {"name": "expr", "symbols": ["lambda"], "postprocess": id},
    {"name": "lambda", "symbols": [{"literal":"\\"}, "expr", {"literal":"->"}, "expr"], "postprocess": d => Lambda(d[1], d[3])},
    {"name": "lambda", "symbols": ["let_in"], "postprocess": id},
    {"name": "let_in", "symbols": [{"literal":"let"}, "expr", {"literal":"="}, "expr", {"literal":"in"}, "expr"], "postprocess": d => LetIn(d[1], d[3], d[5])},
    {"name": "let_in", "symbols": ["if"], "postprocess": id},
    {"name": "if", "symbols": [{"literal":"if"}, "expr", {"literal":"then"}, "expr", {"literal":"else"}, "expr"], "postprocess":  
        ([if_, cond, then_, thenExpr, else_, elseExpr]) => Fun('if', cond, thenExpr, elseExpr)
        },
    {"name": "if", "symbols": ["app"], "postprocess": id},
    {"name": "app", "symbols": ["app", "cons"], "postprocess": ([lhs, rhs]) => App(lhs, rhs)},
    {"name": "app", "symbols": ["cons"], "postprocess": id},
    {"name": "cons", "symbols": ["cons", {"literal":":"}, "list"], "postprocess": ([h, _, tl]) => Fun(':', h, tl)},
    {"name": "cons", "symbols": ["list"], "postprocess": id},
    {"name": "list", "symbols": [(lexer.has("lbracket") ? {type: "lbracket"} : lbracket), "list_elems", (lexer.has("rbracket") ? {type: "rbracket"} : rbracket)], "postprocess": d => d[1]},
    {"name": "list_elems", "symbols": ["expr"], "postprocess": ([e]) => Fun(':', e, Fun('Nil'))},
    {"name": "list_elems", "symbols": ["expr", {"literal":","}, "list_elems"], "postprocess": ([e, _, es]) => Fun(':', e, es)},
    {"name": "list", "symbols": ["addsub"], "postprocess": id},
    {"name": "addsub", "symbols": ["addsub", {"literal":"+"}, "multdiv"], "postprocess": ([a, _, b]) => Fun("@add", a, b)},
    {"name": "addsub", "symbols": ["addsub", {"literal":"-"}, "multdiv"], "postprocess": ([a, _, b]) => Fun("@sub", a, b)},
    {"name": "addsub", "symbols": ["multdiv"], "postprocess": id},
    {"name": "multdiv", "symbols": ["multdiv", {"literal":"*"}, "pow"], "postprocess": ([a, _, b]) => Fun("@mult", a, b)},
    {"name": "multdiv", "symbols": ["multdiv", {"literal":"/"}, "pow"], "postprocess": ([a, _, b]) => Fun("@div", a, b)},
    {"name": "multdiv", "symbols": ["multdiv", {"literal":"%"}, "pow"], "postprocess": ([a, _, b]) => Fun("@mod", a, b)},
    {"name": "multdiv", "symbols": ["pow"], "postprocess": id},
    {"name": "pow", "symbols": ["pow", {"literal":"**"}, "comp"], "postprocess": ([a, _, b]) => Fun("**", a, b)},
    {"name": "pow", "symbols": ["comp"], "postprocess": id},
    {"name": "comp", "symbols": ["comp", {"literal":"<"}, "cons"], "postprocess": ([a, _, b]) => Fun("@lss", a, b)},
    {"name": "comp", "symbols": ["comp", {"literal":"<="}, "cons"], "postprocess": ([a, _, b]) => Fun("@leq", a, b)},
    {"name": "comp", "symbols": ["comp", {"literal":">"}, "cons"], "postprocess": ([a, _, b]) => Fun("@gtr", a, b)},
    {"name": "comp", "symbols": ["comp", {"literal":">="}, "cons"], "postprocess": ([a, _, b]) => Fun("@geq", a, b)},
    {"name": "comp", "symbols": ["comp", {"literal":"=="}, "cons"], "postprocess": ([a, _, b]) => Fun("@equ", a, b)},
    {"name": "comp", "symbols": ["term"], "postprocess": id},
    {"name": "term", "symbols": [(lexer.has("symb") ? {type: "symb"} : symb)], "postprocess": ([s]) => Fun(s.value)},
    {"name": "term", "symbols": ["var"], "postprocess": id},
    {"name": "term", "symbols": [(lexer.has("nil") ? {type: "nil"} : nil)], "postprocess": () => Fun('Nil')},
    {"name": "term", "symbols": ["paren"], "postprocess": id},
    {"name": "paren", "symbols": [{"literal":"("}, "expr", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "var", "symbols": [(lexer.has("varname") ? {type: "varname"} : varname)], "postprocess": ([v]) => ({ type: 'var', name: v.value })},
    {"name": "rule$ebnf$1", "symbols": []},
    {"name": "rule$ebnf$1", "symbols": ["rule$ebnf$1", (lexer.has("nl") ? {type: "nl"} : nl)], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "rule", "symbols": ["expr", {"literal":"="}, "rule$ebnf$1", "expr"], "postprocess": ([lhs, _eq, _nls, rhs]) => ({ type: 'rule', lhs, rhs })},
    {"name": "rules", "symbols": ["non_empty_rules"], "postprocess": id},
    {"name": "non_empty_rules", "symbols": ["rule"], "postprocess": d => [d[0]]},
    {"name": "non_empty_rules$ebnf$1", "symbols": [(lexer.has("nl") ? {type: "nl"} : nl)]},
    {"name": "non_empty_rules$ebnf$1", "symbols": ["non_empty_rules$ebnf$1", (lexer.has("nl") ? {type: "nl"} : nl)], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "non_empty_rules", "symbols": ["non_empty_rules", "non_empty_rules$ebnf$1", "rule"], "postprocess": ([rs, _, r]) => [...rs, r]}
  ],
  ParserStart: "main",
};

export default grammar;
