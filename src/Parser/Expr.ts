import { decons, isFun, isVar, Rule as grfRule, showTerm as grfShowterm, Term as grfTerm } from 'girafe';

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

export const croTermOf = (t: grfTerm): Term => {
    if (isVar(t)) return varOf(t);
    return { type: 'fun', name: t.name, args: t.args.map(croTermOf) };
};

export const grfTermOf = (t: Term): grfTerm => {
    if (t.type === 'var') return t.name;
    return { name: t.name, args: t.args.map(grfTermOf) };
};

export const croRuleOf = ([lhs, rhs]: grfRule): RuleDecl => {
    return {
        type: 'rule',
        lhs: croTermOf(lhs),
        rhs: croTermOf(rhs)
    };
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
    if (term.type !== 'fun') return showExpr(term);
    if (term.args.length === 0) return term.name;
    return `(${term.name} ${term.args.map(showTerm).join(' ')})`;
};

export const fromList = (lst: grfTerm, acc: grfTerm[] = []): grfTerm[] => {
    if (!isFun(lst, ':') && !isFun(lst, 'Nil')) {
        throw new Error(`Trying to convert an invalid list to an array: ${grfShowterm(lst)}`);
    }

    if (lst.name === 'Nil') return acc;

    const [h, tl] = lst.args;
    acc.push(h);
    return fromList(tl, acc);
};

export const postprocessTerm = (term: grfTerm): string => {
    if (isVar(term)) return term;
    if (term.name === 'Nil') return '[]';
    if (term.name === 'Unit') return '()';

    const f = term.name.replace(/_(sim)[0-9]+/g, '');

    if (term.args.length === 0) return f;

    switch (f) {
        case ':':
            {
                const [h, tl] = term.args;
                return `[${postprocessList(h, tl)}]`;
            }
        case ';':
            {
                const [h, tl] = term.args;
                return `(${postprocessList(h, tl, 'Unit', ';')})`;
            }
        case 'app':
            const [f, x] = term.args;

            if (isFun(f, 'String')) {
                return '"' + String.fromCharCode(...fromList(x).map(t => parseInt((t as Fun).name))) + '"';
            }

            return `(${postprocessTerm(f)} ${postprocessTerm(x)})`;
        default:
            return `(${term.name} ${term.args.map(postprocessTerm).join(' ')})`;
    }
};

export const postprocessList = (
    head: grfTerm,
    tail: grfTerm,
    nil = 'Nil',
    cons = ':'
): string => {
    if (isVar(tail) || (tail.name !== cons && tail.name !== nil)) {
        throw new Error(`Expected '${cons}' or '${nil}' at the end of a ${nil === 'Nil' ? 'list' : 'tuple'}, got: ${grfShowterm(tail)}`);
    }

    if (tail.name === nil) return postprocessTerm(head);

    const [h, tl] = tail.args;

    return `${postprocessTerm(head)}, ${postprocessList(h, tl, nil, cons)}`;
};

export const showExpr = (expr: Expr): string => {
    switch (expr.type) {
        case 'fun':
        case 'var':
            return showTerm(expr);
        case 'lambda':
            return `\\${showTerm(expr.x)} -> ${showExpr(expr.rhs)}`;
    }
};

export const showRule = (rule: RuleDecl): string => {
    return `${showExpr(rule.lhs)} = ${showExpr(rule.rhs)}`;
};

export const showProg = (prog: Prog): string => {
    return prog.map(showRule).join('\n');
};

export const varOf = (name: string): Var => ({ type: 'var', name });
export const fun = (name: string, ...args: Term[]): Fun => ({ type: 'fun', name, args });
export const app = (lhs: Term, rhs: Term): Fun => fun('app', lhs, rhs);
export const ruleOf = ([lhs, rhs]: [Fun, Term]): RuleDecl => ({
    type: 'rule',
    lhs,
    rhs
});

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