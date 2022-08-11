"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controller/userController");
const s3_utils_1 = require("../s3_utils");
const router = express_1.default.Router();
router.post("/login", userController_1.login);
router.post("/getuser", userController_1.get_user_data);
router.get("/logout", userController_1.log_out);
router.post("/create", (0, s3_utils_1.upload_single_file)("userimages", "user_image"), userController_1.create_user);
router.get("/validation", userController_1.validate_token);
router.post("/edituseradmin", (0, s3_utils_1.upload_single_file)("userimages", "file"), userController_1.edit_user_admin);
router.post("/edituser", userController_1.edit_user);
router.delete("/delete/:user_ref", userController_1.delete_user);
exports.default = router;
