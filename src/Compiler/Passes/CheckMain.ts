import { Checker, Rule, CompilationMessage, arity } from "girafe";

export const checkMain: Checker = (rules: Rule[]): CompilationMessage[] => {
    const main = rules.filter(([lhs, _]) => lhs.name === 'Main');
    if (main.length === 0) return [];

    const msgs: CompilationMessage[] = [];

    if (arity(main) > 0) {
        msgs.push(`Main should receive no arguments.`);
    }

    if (main.length > 1) {
        msgs.push(`Main should only be defined once.`);
    }

    return msgs;
};