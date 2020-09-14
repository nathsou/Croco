# Croco

A simple purely functional programming language which compiles down to
[girafe](https://github.com/nathsou/Girafe/).

## Usage

```bash
$ interpret: croco src.cro [out]
$ compile to intermediate language: croco src.cro [out] [js/haskell/ocaml/girafe]
$ compile to binary: croco src.cro -c out
```

### Todo

- [ ] support importing girafe files
- [ ] support laziness
- [ ] IO
