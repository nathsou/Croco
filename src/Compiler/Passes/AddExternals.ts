import { addRules, CompilationResult, CompilerPass, fun, Ok, Rule, TRS } from "girafe";

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
    'BitwiseAnd': '@land',
    'BitwiseOr': '@lor',
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

    externalsRules.push([
        fun('app', fun('IsThunk'), 't'),
        fun('@isthunk', 't')
    ]);

    return externalsRules;
};

export const addExternals: CompilerPass = (trs: TRS): CompilationResult => {
    addRules(trs, ...makeExternalRules());
    return Ok(trs);
};