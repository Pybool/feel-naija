import { rateLimit } from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
