import { CompilationResult, CompilerPass, Fun, isSomething, isVar, mapify, Maybe, Ok, Rule, Symb, Term, TRS } from "girafe";
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
            const remainingApps = trs.get('app').filter(([lhs]) => {
                const f = getCurriedFunctionName(lhs);
                return isSomething(f) && usedRules.has(f);
            });

            if (remainingApps.length > 0) {
                trs.set('app', remainingApps);
            } else {
                trs.delete('app');
            }
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
    if (usedRules.has(start)) return;

    const rules = trs.get(start) ?? apps.get(start) ?? [];

    if (rules.length > 0) {
        usedRules.add(start);
    }

    for (const [lhs, rhs] of rules) {
        const symbs: string[] = [];
        for (const arg of lhs.args) {
            allSymbs(arg, symbs);
        }

        allSymbs(rhs, symbs);

        for (const f of symbs) {
            collectUsedRules(trs, f, apps, usedRules);
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

const allSymbs = (
    t: Term,
    acc: string[] = []
): string[] => {
    if (isVar(t)) return acc;

    if (t.name === 'app') {
        const f = getCurriedFunctionName(t);

        if (isSomething(f)) {
            acc.push(f);
        }
    } else {
        acc.push(t.name);
    }

    for (const arg of t.args) {
        allSymbs(arg, acc);
    }

    return acc;
};