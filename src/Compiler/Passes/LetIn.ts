import { Expr, Prog, RuleDecl, Term } from "../../Parser/Expr";

export const removeLetIns = (prog: Prog): Prog<Term> => {
    const newRules: Prog<Term> = [];
    let letInsCount = { count: 0 };

    for (const { lhs, rhs } of prog) {
        newRules.push({
            type: 'rule',
            lhs: lhs as Term,
            rhs: removeLetInsIn(
                rhs,
                rule => {
                    newRules.push(rule);
                },
                letInsCount
            )
        });
    }

    return newRules;
};

const removeLetInsIn = (
    expr: Expr,
    addRule: (rule: RuleDecl<Term>) => void,
    count: { count: number }
): Term => {
    if (expr.type === 'let_in') {
        const name = `let_in${count.count++}`;
        const rule: RuleDecl<Term> = {
            type: 'rule',
            lhs: { type: 'fun', name, args: [expr.x] },
            rhs: removeLetInsIn(expr.rhs, addRule, count)
        };

        addRule(rule);

        return {
            type: 'fun',
            name,
            args: [removeLetInsIn(expr.val, addRule, count)]
        };
    }

    if (expr.type === 'fun') {
        return {
            type: 'fun',
            name: expr.name,
            args: expr.args.map(t => removeLetInsIn(t, addRule, count))
        };
    }

    return expr;
};