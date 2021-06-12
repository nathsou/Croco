import * as nearley from 'nearley';
import grammar from './grammar';
import { default as importsGrammar } from './imports';
import { Fun, Prog, showProg } from './Expr';
import { putSemiColons } from './PutSemicolons';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';

type Import = { type: 'import', path: string, rules: string[] };

const CROCOPATH = process.env.CROCOPATH ?? '/usr/local/lib/node_modules/croco-lang';
const preludePath = resolve(join(CROCOPATH, '/Prelude/Prelude.cro'));

if (!existsSync(preludePath)) {
    console.error(`please set the CROCOPATH environment variable to croco's installation folder`);
    process.exit(1);
}


const prelude: Import = {
    type: 'import',
    path: preludePath,
    rules: []
};

export const parse = (path: string, importedFiles: string[] = []): Prog => {
    const parseImports = new nearley.Parser(nearley.Grammar.fromCompiled(importsGrammar));
    const parseRules = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

    const source = readFileSync(path, 'utf-8');
    const prevDir = process.cwd();
    // go to this path's directory to handle relative imports correctly
    process.chdir(dirname(path));

    const lines = putSemiColons(source).replace(/\r?\n|\r/g, '').split(';');

    let importsCount = 0;

    // imports
    for (const line of lines) {
        if (line.trimLeft().startsWith('import')) {
            parseImports.feed(line + ';');
            importsCount++;
        } else {
            break;
        }
    }

    const imports = parseImports.finish()[0] ?? [];
    if (!importedFiles.includes(preludePath)) {
        imports.push(prelude);
    }

    const importedRules = importFiles(imports, importedFiles);

    // rewriting rules
    for (const line of lines.slice(importsCount)) {
        if (line.trim() !== '') {
            parseRules.feed(line + ';');
        }
    }

    if (parseRules.results?.length > 1) {
        throw new Error(
            `grammar is ambiguous, got ${parseRules.results.length} possible parses: \n\n`
            + parseRules.results.map(showProg).join('\n\n') + '\n'
        );
    }

    // go back to the previous directory
    process.chdir(prevDir);

    return mergeProgramsMut(importedRules, (parseRules.results ?? [[]])[0]);
};

export const mergeProgramsMut = (p: Prog, q: Prog): Prog => {
    for (const rule of q) {
        p.push(rule);
    }

    return p;
};

const excludeMain = (p: Prog): Prog => {
    return p.filter(rule => (rule.lhs as Fun).name !== 'Main');
};

const importFiles = (imports: Import[], importedFiles: string[] = []): Prog => {
    let prog: Prog = [];

    for (const imp of imports) {
        const absolutePath = resolve(imp.path);
        // do not include this file if it has already been imported
        if (!importedFiles.includes(absolutePath)) {
            importedFiles.push(absolutePath);
            mergeProgramsMut(prog, excludeMain(parse(absolutePath, importedFiles)));
        }
    }

    return prog;
};