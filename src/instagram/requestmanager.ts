import Jimp from "jimp";
import utils from "../helpers/misc";
import config from "../settings";
import Neuron from "../models/neural.model";

export class InstagramRequest {
  public baseUrl: string;
  public igUserId: string;
  public getRequest: any;
  public accessToken: string;
  public carouselId: any = null;
  public itemContainers: string[] = [];

  constructor() {
    this.baseUrl = config.graphApiBaseUrl;
    this.igUserId = process.env.INSTAGRAM_USER_ID as string;
    this.accessToken = process.env.GRAPH_API_LONG_LIVED_TOKEN as string;
  }

  private requestFactory() {
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

  private async _saveLastLogin() {
    let neuron: any = await Neuron.findOneAndUpdate({});
    if (!neuron) {
      neuron = await new Neuron();
    }
    neuron.instagramLastLogin = new Date();
    const savedNeuron = await neuron.save();
    console.log("Saved neuron ", savedNeuron);
  }

  public async getLongLivedToken(shortLivedToken:string){
    const requests = this.requestFactory();
    const url = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.APPID as string}&client_secret=${process.env.APPSECRET as string}&fb_exchange_token=${shortLivedToken}`
    const response: any = await requests.get(url);
    if(response.access_token){
        this.accessToken = response.access_token
        return this.accessToken
    }
    /*Use short lived token as fallback token if request to get long lived token failed*/
    this.accessToken = shortLivedToken
    return null
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
                .resize(405, 405, Jimp.RESIZE_NEAREST_NEIGHBOR)
                .quality(100)
                .write(
                  `./public/processing/${updatedCaption}.jpg`,
                  async () => {}
                );
              resolve(`/processing${updatedCaption}.jpg`);
            });
          });
          p.then(async (imageUrl: any) => {
            const graphApiUrl = `${this.baseUrl}${this.igUserId}/media?image_url=${config.serverBaseUrl}${imageUrl}&is_carousel_item=true&access_token=${this.accessToken}`;
            const requests = this.requestFactory();
            const response: { id: string } = await requests.post(graphApiUrl);
            await utils.delay(1500);
            if (response.id) {
              this.itemContainers.push(response.id);
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
      });
    } catch (error: any) {
      console.log(error);
    }
  }

  public async createCarouselContainer(metaData: any) {
    try {
      return new Promise(async (resolve, reject) => {
        const caption = metaData.caption.replaceAll(" ", "%2C");
        const graphApiUrl = `${this.baseUrl}${
          this.igUserId
        }/media?caption=${caption}&media_type=CAROUSEL&children=${this.itemContainers.join(
          "%2C"
        )}&access_token=${this.accessToken}`;
        const requests = this.requestFactory();
        const response: { id: string } = await requests.post(graphApiUrl);
        this.carouselId = response.id;
        console.log("Carousel ID ", this.carouselId);
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
        console.log("Executing publish");
        const graphApiUrl = `${this.baseUrl}${this.igUserId}/media_publish?creation_id=${this.carouselId}&access_token=${this.accessToken}`;
        const igMediaId: { id: string } = await this.requestFactory().post(
          graphApiUrl
        );
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
      return {
        status: false,
        data: null,
        message: "Could not find a valid carousel to publish",
      };
    } catch (err: any) {
      console.log(err);
    }
  }

  public async publishMediaRequest(data: any) {
    return await this.createItemsContainer(data).then(async (state) => {
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
    });
  }
}
