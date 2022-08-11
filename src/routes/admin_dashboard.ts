import express from "express"
import { paginate_shifts, paginate_shifts_entries, paginate_users, paginate_location, get_shift_list_by_date, get_shift_users,admin_dashboard_statistics } from "../controller/adminDashboardController";
const router = express.Router();
router.post("/shifts",paginate_shifts);
router.post("/shifts_entries",paginate_shifts_entries);
router.post("/users",paginate_users);
router.post("/locations",paginate_location);
router.post("/shift_list",get_shift_list_by_date);
router.post("/shift_user_list",get_shift_users);
router.post("/dashboard_statistics",admin_dashboard_statistics);
export default router;