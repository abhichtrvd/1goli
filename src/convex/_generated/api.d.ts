/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as abTests from "../abTests.js";
import type * as activityFeed from "../activityFeed.js";
import type * as addTestOrders from "../addTestOrders.js";
import type * as analytics from "../analytics.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth_phoneOtp from "../auth/phoneOtp.js";
import type * as backup from "../backup.js";
import type * as benchmarks from "../benchmarks.js";
import type * as campaigns from "../campaigns.js";
import type * as cart from "../cart.js";
import type * as cohorts from "../cohorts.js";
import type * as consultations from "../consultations.js";
import type * as crons from "../crons.js";
import type * as dashboardGoals from "../dashboardGoals.js";
import type * as dashboards from "../dashboards.js";
import type * as delivery from "../delivery.js";
import type * as funnels from "../funnels.js";
import type * as http from "../http.js";
import type * as integrations from "../integrations.js";
import type * as loginHistory from "../loginHistory.js";
import type * as messages from "../messages.js";
import type * as messaging from "../messaging.js";
import type * as notificationTemplates from "../notificationTemplates.js";
import type * as optimization from "../optimization.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as prescriptions from "../prescriptions.js";
import type * as productActions from "../productActions.js";
import type * as productStockHistory from "../productStockHistory.js";
import type * as products from "../products.js";
import type * as products_admin from "../products_admin.js";
import type * as products_internal from "../products_internal.js";
import type * as reports from "../reports.js";
import type * as reviewUtils from "../reviewUtils.js";
import type * as reviews from "../reviews.js";
import type * as roles from "../roles.js";
import type * as rules from "../rules.js";
import type * as scheduledPrices from "../scheduledPrices.js";
import type * as scheduledReports from "../scheduledReports.js";
import type * as settings from "../settings.js";
import type * as setupAdmin from "../setupAdmin.js";
import type * as team from "../team.js";
import type * as test_import from "../test_import.js";
import type * as test_integration from "../test_integration.js";
import type * as userActivity from "../userActivity.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as workflows from "../workflows.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  abTests: typeof abTests;
  activityFeed: typeof activityFeed;
  addTestOrders: typeof addTestOrders;
  analytics: typeof analytics;
  audit: typeof audit;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  "auth/phoneOtp": typeof auth_phoneOtp;
  backup: typeof backup;
  benchmarks: typeof benchmarks;
  campaigns: typeof campaigns;
  cart: typeof cart;
  cohorts: typeof cohorts;
  consultations: typeof consultations;
  crons: typeof crons;
  dashboardGoals: typeof dashboardGoals;
  dashboards: typeof dashboards;
  delivery: typeof delivery;
  funnels: typeof funnels;
  http: typeof http;
  integrations: typeof integrations;
  loginHistory: typeof loginHistory;
  messages: typeof messages;
  messaging: typeof messaging;
  notificationTemplates: typeof notificationTemplates;
  optimization: typeof optimization;
  orders: typeof orders;
  payments: typeof payments;
  prescriptions: typeof prescriptions;
  productActions: typeof productActions;
  productStockHistory: typeof productStockHistory;
  products: typeof products;
  products_admin: typeof products_admin;
  products_internal: typeof products_internal;
  reports: typeof reports;
  reviewUtils: typeof reviewUtils;
  reviews: typeof reviews;
  roles: typeof roles;
  rules: typeof rules;
  scheduledPrices: typeof scheduledPrices;
  scheduledReports: typeof scheduledReports;
  settings: typeof settings;
  setupAdmin: typeof setupAdmin;
  team: typeof team;
  test_import: typeof test_import;
  test_integration: typeof test_integration;
  userActivity: typeof userActivity;
  users: typeof users;
  utils: typeof utils;
  workflows: typeof workflows;
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
