#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, VERSION } from "./server.js";

function usage(): void {
  console.log(`open-textbook-finder-mcp ${VERSION}

Find free legal textbooks from OpenStax, DOAB and Open Library for AI apps (MCP). No key needed.

Add it to your AI app's MCP config with command "npx" and args ["-y", "open-textbook-finder-mcp"].

  --help, --version`);
}

async function main(): Promise<void> {
  const cmd = process.argv[2];
  if (cmd === "--help" || cmd === "-h") return usage();
  if (cmd === "--version" || cmd === "-v") return console.log(VERSION);
  await createServer().connect(new StdioServerTransport());
  console.error(`open-textbook-finder-mcp ${VERSION} running`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
