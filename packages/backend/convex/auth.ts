import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    Password<DataModel>({
      profile(params) {
        const email = params.email as string;
        const name = (params.name as string) || email.split("@")[0];
        const username =
          (params.username as string) ||
          email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");

        return {
          email,
          name,
          username,
          subscriptionStatus: "active",
          subscriptionPlan: "yearly",
          subscriptionExpiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
          creditsBalanceUsd: 50.0,
          createdAt: Date.now(),
        };
      },
    }),
  ],
});
