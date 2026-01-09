import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Apply scheduled prices every hour
crons.hourly(
  "apply scheduled prices",
  { minuteUTC: 0 }, // Run at the start of every hour
  internal.scheduledPrices.applyScheduledPrices
);

export default crons;
