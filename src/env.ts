export const canonical_url = process.env.CONCRETE_CANONICAL_URL;
export const client_id = process.env.CONCRETE_API_CLIENT_ID;
export const client_secret = process.env.CONCRETE_API_CLIENT_SECRET;
export const scope = process.env.CONCRETE_API_SCOPE;

// HTTP Basic Auth for password-protected dev sites
export const basic_auth_user = process.env.CONCRETE_BASIC_AUTH_USER;
export const basic_auth_pass = process.env.CONCRETE_BASIC_AUTH_PASS;

// Optional: custom token storage path (useful for multi-site setups)
// Defaults to .tokens.json in the MCP server directory
export const token_path = process.env.CONCRETE_TOKEN_PATH;

if (!canonical_url || !client_id || !client_secret || !scope) {
  throw new Error("Missing environment variables");
}
