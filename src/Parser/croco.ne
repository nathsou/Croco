@preprocessor typescript

main -> rules {% id %}

symb -> [A-Z0-9@] [a-zA-Z0-9\']:* {% ([h, tl]) => h + tl.join('') %}

term -> var {% id %}
term -> fun {% id %}
var -> varname {% ([v]) => ({ type: 'var', name: v }) %}

varname -> [a-z] [a-zA-z0-9]:* {% ([h, tl]) => h + tl.join('') %}

nullary_fun -> symb {% ([f]) => ({ type: 'fun', name: f, args: [] }) %}
fun -> nullary_fun {% id %}
fun -> fun_with_args {% id %}

fun_with_args -> symb _+ args {% ([f, _, args]) => ({ type: 'fun', name: f, args }) %}

single_arg -> var {% id %}
single_arg -> nullary_fun {% id %}
single_arg -> "[]" {% () => ({ type: 'fun', name: 'Nil', args: [] }) %}
single_arg -> "(" _ expr _ ")" {% d => d[2] %}

args -> single_arg {% ([arg]) => [arg] %}
args -> args _+ single_arg {% ([as, _, a]) => [...as, a] %}

rule -> fun _ "=" _ expr {% d => {
    const { name, args } = d[0];
    return { type: 'rule', name, args, body: d[4] };
} %}

expr -> list {% id %}

# lists
list -> nil {% id %}

consed_exprs -> expr {% ([e]) => ({ type: 'fun', name: ':', args: [e, { type: 'fun', name: 'Nil', args: [] }] }) %}
consed_exprs -> consed_exprs _ "," _ expr {% d => ({ type: 'fun', name: ':', args: [d[0], d[4]] }) %}

nil -> "[]" {% () => ({ type: 'fun', name: 'Nil', args: [] }) %}

list -> "[" _ consed_exprs _ "]" {% d => d[2] %}
list -> If {% id %}

# if expression
If -> "if" _ expr _ "then" _ expr _ "else" _ expr {% 
    d => ({ type: 'fun', name: 'if', args: [d[2], d[6], d[10]] })
%}
If -> Comp {% id %}

# # Parentheses
P -> "(" _ expr _ ")" {% d => d[2] %}
P -> term {% id %}

Cons -> P _ ":" _ P {% d => ({ type: 'fun', name: ':', args: [d[0], d[4]] }) %}
Cons -> P {% id %}

# Exponents
Pow -> Cons _ "**" _ Cons {% d => ({ type: 'fun', name: '@pow', args: [d[0], d[4]] }) %}
    | Cons {% id %}

# Multiplication and division
MD -> MD _ "*" _ Pow  {% d => ({ type: 'fun', name: '@mult', args: [d[0], d[4]] }) %}
    | MD _ "/" _ Pow  {% d => ({ type: 'fun', name: '@div', args: [d[0], d[4]] }) %}
    | MD _ "%" _ Pow  {% d => ({ type: 'fun', name: '@mod', args: [d[0], d[4]] }) %}
    | Pow {% id %}

# Addition and subtraction
AS -> AS _ "+" _ MD {% d => ({ type: 'fun', name: '@add', args: [d[0], d[4]] }) %}
AS -> AS _ "-" _ MD {% d => ({ type: 'fun', name: '@sub', args: [d[0], d[4]] }) %}
    | MD {% id %}

Comp -> Comp _ "==" _ AS {% d => ({ type: 'fun', name: '@equ', args: [d[0], d[4]] }) %}
Comp -> Comp _ ">" _ AS {% d => ({ type: 'fun', name: '@gtr', args: [d[0], d[4]] }) %}
Comp -> Comp _ ">=" _ AS {% d => ({ type: 'fun', name: '@geq', args: [d[0], d[4]] }) %}
Comp -> Comp _ "<" _ AS {% d => ({ type: 'fun', name: '@lss', args: [d[0], d[4]] }) %}
Comp -> Comp _ "<=" _ AS {% d => ({ type: 'fun', name: '@leq', args: [d[0], d[4]] }) %}
Comp -> AS {% id %}

# rules -> _ null _ {% () => [] %}
rules -> non_empty_rules {% id %}
non_empty_rules -> _ rule _ {% d => [d[1]] %}
non_empty_rules -> non_empty_rules nl rule {% ([rs, _, r]) => [...rs, r] %}

# Whitespace. The important thing here is that the postprocessor
# is a null-returning function. This is a memory efficiency trick.
_ -> [\s]:* {% () => null %}
_+ -> [\s]:+ {% () => null %}
nl -> "\n":+ {% () => null %}