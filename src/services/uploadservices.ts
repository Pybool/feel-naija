import multer from "multer";
import path from 'path'
import fs from 'fs'
import { Request } from "express";
import RequestFormModel from "../models/newrequest.model";
import { config as dotenvConfig } from "dotenv";
import Xrequest from "../interfaces/extensions.interface";
import { ITelcoResponse, IAuthorizePost } from "../interfaces/upload.interface";
import utils from "../helpers/misc";
import socketMessangers from "../helpers/wssender";
import mailActions from "./mailservice";

dotenvConfig();

class UploadService {
  constructor() {}

  arraifyUploads() {
    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });
    return upload.array("images", parseInt(process.env.MAX_IMAGES || "5"));
  }

  async processAndSave(req: Xrequest) {
    // Extract text from the FormData
    let phone = null;
    let email = null;
    if (req.userId == null) {
      phone = req.body.phone;
      email = req.body.email;
    } else {
      phone = req.body.phone;
      email = req.body.email;
    }
    if (phone && email) {
      const text = req.body.comment;
      let base64ImagesArray: string[] = req.body.images;
      console.log(base64ImagesArray)
      if (!Array.isArray(base64ImagesArray)) {
        base64ImagesArray = [base64ImagesArray];
      }
      const today = new Date();
      const dateFolder = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const uploadFolderPath = path.resolve(__dirname, 'uploads').replace('\\src','\\public').replace('\\services','');
      const dailyFolderPath = path.resolve(uploadFolderPath, dateFolder);
      // Create the uploads folder if it doesn't exist
      if (!fs.existsSync(uploadFolderPath)) {
        fs.mkdirSync(uploadFolderPath);
      }

      // Create the daily folder if it doesn't exist
      if (!fs.existsSync(dailyFolderPath)) {
        fs.mkdirSync(dailyFolderPath);
      }
      const imageUrls = base64ImagesArray.map((base64Image:any) => {
        const fileName = `image_${Date.now()}.jpeg`;
        const filePath = path.resolve(dailyFolderPath, fileName)    
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Image.split(",")[1], "base64");    
        fs.writeFileSync(filePath, buffer);
        return filePath.split('\\public')[1].replaceAll("\\",'/'); // You can store the file path in the database if needed
      });
      const formData = new RequestFormModel({
        phone: phone,
        email: email,
        caption: text,
        request_images: imageUrls,
        request_otp_code: utils.generateOtp(),
      });
      const savedStatus = await formData.save();
      const checkSave = savedStatus._id.toString().length > 0;
      if (checkSave) {
        return {
          status: checkSave,
          id: savedStatus._id.toString(),
          message: "trueCommit",
        };
      } else {
        return { status: checkSave, id: "", message: "falseCommit" };
      }
    }
    return { status: false, id: "", message: "badData" };
  }

  async handleTelcoConfirmation(telcoResponse: ITelcoResponse) {
    const requestObject: any = await this.getRequestObject(telcoResponse);
    const mailPayload = {
      authorizationCode: requestObject.request_otp_code,
      email: requestObject.email,
      postRef: requestObject._id.toString(),
    };
    mailActions.uploadRequest.sendOneTimePasswordMail(mailPayload);
    socketMessangers.sendPersonalWebscoketMessage("", "", {
      requestCode: requestObject.request_otp_code,
    });
  }

  async getRequestObject(telcoResponse: ITelcoResponse) {
    const postIGRequest: any =
      (await RequestFormModel.findOne({ phone: telcoResponse.phone })
        .sort({ date_initiated: -1 })
        .exec()) || "";
    return postIGRequest;
  }

  async authorizePost(req: Xrequest) {
    const data: IAuthorizePost = req.body;
    console.log(data);
    if (data.code != "" && data.postRef != "") {
      const filter = { request_otp_code: data.code, _id: data.postRef };
      const requestObject: any = await RequestFormModel.findOne(filter);
      console.log("Request object to post ===> ", requestObject);
      const isValid = requestObject?.request_otp_code == data.code;
      if (isValid) {
        requestObject.isAuthorized = true;
        await requestObject.save();
      }
      return { data: requestObject, isAuthorized: isValid };
    }
  }
}

export default UploadService;
