import { check, checkArity, checkNoDuplicates, checkNoFreeVars, compile as grfCompile, ExternalsFactory, fun, isOk, leftLinearize, mapify, normalizeLhsArgs, normalizeRhs, Rule, simulateIfs, TRS, uniqueVarNames, unwrap, removeUnusedRules, showTRS } from 'girafe';
import { grfRuleOf, Prog } from "../Parser/Expr";
import { checkMain } from './Passes/CheckMain';
import { removeLambdas } from './Passes/Lambdas';
import { specializePartialFunctions } from './Passes/Uncurry';

const binopExternals = {
    'Add': '@add',
    'Subtract': '@sub',
    'Multiply': '@mult',
    'Divide': '@div',
    'Mod': '@mod',
    'Equals': '@equ',
    'Less': '@lss',
    'LessEq': '@leq',
    'Greater': '@gtr',
    'GreaterEq': '@geq',
    'Cons': ':'
};

const makeExternalRules = (): Rule[] => {
    const externalsRules: Rule[] =
        Object.entries(binopExternals)
            .map(([name, ext]) => [
                fun('app', fun('app', fun(name), 'a'), 'b'),
                fun(ext, 'a', 'b')
            ]);

    externalsRules.push([
        fun('app', fun('app', fun('NotEquals'), 'a'), 'b'),
        fun('app', fun('Not'), fun('@equ', 'a', 'b'))
    ]);

    return externalsRules;
};

export const compile = (rules: Prog, externals: ExternalsFactory<string>): TRS => {
    const withoutLambdas = removeLambdas(rules).map(grfRuleOf);
    // add externals
    withoutLambdas.push(...makeExternalRules());


    const trs = mapify(withoutLambdas);
    const specialized = specializePartialFunctions(trs);

    // console.log(showTRS(specialized));

    const res = grfCompile(
        specialized,
        check(
            checkMain,
            checkNoFreeVars,
            checkArity,
            checkNoDuplicates
        ),
        leftLinearize,
        simulateIfs,
        uniqueVarNames,
        normalizeLhsArgs(externals('native')),
        removeUnusedRules('Main')
        // normalizeRhs(1, false)
    );

    if (isOk(res)) {
        const out = unwrap(res);

        return out;
    } else {
        for (const err of unwrap(res)) {
            console.error(err);
        }

        process.exit();
    }
};