"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const s3_utils_1 = require("../s3_utils");
const router = express_1.default.Router();
const shiftEntryController_1 = require("../controller/shiftEntryController");
router.post("/create", shiftEntryController_1.create_shift_entry);
router.post("/edit", shiftEntryController_1.edit_shift_entry);
router.delete("/delete/:shift_entry_id", shiftEntryController_1.delete_shift_entry);
router.get("/get/:shift_entry_id", shiftEntryController_1.get_shift_entry);
router.post("/clockin", (0, s3_utils_1.upload_single_file)("attendanceimages", "file"), shiftEntryController_1.clock_in);
router.post("/clockout", (0, s3_utils_1.upload_single_file)("attendanceimages", "file"), shiftEntryController_1.clock_out);
router.post("/user_shift_entries", shiftEntryController_1.paginate_shifts_entries);
exports.default = router;
