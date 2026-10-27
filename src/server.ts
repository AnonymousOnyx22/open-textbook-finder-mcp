import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./core/tools.js";
import { createApi, type Api } from "./sources.js";
import { tools } from "./tools.js";

export const VERSION = "0.1.0";

export function createServer(api: Api = createApi()): McpServer {
  const server = new McpServer({ name: "open-textbook-finder-mcp", version: VERSION });
  registerTools(server, tools, api);
  return server;
}
