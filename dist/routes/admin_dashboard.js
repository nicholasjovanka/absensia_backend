"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminDashboardController_1 = require("../controller/adminDashboardController");
const router = express_1.default.Router();
router.post("/shifts", adminDashboardController_1.paginate_shifts);
router.post("/shifts_entries", adminDashboardController_1.paginate_shifts_entries);
router.post("/users", adminDashboardController_1.paginate_users);
router.post("/locations", adminDashboardController_1.paginate_location);
router.post("/shift_list", adminDashboardController_1.get_shift_list_by_date);
router.post("/shift_user_list", adminDashboardController_1.get_shift_users);
router.post("/dashboard_statistics", adminDashboardController_1.admin_dashboard_statistics);
exports.default = router;
