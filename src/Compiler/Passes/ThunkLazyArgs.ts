import { CompilationResult, CompilerPass, fun, Fun, indexed, isFun, isVar, map, mapify, Ok, replaceTerms, Rule, rules, ruleVars, Symb, Term, TRS, Var } from "girafe";
import { croTermOf, grfRuleOf, grfTermOf, LambdaExpr, RuleDecl, Term as CrocoTerm, Unit } from "../../Parser/Expr";
import { Counter, lift } from "./LiftLambdas";

export const lazySymb = 'Lazy';

// indicates the indices of each lazy arguments of lazy symbols
export type LazinessAnnotations = Map<Symb, number[]>;

export const thunkLazyArgs: CompilerPass = (trs: TRS): CompilationResult => {
    const ann = collectLazySymbs(trs);
    const newRules = [];
    const counter = new Counter(0);
    const addRule = (r: Rule) => { newRules.push(r); };

    for (const [lhs, rhs] of map(rules(trs), removeRuleLazinessAnnotations)) {
        newRules.push(callActiveLazyArgs([
            lhs,
            thunkTerm(rhs, ann, addRule, counter)
        ], ann));
    }

    return Ok(mapify(newRules));
};

const addRuleAdapter = (addRule: (r: Rule) => void): (r: RuleDecl<CrocoTerm>) => void => {
    return (r: RuleDecl<CrocoTerm>) => addRule(grfRuleOf(r))
};

const thunkTerm = (
    t: Term,
    ann: LazinessAnnotations,
    addRule: (r: Rule) => void,
    counter: Counter
): Term => {
    if (isVar(t)) return t;

    // do not thunk constant / nullary symbols
    // as they are not expensive to normalize
    if (t.args.length === 0) return t;

    const thunkedArgs = t.args.map((arg, idx) => {
        const isThunk = isLazy(arg);

        if (isThunk) {
            arg = (arg as Fun).args[0];
        }

        const thunkedArg = thunkTerm(arg, ann, addRule, counter);

        if (isThunk || isArgLazy(t.name, idx, ann)) {

            const thunked: LambdaExpr = {
                type: 'lambda',
                x: Unit,
                rhs: croTermOf(thunkedArg)
            };

            return grfTermOf(lift(thunked, addRuleAdapter(addRule), counter, 'thunk'));
        }

        return thunkedArg;
    });

    return { name: t.name, args: thunkedArgs };
};

const grfUnit = fun('Unit');
const Inst = (x: Term) => fun('app', x, grfUnit);

// migrant vars are lazy terms in active position on the rhs
const callActiveLazyArgs = (rule: Rule, ann: LazinessAnnotations): Rule => {
    const [lhs, rhs] = rule;
    if (isVar(rhs) && isVarMigrant(rhs, rule, ann)) {
        return [lhs, Inst(rhs)];
    } else if (isFun(rhs)) {
        const migrants = migrantVars(rule, ann);
        if (migrants.length > 0) {
            const newArgs = migrants.reduce((ts, x) => replaceTerms(x, Inst(x), ts), rhs.args);
            const newRhs: Fun = { name: rhs.name, args: newArgs };
            return [lhs, newRhs];
        }
    }

    return rule;
};

const isVarActive = (x: Var, t: Term, ann: LazinessAnnotations): boolean => {
    if (isVar(t)) return t === x;
    return t.args.some((arg, i) => (
        !isArgLazy(t.name, i, ann) && isVarActive(x, arg, ann)
    ));
};

const isVarMigrant = (x: Var, [lhs, rhs]: Rule, ann: LazinessAnnotations): boolean => {
    return !isVarActive(x, lhs, ann) && isVarActive(x, rhs, ann);
};

const migrantVars = (rule: Rule, ann: LazinessAnnotations): Var[] => {
    return ruleVars(rule).filter(x => isVarMigrant(x, rule, ann));
};

const collectLazySymbs = (trs: TRS): LazinessAnnotations => {
    const annotations: LazinessAnnotations = new Map();

    for (const rule of rules(trs)) {
        collectLazySymbsFromRule(rule, annotations);
    }

    return annotations;
};

const isLazy = (t: Term) => isFun(t, lazySymb);

const isArgLazy = (parentName: Symb, argIndex: number, ann: LazinessAnnotations) => {
    return parentName === lazySymb || (ann.get(parentName) ?? []).includes(argIndex);
};

const collectLazySymbsFromRule = (
    [lhs, _]: Rule,
    annotations: LazinessAnnotations
): void => {
    const ann = indicesWhere(isLazy, lhs.args);
    if (ann.length > 0) {
        annotations.set(lhs.name, ann);
    }
};

const removeTermLazinessAnnotations = <T extends Term>(t: T): T => {
    if (isVar(t)) return t;

    return {
        name: (t as Fun).name,
        args: (t as Fun).args.map(arg =>
            removeTermLazinessAnnotations(isFun(arg, lazySymb) ? arg.args[0] : arg)
        )
    } as T;
};

const removeRuleLazinessAnnotations = ([lhs, rhs]: Rule): Rule => {
    return [
        removeTermLazinessAnnotations(lhs),
        rhs
    ];
};

const indicesWhere = <T>(pred: (val: T) => boolean, vals: Iterable<T>) => {
    const indices: number[] = [];
    for (const [val, idx] of indexed(vals)) {
        if (pred(val)) {
            indices.push(idx);
        }
    }

    return indices;
};