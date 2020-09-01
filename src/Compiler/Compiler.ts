import { compile as grfCompile, defaultPasses, isOk, mapify, TRS, unwrap, useIf } from 'girafe';
import { grfRuleOf, Prog } from "../Parser/Expr";

export const compile = (rules: Prog): TRS => {
    const trs = mapify(rules.map(grfRuleOf));
    useIf(trs);

    const res = grfCompile(trs, ...defaultPasses);

    if (isOk(res)) {
        return unwrap(res);
    } else {
        console.error(unwrap(res).join('\n'));
    }

    return trs;
};