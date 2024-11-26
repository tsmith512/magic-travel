// Do not use anything in this file as an example of how to do any kind of auth
// handling. Current generation is just "keeping a list of allowed keys in a
// database."

/**
 * World's simplest authenticator, just to check if the provided key is allowed.
 *
 * @param key (string) provided string
 * @param env (Env) environment bindings
 * @returns
 */
export const authCheck = async (key: string, env: Env): Promise<boolean> => {
  const result = await env.MAGIC_TRAVEL_DB
    .prepare('SELECT active FROM users WHERE key = ?')
    .bind(key)
    .first();

  if (result?.active) {
    return true;
  }

  return false;
};
