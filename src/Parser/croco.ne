@preprocessor typescript

@{%
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
  binop: ['+', '-', '*', '/', '%', '**', '<', '<=', '>', '>=', '==', ':'],
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
  comment: /#.*?$/,
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
  '+': '@add',
  '-': '@sub',
  '*': '@mult',
  '/': '@div',
  '**': '@pow',
  '%': '@mod',
  '==': '@equ',
  '<': '@lss',
  '<=': '@leq',
  '>': '@gtr',
  '>=': '@geq',
  ':': ':'
};

let underscoresCount = 0;

%}

@lexer lexer

main -> rules {% id %}

expr -> lambda {% id %}

lambda_args -> cons {% ([e]) => [e] %}
lambda_args -> lambda_args cons {% ([es, e]) => [...es, e] %}

lambda -> "\\" lambda_args "->" expr {% d => Lambda(d[1], d[3]) %}
lambda -> let_in {% id %}

let_in -> "let" expr "=" expr "in" expr {% d => LetIn(d[1], d[3], d[5]) %}
let_in -> comp {% id %}

comp -> comp "<"  if {% ([a, _, b]) => Fun("@lss", a, b) %}
comp -> comp "<=" if {% ([a, _, b]) => Fun("@leq", a, b) %}
comp -> comp ">"  if {% ([a, _, b]) => Fun("@gtr", a, b) %}
comp -> comp ">=" if {% ([a, _, b]) => Fun("@geq", a, b) %}
comp -> comp "==" if {% ([a, _, b]) => Fun("@equ", a, b) %}
comp -> if {% id %}

if -> "if" expr "then" expr "else" expr {% 
([if_, cond, then_, thenExpr, else_, elseExpr]) => Fun('if', cond, thenExpr, elseExpr)
%}
if -> app {% id %}

app -> app cons {% ([lhs, rhs]) => App(lhs, rhs) %}
app -> cons {% id %}

cons -> list ":" cons {% ([h, _, tl]) => Fun(':', h, tl) %}
cons -> list {% id %}

list -> "[" list_elems "]" {% d => d[1] %}
list_elems -> expr {% ([e]) => Fun(':', e, Fun('Nil')) %}
list_elems -> expr "," list_elems {% ([e, _, es]) => Fun(':', e, es) %}
list -> tuple {% id %}

tuple -> "(" tuple_elems ")" {% d => d[1] %}
tuple_elems -> expr "," expr {% ([a, _, b]) => Fun(';', a, Fun(';', b, Fun('Unit')))  %}
tuple_elems -> expr "," tuple_elems {% ([e, _, es]) => Fun(';', e, es) %}
tuple -> custom_op {% id %}

custom_op -> custom_op %backtick %symb %backtick expr {% d => App(App(Fun(d[2].value), d[0]), d[4]) %}
custom_op -> addsub {% id %}

addsub -> addsub "+" multdiv {% ([a, _, b]) => Fun("@add", a, b) %}
addsub -> addsub "-" multdiv {% ([a, _, b]) => Fun("@sub", a, b) %}
addsub -> multdiv {% id %}

multdiv -> multdiv "*" pow {% ([a, _, b]) => Fun("@mult", a, b) %}
multdiv -> multdiv "/" pow {% ([a, _, b]) => Fun("@div", a, b) %}
multdiv -> multdiv "%" pow {% ([a, _, b]) => Fun("@mod", a, b) %}
multdiv -> pow {% id %}
pow -> pow "**" comp {% ([a, _, b]) => Fun("**", a, b) %}
pow -> op_fun {% id %}

op_fun -> "(" %binop ")" {%
  d => Lambda(
    [Var('__a'), Var('__b')],
    Fun(opMap[d[1].value], Var('__a'), Var('__b'))
  )
%}
op_fun -> "(" expr %binop ")" {%
  d => Lambda(
    [Var('__b')],
    Fun(opMap[d[2].value], d[1], Var('__b'))
  )
%}
op_fun -> "(" %binop expr ")" {%
  d => Lambda(
    [Var('__a')],
    Fun(opMap[d[1].value], Var('__a'), d[2])
  )
%}
op_fun -> str {% id %}

str -> %string {% ([str]) => Str(str.value.substr(1, str.value.length - 2)) %}
str -> term {% id %}

term -> %symb {% ([s]) => Fun(s.value) %}
term -> var {% id %}
term -> %nil {% () => Fun('Nil') %}
term -> %unit {% () => Fun('Unit') %}
term -> paren {% id %}

paren -> "(" expr ")" {% d => d[1] %}

var -> "_" {% () => ({ type: 'var', name: `any_${underscoresCount++}` }) %}
var -> %varname {% ([v]) => ({ type: 'var', name: v.value }) %}

rule -> expr "=" expr ";" {% ([lhs, _eq, rhs]) => ({ type: 'rule', lhs, rhs }) %}

# rules -> _ null _ {% () => [] %}
rules -> non_empty_rules {% id %}
non_empty_rules -> rule {% d => [d[0]] %}
non_empty_rules -> non_empty_rules rule {% ([rs, r]) => [...rs, r] %}