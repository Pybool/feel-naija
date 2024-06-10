"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const jwt_1 = require("../middlewares/jwt");
const invalidrequest_1 = require("../middlewares/invalidrequest");
const admin_controller_1 = __importDefault(require("../controllers/admin.controller"));
router.put('/user-priviledge', admin_controller_1.default.toggleUserAdminStatus);
router.get('/awaiting-ig-post-requests', jwt_1.decode, admin_controller_1.default.getIgPostRequests);
router.post('/publish-ig-post-request', admin_controller_1.default.pushIgPostRequest);
router.all('/user-priviledge', invalidrequest_1.handleInvalidMethod);
router.all('/awaiting-ig-post-requests', invalidrequest_1.handleInvalidMethod);
router.all('/publish-ig-post-request', invalidrequest_1.handleInvalidMethod);
exports.default = router;
