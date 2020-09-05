import { fun, isFun, isVar, Rule as grfRule, showTerm as grfShowterm, Term as grfTerm } from 'girafe';

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
    expr: Expr
};

export type RuleDecl<E = Expr> = {
    type: 'rule',
    lhs: E,
    rhs: E
};

export const grfTermOf = (t: Term): grfTerm => {
    if (t.type === 'var') return t.name;
    return fun(t.name, ...t.args.map(grfTermOf));
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
    if (term.args.length === 0) return term.name;

    switch (term.name) {
        case 'Nil':
            return '[]';
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
            return `$(\\${showTerm(expr.x)} -> ${showExpr(expr.expr)})`;
    }
};

export const showRule = (rule: RuleDecl): string => {
    return `${showExpr(rule.lhs)} = ${showExpr(rule.rhs)}`;
};

export const showProg = (prog: Prog): string => {
    return prog.map(showRule).join('\n');
};

// export const vars = (expr: Expr, acc: string[] = []): string[] => {
//     if (expr.type === 'var') {
//         acc.push(expr.name);
//         return acc;
//     }

//     if (expr.type === 'let_in') {
//         return [...vars(expr.x), ...vars(expr.val), ...vars(expr.rhs)];
//     }

//     return expr.args.reduce((acc, t) => vars(t, acc), acc);
// };