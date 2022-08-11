import express from "express"

import { create_location, edit_location, delete_location, paginate_location, get_location } from "../controller/locationController";
const router = express.Router();

router.post("/create",create_location);
router.post("/edit",edit_location);
router.post("/paginatelocations",paginate_location);
router.delete("/delete/:location_id",delete_location);
router.get("/:location_id",get_location);

export default router;