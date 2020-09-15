import { ExternalsFactory, mapString, mergeExternals, symbolMap } from "girafe";
import { arithmeticExternals, CrocoArithmeticExternals } from "./Arithmetic";
import { metaExternals } from "./Meta";

export type CrocoTargets = 'js' | 'ocaml';

export type CrocoExts = 'equ' | CrocoArithmeticExternals;

export const crocoExternals: ExternalsFactory<CrocoExts, CrocoTargets>
    = mergeExternals(arithmeticExternals, metaExternals);


export const renameSymb = (f: string): string => {
    return 'grf_' + mapString(f, c => symbolMap[c] ?? c);
};