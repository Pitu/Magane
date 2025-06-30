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

export async function fetchNative(_, ...args) {
	return fetch(...args);
}

export async function fetchNativeJson(_, ...args) {
	const response = await fetch(...args);
	let data;
	if (response.status !== 204) {
		data = await response.json();
	}
	return {
		response: {
			status: response.status,
			statusText: response.statusText
		},
		data
	};
}

export async function fetchNativeArrayBuffer(_, ...args) {
	const response = await fetch(...args);
	let data;
	if (response.status !== 204) {
		data = await response.arrayBuffer();
	}
	return {
		response: {
			status: response.status,
			statusText: response.statusText
		},
		data
	};
}
