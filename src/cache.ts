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
export const routeCacheKeygen = async (from: string, to: string): Promise<string> => {
  const asUint8 = new TextEncoder().encode(`${from}--${to}`);
  const hashBuffer = await crypto.subtle.digest('MD5', asUint8);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
