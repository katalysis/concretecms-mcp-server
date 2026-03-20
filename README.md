# Concrete CMS MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for [Concrete CMS](https://www.concretecms.org) built with TypeScript.

---

## Katalysis Setup Guide

This is the [Katalysis](https://www.katalysis.net) fork of the upstream MCP server. It adds:

- **Configurable token storage** — via `CONCRETE_TOKEN_PATH`, enabling multiple sites to share a single install without token conflicts
- **Node.js crypto compatibility fix** — ensures the server works correctly across Node.js versions

### New Team Member Setup

Install the MCP server once globally on your machine — it is shared across all projects, not cloned per site.

```bash
mkdir -p ~/.mcp/tokens
cd ~/.mcp
git clone https://github.com/katalysis/concretecms-mcp-server
cd concretecms-mcp-server
npm install && npm run build
```

Then create a `.vscode/mcp.json` in your project using the example from this repo as a template:

```bash
cp ~/.mcp/concretecms-mcp-server/mcp.json.example /path/to/your-project/.vscode/mcp.json
```

Edit `.vscode/mcp.json` with your site URL, API Client ID, Client Secret, and your local username in the paths. The file is gitignored so your credentials will never be committed.

### Setting Up API Credentials in Concrete CMS

1. Go to **Dashboard > System > API > Settings** and enable the API
2. Go to **Dashboard > System > API > Integrations** and create a new integration
3. Set the redirect URI to `http://localhost:3000/callback`
4. Note the Client ID and Client Secret — add these to your `.vscode/mcp.json`

### Recommended Scope List

The following scopes are known to work. Note: **do not include `openid`** — it causes a JWT claim error.

```
account:read system:info:read pages:read pages:add pages:update pages:delete pages:versions:read pages:versions:update pages:versions:delete pages:areas:add_block pages:areas:update_block pages:areas:delete_block files:read files:add files:update files:delete users:read users:add users:update users:delete sites:read blocks:read blocks:update blocks:delete
```

### Using with VS Code / GitHub Copilot

The `.vscode/mcp.json` file configures the MCP server for VS Code and GitHub Copilot. Once filled in, VS Code will automatically connect to your Concrete CMS site and make MCP tools available in Copilot chat.

### Using with Claude Desktop

Add an entry to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "concretecms-dev35": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/.mcp/concretecms-mcp-server/dist/index.js"],
      "env": {
        "CONCRETE_CANONICAL_URL": "https://your-dev-site.example.com",
        "CONCRETE_API_CLIENT_ID": "YOUR_CLIENT_ID",
        "CONCRETE_API_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
        "CONCRETE_API_SCOPE": "account:read system:info:read pages:read ...",
        "CONCRETE_TOKEN_PATH": "/Users/YOUR_USERNAME/.mcp/tokens/your-dev-site.json"
      }
    }
  }
}
```

You can add multiple entries (one per site) by giving each a unique key (e.g. `concretecms-dev35`, `concretecms-live`). Each site gets its own token file via `CONCRETE_TOKEN_PATH`.

After restarting Claude Desktop, a browser window will open for OAuth authorisation. Once approved, tokens are saved to the path specified and you won't need to authorise again.

### Password-Protected Dev Sites

HTTP Basic Auth at the server level blocks the OAuth flow, so Plesk's built-in "Password Protected Directories" tool cannot be used with this MCP server. Instead, use `.htaccess` IP-based access control directly.

This approach lets you whitelist specific IPs while requiring a password for everyone else — or simply deny all non-whitelisted IPs entirely:

```apache
# IP-based access control for dev sites
AuthType Basic
AuthName "Restricted Access"
AuthUserFile /path/to/your/.htpasswd

<RequireAny>
    # Allow whitelisted IPs without a password
    Require ip 123.123.123.123
    Require ip 456.456.456.456

    # Require password for everyone else
    Require valid-user
