import user from './user'
import location from './location'
import shift from './shifts'
import organization from './organization'
import admin_dashboard from './admin_dashboard'
import express from "express"
import shift_entry from './shift_entry'
import { upload } from '../s3_settings';
const router = express.Router();

router.use('/user',user);
router.use('/location',location);
router.use('/organization',organization);
router.use('/shift',shift);
router.use('/admin_dashboard',admin_dashboard);
router.use('/shiftentry',shift_entry);
export default router
