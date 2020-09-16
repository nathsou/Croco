
export const putSemiColons = (source: string): string => {
    const lines = source
        .split('\n')
        .filter(line => line.trim() !== '' && !line.trimLeft().startsWith('--'));

    for (let i = 0; i < lines.length; i++) {
        const nextLine = lines[i + 1] ?? '';

        if (
            isRuleDefStart(nextLine) ||
            isImportStart(nextLine) ||
            i === lines.length - 1
        ) {
            lines[i] = lines[i] + ';';
        }
    }

    return lines.join('\n');
};

const peek = (source: string, index: number, len = 1) => source.substr(index, len);

const isImportStart = (line: string): boolean => {
    for (let i = 0; i < line.length; i++) {
        if (line[i] === 'i' && peek(line, i, 'import'.length) === 'import') {
            return true;
        }
    }

    return false;
};

// are we in the beginning of a let .. (here) = .. in .. expression?
let insideLetInt = false;
let prevChar = ' ';

const isRuleDefStart = (line: string): boolean => {
    // the '=' symbol can only appear in rule definitions and let .. = .. in .. expressions 
    for (let i = 0; i < line.length; i++) {
        if ([' let ', ' let'].includes(prevChar + peek(line, i, 4))) {
            insideLetInt = true;
        } else if ([' in', ' in '].includes(prevChar + peek(line, i, 3))) {
            insideLetInt = false;
        }

        if (
            !insideLetInt && // not the '=' of a let .. = .. in .. expression
            line[i] === '=' &&
            !['=', '<', '>', '/'].includes(prevChar) &&
            (line[i + 1] ?? '') !== '=' // do not match '=='
        ) {
            return true;
        }

        prevChar = line[i];
    }

    return false;
};