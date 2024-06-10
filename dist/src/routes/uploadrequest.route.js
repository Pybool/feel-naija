"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const invalidrequest_1 = require("../middlewares/invalidrequest");
const uploadservices_1 = __importDefault(require("../services/uploadservices"));
const uploadrequest_controller_1 = __importDefault(require("../controllers/uploadrequest.controller"));
const ratelimit_1 = require("../middlewares/ratelimit");
const uploadService = new uploadservices_1.default();
router.post('/instagram-upload-media-request', uploadService.arraifyUploads(), uploadrequest_controller_1.default.newUploadRequest);
router.put('/instagram-authorize-igpost', uploadrequest_controller_1.default.verifyAuthorizationCode);
router.all('/instagram-upload-media-request', ratelimit_1.limiter, invalidrequest_1.handleInvalidMethod);
router.all('/instagram-authorize-igpost', invalidrequest_1.handleInvalidMethod);
exports.default = router;
