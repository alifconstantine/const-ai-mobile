/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agent from "../agent.js";
import type * as auth from "../auth.js";
import type * as authUtils from "../authUtils.js";
import type * as conversations from "../conversations.js";
import type * as http from "../http.js";
import type * as implementationPlans from "../implementationPlans.js";
import type * as llmTransport from "../llmTransport.js";
import type * as messages from "../messages.js";
import type * as pendingActions from "../pendingActions.js";
import type * as policyEngine from "../policyEngine.js";
import type * as tools from "../tools.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agent: typeof agent;
  auth: typeof auth;
  authUtils: typeof authUtils;
  conversations: typeof conversations;
  http: typeof http;
  implementationPlans: typeof implementationPlans;
  llmTransport: typeof llmTransport;
  messages: typeof messages;
  pendingActions: typeof pendingActions;
  policyEngine: typeof policyEngine;
  tools: typeof tools;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
