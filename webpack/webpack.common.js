const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = "../src/";

module.exports = {
  entry: {
    popup: path.join(__dirname, srcDir + "popup.tsx"),
    options: path.join(__dirname, srcDir + "options.ts"),
    background: path.join(__dirname, srcDir + "background.ts"),
    content_script: path.join(__dirname, srcDir + "content_script.ts")
  },
  output: {
    path: path.join(__dirname, "../dist/js"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "awesome-ts-loader",
        exclude: /node_modules/
      },

      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }]
      },

      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        use: [{ loader: "url-loader", options: { limit: 100000 } }]
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  plugins: [
    // exclude locale files in moment
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new CopyPlugin([{ from: ".", to: "../" }], { context: "public" })
  ]
};
