import { spawn } from "child_process";
import { unlinkSync, writeFileSync } from "fs";
import { DecisionTreeNormalizer, fun, JSTranslator, nodeWorkerRawNormalizer, OCamlTranslator, rules, showTRS, Targets, TRS } from "girafe";
import { compile } from "../src/Compiler/Compiler";
import { crocoExternals } from "../src/Compiler/Externals/Externals";
import { postprocessTerm } from "../src/Parser/Expr";
import { parse } from "../src/Parser/Parser";

const OCAMLC = 'ocamlopt';
const useNodeWorkers = true;

const printUsage = () => {
    console.info('The inglorious Croco compiler - github.com/nathsou/Croco');
    console.info('---------------------------------------------------------');
    console.info('run: croco src.cro');
    console.info('compile to target: croco src.cro out js/ocaml/girafe');
    console.info('compile to binary: croco src.cro -c out');
    process.exit(0);
};

const externals = crocoExternals;

const src = process.argv[2];

if (src === undefined) {
    printUsage();
}


const trs = compile(parse(src), externals);

if (process.argv[3] === '-c') {
    const out = process.argv[4];

    const ocamlt = new OCamlTranslator(trs, externals('ocaml'));

    const runOcamlc = (srcFile: string): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            const instance = spawn(OCAMLC, [srcFile, '-w', '-26', '-w', '-8', '-o', out]);

            let stderr = '';

            instance.stdout.on('data', (data: Buffer) => {
                console.info('ocamlc: ', data);
            });

            instance.stderr.on('data', (data: Buffer) => {
                stderr += data.toString('utf-8');
            });

            instance.on('close', () => {
                // remove the temporary file
                unlinkSync(`${out}.ml`);

                if (stderr !== '') {
                    reject(stderr);
                } else {
                    unlinkSync(`${out}.cmi`);
                    unlinkSync(`${out}.cmx`);
                    unlinkSync(`${out}.o`);
                    resolve();
                }
            });
        });
    };

    const sourceWithQuery = () => {
        return [
            ocamlt.translate(),
            `in print_endline (grf__at_show (grf_Main ()));;`
        ].join('\n');
    };

    const run = async () => {
        writeFileSync(`${out}.ml`, sourceWithQuery());
        try {
            await runOcamlc(`${out}.ml`);
        } catch (e) {
            console.error(e);
        }
    };

    run();
} else {
    const [out, target] = process.argv.slice(3);

    const targets = ['js', 'ocaml', 'girafe', 'json'];

    const transpile = (trs: TRS, target: Targets | 'girafe' | 'json') => {
        switch (target) {
            case 'girafe':
                return showTRS(trs);
            case 'json':
                return JSON.stringify({
                    type: 'Girafe json',
                    version: 0.1,
                    rules: [...rules(trs)]
                });
            case 'js':
                return new JSTranslator(trs, externals('js')).translate();
            case 'ocaml':
                return new OCamlTranslator(trs, externals('ocaml')).translate();
        }
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
        if (trs.has('Main')) {
            try {
                if (!useNodeWorkers) {
                    const norm = new DecisionTreeNormalizer(trs).asNormalizer(externals('native'));
                    console.log(postprocessTerm(norm(fun('Main'))));
                } else {
                    const normalize = nodeWorkerRawNormalizer(trs, externals('js'));
                    normalize(fun('Main')).then(out => {
                        console.log(out);
                    });
                }
            } catch (e) {
                throw new Error(`Normalization error: ${e}`);
            }
        }
    }

}