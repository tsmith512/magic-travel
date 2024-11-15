/**
 * Take a "from" or "to" location input as-is (so it'll be URL encoded) and try
 * to clean it up a bit to get more consistent Directions API results and dedupe
 * requests that would otherwise count separately for formatting reasons.
 *
 * @param input (string) Location name as-is from the inbond request
 * @returns (string) A normalized string that may reduce duplicate requests
 */
export const locationStringProcessor = (input: string): string => {
  return decodeURIComponent(input)
    .trim()
    .replace(/\s+/g, ' ')
    .replaceAll('+', ' ')
    .toLocaleUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  ;
    // TODO: State --> ST?
    // TODO: Drop address components?
};
