import { CspPolicies, ImageSrc } from '@main/csp';

// Magane's built-in packs
CspPolicies['magane.moe'] = ImageSrc;
// Chibisafe
CspPolicies['chibisafe.moe'] = ImageSrc;
// LINE Store
CspPolicies['stickershop.line-scdn.net'] = ImageSrc;
// Image resize service for imported LINE Store packs
CspPolicies['wsrv.nl'] = ImageSrc;

// If you need to import packs from third-party Chibisafe-based hosts, add the domains here.
// CspPolicies['example.com'] = ImageSrc;

const DEFAULT_HEADERS = {
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
	'Referer': 'https://discord.com/'
};

function withDefaultHeaders(resource, options = {}) {
	const sourceHeaders =
		options.headers ?? (resource instanceof Request ? resource.headers : undefined);

	const headers = new Headers(sourceHeaders);
	for (const [name, value] of Object.entries(DEFAULT_HEADERS)) {
		if (!headers.has(name)) {
			headers.set(name, value);
		}
	}

	return { ...options, headers };
}

async function fetchWithDefaults(resource, options) {
	return fetch(resource, withDefaultHeaders(resource, options));
}

async function fetchAndParse(resource, options, parse) {
	const response = await fetch(resource, withDefaultHeaders(resource, options));
	const data = response.status !== 204 ? await parse(response) : undefined;
	return {
		response: {
			status: response.status,
			statusText: response.statusText
		},
		data
	};
}

export async function fetchNative(_, resource, options = {}) {
	return fetchWithDefaults(resource, options);
}

export async function fetchNativeJson(_, resource, options = {}) {
	return fetchAndParse(resource, options, (r) => r.json());
}

export async function fetchNativeArrayBuffer(_, resource, options = {}) {
	return fetchAndParse(resource, options, (r) => r.arrayBuffer());
}
