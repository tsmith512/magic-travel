/**
 * Build a KV-compatible cache key from the start/end point of a driving route
 *
 * @TODO: KV keys are 512 bytes max. Should probably encode the result somehow
 * because if someone uses street addresses, they could end up getting truncated
 * and causing overlaps.
 *
 * @param from (string) Start of the route
 * @param to (string) End of the route
 * @returns (string) KV key to cache route information
 */
export const routeCacheKeygen = (from: string, to: string): string => {
  return `${from}--${to}`
    .replace(/[,]/g, '')
    .replace(/[^a-zA-Z0-9- ]/g, '')
    .replaceAll(' ', '-')
};
