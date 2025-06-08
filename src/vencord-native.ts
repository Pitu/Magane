import { CspPolicies, MediaSrc } from '@main/csp';

// Magane's built-in packs
CspPolicies['magane.moe'] = MediaSrc;
// Chibisafe
CspPolicies['chibisafe.moe'] = MediaSrc;
// LINE Store
CspPolicies['stickershop.line-scdn.net'] = MediaSrc;
// Image resize service for imported LINE Store packs
CspPolicies['wsrv.nl'] = MediaSrc;

// If you need to import packs from third-party Chibisafe-based hosts, add the domains here.
// CspPolicies['example.com'] = MediaSrc;
// CspPolicies['example.com'] = MediaSrc;
