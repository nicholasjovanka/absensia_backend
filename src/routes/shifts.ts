import express from "express"

const router = express.Router();
import {create_shifts,edit_shift,delete_shift,approve_shift,get_shift} from "../controller/shiftController"

router.post("/create",create_shifts);
router.post("/edit",edit_shift);
router.post("/approve",approve_shift);
router.get("/get-shift/:shift_id",get_shift);
router.delete("/delete/:shift_id",delete_shift);
export default router;