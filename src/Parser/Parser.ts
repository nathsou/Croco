import * as nearley from 'nearley';
import grammar from './grammar';
import { Prog, showProg } from './Expr';
import { putSemiColons } from './PutSemicolons';

export const parse = (source: string): Prog => {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

    const withSemiColons = putSemiColons(source);
    parser.feed(withSemiColons);

    if (parser.results.length > 1) {
        throw new Error(
            `grammar is ambiguous, got ${parser.results.length} possible parses: \n\n`
            + parser.results.map(showProg).join('\n\n') + '\n'
        );
    }

    // console.log(parser.results.map(showProg).join('\n\n') + '\n');

    return parser.results[0];
};
