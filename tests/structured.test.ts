import { describe, it, expect, beforeAll } from "vitest";
import { z } from "zod";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";
import { tools } from "../src/tools.js";
import { fakeApi } from "./fakes.js";

let client: Client;
beforeAll(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createServer(fakeApi()).connect(a);
  client = new Client({ name: "structured output test", version: "0.0.0" });
  await client.connect(b);
});

/** Calls a tool and returns the whole result, so the fields can be read. */
async function call(name: string, args: Record<string, unknown> = {}) {
  const r: any = await client.callTool({ name, arguments: args });
  return { text: r.content[0].text as string, structured: r.structuredContent as Record<string, any> | undefined, isError: !!r.isError };
}

/** The schema of a tool's output, so the fields can be checked against it. */
function outputSchemaOf(name: string) {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`there is no tool called ${name}`);
  if (!tool.outputSchema) throw new Error(`${name} has no output schema`);
  return z.object(tool.outputSchema);
}

describe("the tools carry an output schema", () => {
  it("gives every tool an output schema in the code", () => {
    for (const tool of tools) {
      expect(Object.keys(tool.outputSchema ?? {}), `${tool.name} output schema`).not.toHaveLength(0);
    }
  });

  it("sends an output schema for every tool to the client", async () => {
    const listed = (await client.listTools()).tools;
    expect(listed.map((t) => t.name)).toEqual(tools.map((t) => t.name));
    for (const tool of listed) {
      const schema = (tool as any).outputSchema as { type?: string; properties?: Record<string, unknown> } | undefined;
      expect(schema, `${tool.name} output schema in the tool list`).toBeTruthy();
      expect(schema!.type, `${tool.name} output schema type`).toBe("object");
      expect(Object.keys(schema!.properties ?? {}), `${tool.name} output fields`).toEqual(Object.keys(tools.find((t) => t.name === tool.name)!.outputSchema!));
    }
  });

  it("describes every field of every output schema", async () => {
    const listed = (await client.listTools()).tools;
    for (const tool of listed) {
      const schema = (tool as any).outputSchema as { properties?: Record<string, { description?: string }> } | undefined;
      for (const [key, def] of Object.entries(schema!.properties ?? {})) {
        expect(def.description, `${tool.name}.${key} should have a description`).toBeTruthy();
      }
    }
  });

  it("marks every tool read only", async () => {
    for (const tool of (await client.listTools()).tools) {
      expect(tool.annotations?.readOnlyHint, `${tool.name} readOnlyHint`).toBe(true);
    }
  });
});

describe("the tools return structured content over a real MCP client", () => {
  it("returns fields that match the output schema for every tool", async () => {
    const calls: Record<string, Record<string, unknown>> = {
      find_free_textbook: { query: "calculus" },
      lookup_isbn: { isbn: "9780134685991" },
      list_open_textbooks_by_subject: { subject: "statistics" },
      find_older_edition: { query: "Stewart Calculus" },
    };
    for (const tool of tools) {
      const r = await call(tool.name, calls[tool.name]);
      expect(r.isError, `${tool.name} should not error`).toBe(false);
      expect(r.structured, `${tool.name} structured content`).toBeTruthy();
      const parsed = outputSchemaOf(tool.name).safeParse(r.structured);
      expect(parsed.success, `${tool.name} structured content against its output schema: ${parsed.error?.message}`).toBe(true);
    }
  });

  it("returns the text answer as well as the fields", async () => {
    const r = await call("find_free_textbook", { query: "calculus" });
    expect(r.text).toContain('Found 6 free copies for "calculus"');
    expect(r.structured!.results).toHaveLength(6);
  });

  it("fills in the default limit", async () => {
    const r = await call("list_open_textbooks_by_subject", { subject: "math" });
    expect(r.structured!.results).toHaveLength(10);
  });

  it("rejects a limit outside the range before the tool runs", async () => {
    await expect(client.callTool({ name: "find_free_textbook", arguments: { query: "calculus", limit: 50 } })).resolves.toMatchObject({ isError: true });
  });

  it("returns no fields when the tool errors", async () => {
    const r = await call("lookup_isbn", { isbn: "9780134685992" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("not a valid ISBN");
    expect(r.structured).toBeUndefined();
  });

  it("returns the error text of a failed lookup as it was written", async () => {
    const r = await call("lookup_isbn", { isbn: "9780306406157" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("Not found");
  });
});