</RequireAny>
```

To add more team members, either add their IP to the whitelist or give them credentials in the `.htpasswd` file — both can coexist in the same `<RequireAny>` block.

> **Note:** Configure this in `.htaccess` rather than via Plesk's Password Protected Directories tool. Plesk's tool sets protection at the nginx level which intercepts requests before Apache and cannot be selectively bypassed per path or IP in the same way.

### Pulling Upstream Updates

```bash
cd ~/.mcp/concretecms-mcp-server
git fetch upstream
git merge upstream/main
npm install && npm run build
```

---

## Installation

```bash
git clone https://github.com/MacareuxDigital/concretecms-mcp-server.git
cd concretecms-mcp-server
npm install && npm run build
```

## Usage

### Enable API in Concrete CMS

Since the MCP server uses the Concrete CMS API, you need to enable it in your Concrete CMS installation first.
Please refer to the [Concrete CMS documentation](https://documentation.concretecms.org/9-x/developers/rest-api/introduction) for more information.

### Connect your LLM to the local Concrete CMS MCP Server

Here's an example configuration for Claude Desktop:

```json
{
  "mcpServers": {
    "concretecms": {
      "command": "node",
      "args": [
        "/path/to/concretecms-mcp-server/dist/index.js"
      ],
      "env": {
        "CONCRETE_CANONICAL_URL": "https://your-concrete.example",
        "CONCRETE_API_CLIENT_ID": "YOUR_API_CLIENT_ID",
        "CONCRETE_API_CLIENT_SECRET": "YOUR_API_CLIENT_SECRET",
        "CONCRETE_API_SCOPE": "account:read system:info:read"
      }
    }
  }
}
```

- Set `CONCRETE_CANONICAL_URL` to the URL of your Concrete CMS installation.
- Set `CONCRETE_API_CLIENT_ID` and `CONCRETE_API_CLIENT_SECRET` to the credentials of a registered API integration.
- Set `CONCRETE_API_SCOPE` to the scopes you want to request. You can find a list of available scopes from `https://your-concrete.example/index.php/dashboard/system/api/scopes`.

After you've configured the MCP server, please restart Claude Desktop. It'll automatically opens an authorization window, then sign in and authorize the requested scopes.
Now you should be able to get information about your Concrete CMS in a chat. A refresh token will be saved in `.tokens.json` in the `concretecms-mcp-server` directory, so you don't need to sign in again.

![Screenshot of a chat with Claude Desktop and a Concrete CMS MCP Server](docs/screenshot.png)

For more information about local MCP servers, please refer to the [Claude Desktop documentation](https://modelcontextprotocol.io/docs/develop/connect-local-servers).

### Use your own OpenAPI specification

The MCP server is loading `openapi.yml` to know which endpoints are available in the Concrete CMS API.
The bundled `openapi.yml` file is generated from the Concrete CMS default installation, but you can also use your own OpenAPI specification.
If you added some Express Objects to your Concrete CMS installation and want to use them in your chat, you can generate a new OpenAPI specification from your installation and use it instead.

1. Check "Include this entity in REST API integrations." in the Express Object settings.
2. Open `https://your-concrete.example/index.php/ccm/system/api/openapi.json` in your browser, and copy the JSON output.
3. Replace the `openapi.yml` file in the `concretecms-mcp-server` directory with your own OpenAPI specification.

## Features

This MCP server is depended on the Concrete CMS API, so it supports all features that are available through the API.
For example:

- Get information about your Concrete CMS installation.
- Get content from your Concrete CMS installation.
- Update content in your Concrete CMS installation.
- Upload files to your Concrete CMS installation.
- Get a list of users in your Concrete CMS installation.
- And more!

You can find a list of all available endpoints in [Concrete CMS REST API - Endpoints](https://documentation.concretecms.org/9-x/developers/rest-api/concrete-cms-rest-api-endpoints)

## ToDos

- Test with other MCP clients.
- Add useful prompts.
- Support another authentication method than OAuth2.
- Support to build a remote MCP server (Streamable HTTP Transport).

## License

MIT
