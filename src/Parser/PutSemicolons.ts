import { Maybe, Symb, specialCharsSet, isNothing, snd, Lexer } from "girafe";

export const putSemiColons = (source: string): string => {
    const lines = source.split('\n').filter(line => line.trim() !== '' && line.trimLeft()[0] !== '#');

    const newLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const nextLine = lines[i + 1] ?? '';
        const line = lines[i];

        if (isRuleDefStart(nextLine) || i === lines.length - 1) {
            newLines.push(line + ';');
        } else {
            newLines.push(line);
        }
    }

    return newLines.join('\n');
};

const isSpecialChar = (c: string) => specialCharsSet.has(c);
const isAlphaNum = (c: string) => /[a-zA-Z0-9]/.test(c);
const isUpperCase = (c: string) => c.toUpperCase() === c;

const lexSymb = (input: string): Maybe<[Symb, string]> => {
    if (input === '') return;
    let symb = '';

    const [head, tail] = [input[0], input.slice(1)];

    // first char must be uppercase or a special symbol
    if (!((isAlphaNum(head) && isUpperCase(head)) || isSpecialChar(head))) {
        return;
    }

    symb += head;

    for (const c of tail) {
        if (c === ' ' || c === '\t') break;
        if (isAlphaNum(c) || isSpecialChar(c)) {
            symb += c;
        } else {
            return;
        }
    }

    return [symb, input.slice(symb.length)];
};

const isRuleDefStart = (input: string): boolean => {
    const s = lexSymb(input);
    if (isNothing(s)) return false;
    return snd(s).includes('=');
};