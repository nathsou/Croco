[![NPM Package][npm]][npm-url]
[![Build Size][build-size]][build-size-url]

# Croco

A simple purely functional programming language which compiles down to
[girafe](https://github.com/nathsou/Girafe/).

## Installation

```bash
npm install croco-lang
```

## Usage

```bash
$ run: croco src.cro [out]
$ compile to intermediate language: croco src.cro out js/ocaml/girafe
$ compile to binary: croco src.cro -c out
```

### Todo

- [ ] support laziness
- [ ] IO

[npm]: https://img.shields.io/npm/v/croco-lang
[npm-url]: https://www.npmjs.com/package/croco-lang
[build-size]: https://badgen.net/bundlephobia/minzip/croco-lang
[build-size-url]: https://bundlephobia.com/result?p=croco-lang