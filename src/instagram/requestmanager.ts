import Jimp from "jimp";
import utils from "../helpers/misc";
import config from "../settings";
import Neuron from "../models/neural.model";

export class InstagramRequest {
  public baseUrl: string;
  public igUserId: string;
  public getRequest: any;
  public singlePost: boolean = false;
  public singlePostContainer: any = null;
  public static accessToken: string =
    "EAAFXaSZBSgTQBO0bf6aHzecG22JiY8YwYr8nwmhj32itQgB8uiZC5HlpUWE3wZAUDcEm4rOAULoafugfmCJGq8hIQBfdnEiIhThIitWn4mOxCCUadvgXuvoxL20vgAZCLkW1u82ZAFKuleOX0cCNBkcKe4cPEBAZAxpfjPjebodCJJ2BzZBQ5EqllYhKoVJznd2";
  public carouselId: any = null;
  public itemContainers: string[] = [];

  constructor() {
    this.baseUrl = config.graphApiBaseUrl;
    this.igUserId = process.env.INSTAGRAM_USER_ID as string;
  }

  private static requestFactory() {
    return {
      get: async (url: string) => {
        try {
          const response = await fetch(url, {
            method: "get",
            headers: { "Content-Type": "application/json" },
          });
          const json = await response.json();
          return json;
        } catch (err) {
          console.log(err);
        }
      },

      post: async (url: string, body: any = {}) => {
        try {
          const response = await fetch(url, {
            method: "post",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
          });
          const json = await response.json();
          return json;
        } catch (err) {
          console.log(err);
        }
      },
    };
  }

  public static async saveLastLogin() {
    let neuron: any = await Neuron.findOneAndUpdate({});
    if (!neuron) {
      neuron = await new Neuron();
    }
    neuron.instagramLastLogin = new Date();
    await neuron.save();
  }

  public static async getLongLivedToken(shortLivedToken: string) {
    try {
      const requests = InstagramRequest.requestFactory();
      const url = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${
        process.env.APPID as string
      }&client_secret=${
        process.env.APPSECRET as string
      }&fb_exchange_token=${shortLivedToken}`;
      const response: any = await requests.get(url);
      if (response.access_token) {
        InstagramRequest.accessToken = response.access_token;
        return InstagramRequest.accessToken;
      }
      /*Use short lived token as fallback token if request to get long lived token failed*/
      InstagramRequest.accessToken = shortLivedToken;
      return null;
    } catch(error) {
      console.log(error)
      return null;
    }
  }

  public async createItemsContainer(metaData: any) {
    try {
      const imagesUrls: any[] = metaData.request_images;
      return new Promise((tresolve: any, treject: any) => {
        imagesUrls.forEach(async (imageUrl: string) => {
          const updatedCaption = imageUrl.replaceAll(".jpeg", "") + "-temp";
          let p = new Promise((resolve: any, reject: any) => {
            Jimp.read(`${config.serverBaseUrl}${imageUrl}`).then((lenna) => {
              lenna
                .resize(1000, 800, Jimp.RESIZE_HERMITE)
                .quality(100)
                .write(
                  `./public/processing/${updatedCaption}.jpg`,
                  async () => {}
                );
              resolve(`/processing${updatedCaption}.jpg`);
            });
          });
          p.then(async (imageUrl: any) => {
            let graphApiUrl;
            if (imagesUrls.length > 1) {
              graphApiUrl = `${this.baseUrl}${this.igUserId}/media?image_url=${config.serverBaseUrl}${imageUrl}&is_carousel_item=true&access_token=${InstagramRequest.accessToken}`;
            } else {
              this.singlePost = true;
              const caption = this._processCaption(
                metaData.caption.replaceAll(" ", "%2C")
              );
              graphApiUrl = `${this.baseUrl}${this.igUserId}/media?image_url=${config.serverBaseUrl}${imageUrl}&caption=${caption}&access_token=${InstagramRequest.accessToken}`;
            }
            const requests = InstagramRequest.requestFactory();
            const response: any = await requests.post(graphApiUrl);
            if (response?.error?.code == 190) {
              tresolve("unauthenticated");
            }
            await utils.delay(1500);
            if (response.id) {
              if (this.singlePost) {
                this.singlePostContainer = response.id;
                tresolve("single-completed");
              } else {
                this.itemContainers.push(response.id);
              }
            } else {
              tresolve("failed");
            }

            if (
              this.itemContainers.length != 0 &&
              this.itemContainers.length == imagesUrls.length
            ) {
              tresolve("completed");
            }
          }).catch((error: any) => {
            treject("error");
            console.log(error);
          });
        });
      }).catch((error: any) => {});
    } catch (error: any) {
      console.log(error);
    }
  }

  private _processCaption(caption: string) {
    return caption;
  }

  public async createCarouselContainer(metaData: any) {
    try {
      return new Promise(async (resolve, reject) => {
        const caption = this._processCaption(
          metaData.caption.replaceAll(" ", "%2C")
        );
        const graphApiUrl = `${this.baseUrl}${
          this.igUserId
        }/media?caption=${caption}&media_type=CAROUSEL&children=${this.itemContainers.join(
          "%2C"
        )}&access_token=${InstagramRequest.accessToken}`;
        const requests = InstagramRequest.requestFactory();
        const response: { id: string } = await requests.post(graphApiUrl);
        this.carouselId = response.id;
        console.log("Carousel ID ", response);
        resolve(this.carouselId);
      }).catch((error: any) => {
        console.log(error);
      });
    } catch (error: any) {
      console.log(error);
    }
  }

  public async publishCarousel() {
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
    } catch (err: any) {
      console.log(err);
    }
  }

  private async publisher() {
    try {
      const graphApiUrl = `${this.baseUrl}${
        this.igUserId
      }/media_publish?creation_id=${
        this.carouselId || this.singlePostContainer
      }&access_token=${InstagramRequest.accessToken}`;
      const igMediaId: { id: string } =
        await InstagramRequest.requestFactory().post(graphApiUrl);
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
    } catch(error) {
      console.log(error)
      return {
        status: false,
        data: null,
        message: "Could not publish at this time",
      };
    }
  }

  public async publishMediaRequest(data: any) {
    return await this.createItemsContainer(data).then(async (state) => {
      try{
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
          } else {
            return {
              status: false,
              message: "Could process single post parameters",
            };
          }
        }
        if (state == "completed") {
          return await this.createCarouselContainer(data).then(
            async (carouselId) => {
              if (carouselId) {
                return await this.publishCarousel();
              }
              return {
                status: false,
                message: "Could not generate carousel for images",
              };
            }
          );
        }
        return {
          status: false,
          message: "Could not generate container for carousel",
        };
      }
      catch(error){
        console.log(error)
      }
    });
  }
}
