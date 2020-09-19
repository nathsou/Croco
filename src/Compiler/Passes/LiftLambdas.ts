import { uniq } from "girafe";
import { appChain, freeVars, fun, LambdaExpr, Prog, rev, RuleDecl, Term, Var } from "../../Parser/Expr";

type L = Term | LambdaExpr;

export const liftLambdas = (prog: Prog<L>, previousLambdasCount = 0): Prog<Exclude<L, LambdaExpr>> => {
    const newRules: Prog<Term> = [];

    // TODO: Find a better way to give each lamda a unique name
    const counter = new Counter(previousLambdasCount);

    for (const { lhs, rhs } of prog) {
        newRules.push({
            type: 'rule',
            lhs: lhs as Term,
            rhs: lift(
                rhs,
                rule => { newRules.push(rule); },
                counter
            )
        });
    }

    return newRules;
};

export const lambdaPrefix = 'lambda';

export const lift = (
    expr: L,
    addRule: (rule: RuleDecl<Term>) => void,
    lambdasCounter: Counter,
    prefix = lambdaPrefix
): Term => {
    switch (expr.type) {
        case 'lambda':
            const name = `${prefix}${lambdasCounter.next()}`;
            const vs: Var[] = uniq(freeVars(expr)).map(v => ({ type: 'var', name: v }));

            const rule: RuleDecl<Exclude<L, LambdaExpr>> = {
                type: 'rule',
                lhs: appChain(fun(name), [...vs, expr.x]),
                rhs: lift(expr.rhs, addRule, lambdasCounter, prefix)
            };

            addRule(rule);

            return appChain(fun(name), rev(vs));

        case 'fun':
            return {
                type: 'fun',
                name: expr.name,
                args: expr.args.map(t => lift(t, addRule, lambdasCounter, prefix))
            };
    }

    return expr;
};

export class Counter {
    protected current: number;

    constructor(initialCount = 0) {
        this.current = initialCount;
    }

    public next(): number {
        return this.current++;
    }
}