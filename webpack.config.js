const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const outputPath = path.resolve(__dirname, "build");

// 修改该变量进行不同版本编译
const version = 'v2';

console.log('\033[42;30m 当前版本 \033[40;32m ' + version + '\033[0m');
console.warn('\033[43;30m 提示 \033[40;33m ' + '修改version变量进行不同版本编译' + '\033[0m');

module.exports = {
  entry: path.resolve(__dirname, `./lib/${version}/demo`),
  output: {
    path: outputPath,
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".js", ".json", ".jsx"],
    alias: {}
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader?cacheDirectory"]
      }
    ]
  },
  mode: "development",
  devServer: {
    contentBase: path.join(__dirname, "build"),
    compress: true,
    open: true,
    quiet: true,
    port: 9001
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'xxx',
      template: path.resolve(__dirname, './index.html')
    })
  ]
};
