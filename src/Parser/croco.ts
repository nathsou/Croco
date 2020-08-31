// Generated automatically by nearley, version 2.19.6
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }

interface NearleyToken {
  value: any;
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
  Lexer: undefined,
  ParserRules: [
    { "name": "main", "symbols": ["rules"], "postprocess": id },
    { "name": "symb$ebnf$1", "symbols": [] },
    { "name": "symb$ebnf$1", "symbols": ["symb$ebnf$1", /[a-zA-Z0-9\']/], "postprocess": (d) => d[0].concat([d[1]]) },
    { "name": "symb", "symbols": [/[A-Z0-9@]/, "symb$ebnf$1"], "postprocess": ([h, tl]) => h + tl.join('') },
    { "name": "term", "symbols": ["var"], "postprocess": id },
    { "name": "term", "symbols": ["fun"], "postprocess": id },
    { "name": "var", "symbols": ["varname"], "postprocess": ([v]) => ({ type: 'var', name: v }) },
    { "name": "varname$ebnf$1", "symbols": [] },
    { "name": "varname$ebnf$1", "symbols": ["varname$ebnf$1", /[a-zA-z0-9]/], "postprocess": (d) => d[0].concat([d[1]]) },
    { "name": "varname", "symbols": [/[a-z]/, "varname$ebnf$1"], "postprocess": ([h, tl]) => h + tl.join('') },
    { "name": "nullary_fun", "symbols": ["symb"], "postprocess": ([f]) => ({ type: 'fun', name: f, args: [] }) },
    { "name": "fun", "symbols": ["nullary_fun"], "postprocess": id },
    { "name": "fun", "symbols": ["fun_with_args"], "postprocess": id },
    { "name": "fun_with_args", "symbols": ["symb", "_+", "args"], "postprocess": ([f, _, args]) => ({ type: 'fun', name: f, args }) },
    { "name": "single_arg", "symbols": ["var"], "postprocess": id },
    { "name": "single_arg", "symbols": ["nullary_fun"], "postprocess": id },
    { "name": "single_arg$string$1", "symbols": [{ "literal": "[" }, { "literal": "]" }], "postprocess": (d) => d.join('') },
    { "name": "single_arg", "symbols": ["single_arg$string$1"], "postprocess": () => ({ type: 'fun', name: 'Nil', args: [] }) },
    { "name": "single_arg", "symbols": [{ "literal": "(" }, "_", "expr", "_", { "literal": ")" }], "postprocess": d => d[2] },
    { "name": "args", "symbols": ["single_arg"], "postprocess": ([arg]) => [arg] },
    { "name": "args", "symbols": ["args", "_+", "single_arg"], "postprocess": ([as, _, a]) => [...as, a] },
    {
      "name": "rule", "symbols": ["fun", "_", { "literal": "=" }, "_", "expr"], "postprocess": d => {
        const { name, args } = d[0];
        return { type: 'rule', name, args, body: d[4] };
      }
    },
    { "name": "expr", "symbols": ["list"], "postprocess": id },
    { "name": "list", "symbols": ["nil"], "postprocess": id },
    { "name": "consed_exprs", "symbols": ["expr"], "postprocess": ([e]) => ({ type: 'fun', name: ':', args: [e, { type: 'fun', name: 'Nil', args: [] }] }) },
    { "name": "consed_exprs", "symbols": ["consed_exprs", "_", { "literal": "," }, "_", "expr"], "postprocess": d => ({ type: 'fun', name: ':', args: [d[0], d[4]] }) },
    { "name": "nil$string$1", "symbols": [{ "literal": "[" }, { "literal": "]" }], "postprocess": (d) => d.join('') },
    { "name": "nil", "symbols": ["nil$string$1"], "postprocess": () => ({ type: 'fun', name: 'Nil', args: [] }) },
    { "name": "list", "symbols": [{ "literal": "[" }, "_", "consed_exprs", "_", { "literal": "]" }], "postprocess": d => d[2] },
    { "name": "list", "symbols": ["If"], "postprocess": id },
    { "name": "If$string$1", "symbols": [{ "literal": "i" }, { "literal": "f" }], "postprocess": (d) => d.join('') },
    { "name": "If$string$2", "symbols": [{ "literal": "t" }, { "literal": "h" }, { "literal": "e" }, { "literal": "n" }], "postprocess": (d) => d.join('') },
    { "name": "If$string$3", "symbols": [{ "literal": "e" }, { "literal": "l" }, { "literal": "s" }, { "literal": "e" }], "postprocess": (d) => d.join('') },
    {
      "name": "If", "symbols": ["If$string$1", "_", "expr", "_", "If$string$2", "_", "expr", "_", "If$string$3", "_", "expr"], "postprocess":
        d => ({ type: 'fun', name: 'if', args: [d[2], d[6], d[10]] })
    },
    { "name": "If", "symbols": ["Comp"], "postprocess": id },
    { "name": "P", "symbols": [{ "literal": "(" }, "_", "expr", "_", { "literal": ")" }], "postprocess": d => d[2] },
    { "name": "P", "symbols": ["term"], "postprocess": id },
    { "name": "Cons", "symbols": ["P", "_", { "literal": ":" }, "_", "P"], "postprocess": d => ({ type: 'fun', name: ':', args: [d[0], d[4]] }) },
    { "name": "Cons", "symbols": ["P"], "postprocess": id },
    { "name": "Pow$string$1", "symbols": [{ "literal": "*" }, { "literal": "*" }], "postprocess": (d) => d.join('') },
    { "name": "Pow", "symbols": ["Cons", "_", "Pow$string$1", "_", "Cons"], "postprocess": d => ({ type: 'fun', name: '@pow', args: [d[0], d[4]] }) },
    { "name": "Pow", "symbols": ["Cons"], "postprocess": id },
    { "name": "MD", "symbols": ["MD", "_", { "literal": "*" }, "_", "Pow"], "postprocess": d => ({ type: 'fun', name: '@mult', args: [d[0], d[4]] }) },
    { "name": "MD", "symbols": ["MD", "_", { "literal": "/" }, "_", "Pow"], "postprocess": d => ({ type: 'fun', name: '@div', args: [d[0], d[4]] }) },
    { "name": "MD", "symbols": ["MD", "_", { "literal": "%" }, "_", "Pow"], "postprocess": d => ({ type: 'fun', name: '@mod', args: [d[0], d[4]] }) },
    { "name": "MD", "symbols": ["Pow"], "postprocess": id },
    { "name": "AS", "symbols": ["AS", "_", { "literal": "+" }, "_", "MD"], "postprocess": d => ({ type: 'fun', name: '@add', args: [d[0], d[4]] }) },
    { "name": "AS", "symbols": ["AS", "_", { "literal": "-" }, "_", "MD"], "postprocess": d => ({ type: 'fun', name: '@sub', args: [d[0], d[4]] }) },
    { "name": "AS", "symbols": ["MD"], "postprocess": id },
    { "name": "Comp$string$1", "symbols": [{ "literal": "=" }, { "literal": "=" }], "postprocess": (d) => d.join('') },
    { "name": "Comp", "symbols": ["Comp", "_", "Comp$string$1", "_", "AS"], "postprocess": d => ({ type: 'fun', name: '@equ', args: [d[0], d[4]] }) },
    { "name": "Comp", "symbols": ["Comp", "_", { "literal": ">" }, "_", "AS"], "postprocess": d => ({ type: 'fun', name: '@gtr', args: [d[0], d[4]] }) },
    { "name": "Comp$string$2", "symbols": [{ "literal": ">" }, { "literal": "=" }], "postprocess": (d) => d.join('') },
    { "name": "Comp", "symbols": ["Comp", "_", "Comp$string$2", "_", "AS"], "postprocess": d => ({ type: 'fun', name: '@geq', args: [d[0], d[4]] }) },
    { "name": "Comp", "symbols": ["Comp", "_", { "literal": "<" }, "_", "AS"], "postprocess": d => ({ type: 'fun', name: '@lss', args: [d[0], d[4]] }) },
    { "name": "Comp$string$3", "symbols": [{ "literal": "<" }, { "literal": "=" }], "postprocess": (d) => d.join('') },
    { "name": "Comp", "symbols": ["Comp", "_", "Comp$string$3", "_", "AS"], "postprocess": d => ({ type: 'fun', name: '@leq', args: [d[0], d[4]] }) },
    { "name": "Comp", "symbols": ["AS"], "postprocess": id },
    { "name": "rules", "symbols": ["non_empty_rules"], "postprocess": id },
    { "name": "non_empty_rules", "symbols": ["_", "rule", "_"], "postprocess": d => [d[1]] },
    { "name": "non_empty_rules", "symbols": ["non_empty_rules", "nl", "rule"], "postprocess": ([rs, _, r]) => [...rs, r] },
    { "name": "_$ebnf$1", "symbols": [] },
    { "name": "_$ebnf$1", "symbols": ["_$ebnf$1", /[\s]/], "postprocess": (d) => d[0].concat([d[1]]) },
    { "name": "_", "symbols": ["_$ebnf$1"], "postprocess": () => null },
    { "name": "_+$ebnf$1", "symbols": [/[\s]/] },
    { "name": "_+$ebnf$1", "symbols": ["_+$ebnf$1", /[\s]/], "postprocess": (d) => d[0].concat([d[1]]) },
    { "name": "_+", "symbols": ["_+$ebnf$1"], "postprocess": () => null },
    { "name": "nl$ebnf$1", "symbols": [{ "literal": "\n" }] },
    { "name": "nl$ebnf$1", "symbols": ["nl$ebnf$1", { "literal": "\n" }], "postprocess": (d) => d[0].concat([d[1]]) },
    { "name": "nl", "symbols": ["nl$ebnf$1"], "postprocess": () => null }
  ],
  ParserStart: "main",
};

export default grammar;
