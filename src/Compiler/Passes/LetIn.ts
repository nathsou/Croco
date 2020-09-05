import { Expr, Prog, RuleDecl, Term } from "../../Parser/Expr";

let letInsCount = 0;

export const removeLetIns = (prog: Prog): Prog<Term> => {
    const newRules: Prog<Term> = [];
    letInsCount = 0;

    for (const { lhs, rhs } of prog) {
        newRules.push({
            type: 'rule',
            lhs: lhs as Term,
            rhs: removeLetInsIn(
                rhs,
                rule => { newRules.push(rule); }
            )
        });
    }

    return newRules;
};

// TODO: support nested let .. in expressions
const removeLetInsIn = (
    expr: Expr,
    addRule: (rule: RuleDecl<Term>) => void
): Term => {
    if (expr.type === 'let_in') {
        const name = `let_in${letInsCount++}`;

        const rhs = removeLetInsIn(expr.rhs, addRule);
        const rule: RuleDecl<Term> = {
            type: 'rule',
            lhs: { type: 'fun', name, args: [expr.x] },
            rhs
        };

        addRule(rule);

        return {
            type: 'fun',
            name,
            args: [removeLetInsIn(expr.val, addRule)]
        };
    }

    if (expr.type === 'fun') {
        return {
            type: 'fun',
            name: expr.name,
            args: expr.args.map(t => removeLetInsIn(t, addRule))
        };
    }

    return expr;
};