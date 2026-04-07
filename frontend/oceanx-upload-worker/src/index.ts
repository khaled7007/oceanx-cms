export interface Env {
	BUCKET: R2Bucket;
	PUBLIC_URL: string;
	ALLOWED_ORIGIN: string;
	UPLOAD_SECRET: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const corsHeaders: Record<string, string> = {
			'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
			'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, X-Upload-Secret',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		try {
			if (!env.UPLOAD_SECRET) {
				return new Response(JSON.stringify({ error: 'UPLOAD_SECRET not configured on worker' }), {
					status: 500,
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
				});
			}

			const secret = request.headers.get('X-Upload-Secret');
			if (secret !== env.UPLOAD_SECRET) {
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
				const publicUrl = `${env.PUBLIC_URL}/${key}`;
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
