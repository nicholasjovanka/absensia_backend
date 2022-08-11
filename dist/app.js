"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import cron from 'node-cron';
const compression_1 = __importDefault(require("compression"));
const body_parser_1 = require("body-parser");
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const root_router_1 = __importDefault(require("./routes/root_router"));
const app = (0, express_1.default)();
app.use((0, compression_1.default)({ threshold: 0 }), (0, body_parser_1.urlencoded)({ extended: true }), (0, body_parser_1.json)(), (0, cors_1.default)({
    origin: '*',
    optionsSuccessStatus: 200,
}));
app.use("/", root_router_1.default);
app.listen(3000, () => {
    console.log(`Application is running on port 3000`);
});
// cronjob.start();
