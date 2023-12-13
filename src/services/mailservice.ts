import User from "../models/user.model";
import * as crypto from "crypto";
import ejs from "ejs";
import sendMail from "./mailtrigger";
import { Options } from "nodemailer/lib/mailer";
import jwthelper from "../helpers/jwt_helper";

const mailActions = {
  auth: {
    sendEmailConfirmationMail: async (savedUser: any, created: boolean) => {
      return new Promise(async (resolve, reject) => {
        try {
          const usermail = savedUser.email;
          const accessToken = await jwthelper.signAccessToken(savedUser.id);
          const refreshToken = await jwthelper.signRefreshToken(savedUser.id);
          const confirmationLink = `${process.env.BACKEND_BASE_URL}/auth/confirm?token=${accessToken}`;
          const template = await ejs.renderFile(
            "src/templates/emailConfirmation.ejs",
            { usermail, confirmationLink }
          );

          const mailOptions = {
            from: "info.feelnigeria@gmail.com",
            to: savedUser?.email,
            subject: "Confirm your registration",
            text: `Click the following link to confirm your registration: ${confirmationLink}`,
            html: template,
          };
          await sendMail(mailOptions);
          if (created) resolve({ status: true, accessToken, refreshToken });
          else resolve({ status: true, link: confirmationLink });
        } catch(error){
          console.log(error)
          resolve({ status: false, link: "" });
        }
      }).catch((error:any)=>{
        console.log(error)
        throw error
      });
    },

    sendPasswordResetMail: async (email: string, user: any) => {
      return { status: true, message: "" };
    },
  },
  uploadRequest: {
    sendOneTimePasswordMail: async (payload: {
      authorizationCode: string;
      email: string;
      postRef: string;
    }) => {
      let authorizationTemplate;
      let mailOptions: Options;
      try {
        authorizationTemplate = await ejs.renderFile(
          "src/templates/approvalOtpTemplate.ejs",
          {
            authorizationCode: payload.authorizationCode,
            recepient: payload.email,
            postRef: payload.postRef,
          }
        );
        mailOptions = {
          from: "info.feelnigeria@gmail.com",
          to: payload?.email,
          subject: "Sms Confirmed",
          text: `Your sms was confirmed`,
          html: authorizationTemplate,
        };
      } catch (error) {
        console.log(error)
        throw error;
      }
      try {
        await sendMail(mailOptions);
      } catch (err) {
        console.log(err);
      }
    },
  },
};

export default mailActions;
