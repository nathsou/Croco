import { mapify, TRS, useIf, compile as grfCompile, defaultPasses, isLeft, Left, unwrap } from 'girafe';
import { grfRuleOf, Prog } from "../Parser/Expr";

export const compile = (rules: Prog): TRS => {
    const trs = mapify(rules.map(grfRuleOf));
    useIf(trs);

    const res = grfCompile(trs, ...defaultPasses);

    if (isLeft(res)) {
        return unwrap(res);
    } else {
        console.error(unwrap(res).join('\n'));
    }

    return trs;
};