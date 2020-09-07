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
  lambda: '\\',
  backtick: '`',
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

const Lambda = (args, rhs) => lambdaAux([...args].reverse(), rhs);

const lambdaAux = (args, rhs) => {
  if (args.length === 1) return { type: 'lambda', x: args[0], rhs };
  const [h, tl] = [args[0], args.slice(1)];
  return Lambda(tl, { type: 'lambda', x: h, rhs });
};

const LetIn = (x, val, rhs) => App(Lambda([x], rhs), val);
%}

@lexer lexer

main -> rules {% id %}

expr -> lambda {% id %}

lambda_args -> cons {% ([e]) => [e] %}
lambda_args -> lambda_args cons {% ([es, e]) => [...es, e] %}

lambda -> "\\" lambda_args "->" expr {% d => Lambda(d[1], d[3]) %}
lambda -> comp {% id %}

comp -> comp "<"  let_in {% ([a, _, b]) => Fun("@lss", a, b) %}
comp -> comp "<=" let_in {% ([a, _, b]) => Fun("@leq", a, b) %}
comp -> comp ">"  let_in {% ([a, _, b]) => Fun("@gtr", a, b) %}
comp -> comp ">=" let_in {% ([a, _, b]) => Fun("@geq", a, b) %}
comp -> comp "==" let_in {% ([a, _, b]) => Fun("@equ", a, b) %}
comp -> let_in {% id %}

let_in -> "let" expr "=" expr "in" expr {% d => LetIn(d[1], d[3], d[5]) %}
let_in -> if {% id %}

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
pow -> term {% id %}

term -> %symb {% ([s]) => Fun(s.value) %}
term -> var {% id %}
term -> %nil {% () => Fun('Nil') %}
term -> %unit {% () => Fun('Unit') %}
term -> paren {% id %}

paren -> "(" expr ")" {% d => d[1] %}

var -> %varname {% ([v]) => ({ type: 'var', name: v.value }) %}

rule -> expr "=" %nl:* expr {% ([lhs, _eq, _nls, rhs]) => ({ type: 'rule', lhs, rhs }) %}

# rules -> _ null _ {% () => [] %}
rules -> non_empty_rules {% id %}
non_empty_rules -> rule {% d => [d[0]] %}
non_empty_rules -> non_empty_rules %nl:+ rule {% ([rs, _, r]) => [...rs, r] %}