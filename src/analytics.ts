import { IRequest } from "itty-router";
import { AuthenticatedRequest, DrivingRouteInfo } from "./api-v1-xml";

type lookupMethod = "API" | "KV" | "CDN";

export const writeAnalyticsEvent = (data: DrivingRouteInfo, request: AuthenticatedRequest, method: lookupMethod, env: Env): void => {
  env.MAGIC_TRAVEL_ANALYTICS.writeDataPoint({
    'blobs': [
      data.start,
      data.end,
      request.verifiedKey, // @TODO: This is an index so it doesn't also need to be here?
      request.sheetVersion,
      method
    ],
    'doubles': [data.distance, data.duration],
    'indexes': [(request?.query?.key?.toString() ?? 'unknown')],
  });
};
