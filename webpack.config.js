const path = require("path");
const dist = path.join(__dirname, "dist");
const webpack = require('webpack');

const croco = {
    entry: "./cli/croco.ts",
    target: "node",
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: [
                    /node_modules/,
                    /lib/,
                    /dist/
                ],
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    plugins: [
        new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true }),
    ],
    optimization: {
        minimize: true,
    },
    output: {
        path: dist,
        filename: "croco.js"
    }
};

module.exports = [croco];