import { Externals, ExternalsFactory, False, Fun, isFun, NativeExternals, nullaryVarName, showTerm, True } from "girafe";
import { CrocoTargets } from "./Externals";

export const symb = (f: string): Fun => ({ name: f, args: [] });

const arithbinop = (t: Fun, op: (a: number, b: number) => number): Fun => {
    const [a, b] = t.args;
    if (isFun(a) && isFun(b)) {
        try {
            const an = parseInt(a.name);
            const bn = parseInt(b.name);

            const res = op(an, bn);
            return symb(`${res}`);
        } catch (e) { }
    }

    throw new Error(`arithmetic operator applied to: ${showTerm(a)} and ${showTerm(b)}`);
};

const boolbinop = (t: Fun, op: (a: number, b: number) => boolean): Fun => {
    const [a, b] = t.args;
    if (isFun(a) && isFun(b)) {
        const an = parseInt(a.name);
        const bn = parseInt(b.name);
        const res = op(an, bn);

        return res ? True : False;
    }

    throw new Error(`boolean operator applied to: ${showTerm(a)} and ${showTerm(b)}`);
};

export type CrocoArithmeticExternals = 'add' | 'sub' | 'mult' | 'div' |
    'mod' | 'gtr' | 'geq' | 'lss' | 'leq';

const nativeArithmeticExternals: NativeExternals<CrocoArithmeticExternals> = {
    'add': t => arithbinop(t, (a, b) => a + b),
    'sub': t => arithbinop(t, (a, b) => a - b),
    'mult': t => arithbinop(t, (a, b) => a * b),
    'div': t => arithbinop(t, (a, b) => a / b),
    'mod': t => arithbinop(t, (a, b) => a % b),
    'gtr': t => boolbinop(t, (a, b) => a > b),
    'geq': t => boolbinop(t, (a, b) => a >= b),
    'lss': t => boolbinop(t, (a, b) => a < b),
    'leq': t => boolbinop(t, (a, b) => a <= b)
};

const jsarithbinop = (op: string) => {
    return (name: string) => (
        `function ${name}(a, b) {
            return ${op === '/' ? 'Math.floor(a / b)' : `a ${op} b`};
        }`
    );
};

const jsboolbinop = (op: string) => {
    return (name: string) => (
        `function ${name}(a, b) {
            return a ${op} b ? ${nullaryVarName('True')} : ${nullaryVarName('False')};
        }`
    );
};

const jsArithmeticExternals: Externals<'js', CrocoArithmeticExternals> = {
    'add': jsarithbinop('+'),
    'sub': jsarithbinop('-'),
    'mult': jsarithbinop('*'),
    'div': jsarithbinop('/'),
    'mod': jsarithbinop('%'),
    'gtr': jsboolbinop('>'),
    'geq': jsboolbinop('>='),
    'lss': jsboolbinop('<'),
    'leq': jsboolbinop('<=')
};

const ocamlIntBinop = (op: string) =>
    (name: string) => `let ${name} (Nat a, Nat b) = Nat (a ${op} b);;`;

const ocamlBoolOf = (expr: string) =>
    `(if ${expr} then ${nullaryVarName('True')} else ${nullaryVarName('False')})`;

const ocamlBoolBinop = (op: string) =>
    (name: string) => `let ${name} (Nat a, Nat b) = ${ocamlBoolOf(`a ${op} b`)};;`;

const ocamlArithmeticExternals: Externals<'ocaml', CrocoArithmeticExternals> = {
    "sub": ocamlIntBinop('-'),
    "add": ocamlIntBinop('+'),
    "mult": ocamlIntBinop('*'),
    "mod": ocamlIntBinop('mod'),
    "div": ocamlIntBinop('/'),
    "lss": ocamlBoolBinop('<'),
    "leq": ocamlBoolBinop('<='),
    "gtr": ocamlBoolBinop('>'),
    "geq": ocamlBoolBinop('>=')
};

export const arithmeticExternals: ExternalsFactory<CrocoArithmeticExternals, CrocoTargets> = target => {
    return {
        'native': nativeArithmeticExternals,
        'js': jsArithmeticExternals,
        'ocaml': ocamlArithmeticExternals
    }[target];
};