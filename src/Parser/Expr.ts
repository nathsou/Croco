import { fun, isFun, Rule as grfRule, showTerm as grfShowterm, Term as grfTerm } from 'girafe';

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
    lhs: Expr,
    rhs: Expr
};

export const grfTermOf = (t: Term): grfTerm => {
    if (t.type === 'var') return t.name;
    return fun(t.name, ...t.args.map(grfTermOf));
};

export const grfRuleOf = (rule: RuleDecl): grfRule => {
    const lhs = grfTermOf(rule.lhs);

    if (isFun(lhs)) {
        return [lhs, grfTermOf(rule.rhs)];
    }

    throw new Error(`rule lhs is not Fun: ${grfShowterm(lhs)}`);
};

export const showTerm = (term: Term): string => {
    if (term.type === 'var') return term.name;
    if (term.args.length === 0) return term.name;
    return `(${term.name} ${term.args.map(showTerm).join(' ')})`;
};

export const showExpr = (expr: Expr): string => {
    switch (expr.type) {
        case 'fun':
        case 'var':
            return showTerm(expr);
    }
};

export const showRule = (rule: RuleDecl): string => {
    return `${showExpr(rule.lhs)} = ${showExpr(rule.rhs)}`;
};

export const showProg = (prog: Prog): string => {
    return prog.map(showRule).join('\n');
};