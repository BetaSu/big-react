const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const outputPath = path.resolve(__dirname, "build");
const packagesPath = path.resolve(__dirname, 'packages');

module.exports = {
  entry: path.resolve(__dirname, `./demo`),
  output: {
    path: outputPath,
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".js", ".json", ".jsx"],
    alias: {
      react: path.resolve(packagesPath, 'react'),
      reactDOM: path.resolve(packagesPath, 'react-dom'),
      reactReconciler: path.resolve(packagesPath, 'react-reconciler'),
      scheduler: path.resolve(packagesPath, 'scheduler'),
      shared: path.resolve(packagesPath, 'shared')
    }
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
  devServer: {
    contentBase: path.join(__dirname, "build"),
    compress: true,
    open: true,
    quiet: true,
    port: 9001
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'for dev',
      template: path.resolve(__dirname, './demo/assets/index.html')
    })
  ]
};
