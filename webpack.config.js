const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        entry: './src/main.tsx',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name]-[contenthash].js',
            clean: true,
            // publicPath: isProduction ? './' : '/',
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
            alias: {
                "azure-devops-extension-sdk": path.resolve("node_modules/azure-devops-extension-sdk")
            },
            modules: [path.resolve("."), "node_modules"]
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig.app.json',
                        },
                    },
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/,
                    use: [
                        isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        'postcss-loader',
                    ],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './index.html',
                filename: 'index.html',
            }),
            new MiniCssExtractPlugin({
                filename: isProduction ? '[name]-[contenthash].css' : '[name].css',
            }),
            new CopyWebpackPlugin({
                patterns: [
                    { from: 'images', to: '.', noErrorOnMissing: true },
                ],
            }),
        ],
        devServer: {
            static: "./",
            hot: true,
            port: 5173,
            server: "https"
        },
        devtool: "inline-source-map",
    };
};
