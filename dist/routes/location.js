"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const locationController_1 = require("../controller/locationController");
const router = express_1.default.Router();
router.post("/create", locationController_1.create_location);
router.post("/edit", locationController_1.edit_location);
router.post("/paginatelocations", locationController_1.paginate_location);
router.delete("/delete/:location_id", locationController_1.delete_location);
router.get("/:location_id", locationController_1.get_location);
exports.default = router;
