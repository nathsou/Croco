// Generated automatically by nearley, version 2.19.6
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var backtick: any;
declare var symb: any;
declare var binop: any;
declare var string: any;
declare var nil: any;
declare var unit: any;
declare var varname: any;

const moo = require('moo');

const lexer = moo.compile({
  ws: /[ \t]+/,
  if_: 'if',
  then: 'then',
  else_: 'else',
  let_: 'let',
  in_: 'in',
  any: '_',
  varname: /[a-z]+[a-zA-Z0-9]*/,
  symb: /[A-Z0-9@][a-zA-Z0-9']*/,
  arrow: '->',
  binop: ['+', '-', '*', '/', '%', '**', '<', '<=', '>', '>=', '==', ':', '.', '++', '>>', '>>=', '&&', '||'],
  comma: ',',
  assign: '=',
  unit: '()',
  lparen: '(',
  rparen: ')',
  nil: '[]',
  lbracket: '[',
  rbracket: ']',
  semicolon: ';',
  lambda: '\\',
  comment: /\-\-.*?$/,
  string: /"(?:\\["\\]|[^\n"\\])*"/,
  backtick: '`',
  nl: { match: /\n/, lineBreaks: true },
});

// ignore whitespaces and newlines in output tokenization
lexer.next = (next => () => {
	let tok;
	while ((tok = next.call(lexer)) && (tok.type === 'ws' || tok.type === 'nl'));
    // console.log(tok);
	return tok;
})(lexer.next);

const Fun = (name, ...args) => ({ type: 'fun', name, args });
const Var = name => ({ type: 'var', name });
const App = (f, x) => Fun('app', f, x);
const Cons = (h, tl) => Fun(':', h, tl);

const Lambda = (args, rhs) => lambdaAux([...args].reverse(), rhs);

const lambdaAux = (args, rhs) => {
  if (args.length === 1) return { type: 'lambda', x: args[0], rhs };
  const [h, tl] = [args[0], args.slice(1)];
  return Lambda(tl, { type: 'lambda', x: h, rhs });
};

const LetIn = (x, val, rhs) => App(Lambda([x], rhs), val);

const List = vals => {
  if (vals.length === 0) return Fun('Nil');
  return Cons(vals[0], List(vals.slice(1)));
};

const Str = str => App(Fun('String'), List(str.split('').map(c => Fun(`${c.charCodeAt(0)}`))));

const opMap = {
  '+': 'Add',
  '-': 'Subtract',
  '*': 'Multiply',
  '/': 'Divide',
  '**': 'Pow',
  '%': 'Mod',
  '==': 'Equals',
  '<': 'Less',
  '<=': 'LessEq',
  '>': 'Greater',
  '>=': 'GreaterEq',
  ':': 'Cons',
  '.': 'Compose',
  '++': 'Prepend',
  '>>': 'MonadicThen',
  '>>=': 'MonadicBind',
  '&&': 'LazyAnd',
  '||': 'LazyOr',
};

let underscoresCount = 0;


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
    {"name": "lambda_args", "symbols": ["cons"], "postprocess": ([e]) => [e]},
    {"name": "lambda_args", "symbols": ["lambda_args", "cons"], "postprocess": ([es, e]) => [...es, e]},
    {"name": "lambda", "symbols": [{"literal":"\\"}, "lambda_args", {"literal":"->"}, "expr"], "postprocess": d => Lambda(d[1], d[3])},
    {"name": "lambda", "symbols": ["let_in"], "postprocess": id},
    {"name": "let_in", "symbols": [{"literal":"let"}, "expr", {"literal":"="}, "expr", {"literal":"in"}, "expr"], "postprocess": d => LetIn(d[1], d[3], d[5])},
    {"name": "let_in", "symbols": ["comp"], "postprocess": id},
    {"name": "comp", "symbols": ["comp", {"literal":"||"}, "if"], "postprocess": ([p, _, q]) => App(App(Fun("LazyOr"), p), Lambda([Fun('Unit')], q))},
    {"name": "comp", "symbols": ["comp", {"literal":"&&"}, "if"], "postprocess": ([p, _, q]) => App(App(Fun("LazyAnd"), p), Lambda([Fun('Unit')], q))},
    {"name": "comp", "symbols": ["comp", {"literal":"++"}, "if"], "postprocess": ([as, _, bs]) => App(App(Fun("Prepend"), as), bs)},
    {"name": "comp", "symbols": ["comp", {"literal":">>"}, "if"], "postprocess": ([as, _, bs]) => App(App(Fun("MonadicThen"), as), bs)},
    {"name": "comp", "symbols": ["comp", {"literal":">>="}, "if"], "postprocess": ([as, _, bs]) => App(App(Fun("MonadicBind"), as), bs)},
    {"name": "comp", "symbols": ["comp", {"literal":"."}, "if"], "postprocess": ([f, _, g]) => App(App(Fun("Compose"), f), g)},
    {"name": "comp", "symbols": ["comp", {"literal":"<"}, "if"], "postprocess": ([a, _, b]) => App(App(Fun("Less"), a), b)},
    {"name": "comp", "symbols": ["comp", {"literal":"<="}, "if"], "postprocess": ([a, _, b]) => App(App(Fun("LessEq"), a), b)},
    {"name": "comp", "symbols": ["comp", {"literal":">"}, "if"], "postprocess": ([a, _, b]) => App(App(Fun("Greater"), a), b)},
    {"name": "comp", "symbols": ["comp", {"literal":">="}, "if"], "postprocess": ([a, _, b]) => App(App(Fun("GreaterEq"), a), b)},
    {"name": "comp", "symbols": ["comp", {"literal":"=="}, "if"], "postprocess": ([a, _, b]) => App(App(Fun("Equals"), a), b)},
    {"name": "comp", "symbols": ["if"], "postprocess": id},
    {"name": "if", "symbols": [{"literal":"if"}, "expr", {"literal":"then"}, "expr", {"literal":"else"}, "expr"], "postprocess":  
        ([if_, cond, then_, thenExpr, else_, elseExpr]) => Fun('if', cond, thenExpr, elseExpr)
        },
    {"name": "if", "symbols": ["app"], "postprocess": id},
    {"name": "app", "symbols": ["app", "cons"], "postprocess": ([lhs, rhs]) => App(lhs, rhs)},
    {"name": "app", "symbols": ["cons"], "postprocess": id},
    {"name": "cons", "symbols": ["list", {"literal":":"}, "cons"], "postprocess": ([h, _, tl]) => Fun(':', h, tl)},
    {"name": "cons", "symbols": ["list"], "postprocess": id},
    {"name": "list", "symbols": [{"literal":"["}, "list_elems", {"literal":"]"}], "postprocess": d => d[1]},
    {"name": "list_elems", "symbols": ["expr"], "postprocess": ([e]) => Fun(':', e, Fun('Nil'))},
    {"name": "list_elems", "symbols": ["expr", {"literal":","}, "list_elems"], "postprocess": ([e, _, es]) => Fun(':', e, es)},
    {"name": "list", "symbols": ["tuple"], "postprocess": id},
    {"name": "tuple", "symbols": [{"literal":"("}, "tuple_elems", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "tuple_elems", "symbols": ["expr", {"literal":","}, "expr"], "postprocess": ([a, _, b]) => Fun(';', a, Fun(';', b, Fun('Unit')))},
    {"name": "tuple_elems", "symbols": ["expr", {"literal":","}, "tuple_elems"], "postprocess": ([e, _, es]) => Fun(';', e, es)},
    {"name": "tuple", "symbols": ["custom_op"], "postprocess": id},
    {"name": "custom_op", "symbols": ["custom_op", (lexer.has("backtick") ? {type: "backtick"} : backtick), (lexer.has("symb") ? {type: "symb"} : symb), (lexer.has("backtick") ? {type: "backtick"} : backtick), "expr"], "postprocess": d => App(App(Fun(d[2].value), d[0]), d[4])},
    {"name": "custom_op", "symbols": ["addsub"], "postprocess": id},
    {"name": "addsub", "symbols": ["addsub", {"literal":"+"}, "multdiv"], "postprocess": ([a, _, b]) => App(App(Fun("Add"), a), b)},
    {"name": "addsub", "symbols": ["addsub", {"literal":"-"}, "multdiv"], "postprocess": ([a, _, b]) => App(App(Fun("Subtract"), a), b)},
    {"name": "addsub", "symbols": ["multdiv"], "postprocess": id},
    {"name": "multdiv", "symbols": ["multdiv", {"literal":"*"}, "pow"], "postprocess": ([a, _, b]) => App(App(Fun("Multiply"), a), b)},
    {"name": "multdiv", "symbols": ["multdiv", {"literal":"/"}, "pow"], "postprocess": ([a, _, b]) => App(App(Fun("Divide"), a), b)},
    {"name": "multdiv", "symbols": ["multdiv", {"literal":"%"}, "pow"], "postprocess": ([a, _, b]) => App(App(Fun("Mod"), a), b)},
    {"name": "multdiv", "symbols": ["pow"], "postprocess": id},
    {"name": "pow", "symbols": ["pow", {"literal":"**"}, "comp"], "postprocess": ([a, _, b]) => App(App(Fun("Pow"), a), b)},
    {"name": "pow", "symbols": ["op_fun"], "postprocess": id},
    {"name": "op_fun", "symbols": [{"literal":"("}, (lexer.has("binop") ? {type: "binop"} : binop), {"literal":")"}], "postprocess": d => Fun(opMap[d[1].value])},
    {"name": "op_fun", "symbols": [{"literal":"("}, "expr", (lexer.has("binop") ? {type: "binop"} : binop), {"literal":")"}], "postprocess": d => App(Fun(opMap[d[2].value]), d[1])},
    {"name": "op_fun", "symbols": [{"literal":"("}, (lexer.has("binop") ? {type: "binop"} : binop), "expr", {"literal":")"}], "postprocess": 
        d => Lambda(
          [Var('__a')],
          App(App(Fun(opMap[d[1].value]), Var('__a')), d[2])
        )
        },
    {"name": "op_fun", "symbols": ["str"], "postprocess": id},
    {"name": "str", "symbols": [(lexer.has("string") ? {type: "string"} : string)], "postprocess": ([str]) => Str(str.value.substr(1, str.value.length - 2))},
    {"name": "str", "symbols": ["term"], "postprocess": id},
    {"name": "term", "symbols": [(lexer.has("symb") ? {type: "symb"} : symb)], "postprocess": ([s]) => Fun(s.value)},
    {"name": "term", "symbols": ["var"], "postprocess": id},
    {"name": "term", "symbols": [(lexer.has("nil") ? {type: "nil"} : nil)], "postprocess": () => Fun('Nil')},
    {"name": "term", "symbols": [(lexer.has("unit") ? {type: "unit"} : unit)], "postprocess": () => Fun('Unit')},
    {"name": "term", "symbols": ["paren"], "postprocess": id},
    {"name": "paren", "symbols": [{"literal":"("}, "expr", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "var", "symbols": [{"literal":"_"}], "postprocess": () => ({ type: 'var', name: `any_${underscoresCount++}` })},
    {"name": "var", "symbols": [(lexer.has("varname") ? {type: "varname"} : varname)], "postprocess": ([v]) => ({ type: 'var', name: v.value })},
    {"name": "rule", "symbols": ["expr", {"literal":"="}, "expr", {"literal":";"}], "postprocess": ([lhs, _eq, rhs]) => ({ type: 'rule', lhs, rhs })},
    {"name": "rules", "symbols": ["non_empty_rules"], "postprocess": id},
    {"name": "non_empty_rules", "symbols": ["rule"], "postprocess": d => [d[0]]},
    {"name": "non_empty_rules", "symbols": ["non_empty_rules", "rule"], "postprocess": ([rs, r]) => [...rs, r]}
  ],
  ParserStart: "main",
};

export default grammar;
