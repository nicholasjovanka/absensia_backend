import express from "express"
import { login,get_user_data, validate_token, create_user,edit_user_admin, log_out, edit_user, delete_user } from "../controller/userController";
import { upload_single_file } from '../s3_utils';
const router = express.Router();

router.post("/login",login);
router.post("/getuser",get_user_data);
router.get("/logout",log_out);
router.post("/create",upload_single_file("userimages","user_image"), create_user);
router.get("/validation",validate_token);
router.post("/edituseradmin",upload_single_file("userimages","file"), edit_user_admin);
router.post("/edituser",edit_user);
router.delete("/delete/:user_ref",delete_user);
export default router;