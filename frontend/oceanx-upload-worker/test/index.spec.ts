import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

/** Build a minimal env with required bindings */
function makeEnv(overrides: Record<string, unknown> = {}) {
	return {
		...env,
		FIREBASE_PROJECT_ID: "test-project",
		PUBLIC_URL: "https://example.r2.dev",
		ALLOWED_ORIGIN: "*",
		...overrides,
	};
}

describe("oceanx-upload-worker", () => {
	it("returns 401 for GET requests (auth is checked before method)", async () => {
		const request = new IncomingRequest("http://example.com/some-key");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, makeEnv(), ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(401);
	});

	it("returns 204 for OPTIONS preflight", async () => {
		const request = new IncomingRequest("http://example.com/some-key", {
			method: "OPTIONS",
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, makeEnv(), ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(204);
	});

	it("returns 401 when no Authorization header is provided on PUT", async () => {
		const request = new IncomingRequest("http://example.com/some-key", {
			method: "PUT",
			body: "data",
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, makeEnv(), ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(401);
		const body = await response.json() as { error: string };
		expect(body.error).toBe("Unauthorized");
	});

	it("returns 401 when no Authorization header is provided on DELETE", async () => {
		const request = new IncomingRequest("http://example.com/some-key", {
			method: "DELETE",
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, makeEnv(), ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(401);
		const body = await response.json() as { error: string };
		expect(body.error).toBe("Unauthorized");
	});

	it("returns 401 for an invalid/malformed Bearer token", async () => {
		const request = new IncomingRequest("http://example.com/some-key", {
			method: "PUT",
			headers: { Authorization: "Bearer not.a.valid.jwt" },
			body: "data",
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, makeEnv(), ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(401);
	});

	it("returns 500 when FIREBASE_PROJECT_ID is not configured", async () => {
		const request = new IncomingRequest("http://example.com/some-key", {
			method: "PUT",
			headers: { Authorization: "Bearer sometoken" },
			body: "data",
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, makeEnv({ FIREBASE_PROJECT_ID: "" }), ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(500);
		const body = await response.json() as { error: string };
		expect(body.error).toBe("FIREBASE_PROJECT_ID not configured on worker");
	});
});
