import { uniq } from "girafe";
import { appChain, freeVars, fun, LambdaExpr, Prog, rev, RuleDecl, Term, Var } from "../../Parser/Expr";
type L = Term | LambdaExpr;

let lambdasCount = 0;

export const liftLambdas = (prog: Prog<L>): Prog<Exclude<L, LambdaExpr>> => {
    const newRules: Prog<Term> = [];
    lambdasCount = 0;

    for (const { lhs, rhs } of prog) {
        newRules.push({
            type: 'rule',
            lhs: lhs as Term,
            rhs: lift(
                rhs,
                rule => { newRules.push(rule); }
            )
        });
    }

    return newRules;
};

const lift = (
    expr: L,
    addRule: (rule: RuleDecl<Term>) => void
): Term => {
    switch (expr.type) {
        case 'lambda':
            const name = `lambda${lambdasCount++}`;
            const vs: Var[] = uniq(freeVars(expr)).map(v => ({ type: 'var', name: v }));

            const rule: RuleDecl<Exclude<L, LambdaExpr>> = {
                type: 'rule',
                lhs: appChain(fun(name), [...vs, expr.x]),
                rhs: lift(expr.rhs, addRule)
            };

            addRule(rule);

            return appChain(fun(name), rev(vs));

        case 'fun':
            return {
                type: 'fun',
                name: expr.name,
                args: expr.args.map(t => lift(t, addRule))
            };
    }

    return expr;
};