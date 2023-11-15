import express from 'express';
const router = express.Router();
import { decode } from '../middlewares/jwt';
import { handleInvalidMethod } from '../middlewares/invalidrequest'
import UploadService from '../services/upload.services';
import uploadsControllers from '../controllers/uploadrequest.controller';

const uploadService = new UploadService()

router.get('/instagram-upload-media-request', decode , uploadService.arraifyUploads(), uploadsControllers.newUploadRequest)




router.all('/instagram-upload-media-request', handleInvalidMethod);
export default router