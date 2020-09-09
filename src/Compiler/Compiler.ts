import { check, checkArity, checkNoDuplicates, checkNoFreeVars, compile as grfCompile, ExternalsFactory, isOk, leftLinearize, mapify, normalizeLhsArgs, simulateIfs, TRS, unwrap } from 'girafe';
import { grfRuleOf, Prog } from "../Parser/Expr";
import { checkMain } from './Passes/CheckMain';
import { removeLambdas } from './Passes/Lambdas';

export const compile = (rules: Prog, externals: ExternalsFactory<string>): TRS => {
    const trs = mapify(removeLambdas(rules).map(grfRuleOf));

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
        normalizeLhsArgs(externals('native'))
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