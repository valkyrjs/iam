export default {
  routes: [
    (await import("./routes/email-otp/create.ts")).default,
    (await import("./routes/email-otp/verify.ts")).default,
  ],
  bootstrap: async () => {},
  resolve: async (_: Request) => {},
};
