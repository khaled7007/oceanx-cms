export interface Env {
	BUCKET: R2Bucket;
	PUBLIC_URL: string;
	ALLOWED_ORIGIN: string;
	FIREBASE_PROJECT_ID: string;
}

/**
 * Verify a Firebase ID token (RS256 JWT) using Google's public JWK keys.
 * Returns the decoded payload on success, or throws on failure.
 */
async function verifyFirebaseToken(token: string, projectId: string): Promise<Record<string, unknown>> {
	const parts = token.split('.');
	if (parts.length !== 3) throw new Error('Invalid token format');

	const [headerB64, payloadB64, sigB64] = parts;

	const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/'))) as { kid?: string; alg?: string };
	if (header.alg !== 'RS256') throw new Error('Unsupported algorithm');

	const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;

	// Check expiry
	const now = Math.floor(Date.now() / 1000);
	if (typeof payload.exp !== 'number' || payload.exp < now) throw new Error('Token expired');

	// Check audience and issuer
	if (payload.aud !== projectId) throw new Error('Invalid audience');
	if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('Invalid issuer');

	// Fetch Google's public JWKs for Firebase
	const jwkRes = await fetch(
		'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
		{ cf: { cacheTtl: 3600 } } as RequestInit,
	);
	if (!jwkRes.ok) throw new Error('Failed to fetch public keys');
	const { keys } = (await jwkRes.json()) as { keys: JsonWebKey[] };

	const jwk = keys.find((k) => (k as { kid?: string }).kid === header.kid);
	if (!jwk) throw new Error('Matching public key not found');

	const cryptoKey = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);

	const sigBytes = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
	const dataBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

	const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sigBytes, dataBytes);
	if (!valid) throw new Error('Invalid signature');

	return payload;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const corsHeaders: Record<string, string> = {
			'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
			'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		try {
			if (!env.FIREBASE_PROJECT_ID) {
				return new Response(JSON.stringify({ error: 'FIREBASE_PROJECT_ID not configured on worker' }), {
					status: 500,
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			}

			const authHeader = request.headers.get('Authorization') ?? '';
			const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
			if (!token) {
				return new Response(JSON.stringify({ error: 'Unauthorized' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			}

			try {
				await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
			} catch {
				return new Response(JSON.stringify({ error: 'Unauthorized' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			}

			const url = new URL(request.url);
			const key = decodeURIComponent(url.pathname.slice(1));

			if (!key) {
				return new Response(JSON.stringify({ error: 'Missing key in path' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			}

			if (request.method === 'PUT') {
				const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
				await env.BUCKET.put(key, request.body, {
					httpMetadata: { contentType },
				});
				const publicUrl = `${env.PUBLIC_URL}/${key.split('/').map(encodeURIComponent).join('/')}`;
				return new Response(JSON.stringify({ url: publicUrl, key }), {
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			}

			if (request.method === 'DELETE') {
				await env.BUCKET.delete(key);
				return new Response(JSON.stringify({ ok: true }), {
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			}

			return new Response('Method not allowed', { status: 405, headers: corsHeaders });
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Internal error';
			return new Response(JSON.stringify({ error: message }), {
				status: 500,
				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			});
		}
	},
};
