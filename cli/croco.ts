import { readFileSync, writeFileSync } from "fs";
import { arithmeticExternals, fun, mergeExternals, metaExternals, nodeWorkerNormalizer, showTRS, supportedTargets, Targets, translate } from "girafe";
import { compile } from "../src/Compiler/Compiler";
import { postprocessTerm } from "../src/Parser/Expr";
import { parse } from "../src/Parser/Parser";

const [src, out, target] = process.argv.slice(2);

if (src === undefined) {
    console.info('usage: croco src.cro [out.grf');
    process.exit(0);
}

const source = readFileSync(src).toString('utf-8');

const trs = compile(parse(source));

if (out) {
    if (target === 'girafe') {
        writeFileSync(out, showTRS(trs));
    } else if (target) {
        if (supportedTargets.includes(target as Targets)) {
            const externals = mergeExternals(arithmeticExternals, metaExternals());
            writeFileSync(out, translate(trs, target as Targets, externals));
        } else {
            console.log(`invalid target: ${target}, options are: ${supportedTargets.join(', ')}`);
            process.exit();
        }
    }
} else {
    const log = (msg: string) => { console.log(msg); };
    const externals = mergeExternals(arithmeticExternals, metaExternals(log))('js');
    const normalize = nodeWorkerNormalizer(trs, externals);

    normalize(fun('Main')).then(out => {
        console.log(postprocessTerm(out));
    });

}