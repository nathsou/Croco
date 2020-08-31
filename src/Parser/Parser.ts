import * as nearley from 'nearley';
import { Prog } from './Expr';
import grammar from './croco';

export const parse = (source: string): Prog => {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

    parser.feed(source);

    if (parser.results.length > 1) {
        throw new Error(
            `grammar is ambiguous, got ${parser.results.length} possible parses:
            ${parser.results.map(p => JSON.stringify(p)).join('\n\n')}`
        );
    }

    // console.log(parser.results[0][0]);

    return parser.results[0];
};
