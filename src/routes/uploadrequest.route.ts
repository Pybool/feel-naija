import express from 'express';
const router = express.Router();
import { decode } from '../middlewares/jwt';
import { handleInvalidMethod } from '../middlewares/invalidrequest'
import UploadService from '../services/uploadservices';
import uploadsControllers from '../controllers/uploadrequest.controller';
import { limiter } from '../middlewares/ratelimit';

const uploadService = new UploadService()

router.post('/instagram-upload-media-request' , uploadService.arraifyUploads(), uploadsControllers.newUploadRequest)
router.put('/instagram-authorize-igpost' , uploadsControllers.verifyAuthorizationCode)

router.all('/instagram-upload-media-request', limiter, handleInvalidMethod);
router.all('/instagram-authorize-igpost', handleInvalidMethod);
export default router

