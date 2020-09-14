import { CompilationResult, CompilerPass, Fun, isFun, isSomething, isVar, mapify, Maybe, Ok, Rule, Symb, Term, TRS } from "girafe";
import { uncurry } from './Specialize';

export const removeUnusedFunctions = (startingRule: Symb): CompilerPass => {
    return (trs: TRS): CompilationResult => {
        const apps = mapify((trs.get('app') ?? []).map(uncurryRule));
        const usedRules = collectUsedRules(
            trs,
            startingRule,
            apps
        );

        usedRules.add('app');

        // remove unused rules
        for (const f of trs.keys()) {
            if (!usedRules.has(f)) {
                trs.delete(f);
            }
        }

        // remove unused apps
        if (trs.has('app')) {
            trs.set('app', trs.get('app').filter(([lhs]) => {
                const f = getCurriedFunctionName(lhs) as string;
                return usedRules.has(f);
            }));
        }

        return Ok(trs);
    };
}

const uncurryRule = ([lhs, rhs]): Rule => {
    return [uncurry(lhs) as Fun, uncurry(rhs)];
};

const collectUsedRules = (
    trs: TRS,
    start: Symb,
    apps: Map<Symb, Rule[]>,
    usedRules: Set<Symb> = new Set()
): Set<Symb> => {
    let rules: Rule[];

    if (usedRules.has(start)) return;
    rules = trs.get(start) ?? apps.get(start) ?? [];
    if (rules.length > 0) {
        usedRules.add(start);
    }

    for (const [lhs, rhs] of rules) {
        const symbs: SymbOrApp[] = [];
        for (const arg of lhs.args) {
            allSymbs(arg, symbs);
        }

        allSymbs(rhs, symbs);

        for (const f of symbs) {
            collectUsedRules(trs, f.name, apps, usedRules);
        }
    }

    return usedRules;
};

// getCurriedFunctionName(app(app(Add, a), b)) -> Add
const getCurriedFunctionName = (t: Term, depth = 0): Maybe<string> => {
    if (isVar(t)) return;
    if (t.args.length === 0 && depth > 0) {
        return t.name;
    }

    if (t.name === 'app') {
        const [lhs] = t.args;
        return getCurriedFunctionName(lhs, depth + 1);
    }

    return t.name;
};

type SymbOrApp = {
    type: 'symb' | 'app',
    name: string
};

const allSymbs = (
    t: Term,
    acc: SymbOrApp[] = []
): SymbOrApp[] => {
    if (isVar(t)) return acc;

    if (t.name === 'app') {
        const f = getCurriedFunctionName(t);
        if (isSomething(f)) {
            acc.push({ type: 'app', name: f });
        }
    } else {
        acc.push({ type: 'symb', name: t.name });
    }

    for (const arg of t.args) {
        allSymbs(arg, acc);
    }

    return acc;
};