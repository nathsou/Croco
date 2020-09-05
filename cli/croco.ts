import { readFileSync, writeFileSync } from "fs";
import { arithmeticExternals, DecisionTreeNormalizer, fun, mergeExternals, metaExternals, showTRS, supportedTargets, Targets, translate, nodeWorkerNormalizer, makeNat } from "girafe";
import { compile } from "../src/Compiler/Compiler";
import { postprocessTerm } from "../src/Parser/Expr";
import { parse } from "../src/Parser/Parser";

const [src, out, target] = process.argv.slice(2);

const printUsage = () => {
    console.info('usage: croco src.cro [out.grf]');
    process.exit(0);
};

if (src === undefined) {
    printUsage();
}

const source = readFileSync(src).toString('utf-8');

const externals = mergeExternals(arithmeticExternals, metaExternals());

const trs = compile(parse(source), externals);

if (out) {
    if (target) {
        if (target === 'girafe') {
            writeFileSync(out, showTRS(trs));
        } else if (supportedTargets.includes(target as Targets)) {
            const externals = mergeExternals(arithmeticExternals, metaExternals());
            writeFileSync(out, translate(trs, target as Targets, externals));
        } else {
            console.log(`invalid target: ${target}, options are: ${[...supportedTargets, 'girafe'].join(', ')}`);
            process.exit();
        }
    } else {
        printUsage();
    }
} else {
    // const normalize = new DecisionTreeNormalizer(trs).asNormalizer(externals('native'));
    // console.log(postprocessTerm(normalize(fun('Main'))));

    const normalize = nodeWorkerNormalizer(trs, externals('js'), makeNat);
    normalize(fun('Main')).then(out => {
        console.log(postprocessTerm(out));
    });
}