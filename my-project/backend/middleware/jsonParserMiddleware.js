const bodyParser = require("body-parser");
const express = require("express");

const jsonParserMiddleware = () => [
  bodyParser.json(),  // Parse JSON request body
  express.json()      // Additional express JSON middleware
];

module.exports = jsonParserMiddleware;
