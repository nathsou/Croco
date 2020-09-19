import { Arities, arity, CompilationResult, CompilerPass, decons, fun, Fun, isFun, isVar, mapify, Ok, Rule, showTerm, Symb, Term, TRS, Var } from "girafe";
import { rev } from "../../Parser/Expr";

// Creates intermediate rules for partially applied functions
export const specializePartialFunctions: CompilerPass = (trs: TRS): CompilationResult => {
    const newRules: Rule[] = [];
    const uncurried = uncurryTRS(trs);
    const arities: Arities = new Map();

    for (const [f, rules] of uncurried.entries()) {
        const ar = arity(rules);
        arities.set(f, ar);

        const f_ = `${f}_${ar}`;

        if (ar === 0) {
            newRules.push(...rules);
        } else if (ar === 1) {
            for (const [lhs, rhs] of rules) {
                newRules.push([fun('app', fun(f), lhs.args[0]), rhs]);
            }

        } else {
            // add fully applied terms
            for (const [lhs, rhs] of rules) {
                newRules.push([fun(f_, ...lhs.args), rhs]);
            }

            const vs: Var[] = [];

            // add terms for partial applications
            for (let n = 0; n < ar; n++) {
                newRules.push([
                    fun('app', fun(`${f}${n === 0 ? '' : `_${n}`}`, ...vs), `v${n}`),
                    fun(`${f}_${n + 1}`, ...vs, `v${n}`)
                ]);

                vs.push(`v${n}`);
            }
        }

    }

    return Ok(mapify(newRules.map(r => specializeRule(r, arities))));
};

const uncurryTRS = (trs: TRS): TRS => {
    for (const [lhs, rhs] of (trs.get('app') ?? [])) {
        const uncurried = uncurry(lhs) as Fun;
        const f = uncurried.name;
        const newRule: Rule = [uncurried, rhs];

        if (!trs.has(f)) {
            trs.set(f, [newRule]);
        } else {
            trs.get(f).push(newRule);
        }
    }

    trs.delete('app');

    return trs;
};

// transforms app(app(+, a), b) into +(a, b)
export const uncurry = (t: Term, args: Term[] = []): Term => {
    if (isVar(t)) return t;
    if (t.args.length === 0 && args.length > 0) {
        return { name: t.name, args: rev(args) };
    }

    if (t.name === 'app') {
        const [lhs, rhs] = t.args;
        args.push(rhs);

        return uncurry(lhs, args);
    }

    return { name: t.name, args: t.args.map(s => uncurry(s)) };
};

// returns specialized partially applied functions insead of chains of 'app'
const specialize = (t: Term, arities: Arities): Term => {
    if (isVar(t)) return t;
    if (t.name === 'app') {
        const uncurried = uncurry(t);

        if (isFun(uncurried)) {
            const f = uncurried.name;
            const ar = arities.get(f) ?? 0;

            let newTerm: Term;

            // if the function was applied to too few arguments
            if (uncurried.args.length < ar) {
                // throw new Error(`ar(${f}) = ${ar}, got: ${uncurried.args.length}`);
                newTerm = {
                    name: `${f}_${uncurried.args.length}`,
                    args: uncurried.args.map(s => specialize(s, arities))
                };
            } else if (ar === 0) {
                return appChain(fun(f), uncurried.args.map(s => specialize(s, arities)));
            } else if (ar === 1) {
                newTerm = { name: 'app', args: [fun(f), specialize(uncurried.args[0], arities)] };
            } else {
                newTerm = {
                    name: `${f}_${ar}`,
                    args: uncurried.args.slice(0, ar).map(s => specialize(s, arities))
                };
            }

            // if the function was applied to too many arguments
            if (uncurried.args.length > ar) {
                const r = appChain(newTerm, uncurried.args.slice(ar));
                return r;
            } else {
                return newTerm;
            }
        }
    }

    return { name: t.name, args: t.args.map(s => specialize(s, arities)) };
};

const specializeRule = ([lhs, rhs]: Rule, arities: Arities): Rule => {
    return [
        fun(lhs.name, ...lhs.args.map(t => specialize(t, arities))) as Fun,
        specialize(rhs, arities)
    ];
};


export const appChain = (lhs: Term, args: Term[]): Term => {
    return appChainAux(lhs, rev(args));
};

const app = (lhs: Term, rhs: Term) => fun('app', lhs, rhs);

const appChainAux = (lhs: Term, args: Term[]): Term => {
    if (args.length === 0) return lhs;
    if (args.length === 1) return app(lhs, args[0]);

    const [h, tl] = decons(args);
    return app(appChainAux(lhs, tl), h);
};