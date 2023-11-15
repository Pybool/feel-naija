import multer from 'multer';
import {Request} from 'express';
import RequestFormModel from "../models/newrequest.model";

class UploadService{
    constructor(){}

    arraifyUploads(){
        // Set up Multer for handling file uploads
        const storage = multer.memoryStorage();
        const upload = multer({ storage: storage });
        return upload.array('images', Number(process.env.MAX_IMAGES))
    }

    async processAndSave(req:Request){
        // Extract text from the FormData
        const text = req.body.text;
        // Extract image data and save to MongoDB
        const files:any = req.files
        const imageUrls = files?.map((file: any) => {
        const base64Image = file.buffer.toString('base64');
        return `data:${file.mimetype};base64,${base64Image}`;
        });

        // Create a new FormData document
        const formData = new RequestFormModel({
        text: text,
        images: imageUrls,
        });
        const savedStatus = await formData.save();
        return savedStatus._id.toString().length > 0
    }
}

export default UploadService