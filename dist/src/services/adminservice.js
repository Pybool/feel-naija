"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const newrequest_model_1 = __importDefault(require("../models/newrequest.model"));
const wssender_1 = __importDefault(require("../helpers/wssender"));
const requestmanager_1 = require("../instagram/requestmanager");
class AdminService {
    constructor() { }
    buildFilter(parameters) {
        return {};
    }
    async getIgPostRequests(req) {
        const igPostsUrl = "";
        try {
            const queryParameters = req.query;
            const page = Number(queryParameters.page) || 1;
            const perPage = Number(queryParameters.perPage) || 10;
            const filter = this.buildFilter(queryParameters);
            const totalCount = await newrequest_model_1.default.countDocuments(filter);
            // Find documents with pagination and population
            const igPostRequests = await newrequest_model_1.default.find(filter)
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
            const links = {
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
        catch (error) {
            console.log(error);
            return { status: false, error: error.message };
        }
    }
    async pushIgPostRequest(req) {
        try {
            const filter = { _id: req.body.postId };
            const postObject = await newrequest_model_1.default.findOne(filter);
            const resp = await this._uploadInstagramPost(postObject);
            console.log("resp.code", resp);
            if (resp?.status) {
                postObject.isPosted = true;
                await postObject.save();
                wssender_1.default.sendPersonalWebscoketMessage("instagram-post", postObject.client?._id.toString(), { status: "completed" });
                return resp;
            }
            else {
                if (resp?.code == 190) {
                    return resp?.code;
                }
            }
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    async _uploadInstagramPost(postObject) {
        try {
            return await new Promise(async (resolve, reject) => {
                const instagramRequest = new requestmanager_1.InstagramRequest();
                const resp = await instagramRequest.publishMediaRequest(postObject);
                resolve(resp);
            });
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
}
exports.AdminService = AdminService;
