import { check, checkArity, checkNoDuplicates, checkNoFreeVars, compile as grfCompile, ExternalsFactory, isOk, leftLinearize, mapify, normalizeLhsArgs, simulateIfs, TRS, unwrap } from 'girafe';
import { grfRuleOf, Prog } from "../Parser/Expr";
import { removeLambdas } from './Passes/Lambdas';

export const compile = (rules: Prog, externals: ExternalsFactory<string>): TRS => {
    const trs = mapify(removeLambdas(rules).map(grfRuleOf));

    const res = grfCompile(
        trs,
        check(
            checkNoFreeVars,
            checkArity,
            checkNoDuplicates
        ),
        leftLinearize,
        simulateIfs,
        normalizeLhsArgs(externals('native'))
    );

    if (isOk(res)) {
        return unwrap(res);
    } else {
        console.error(unwrap(res).join('\n'));
    }

    return trs;
};