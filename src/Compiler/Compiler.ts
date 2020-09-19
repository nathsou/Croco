import { check, checkArity, checkNoDuplicates, checkNoFreeVars, compile as grfCompile, CompilerPass, ExternalsFactory, isOk, leftLinearize, mapify, normalizeLhsArgs, Ok, simulateIfs, TRS, unwrap } from 'girafe';
import { grfRuleOf, Prog } from "../Parser/Expr";
import { CrocoExts } from './Externals/Externals';
import { addBinopExternals } from './Passes/AddBinopExternals';
import { checkMain } from './Passes/CheckMain';
import { liftLambdas } from './Passes/LiftLambdas';
import { removeUnusedFunctions } from './Passes/RemoveUnusedFunctions';
import { specializePartialFunctions } from './Passes/Specialize';
import { thunkLazyArgs } from './Passes/ThunkLazyArgs';

export const compile = (rules: Prog, externals: ExternalsFactory<CrocoExts>): TRS => {

    const trs = mapify(liftLambdas(rules).map(grfRuleOf));

    // Compilation pipeline
    const res = grfCompile(
        trs,
        addBinopExternals,
        specializePartialFunctions,
        when(trs => trs.has('Main'), removeUnusedFunctions('Main')),
        check(
            checkMain,
            checkNoFreeVars,
            checkArity,
            checkNoDuplicates
        ),
        thunkLazyArgs,
        leftLinearize,
        simulateIfs(),
        // ensureUniqueVarNames,
        normalizeLhsArgs(externals('native'))
        // normalizeRhs(1, false)
    );

    if (isOk(res)) {
        return unwrap(res);
    } else {
        for (const err of unwrap(res)) {
            console.error(err);
        }
    }
};

const when = (cond: (trs: TRS) => boolean, pass: CompilerPass): CompilerPass => {
    return (trs: TRS) => {
        if (cond(trs)) {
            return pass(trs);
        } else {
            return Ok(trs);
        }
    };
};