import { IRequest } from "itty-router";
import { DrivingRouteInfo } from "./api-v1-xml";

type lookupMethod = "API" | "KV" | "CDN";

export const writeAnalyticsEvent = (data: DrivingRouteInfo, request: IRequest, method: lookupMethod, env: Env): void => {
  env.MAGIC_TRAVEL_ANALYTICS.writeDataPoint({
    'blobs': [request.verifiedUser, data.from, data.duration],
    'doubles': [data.distance, data.duration],
    'indexes': [(request?.query?.key ?? 'unknown')],
  });
};
