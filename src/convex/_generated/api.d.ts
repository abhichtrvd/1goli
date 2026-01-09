/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addTestOrders from "../addTestOrders.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth_phoneOtp from "../auth/phoneOtp.js";
import type * as benchmarks from "../benchmarks.js";
import type * as cart from "../cart.js";
import type * as consultations from "../consultations.js";
import type * as delivery from "../delivery.js";
import type * as http from "../http.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as prescriptions from "../prescriptions.js";
import type * as productActions from "../productActions.js";
import type * as products from "../products.js";
import type * as products_admin from "../products_admin.js";
import type * as products_internal from "../products_internal.js";
import type * as reviews from "../reviews.js";
import type * as settings from "../settings.js";
import type * as setupAdmin from "../setupAdmin.js";
import type * as test_import from "../test_import.js";
import type * as test_integration from "../test_integration.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addTestOrders: typeof addTestOrders;
  audit: typeof audit;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  "auth/phoneOtp": typeof auth_phoneOtp;
  benchmarks: typeof benchmarks;
  cart: typeof cart;
  consultations: typeof consultations;
  delivery: typeof delivery;
  http: typeof http;
  orders: typeof orders;
  payments: typeof payments;
  prescriptions: typeof prescriptions;
  productActions: typeof productActions;
  products: typeof products;
  products_admin: typeof products_admin;
  products_internal: typeof products_internal;
  reviews: typeof reviews;
  settings: typeof settings;
  setupAdmin: typeof setupAdmin;
  test_import: typeof test_import;
  test_integration: typeof test_integration;
  users: typeof users;
  utils: typeof utils;
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
