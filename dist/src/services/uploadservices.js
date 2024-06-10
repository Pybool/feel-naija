"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const newrequest_model_1 = __importDefault(require("../models/newrequest.model"));
const dotenv_1 = require("dotenv");
const misc_1 = __importDefault(require("../helpers/misc"));
const wssender_1 = __importDefault(require("../helpers/wssender"));
const mailservice_1 = __importDefault(require("./mailservice"));
(0, dotenv_1.config)();
class UploadService {
    constructor() { }
    arraifyUploads() {
        try {
            const storage = multer_1.default.memoryStorage();
            const upload = (0, multer_1.default)({
                storage: storage,
                limits: {
                    fieldSize: 9 * 1024 * 1024, // 4MB limit
                },
            });
            return upload.array("images", parseInt(process.env.MAX_IMAGES || "5"));
        }
        catch (error) {
            console.log("Errpr", error);
            throw error;
        }
    }
    async processAndSave(req) {
        try {
            let phone = null;
            let email = null;
            if (req.userId == null) {
                phone = req.body.phone;
                email = req.body.email;
            }
            else {
                phone = req.body.phone;
                email = req.body.email;
            }
            if (phone && email) {
                const text = req.body.comment;
                let base64ImagesArray = req.body.images;
                if (!Array.isArray(base64ImagesArray)) {
                    base64ImagesArray = [base64ImagesArray];
                }
                const today = new Date();
                const dateFolder = `${today.getFullYear()}-${(today.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
                const uploadFolderPath = path_1.default
                    .join(__dirname, "uploads")
                    .replace(path_1.default.join("src"), path_1.default.join("public"))
                    .replace(path_1.default.join("services"), "");
                const dailyFolderPath = path_1.default.resolve(uploadFolderPath, dateFolder);
                // Create the uploads folder if it doesn't exist
                if (!fs_1.default.existsSync(uploadFolderPath)) {
                    fs_1.default.mkdirSync(uploadFolderPath);
                }
                // Create the daily folder if it doesn't exist
                if (!fs_1.default.existsSync(dailyFolderPath)) {
                    fs_1.default.mkdirSync(dailyFolderPath);
                }
                const imageUrls = base64ImagesArray.map((base64Image) => {
                    const fileName = `image_${Date.now()}.jpeg`;
                    const filePath = path_1.default.resolve(dailyFolderPath, fileName);
                    // Convert base64 to buffer
                    const buffer = Buffer.from(base64Image.split(",")[1], "base64");
                    fs_1.default.writeFileSync(filePath, buffer);
                    const filePathWithoutPublic = filePath.split(path_1.default.join("public"))[1];
                    const normalizedFilePath = filePathWithoutPublic.replace(new RegExp(path_1.default.sep.replace("\\", "\\\\"), "g"), "/");
                    return normalizedFilePath; // You can store the file path in the database if needed
                });
                const formData = new newrequest_model_1.default({
                    phone: phone,
                    email: email,
                    caption: text,
                    request_images: imageUrls,
                    request_otp_code: misc_1.default.generateOtp(),
                });
                const savedStatus = await formData.save();
                const checkSave = savedStatus._id.toString().length > 0;
                if (checkSave) {
                    return {
                        status: checkSave,
                        id: savedStatus._id.toString(),
                        message: "trueCommit",
                    };
                }
                else {
                    return { status: checkSave, id: "", message: "falseCommit" };
                }
            }
            return { status: false, id: "", message: "badData" };
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async handleTelcoConfirmation(telcoResponse) {
        try {
            const requestObject = await this.getRequestObject(telcoResponse);
            const mailPayload = {
                authorizationCode: requestObject.request_otp_code,
                email: requestObject.email,
                postRef: requestObject._id.toString(),
            };
            mailservice_1.default.uploadRequest.sendOneTimePasswordMail(mailPayload);
            wssender_1.default.sendPersonalWebscoketMessage("", "", {
                requestCode: requestObject.request_otp_code,
            });
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async getRequestObject(telcoResponse) {
        try {
            const postIGRequest = (await newrequest_model_1.default.findOne({ phone: telcoResponse.phone })
                .sort({ date_initiated: -1 })
                .exec()) || "";
            return postIGRequest;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async authorizePost(req) {
        try {
            const data = req.body;
            if (data.code != "" && data.postRef != "") {
                const filter = { request_otp_code: data.code, _id: data.postRef };
                const requestObject = await newrequest_model_1.default.findOne(filter);
                console.log("Request object to post ===> ", requestObject);
                const isValid = requestObject?.request_otp_code == data.code;
                if (isValid) {
                    requestObject.isAuthorized = true;
                    await requestObject.save();
                }
                return { data: requestObject, isAuthorized: isValid };
            }
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
}
exports.default = UploadService;
