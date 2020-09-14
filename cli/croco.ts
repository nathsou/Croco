import { spawn } from "child_process";
import { unlinkSync, writeFileSync } from "fs";
import { arithmeticExternals, fun, JSTranslator, makeNat, mergeExternals, metaExternals, nodeWorkerNormalizer, OCamlTranslator, showTRS, supportedTargets, Targets, translate, TRS } from "girafe";
import { compile } from "../src/Compiler/Compiler";
import { postprocessTerm } from "../src/Parser/Expr";
import { parse } from "../src/Parser/Parser";

const OCAMLC = 'ocamlc';

const printUsage = () => {
    console.info('The inglorious Croco compiler - github.com/nathsou/Croco');
    console.info('---------------------------------------------------------');
    console.info('interpret: croco src.cro [out]');
    console.info('compile to intermediate language: croco src.cro [out] [js/haskell/ocaml/girafe]');
    console.info('compile to binary: croco src.cro -c out');
    process.exit(0);
};

const externals = mergeExternals(arithmeticExternals, metaExternals());

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
            const instance = spawn(OCAMLC, [srcFile, '-o', out]);

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
                unlinkSync(`${out}.cmi`);
                unlinkSync(`${out}.cmo`);

                if (stderr !== '') {
                    reject(stderr);
                } else {
                    resolve();
                }
            });
        });
    };

    const sourceWithQuery = () => {
        return [
            ocamlt.translate(),
            'in print_endline (show_term (grf_Main ()));;'
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

    const targets = [...supportedTargets, 'girafe'];

    const transpile = (trs: TRS, target: Targets | 'girafe') => {
        if (target === 'girafe') {
            return showTRS(trs);
        }

        if (target === 'js') {
            return new JSTranslator(trs, externals('js'), makeNat).translate();
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

        if (trs.has('Main')) {
            const normalize = nodeWorkerNormalizer(trs, externals('js'), makeNat);
            normalize(fun('Main')).then(out => {
                console.log(postprocessTerm(out));
            });
        }
    }

}