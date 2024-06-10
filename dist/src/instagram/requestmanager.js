"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstagramRequest = void 0;
const jimp_1 = __importDefault(require("jimp"));
const misc_1 = __importDefault(require("../helpers/misc"));
const settings_1 = __importDefault(require("../settings"));
const neural_model_1 = __importDefault(require("../models/neural.model"));
class InstagramRequest {
    constructor() {
        this.singlePost = false;
        this.singlePostContainer = null;
        this.carouselId = null;
        this.itemContainers = [];
        this.baseUrl = settings_1.default.graphApiBaseUrl;
        this.igUserId = process.env.INSTAGRAM_USER_ID;
    }
    static requestFactory() {
        return {
            get: async (url) => {
                try {
                    console.log("Fetching ", url);
                    const response = await fetch(url, {
                        method: "get",
                        headers: { "Content-Type": "application/json" },
                    });
                    const json = await response.json();
                    return json;
                }
                catch (err) {
                    console.log(err);
                }
            },
            post: async (url, body = {}) => {
                try {
                    const response = await fetch(url, {
                        method: "post",
                        body: JSON.stringify(body),
                        headers: { "Content-Type": "application/json" },
                    });
                    const json = await response.json();
                    return json;
                }
                catch (err) {
                    console.log(err);
                }
            },
        };
    }
    static async saveLastLogin() {
        let neuron = await neural_model_1.default.findOneAndUpdate({});
        if (!neuron) {
            neuron = await new neural_model_1.default();
        }
        neuron.instagramLastLogin = new Date();
        await neuron.save();
    }
    static async getLongLivedToken(shortLivedToken) {
        try {
            const requests = InstagramRequest.requestFactory();
            const url = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.APPID}&client_secret=${process.env.APPSECRET}&fb_exchange_token=${shortLivedToken}`;
            const response = await requests.get(url);
            if (response.access_token) {
                InstagramRequest.accessToken = response.access_token;
                return InstagramRequest.accessToken;
            }
            /*Use short lived token as fallback token if request to get long lived token failed*/
            InstagramRequest.accessToken = shortLivedToken;
            return null;
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    async createItemsContainer(metaData) {
        try {
            console.log("Creating container");
            const imagesUrls = metaData.request_images;
            return new Promise((tresolve, treject) => {
                imagesUrls.forEach(async (imageUrl) => {
                    const updatedCaption = imageUrl.replaceAll(".jpeg", "") + "-temp";
                    let p = new Promise((resolve, reject) => {
                        jimp_1.default.read(`${settings_1.default.serverBaseUrl}${imageUrl}`).then((lenna) => {
                            lenna
                                .resize(800, 800, jimp_1.default.RESIZE_HERMITE)
                                .quality(100)
                                .write(`./public/processing/${updatedCaption}.jpg`, async () => { });
                            resolve(`/processing${updatedCaption}.jpg`);
                        });
                    });
                    p.then(async (imageUrl) => {
                        let graphApiUrl;
                        if (imagesUrls.length > 1) {
                            graphApiUrl = `${this.baseUrl}${this.igUserId}/media?image_url=${settings_1.default.serverBaseUrl}${imageUrl}&is_carousel_item=true&access_token=${InstagramRequest.accessToken}`;
                        }
                        else {
                            this.singlePost = true;
                            const caption = this._processCaption(metaData.caption.replaceAll(" ", "%2C"));
                            graphApiUrl = `${this.baseUrl}${this.igUserId}/media?image_url=${settings_1.default.serverBaseUrl}${imageUrl}&caption=${caption}&access_token=${InstagramRequest.accessToken}`;
                        }
                        console.log(graphApiUrl);
                        const requests = InstagramRequest.requestFactory();
                        const response = await requests.post(graphApiUrl);
                        console.log("Response ===> ", response);
                        if (response?.error?.code == 190) {
                            tresolve("unauthenticated");
                        }
                        await misc_1.default.delay(1500);
                        if (response.id) {
                            if (this.singlePost) {
                                this.singlePostContainer = response.id;
                                tresolve("single-completed");
                            }
                            else {
                                this.itemContainers.push(response.id);
                            }
                        }
                        else {
                            tresolve("failed");
                        }
                        if (this.itemContainers.length != 0 &&
                            this.itemContainers.length == imagesUrls.length) {
                            tresolve("completed");
                        }
                    }).catch((error) => {
                        treject("error");
                        console.log(error);
                    });
                });
            }).catch((error) => { });
        }
        catch (error) {
            console.log(error);
        }
    }
    _processCaption(caption) {
        return caption;
    }
    async createCarouselContainer(metaData) {
        try {
            return new Promise(async (resolve, reject) => {
                const caption = this._processCaption(metaData.caption.replaceAll(" ", "%2C"));
                const graphApiUrl = `${this.baseUrl}${this.igUserId}/media?caption=${caption}&media_type=CAROUSEL&children=${this.itemContainers.join("%2C")}&access_token=${InstagramRequest.accessToken}`;
                const requests = InstagramRequest.requestFactory();
                const response = await requests.post(graphApiUrl);
                this.carouselId = response.id;
                console.log("Carousel ID ", response);
                resolve(this.carouselId);
            }).catch((error) => {
                console.log(error);
            });
        }
        catch (error) {
            console.log(error);
        }
    }
    async publishCarousel() {
        try {
            if (this.carouselId != "" && this.carouselId != undefined) {
                console.log("Executing publish for carousel");
                return await this.publisher();
            }
            if (this.singlePost) {
                console.log("Executing publish for Single post");
                if (this.singlePostContainer) {
                    this.carouselId = undefined;
                    return await this.publisher();
                }
                return {
                    status: false,
                    data: "",
                    message: "Could not publishn single post at this time",
                };
            }
            return {
                status: false,
                data: null,
                message: "Could not find a valid carousel to publish",
            };
        }
        catch (err) {
            console.log(err);
        }
    }
    async publisher() {
        try {
            const graphApiUrl = `${this.baseUrl}${this.igUserId}/media_publish?creation_id=${this.carouselId || this.singlePostContainer}&access_token=${InstagramRequest.accessToken}`;
            const igMediaId = await InstagramRequest.requestFactory().post(graphApiUrl);
            console.log("Media ID ", igMediaId);
            if (igMediaId.id) {
                return {
                    status: true,
                    data: igMediaId?.id,
                    message: "Carousel has been published",
                };
            }
            return {
                status: false,
                data: igMediaId?.id,
                message: "Could not publish at this time",
            };
        }
        catch (error) {
            console.log(error);
            return {
                status: false,
                data: null,
                message: "Could not publish at this time",
            };
        }
    }
    async publishMediaRequest(data) {
        return await this.createItemsContainer(data).then(async (state) => {
            try {
                if (state == "unauthenticated") {
                    return {
                        status: false,
                        message: "Unauthenticated",
                        code: 190,
                    };
                }
                if (state == "single-completed") {
                    if (this.singlePost && this.singlePostContainer) {
                        return await this.publishCarousel();
                    }
                    else {
                        return {
                            status: false,
                            message: "Could process single post parameters",
                        };
                    }
                }
                if (state == "completed") {
                    return await this.createCarouselContainer(data).then(async (carouselId) => {
                        if (carouselId) {
                            return await this.publishCarousel();
                        }
                        return {
                            status: false,
                            message: "Could not generate carousel for images",
                        };
                    });
                }
                return {
                    status: false,
                    message: "Could not generate container for carousel",
                };
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
exports.InstagramRequest = InstagramRequest;
InstagramRequest.accessToken = "EAAFXaSZBSgTQBO3ePZC4msH3G3D8VdoExb7BFWd1jSlHEGFpu6t9TBe7bUjsZBLdqjHtXQsJHeMWsmlGxnOa8kLu0c1D5CyvHpUZB8ucq7ZBSeHmIpmCYZCu0xraPMogZCgAgL0h8DmliQgMiz7QmHmYy7xephDcn3eseczpcwK7ZBapnL3GXgqhvHdLkbcYt8sJBBYrfdgZBhoEUZCZAh5Jsh5lXBksLhSeSmnfIdAyNRnfPADa7L7k4J3ZCtWK2KYKUzRmbIo0kwZDZD";
