import { check, checkArity, checkNoDuplicates, checkNoFreeVars, compile as grfCompile, ExternalsFactory, fun, isOk, leftLinearize, mapify, normalizeLhsArgs, normalizeRhs, Rule, showTRS, simulateIfs, TRS, uniqueVarNames, unwrap } from 'girafe';
import { grfRuleOf, Prog } from "../Parser/Expr";
import { checkMain } from './Passes/CheckMain';
import { removeLambdas } from './Passes/Lambdas';

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

const externalsRules: Rule[] =
    Object.entries(binopExternals)
        .map(([name, ext]) => [
            fun('app', fun('app', fun(name), 'a'), 'b'),
            fun(ext, 'a', 'b')
        ]);

export const compile = (rules: Prog, externals: ExternalsFactory<string>): TRS => {
    const withoutLambdas = removeLambdas(rules).map(grfRuleOf);
    // add externals
    withoutLambdas.push(...externalsRules);

    const trs = mapify(withoutLambdas);

    const res = grfCompile(
        trs,
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
        normalizeRhs(0, false)
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