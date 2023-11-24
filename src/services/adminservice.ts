import Xrequest from "../interfaces/extensions.interface";
import RequestFormModel from "../models/newrequest.model";
import Mail from "nodemailer/lib/mailer"
import sendMail from "./mailtrigger"
import socketMessangers from "../helpers/wssender"
import { postToInsta } from "../../test";
import { InstagramRequest } from "../instagram/requestmanager";

export class AdminService {
    constructor(){}

    private buildFilter(parameters:any){
        return {}
    }

    public async getIgPostRequests(req:Xrequest){
        const igPostsUrl = ''
        try {
            const queryParameters = req.query
            const page = Number(queryParameters.page as string) || 1;
            const perPage = Number(queryParameters.perPage as string) || 10;
            const filter: any = this.buildFilter(queryParameters); 
            const totalCount = await RequestFormModel.countDocuments(filter);
        
            // Find documents with pagination and population
            console.log(filter)
            
            const igPostRequests = await RequestFormModel.find(filter)
              .sort({ date_initiated: -1 })
              .skip((page - 1) * perPage)
              .limit(perPage)
              .exec();        
            const totalPages = Math.ceil(totalCount / perPage);
            const hasNextPage = page < totalPages;
            const hasPreviousPage = page > 1;
        
            const paginationInfo = {
              page,
              perPage,
              totalPostRequests: totalCount,
              totalPages,
              hasNextPage,
              hasPreviousPage,
            };
        
            const links:any = {
              self: `${igPostsUrl}?page=${page}&perPage=${perPage}`,
            };
        
            if (hasNextPage) {
              links.next = `${igPostsUrl}?page=${page + 1}&perPage=${perPage}`;
              links.last = `${igPostsUrl}?page=${totalPages}&perPage=${perPage}`;
            }
        
            if (hasPreviousPage) {
              links.prev = `${igPostsUrl}?page=${page - 1}&perPage=${perPage}`;
            }        
            return { status: true, data: igPostRequests, paginationInfo, links };
          } 
        catch (error:any) {
           return { status: false, error: error.message };
        }
    }

    public async pushIgPostRequest(req:Xrequest){
        const filter = {_id:req.body.postId}
        const postObject:any = await RequestFormModel.findOne(filter)
        this._uploadInstagramPost(postObject)
        socketMessangers.sendPersonalWebscoketMessage(
            "instagram-post",
            postObject.client?._id.toString(),
            { status: "completed" }
        );
    }

    private async _uploadInstagramPost(postObject:any){
        await new Promise(async(resolve:any, reject:any)=>{
          resolve(console.log(postObject))
           if (postObject.request_images.length == 1){
            await postToInsta()
            resolve(1)
           }
           else{
            const instagramRequest = new InstagramRequest()
            await instagramRequest.publishMediaRequest(postObject)
            resolve(1)
           }
        });
        console.log('Long-running task completed');
    };

    

}