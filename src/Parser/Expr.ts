import { fun, Rule as grfRule, Term as grfTerm } from 'girafe';

export type Prog = RuleDecl[];
export type Decl = RuleDecl;
export type Expr = Term;

export type Term = Var | Fun;

export type Var = {
    type: 'var',
    name: string
};

export type Fun = {
    type: 'fun',
    name: string,
    args: Term[]
};

export type RuleDecl = {
    type: 'rule',
    name: string,
    args: Expr[],
    body: Expr
};

export const grfTermOf = (t: Term): grfTerm => {
    if (t.type === 'var') return t.name;
    return fun(t.name, ...t.args.map(grfTermOf));
};

export const grfRuleOf = (rule: RuleDecl): grfRule => {
    return [fun(rule.name, ...rule.args.map(grfTermOf)), grfTermOf(rule.body)];
};