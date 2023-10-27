declare global {
	interface BetterDiscordConfigExport {
		name: string;
		displayName: string;
		author: string;
		description: string;
		version: string;
		invite?: string;
		authorId?: string;
		authorLink?: string;
		donate?: string;
		patreon?: string;
		website?: string;
		source?: string;
		license?: string;
		updateUrl?: string;
	}
}

export {};
