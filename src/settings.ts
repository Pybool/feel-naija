const config: any = {
  ensureAuth: true, //Set to false to allow unauthenticated requests to all routes
  graphApiBaseUrl: "https://graph.facebook.com/v18.0/",
  serverBaseUrl:process.env.BACKEND_BASE_URL
};

export default config;
