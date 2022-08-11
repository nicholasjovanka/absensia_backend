"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const shiftController_1 = require("../controller/shiftController");
router.post("/create", shiftController_1.create_shifts);
router.post("/edit", shiftController_1.edit_shift);
router.post("/approve", shiftController_1.approve_shift);
router.get("/get-shift/:shift_id", shiftController_1.get_shift);
router.delete("/delete/:shift_id", shiftController_1.delete_shift);
exports.default = router;
