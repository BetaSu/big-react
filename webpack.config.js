const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const outputPath = path.resolve(__dirname, 'build');

module.exports = {
    entry: path.resolve(__dirname, './src'),
    output: {
        path: outputPath,
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.js', '.json', '.jsx'],
        alias: {
            
        }
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader?cacheDirectory']
            }
        ]
    },
    mode: 'development',
    devServer: {
        contentBase: path.join(__dirname, 'build'),
        compress: true,
        open: true,
        port: 9001
    },
    plugins: [
      new HtmlWebpackPlugin()
    ]
};
