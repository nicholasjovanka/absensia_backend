import express from "express"

const router = express.Router();
import {edit_organization} from "../controller/organizationController"
router.post("/edit",edit_organization);
export default router;