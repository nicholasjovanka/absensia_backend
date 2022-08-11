"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.q = exports.server = void 0;
const faunadb_1 = require("faunadb");
exports.server = new faunadb_1.Client({ secret: process.env.FAUNADB_SECRET || "", domain: "db.fauna.com" });
exports.q = faunadb_1.query;
const client = (token) => new faunadb_1.Client({ secret: token });
exports.client = client;
