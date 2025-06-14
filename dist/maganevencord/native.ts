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
