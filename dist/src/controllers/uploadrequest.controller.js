"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../logger"));
const uploadservices_1 = __importDefault(require("../services/uploadservices"));
const misc_1 = __importDefault(require("../helpers/misc"));
const validators_1 = __importDefault(require("../helpers/validators/validators"));
const uploadsControllers = {
    newUploadRequest: (async (req, res) => {
        try {
            const validation = validators_1.default.newUploadRequest(req.body);
            const hasPendingAuthorization = false; //Implement the function check later
            if (validation.success && !hasPendingAuthorization) {
                const uploadService = new uploadservices_1.default();
                const process = await uploadService.processAndSave(req);
                if (process.status && process.message == 'trueCommit') {
                    misc_1.default.telcoSimulate(4000, req.body.phone).then(async (telcoResponse) => {
                        console.log(telcoResponse);
                        await uploadService.handleTelcoConfirmation(telcoResponse);
                    });
                    res.status(201).json({ status: true, data: process.id, message: 'FormData stored successfully' });
                }
                else if (!process.status && process.message == 'falseCommit') {
                    res.status(422).json({ status: false, message: 'Request did not process correctly to completion' });
                }
                else if (!process.status && process.message == 'badData') {
                    res.status(400).json({ status: false, message: 'Could not retrieve email or mobile phone number' });
                }
            }
            else {
                res.status(400).json({ status: false, message: validation.error });
            }
        }
        catch (error) {
            logger_1.default.error('newUploadRequest: ' + error);
            res.status(400).json({ error: 'Internal Server Error' });
        }
    }),
    verifyAuthorizationCode: (async (req, res, next) => {
        try {
            const authorizeData = req.body;
            if (!authorizeData) {
                res.status(400).json({ message: 'Bad request format' });
            }
            const uploadService = new uploadservices_1.default();
            const post = await uploadService.authorizePost(req);
            if (post.isAuthorized) {
                res.status(200).json({ status: true, message: 'Your instagram post request has been verified' });
            }
            else {
                res.status(403).json({ status: false, message: 'Your instagram post request failed authorization' });
            }
        }
        catch (err) {
            console.log(err);
            res.status(400).json({ error: 'Internal Server Error' });
        }
    }),
};
exports.default = uploadsControllers;
