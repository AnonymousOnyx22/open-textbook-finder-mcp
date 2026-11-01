import { describe, expect, it } from "vitest";
import { ApiError, createClient } from "../src/core/http.js";

function sequence(statuses: number[]) {
  const calls = { n: 0 };
  const fetchImpl = (async () => {
    const status = statuses[Math.min(calls.n++, statuses.length - 1)];
    return new Response(JSON.stringify({ ok: status === 200 }), { status });
  }) as typeof fetch;
  return { calls, fetchImpl };
}

describe("http retry", () => {
  it("retries a 429 and then returns the result", async () => {
    const { calls, fetchImpl } = sequence([429, 200]);
    const client = createClient({ baseUrl: "https://x.test", fetchImpl, retryDelayMs: 1 });
    expect(await client.get("a")).toEqual({ ok: true });
    expect(calls.n).toBe(2);
  });

  it("retries 5xx answers and gives up after the retry limit", async () => {
    const { calls, fetchImpl } = sequence([503]);
    const client = createClient({ baseUrl: "https://x.test", fetchImpl, retryDelayMs: 1 });
    await expect(client.get("a")).rejects.toMatchObject({ status: 503 });
    expect(calls.n).toBe(3);
  });

  it("does not retry a 404", async () => {
    const { calls, fetchImpl } = sequence([404]);
    const client = createClient({ baseUrl: "https://x.test", fetchImpl, retryDelayMs: 1 });
    await expect(client.get("a")).rejects.toBeInstanceOf(ApiError);
    expect(calls.n).toBe(1);
  });
});
