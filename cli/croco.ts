import { readFileSync, writeFileSync } from "fs";
import { arithmeticExternals, head, makeNat, mergeExternals, metaExternals, nodeWorkerNormalizer, rhs, showTRS, supportedTargets, Targets, translate, TRS } from "girafe";
import { compile } from "../src/Compiler/Compiler";
import { postprocessTerm } from "../src/Parser/Expr";
import { parse } from "../src/Parser/Parser";

const [src, out, target] = process.argv.slice(2);

const printUsage = () => {
    console.info('usage: croco src.cro [out] [js/haskell/ocaml/girafe]');
    process.exit(0);
};

if (src === undefined) {
    printUsage();
}

const targets = [...supportedTargets, 'girafe'];

const source = readFileSync(src).toString('utf-8');

const externals = mergeExternals(arithmeticExternals, metaExternals());

const trs = compile(parse(source), externals);

const transpile = (trs: TRS, target: Targets | 'girafe') => {
    if (target === 'girafe') {
        return showTRS(trs);
    }

    return translate(trs, target, externals);
};

if (out) {
    if (target) {
        if (targets.includes(target)) {
            writeFileSync(out, transpile(trs, target as Targets | 'girafe'));
        } else {
            console.log(`invalid target: ${target}, options are: ${targets.join(', ')}`);
            process.exit();
        }
    } else {
        if (targets.includes(out as Targets | 'girafe')) {
            console.log(transpile(trs, out as Targets | 'girafe'));
        } else {
            printUsage();
        }
    }
} else {
    // const norm = new DecisionTreeNormalizer(trs).asNormalizer(externals('native'));
    // console.log(postprocessTerm(norm(fun('Main'))));

    const normalize = nodeWorkerNormalizer(trs, externals('js'), makeNat);
    normalize(rhs(head(trs.get('Main')))).then(out => {
        console.log(postprocessTerm(out));
    });
}
