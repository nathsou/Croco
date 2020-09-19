# Croco

A simple purely functional programming language which compiles down to
[girafe](https://github.com/nathsou/Girafe/).

## Usage

```bash
$ run: croco src.cro [out]
$ compile to intermediate language: croco src.cro out js/ocaml/girafe
$ compile to binary: croco src.cro -c out
```

### Todo

- [ ] support laziness
- [ ] IO
