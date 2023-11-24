import fs from "fs";
import Jimp from "jimp";
import FileCookieStore from "tough-cookie-filestore";
import imaps from "imap-simple";
import _ from "lodash";
import { simpleParser } from "mailparser";
import dayjs from "dayjs";
import { Instagram } from "instagram-web-api";
import dotenv from "dotenv";
dotenv.config();

const makePost = async () => {
  const instagramLoginFunction = async () => {
    // Persist cookies after Instagram client log in
    const cookieStore = new FileCookieStore("./cookies.json");

    const client = new Instagram(
      {
        username: process.env.INSTAGRAM_USERNAME,
        password: process.env.INSTAGRAM_PASSWORD,
        cookieStore,
      },
      {
        language: "en-US",
      }
    );

    const instagramPostPictureFunction = async () => {
      await client
        .getPhotosByUsername({ username: process.env.INSTAGRAM_USERNAME })
        .then((res: any) => {
          const allCaptions = res.user.edge_owner_to_timeline_media.edges.map(
            (item: any) => item.node.edge_media_to_caption.edges[0]
          );

          const allCaptionsExisting = allCaptions.filter(
            (caption: any) => caption
          );
          const MostRecentAndOffset: { mostRecent: string; offset: number } = {
            mostRecent:
              allCaptions[allCaptions.length - allCaptionsExisting.length].node
                .text,
            offset: allCaptions.length - allCaptionsExisting.length,
          };
          return MostRecentAndOffset;
        })
        .then(
          ({ mostRecent, offset }: { mostRecent: string; offset: number }) => {
            return {
              latestNumber: Number(mostRecent.split(" - ")[0]),
              offset: offset,
            };
          }
        )
        .then(
          ({
            latestNumber,
            offset,
          }: {
            latestNumber: number;
            offset: number;
          }) => {
            const updatedNumber = latestNumber + (offset + 1);
            const updatedCaption = updatedNumber + ''
            Jimp.read('')
              .then((lenna) => {
                return lenna
                  .resize(405, 405, Jimp.RESIZE_NEAREST_NEIGHBOR)
                  .quality(100)
                  .write(`./${""}.jpg`, async () => {
                    // Upload converted and resized JPG to Instagram feed
                    await client
                      .uploadPhoto({
                        photo: `${""}.jpg`,
                        caption: updatedCaption,
                        post: "feed",
                      })
                      .then(async ({ media }:{media:any}) => {
                        console.log(
                          `https://www.instagram.com/p/${media.code}/`
                        );

                        await client.addComment({
                          mediaId: media.id,
                          text: "#nftcollectors #nftcollectibles #dibujo #dibujodigital #pixel #pixelart #digitalart #cute #artist #instadaily #artdaily #pixelartist #dailyart #nfts #nft #16bitart #8bitart #8bit #32bit #arteespanol #artebrasil #gatoslindos #gatosdeinstagram #nycart",
                        });

                        // Remove Local JPG File
                        fs.unlinkSync(`${""}.jpg`);
                      });
                  });
              })
              .catch((err) => {
                console.log(err);
              });
          }
        );
    };

    try {
      console.log("Logging in...");

      await client.login();

      console.log("Login successful!");

      const delayedInstagramPostFunction = async (timeout:number) => {
        setTimeout(async () => {
          await instagramPostPictureFunction();
        }, timeout);
      };

      await delayedInstagramPostFunction(50000);
    } catch (err:any) {
      console.log("Login failed!");

      const delayedLoginFunction = async (timeout:number) => {
        setTimeout(async () => {
          await client.login().then(() => instagramPostPictureFunction());
        }, timeout);
      };

      if (err.statusCode === 403 || err.statusCode === 429) {
        console.log("Throttled!");

        await delayedLoginFunction(60000);
      }

      console.log(err);

      // Instagram has thrown a checkpoint error
      if (err.error && err.error.message === "checkpoint_required") {
        const challengeUrl = err.error.checkpoint_url;

        await client.updateChallenge({ challengeUrl, choice: 1 });

        const emailConfig = {
          imap: {
            user: `${process.env.INKY_DOODLE_EMAIL}`,
            password: `${process.env.INKY_DOODLE_EMAIL_PASSWORD}`,
            host: "imap.gmail.com",
            port: 993,
            tls: true,
            tlsOptions: {
              servername: "imap.gmail.com",
              rejectUnauthorized: false,
            },
            authTimeout: 30000,
          },
        };

        // Connect to email and solve Instagram challenge after delay
        const delayedEmailFunction = async (timeout:number) => {
          setTimeout(() => {
            imaps.connect(emailConfig).then(async (connection) => {
              return connection.openBox("INBOX").then(async () => {
                // Fetch emails from the last hour
                const delay = 1 * 3600 * 1000;
                let lastHour:any = new Date();
                lastHour.setTime(Date.now() - delay);
                lastHour = lastHour.toISOString();
                const searchCriteria = ["ALL", ["SINCE", lastHour]];
                const fetchOptions = {
                  bodies: [""],
                };
                return connection
                  .search(searchCriteria, fetchOptions)
                  .then((messages) => {
                    messages.forEach((item) => {
                      const all:any = _.find(item.parts, { which: "" });
                      const id = item.attributes.uid;
                      const idHeader = "Imap-Id: " + id + "\r\n";
                      simpleParser(idHeader + all.body, async (err, mail:any) => {
                        if (err) {
                          console.log(err);
                        }

                        console.log(mail.subject);

                        const answerCodeArr = mail.text
                          .split("\n")
                          .filter(
                            (item: string) =>
                              item && /^\S+$/.test(item) && !isNaN(Number(item))
                          );

                        if (mail.text.includes("Instagram")) {
                          if (answerCodeArr.length > 0) {
                            // Answer code must be kept as string type and not manipulated to a number type to preserve leading zeros
                            const answerCode = answerCodeArr[0];
                            console.log(answerCode);

                            await client.updateChallenge({
                              challengeUrl,
                              securityCode: answerCode,
                            });

                            console.log(
                              `Answered Instagram security challenge with answer code: ${answerCode}`
                            );

                            await client.login();

                            await instagramPostPictureFunction();
                          }
                        }
                      });
                    });
                  });
              });
            });
          }, timeout);
        };

        await delayedEmailFunction(40000);
      }

      // Delete stored cookies, if any, and log in again
      console.log("Logging in again and setting new cookie store");
      fs.unlinkSync("./cookies.json");
      const newCookieStore = new FileCookieStore("./cookies.json");

      const newClient = new Instagram(
        {
          username: process.env.INSTAGRAM_USERNAME,
          password: process.env.INSTAGRAM_PASSWORD,
          cookieStore: newCookieStore,
        },
        {
          language: "en-US",
        }
      );

      const delayedNewLoginFunction = async (timeout: number | undefined) => {
        setTimeout(async () => {
          console.log("Logging in again");
          await newClient
            .login()
            .then(() => instagramPostPictureFunction())
            .catch((err: any) => {
              console.log(err);
              console.log("Login failed again!");
            });
        }, timeout);
      };

      await delayedNewLoginFunction(10000);
    }
  };

  await instagramLoginFunction();
};

export default makePost
