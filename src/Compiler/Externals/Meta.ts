import { Externals, ExternalsFactory, False, fun, Fun, NativeExternals, nullaryVarName, Term, termsEq, True } from "girafe";
import { postprocessTerm } from "../../Parser/Expr";
import { CrocoTargets, renameSymb } from "./Externals";

export type CrocoMetaExternals = 'equ' | 'show';

const equ = (s: Term, t: Term): Fun => {
    return termsEq(s, t) ? True : False;
};

const nativeMetaExternals: NativeExternals<CrocoMetaExternals> = {
    equ: t => { const [a, b] = t.args; return equ(a, b); },
    show: t => { console.log(postprocessTerm(t)); return fun('Unit'); }
};

const jsMetaExternals: Externals<'js', CrocoMetaExternals> = {
    equ: name => `
        function ${name}(a, b) {
            if (isFun(a) && isFun(b) && a.name === b.name && a.args.length === b.args.length) {
              for (let i = 0; i < a.args.length; i++) {
                  if (${name}(a.args[i], b.args[i]).name === "False") {
                      return ${nullaryVarName('False')};
                  }
              }
              return ${nullaryVarName('True')};
            }
          
            return a === b ? ${nullaryVarName('True')} : ${nullaryVarName('False')};
        }`,
    show: name => `
        function ${name}(term) {
            if (isVar(term)) return term;
            if (isNat(term)) return term.toString();
            if (term.name === 'Nil') return '[]';
            if (term.name === 'Unit') return '()';
        
            const f = term.name.replace(/_(sim)[0-9]+/g, '');
        
            if (term.args.length === 0) return f;

            const postprocessList = (head, tail, nil = 'Nil', cons = ':') => {
                if (isVar(tail) || (tail.name !== cons && tail.name !== nil)) {
                    throw new Error(
                        'Expected "' + cons + '" or "' + nil + '" at the end of a ' +
                        nil === 'Nil' ? 'list' : 'tuple' + ', got: ' + JSON.stringify(tail)
                    );
                }
            
                if (tail.name === nil) return ${name}(head);
            
                const [h, tl] = tail.args;
            
                return ${name}(head) + ', ' + postprocessList(h, tl, nil, cons);
            };

            const fromList = (lst, acc = []) => {
                if (!isFun(lst) || (lst.name !== ':' && lst.name !== 'Nil')) {
                    throw new Error('Trying to convert an invalid list to an array');
                }

                if (lst.name === 'Nil') return acc;

                const [h, tl] = lst.args;
                acc.push(h);
                return fromList(tl, acc);
            };
        
            switch (f) {
                case ':':
                    {
                        const [h, tl] = term.args;
                        return '[' + postprocessList(h, tl) + ']';
                    }
                case ';':
                    {
                        const [h, tl] = term.args;
                        return '(' + postprocessList(h, tl, 'Unit', ';') + ')';
                    }
                    case 'app':
                    case 'grf_app':
                        const [f, x] = term.args;
            
                        if (isFun(f) && f.name === 'String') {
                            return '"' + String.fromCharCode(...fromList(x).map(c => parseInt(c))) + '"';
                        }
            
                        return '(' + ${name}(f) + ' ' + ${name}(x) + ')';
                default:
                    return '(' + term.name + ' ' + term.args.map(${name}).join(' ') + ')';
            }
        }
    `
};

const ocamlMetaExternals: Externals<'ocaml', CrocoMetaExternals> = {
    equ: (name: string) =>
        `let ${name} (a, b) = if a = b then ${nullaryVarName('True')} else ${nullaryVarName('False')};;`,
    show: name =>
        `let rec ${name} t =
        let rec from_list lst acc = match lst with
            | (Fun (":", [h; tl])) -> from_list tl (h::acc)
            | (Fun ("Nil", [])) -> acc
            | _ -> failwith "Trying to convert an invalid term to a list"
        in let rec postprocess_list head tail = match tail with
            | (Fun ("Nil", [])) | (Fun ("Unit", [])) -> ${name} head
            | (Fun (":", [h; tl])) | (Fun (";", [h; tl])) -> 
                (${name} head) ^ ", " ^ (postprocess_list h tl)
            | _ -> failwith "expected : or ; in list / tuple"
        in match t with
            | Var x -> x
            | Nat n -> string_of_int n
            | Fun ("Nil", []) -> "[]"
            | Fun ("Unit", []) -> "()"
            | Fun (f, []) -> f
            | Fun (":", [h; tl]) -> 
                let lst = postprocess_list h tl in
                "[" ^ lst ^ "]"
            | Fun (";", [h; tl]) -> 
                let lst = postprocess_list h tl in
                "(" ^ lst ^ ")"
            | Fun ("${renameSymb('app')}", [Fun ("String", []); cs]) -> 
                let lst = List.rev (from_list cs []) in
                let char_codes = List.map (fun (Nat c) -> char_of_int c) lst in
                let chars = List.map (String.make 1) char_codes in
                let str = String.concat "" chars in
                "\\"" ^ str ^ "\\""
            | Fun (f, ts) -> "(" ^ f ^ (String.concat " " (List.map ${name} ts)) ^ ")";;
        `
};

export const metaExternals: ExternalsFactory<CrocoMetaExternals, CrocoTargets> = target => {
    return {
        'native': nativeMetaExternals,
        'js': jsMetaExternals,
        'ocaml': ocamlMetaExternals
    }[target];
};