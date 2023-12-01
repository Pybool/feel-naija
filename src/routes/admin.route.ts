import express from 'express';
const router = express.Router();
import { decode, ensureAdmin } from '../middlewares/jwt';
import { handleInvalidMethod } from '../middlewares/invalidrequest'
import adminController from '../controllers/admin.controller';

router.put('/user-priviledge', decode, ensureAdmin, adminController.toggleUserAdminStatus)
router.get('/awaiting-ig-post-requests',decode, adminController.getIgPostRequests)
router.post('/publish-ig-post-request',  adminController.pushIgPostRequest)


router.all('/user-priviledge', handleInvalidMethod);
router.all('/awaiting-ig-post-requests',  handleInvalidMethod);
router.all('/publish-ig-post-request', handleInvalidMethod);
export default router

