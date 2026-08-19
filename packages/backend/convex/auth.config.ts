export default {
  providers: [
    {
      domain:
        process.env.CLERK_JWT_ISSUER_DOMAIN ||
        process.env.CLERK_FRONTEND_API_URL ||
        "https://natural-lemming-4644.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
