import { LambdaExpr, Prog, RuleDecl, Term } from "../../Parser/Expr";

type L = Term | LambdaExpr;

let lambdasCount = 0;

export const removeLambdas = (prog: Prog<L>): Prog<Exclude<L, LambdaExpr>> => {
    const newRules: Prog<Term> = [];
    lambdasCount = 0;

    for (const { lhs, rhs } of prog) {
        newRules.push({
            type: 'rule',
            lhs: lhs as Term,
            rhs: removeLambdasIn(
                rhs,
                rule => { newRules.push(rule); }
            )
        });
    }

    return newRules;
};

// TODO: support nested lambda expressions and variable capturing
const removeLambdasIn = (
    expr: L,
    addRule: (rule: RuleDecl<Term>) => void
): Term => {
    switch (expr.type) {
        case 'lambda':
            const name = `lambda${lambdasCount++}`;

            const rule: RuleDecl<Exclude<L, LambdaExpr>> = {
                type: 'rule',
                lhs: { type: 'fun', name: 'app', args: [{ type: 'fun', name, args: [] }, expr.x] },
                rhs: removeLambdasIn(expr.expr, addRule)
            };

            addRule(rule);

            return { type: 'fun', name, args: [] };

        case 'fun':
            return {
                type: 'fun',
                name: expr.name,
                args: expr.args.map(t => removeLambdasIn(t, addRule))
            };
    }

    return expr;
};