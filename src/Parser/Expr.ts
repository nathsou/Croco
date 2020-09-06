import { isFun, isVar, Rule as grfRule, showTerm as grfShowterm, Term as grfTerm, decons } from 'girafe';

export type Prog<E = Expr> = RuleDecl<E>[];
export type Decl = RuleDecl;
export type Expr = Term | LambdaExpr;

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

export type LetInExpr = {
    type: 'let_in',
    x: Term,
    val: Expr,
    rhs: Expr
};

export type LambdaExpr = {
    type: 'lambda',
    x: Term,
    rhs: Expr
};

export type RuleDecl<E = Expr> = {
    type: 'rule',
    lhs: E,
    rhs: E
};

export const grfTermOf = (t: Term): grfTerm => {
    if (t.type === 'var') return t.name;
    return { name: t.name, args: t.args.map(grfTermOf) };
};

export const grfRuleOf = (rule: RuleDecl<Term>): grfRule => {
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

export const postprocessTerm = (term: grfTerm): string => {
    if (isVar(term)) return term;
    if (term.name === 'Nil') return '[]';
    if (term.name === 'Unit') return '()';

    const f = term.name.replace(/_(sim)[0-9]+/g, '');

    if (term.args.length === 0) return f;

    switch (f) {
        case ':':
            const [h, tl] = term.args;
            return `[${postprocessList(h, tl)}]`;
        case 'app':
            const [f, x] = term.args;
            return `(${postprocessTerm(f)} ${postprocessTerm(x)})`;
        default:
            return grfShowterm(term);
    }
};

export const postprocessList = (head: grfTerm, tail: grfTerm): string => {
    if (isVar(tail) || (tail.name !== ':' && tail.name !== 'Nil')) {
        throw new Error(`Expected ':' or 'Nil' at the tail of a list, got: ${grfShowterm(tail)}`);
    }

    if (tail.name === 'Nil') return postprocessTerm(head);

    const [h, tl] = tail.args;

    return `${postprocessTerm(head)}, ${postprocessList(h, tl)}`
};

export const showExpr = (expr: Expr): string => {
    switch (expr.type) {
        case 'fun':
        case 'var':
            return showTerm(expr);
        case 'lambda':
            return `$(\\${showTerm(expr.x)} -> ${showExpr(expr.rhs)})`;
    }
};

export const showRule = (rule: RuleDecl): string => {
    return `${showExpr(rule.lhs)} = ${showExpr(rule.rhs)}`;
};

export const showProg = (prog: Prog): string => {
    return prog.map(showRule).join('\n');
};

export const fun = (name: string, ...args: Term[]): Fun => ({ type: 'fun', name, args });
export const app = (lhs: Term, rhs: Term): Fun => fun('app', lhs, rhs);

export const rev = <T>(lst: readonly T[]): T[] => {
    const r: T[] = [];
    for (let i = lst.length - 1; i >= 0; i--) {
        r.push(lst[i]);
    }

    return r;
};

export const appChain = (lhs: Term, args: Term[]): Term => {
    return appChainAux(lhs, rev(args));
};

const appChainAux = (lhs: Term, args: Term[]): Term => {
    if (args.length === 0) return lhs;
    if (args.length === 1) return app(lhs, args[0]);

    const [h, tl] = decons(args);
    return app(appChain(lhs, tl), h);
};

export const vars = (expr: Expr, acc: string[] = []): string[] => {
    if (expr.type === 'var') {
        acc.push(expr.name);
        return acc;
    }

    if (expr.type === 'lambda') {
        return [...vars(expr.x), ...vars(expr.rhs)];
    }

    return expr.args.reduce((acc, t) => vars(t, acc), acc);
};

export const freeVars = (expr: Expr, acc: string[] = []): string[] => {
    switch (expr.type) {
        case 'var':
            acc.push(expr.name);
            return acc;
        case 'fun':
            return expr.args.reduce((acc, t) => freeVars(t, acc), acc);
        case 'lambda':
            const vs = freeVars(expr.x);
            acc.push(...freeVars(expr.rhs).filter(v => !vs.includes(v)));
            return acc;
    }
};