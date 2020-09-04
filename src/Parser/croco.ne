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
  binop: ['+', '-', '*', '/', '%', '**', '<', '<=', '>', '>=', '==', ':'],
  comma: ',',
  assign: '=',
  lparen: '(',
  rparen: ')',
  nil: '[]',
  lbracket: '[',
  rbracket: ']',
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
const LetIn = (x, val, rhs) => ({ type: 'let_in', x, val, rhs });
%}

@lexer lexer

main -> rules {% id %}

expr -> app {% id %}

app -> app cons {% ([lhs, rhs]) => App(lhs, rhs) %}
app -> cons {% id %}

cons -> cons ":" list {% ([h, _, tl]) => Fun(':', h, tl) %}
cons -> list {% id %}

list -> %lbracket list_elems %rbracket {% d => d[1] %}
list_elems -> expr {% ([e]) => Fun(':', e, Fun('Nil')) %}
list_elems -> expr "," list_elems {% ([e, _, es]) => Fun(':', e, es) %}
list -> let_in {% id %}

let_in -> "let" expr "=" expr "in" expr {% d => LetIn(d[1], d[3], d[5]) %}
let_in -> if {% id %}

# if expression
if -> "if" expr "then" expr "else" expr {% 
([if_, cond, then_, thenExpr, else_, elseExpr]) => Fun('if', cond, thenExpr, elseExpr)
%}
if -> addsub {% id %}

addsub -> addsub "+" multdiv {% ([a, _, b]) => Fun("@add", a, b) %}
addsub -> addsub "-" multdiv {% ([a, _, b]) => Fun("@sub", a, b) %}
addsub -> multdiv {% id %}

multdiv -> multdiv "*" pow {% ([a, _, b]) => Fun("@mult", a, b) %}
multdiv -> multdiv "/" pow {% ([a, _, b]) => Fun("@div", a, b) %}
multdiv -> multdiv "%" pow {% ([a, _, b]) => Fun("@mod", a, b) %}
multdiv -> pow {% id %}

pow -> pow "**" comp {% ([a, _, b]) => Fun("**", a, b) %}
pow -> comp {% id %}

comp -> comp "<"  cons {% ([a, _, b]) => Fun("@lss", a, b) %}
comp -> comp "<=" cons {% ([a, _, b]) => Fun("@leq", a, b) %}
comp -> comp ">"  cons {% ([a, _, b]) => Fun("@gtr", a, b) %}
comp -> comp ">=" cons {% ([a, _, b]) => Fun("@geq", a, b) %}
comp -> comp "==" cons {% ([a, _, b]) => Fun("@equ", a, b) %}
comp -> term {% id %}

term -> %symb {% ([s]) => Fun(s.value) %}
term -> var {% id %}
term -> %nil {% () => Fun('Nil') %}
term -> paren {% id %}

paren -> "(" expr ")" {% d => d[1] %}

var -> %varname {% ([v]) => ({ type: 'var', name: v.value }) %}

rule -> expr "=" %nl:* expr {% ([lhs, _eq, _nls, rhs]) => ({ type: 'rule', lhs, rhs }) %}

# rules -> _ null _ {% () => [] %}
rules -> non_empty_rules {% id %}
non_empty_rules -> rule {% d => [d[0]] %}
non_empty_rules -> non_empty_rules %nl:+ rule {% ([rs, _, r]) => [...rs, r] %}