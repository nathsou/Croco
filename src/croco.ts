import { readFileSync } from "fs";
import { arithmeticExternals, DecisionTreeNormalizer, fun, mergeExternals, metaExternals, showTerm, showTRS } from "girafe";
import { compile } from "./Compiler/Compiler";
import { parse } from "./Parser/Parser";

const [src] = process.argv.slice(2);

if (src === undefined) {
    console.info('usage: croco src.cro');
    process.exit(0);
}

const source = readFileSync(src).toString('utf-8');

const trs = compile(parse(source));

console.log(showTRS(trs));

const log = (msg: string) => { console.log(msg); };
const externals = mergeExternals(arithmeticExternals, metaExternals(log))('native');

const norm = new DecisionTreeNormalizer(trs).asNormalizer(externals);
console.log(showTerm(norm(fun('Main'))));