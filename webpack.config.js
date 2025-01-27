const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const fs = require("fs");


const entries = {};

const srcDir = path.join(__dirname, "src");
fs.readdirSync(srcDir).filter(dir => {
    if (fs.statSync(path.join(srcDir, dir)).isDirectory()) {
        entries[dir] = "./" + path.relative(process.cwd(), path.join(srcDir, dir, dir));
    }
});

module.exports = {
    entry:  entries,
    output: {
        filename: "[name]/[name].js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            "azure-devops-extension-sdk": path.resolve("node_modules/azure-devops-extension-sdk")
        },
        modules: [path.resolve("."), "node_modules"]
    },
    stats: {
        warnings: false
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            },
            {
                test: /\.scss$/,
                use: ["style-loader", "css-loader","sass-loader"]
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.woff$/,
                use: [{
                    loader: 'base64-inline-loader'
                }]
            },
            {
                test: /\.html$/,
                loader: "file-loader"
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: "**/*.html", context: "src" }
            ]
        })
    ]
};
