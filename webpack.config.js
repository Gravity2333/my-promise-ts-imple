const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
module.exports = {
  mode: "none",
  entry: "./src/index.ts", // 项目的入口文件
  output: {
    filename: "bundle.js", // 编译后的文件名
    path: path.resolve(__dirname, "public"), // 编译后的文件路径
    module: true,
    libraryTarget: "module",
    clean: true,
  },
  experiments: {
    outputModule: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/, // 匹配 TypeScript 文件
        use: "ts-loader", // 使用 ts-loader 来处理 TypeScript 文件
        exclude: /node_modules/, // 排除 node_modules 目录
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"], // 自动解析的文件扩展名
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./demo",
          to: "./demo",
        },
      ],
    }),
  ],
};
