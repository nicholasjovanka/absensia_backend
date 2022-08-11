import express from "express"
import { upload_single_file } from '../s3_utils';
const router = express.Router();
import {create_shift_entry,edit_shift_entry,delete_shift_entry,clock_in,clock_out,paginate_shifts_entries, get_shift_entry} from "../controller/shiftEntryController"

router.post("/create",create_shift_entry);
router.post("/edit",edit_shift_entry);
router.delete("/delete/:shift_entry_id",delete_shift_entry);
router.get("/get/:shift_entry_id",get_shift_entry);
router.post("/clockin",upload_single_file("attendanceimages","file"),clock_in);
router.post("/clockout",upload_single_file("attendanceimages","file"),clock_out);
router.post("/user_shift_entries",paginate_shifts_entries);
export default router;