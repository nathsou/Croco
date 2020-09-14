import { check, checkArity, checkNoDuplicates, checkNoFreeVars, compile as grfCompile, ExternalsFactory, isOk, leftLinearize, mapify, normalizeLhsArgs, simulateIfs, TRS, uniqueVarNames, unwrap } from 'girafe';
import { grfRuleOf, Prog } from "../Parser/Expr";
import { addBinopExternals } from './Passes/AddBinopExternals';
import { checkMain } from './Passes/CheckMain';
import { liftLambdas } from './Passes/LiftLambdas';
import { removeUnusedFunctions } from './Passes/RemoveUnusedFunctions';
import { specializePartialFunctions } from './Passes/Specialize';

export const compile = (rules: Prog, externals: ExternalsFactory<string>): TRS => {

    const trs = mapify(liftLambdas(rules).map(grfRuleOf));

    // Compilation pipeline
    const res = grfCompile(
        trs,
        addBinopExternals,
        specializePartialFunctions,
        removeUnusedFunctions('Main'),
        check(
            checkMain,
            checkNoFreeVars,
            checkArity,
            checkNoDuplicates
        ),
        leftLinearize,
        simulateIfs,
        uniqueVarNames,
        normalizeLhsArgs(externals('native'))
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