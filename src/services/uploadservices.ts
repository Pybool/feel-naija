import multer from "multer";
import path from "path";
import fs from "fs";
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
    try {
      const storage = multer.memoryStorage();
      const upload = multer({
        storage: storage,
        limits: {
          fieldSize: 9 * 1024 * 1024, // 4MB limit
        },
      });
      return upload.array("images", parseInt(process.env.MAX_IMAGES || "5"));
    } catch (error) {
      console.log("Errpr",error);
      throw error;
    }
  }

  async processAndSave(req: Xrequest) {
    try {
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
        if (!Array.isArray(base64ImagesArray)) {
          base64ImagesArray = [base64ImagesArray];
        }
        const today = new Date();
        const dateFolder = `${today.getFullYear()}-${(today.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
        const uploadFolderPath = path
          .join(__dirname, "uploads")
          .replace(path.join("src"), path.join("public"))
          .replace(path.join("services"), "");
        const dailyFolderPath = path.resolve(uploadFolderPath, dateFolder);
        // Create the uploads folder if it doesn't exist
        if (!fs.existsSync(uploadFolderPath)) {
          fs.mkdirSync(uploadFolderPath);
        }

        // Create the daily folder if it doesn't exist
        if (!fs.existsSync(dailyFolderPath)) {
          fs.mkdirSync(dailyFolderPath);
        }
        const imageUrls = base64ImagesArray.map((base64Image: any) => {
          const fileName = `image_${Date.now()}.jpeg`;
          const filePath = path.resolve(dailyFolderPath, fileName);
          // Convert base64 to buffer
          const buffer = Buffer.from(base64Image.split(",")[1], "base64");
          fs.writeFileSync(filePath, buffer);
          const filePathWithoutPublic = filePath.split(path.join("public"))[1];
          const normalizedFilePath = filePathWithoutPublic.replace(
            new RegExp(path.sep.replace("\\", "\\\\"), "g"),
            "/"
          );
          return normalizedFilePath; // You can store the file path in the database if needed
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
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async handleTelcoConfirmation(telcoResponse: ITelcoResponse) {
    try {
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
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getRequestObject(telcoResponse: ITelcoResponse) {
    try {
      const postIGRequest: any =
        (await RequestFormModel.findOne({ phone: telcoResponse.phone })
          .sort({ date_initiated: -1 })
          .exec()) || "";
      return postIGRequest;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async authorizePost(req: Xrequest) {
    try {
      const data: IAuthorizePost = req.body;
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
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

export default UploadService;
