<script>
	/* global BdApi, VencordApi */
	import { onMount, onDestroy } from 'svelte';
	import Button from './Button.svelte';

	import * as animateScroll from 'svelte-scrollto';
	import SemverGt from 'semver/functions/gt';
	import './styles/main.scss';

	const log = (message, type = 'log') => {
		type = ['log', 'info', 'warn', 'error'].includes(type) ? type : 'log';
		return console[type]('%c[Magane]%c', 'color: #3a71c1; font-weight: 700', '', message);
	};

	const MountType = {
		LEGACY: 'legacy',
		BETTERDISCORD: 'betterdiscord',
		VENCORD: 'vencord'
	};
	let mountType = null;

	/*
		Built-in update checker is not available outside of BetterDiscord.
		Find-replacing these is not possible due to Svelte directly injecting string constants
		into any functions that use them when building in production mode.
	*/
	const bdPluginName = 'MaganeBD';
	const githubUrl = 'https://github.com/Pitu/Magane/commits/master';
	const updateUrl = 'https://raw.githubusercontent.com/Pitu/Magane/master/dist/magane.plugin.js';

	// APIs
	const Modules = {};

	/*
		For BetterDiscord, use BdApi helper functions.
		For other mods, their respective build scripts will have to find-replace
		MOCK_API and MOCK_API.functionName with their respective helper functions.
	*/
	const MOCK_API = {};
	const VENCORD_TOASTS_TYPE = {
		info: 0,
		success: 1,
		error: 2,
		warn: 2
	};
	const Helper = {
		findByProps(...args) {
			switch (mountType) {
				case MountType.BETTERDISCORD:
					return BdApi.findModuleByProps(...args);
				case MountType.VENCORD:
					return VencordApi.findByPropsLazy(...args);
				default:
					return MOCK_API.FINDBYPROPS(...args);
			}
		},
		find(...args) {
			switch (mountType) {
				case MountType.BETTERDISCORD:
					return BdApi.Webpack.getModule(...args);
				case MountType.VENCORD:
					return VencordApi.findLazy(args[0]);
				default:
					return MOCK_API.FIND(...args);
			}
		},
		Alerts: {
			show(...args) {
				if (mountType === MountType.BETTERDISCORD) {
					return BdApi.showConfirmationModal(...args);
				} else if (mountType === MountType.VENCORD) {
					const title = args[0];

					// Re-map Markdown formatting to pure HTML
					// Once again I'm reminded how whack it is to implant Svelte into React
					const body = Modules.React.createElement('div', {
						dangerouslySetInnerHTML: {
							__html: args[1]
								.replace(/\*\*(.*?)\*\*/gm, '<b>$1</b>')
								.replace(/__(.*?)__/gm, '<u>$1</u>')
								.replace(/```\n(.*?)\n```/gsm, '<code>$1</code>')
								.replace(/\n\n/gm, '<br>')
						},
						style: {
							'user-select': 'text'
						}
					});

					return VencordApi.Alerts.show(Object.assign({
						title,
						body
					}, ...args.slice(2)));
				}

				return MOCK_API.ALERTS_SHOW(...args);
			}
		},
		Toasts: {
			show(...args) {
				if (mountType === MountType.BETTERDISCORD) {
					return BdApi.showToast(...args);
				} else if (mountType === MountType.VENCORD) {
					const message = args[0];
					const options = Object.assign({}, ...args.slice(1));
					let type = 0;

					// Re-map options for Vencord
					if (options.type) {
						type = VENCORD_TOASTS_TYPE[options.type];
						delete options.type;
					}
					if (options.timeout === undefined) {
						// BetterDiscord's default timeout for toasts
						options.duration = 3000;
					} else {
						options.duration = options.timeout;
						delete options.timeout;
					}

					// Force position to bottom
					options.position = 1;

					return VencordApi.Toasts.show({
						message,
						type,
						options
					});
				}

				return MOCK_API.TOASTS_SHOW(...args);
			}
		},
		Plugins: {
			isEnabled(...args) {
				switch (mountType) {
					case MountType.BETTERDISCORD:
						return BdApi.Plugins.isEnabled(...args);
					case MountType.VENCORD:
						return null; // TODO Vencord
					default:
						return MOCK_API.PLUGINS_ISENABLED(...args);
				}
			},
			getVersion(...args) {
				switch (mountType) {
					case MountType.BETTERDISCORD:
						return BdApi.Plugins.get(...args).version;
					case MountType.VENCORD:
						return null; // TODO Vencord
					default:
						return MOCK_API.PLUGINS_GETVERSION(...args);
				}
			}
		},
		UI: {
			showNotice(...args) {
				switch (mountType) {
					case MountType.BETTERDISCORD:
						return BdApi.UI.showNotice(...args);
					case MountType.VENCORD:
						return null; // TODO Vencord
					default:
						return MOCK_API.UI_SHOWNOTICE(...args);
				}
			}
		}
	};

	const coords = { top: 0, left: 0 };
	const selectorVoiceChatWrapper = '[class^="chatLayerWrapper_"]';
	const selectorTextArea = '[class^="channelTextArea_"]:not([class*="channelTextAreaDisabled_"])';
	let main = null;
	let base = null;
	let forceHideMagane = false;
	let components = [];
	let activeComponent = null;

	let baseURL = '';
	let stickerWindowActive = false;
	let stickerAddModalActive = false;
	const stickerAddModalTabsInit = {};
	let activeTab = null;
	let favoriteStickers = [];
	let availablePacks = [];
	let subscribedPacks = [];
	let subscribedPacksSimple = [];
	let filteredPacks = [];
	let stickersStats = [];
	let frequentlyUsedSorted = [];
	let simplePacksData = {};
	const localPacks = {};
	let linePackSearch = null;
	let remotePackUrl = null;
	let frequentlyUsedInput = 10; // default
	let hotkeyInput = null;
	let hotkey = {};
	let onCooldown = false;
	let storage = null;
	let packsSearch = null;
	let resizeObserver = null;
	const resizeObserverQueue = [];
	let resizeObserverQueueWorking = false;
	let isWarnedAboutViewportHeight = false;
	const waitForTimeouts = {};

	// For display in info popup only, expandable if required
	const remotePackTypes = {
		0: 'Custom JSON',
		1: 'Chibisafe Albums',
		2: 'Old Chibisafe / Lolisafe v3 Albums'
	};

	const settings = {
		disableUpdateCheck: false,
		enableWindowMagane: false,
		disableToasts: false,
		closeWindowOnSend: false,
		useLeftToolbar: false,
		showPackAppendix: false,
		disableDownscale: false,
		disableUploadObfuscation: false,
		alwaysSendAsLink: false,
		maskStickerLink: false,
		ctrlInvertSendBehavior: false,
		ignoreEmbedLinksPermission: false,
		markAsSpoiler: false,
		ignoreViewportSize: false,
		disableSendingWithChatInput: false,
		frequentlyUsed: frequentlyUsedInput,
		hotkey: null
	};
	const defaultSettings = Object.freeze(Object.assign({}, settings));

	const allowedStorageKeys = [
		'magane.available',
		'magane.subscribed',
		'magane.favorites',
		'magane.settings',
		'magane.stats'
	];

	const toast = (message, options = {}) => {
		if (!options.nolog || settings.disableToasts) {
			log(message, options.type);
		}
		if (!settings.disableToasts) {
			delete options.nolog;
			Helper.Toasts.show(message, options);
		}
	};

	const toastInfo = (message, options = {}) => {
		options.type = 'info';
		return toast(message, options);
	};

	const toastSuccess = (message, options = {}) => {
		options.type = 'success';
		return toast(message, options);
	};

	const toastError = (message, options = {}) => {
		options.type = 'error';
		return toast(message, options);
	};

	const toastWarn = (message, options = {}) => {
		options.type = 'warn';
		return toast(message, options);
	};

	const waitFor = (selector, options = {}) => {
		if (options.logname) {
			log(`Waiting for ${options.logname}\u2026`);
		}
		let poll;
		return new Promise(resolve => {
			(poll = () => {
				const found = [];
				const elements = document.querySelectorAll(selector);
				for (let i = 0; i < elements.length; i++) {
					// If an assert function is provided, ensure that it passes
					if (typeof options.assert !== 'function' || options.assert(elements[i])) {
						found.push(elements[i]);
					}
					// Break for-loop early if not instructed to return multiple elements
					if (found.length && !options.multiple) {
						break;
					}
				}
				if (found.length) {
					delete waitForTimeouts[selector];
					return resolve(found);
				}
				waitForTimeouts[selector] = setTimeout(poll, 500);
			})();
		});
	};

	const mountButtonComponent = textArea => {
		const buttonsContainer = textArea.querySelector('[class^="buttons"]');
		const component = new Button({
			target: buttonsContainer,
			anchor: buttonsContainer.firstElementChild
		});

		// eslint-disable-next-line no-use-before-define
		component.$on('click', () => toggleStickerWindow(undefined, component));
		// eslint-disable-next-line no-use-before-define
		component.$on('grabPacks', () => grabPacks(true));

		component.textArea = textArea;
		component.lastTextAreaSize = {
			width: textArea.clientWidth,
			height: textArea.clientHeight
		};

		return component;
	};

	const updateStickerWindowPosition = component => {
		log('Updating window\'s position\u2026');

		const buttonsContainer = component.textArea.querySelector('[class^="buttons"]');
		const props = buttonsContainer.getBoundingClientRect();

		coords.wbottom = (base.clientHeight - props.top) + 8;
		coords.wright = (base.clientWidth - props.right) - 6;

		if (mountType === MountType.LEGACY) {
			const baseProps = base.getBoundingClientRect();
			coords.wbottom += baseProps.top;
			coords.wright += baseProps.left;
		}
	};

	const resizeObserverWorker = async entry => {
		// Check against recorded textArea's size if entry's new size is still valid
		if (entry && entry.contentRect.width !== 0 && entry.contentRect.height !== 0) {
			for (const component of components) {
				if (component.textArea === entry.target) {
					// Skip worker only if entry's new width still matches recorded width (ignore height)
					if (component.lastTextAreaSize.width === entry.contentRect.width) return;
					break;
				}
			}
		}

		// Wait for new valid textArea(s)
		const textAreas = await waitFor(selectorTextArea, {
			logname: 'textarea',
			assert: element => {
				// Ensure that the textArea element has a buttons container
				let valid = Boolean(element.querySelector('[class^="buttons"]'));

				/*
					If voice channel's chat wrapper is currently active,
					assert that found element is a child of it, otherwise let waitFor() to continue to poll.
					This is necesary because Discord does not immediately destroy the old element
					as it is building a chat wrapper when in a voice channel.
				*/
				if (valid) {
					const voiceChatWrapper = document.querySelector(selectorVoiceChatWrapper);
					if (voiceChatWrapper) {
						valid = voiceChatWrapper.contains(element);
					}
				}

				return valid;
			},
			multiple: true
		});

		const componentsOld = components.slice();
		const componentsNew = [];

		for (const textArea of textAreas) {
			// Assign ephemeral ID to the textArea element
			if (!textArea._maganeID) {
				textArea._maganeID = Date.now();
			}

			let valid = false;
			for (let i = 0; i < componentsOld.length; i++) {
				if (componentsOld[i].textArea === textArea) {
					valid = true;
					// Update recorded textArea's size
					componentsOld[i].lastTextAreaSize = {
						width: textArea.clientWidth,
						height: textArea.clientHeight
					};
					componentsNew.push(componentsOld[i]);
					componentsOld.splice(i, 1);
					break;
				}
			}

			if (valid) {
				log(`Textarea #${textArea._maganeID}: still attached`);
				continue;
			}

			// Mount button component attached to the textArea
			const component = mountButtonComponent(textArea);
			if (component) {
				log(`Textarea #${textArea._maganeID}: attached`);
				resizeObserver.observe(textArea);
				componentsNew.push(component);
			} else {
				log(`Textarea #${textArea._maganeID}: failed to attach`);
			}
		}

		// Loop through and destroy outdated components
		for (const component of componentsOld) {
			log(`Textarea #${component.textArea._maganeID}: outdated, destroying\u2026`);
			// Force-close sticker window if an active component is outdated
			if (activeComponent === component) {
				// eslint-disable-next-line no-use-before-define
				toggleStickerWindow(false, activeComponent);
				activeComponent = null;
			}
			resizeObserver.unobserve(component.textArea);
			component.$destroy();
		}

		// Assign new components as current valid components
		components = componentsNew;
		if (components.length) {
			// Update active component's window position
			if (activeComponent) {
				updateStickerWindowPosition(activeComponent);
			}
		} else {
			// If, by chance, this worker ends with zero valid components due to failed mounting,
			// kickstart worker again to await future textArea(s)
			resizeObserverWorker();
		}
	};

	// Simple queue system for observer events
	const resizeObserverQueuePush = entry => new Promise((resolve, reject) => {
		resizeObserverQueue.push({ entry, resolve, reject });
		// eslint-disable-next-line no-use-before-define
		resizeObserverQueueShift();
	});

	const resizeObserverQueueShift = () => {
		if (resizeObserverQueueWorking) {
			return false;
		}
		const item = resizeObserverQueue.shift();
		if (!item) {
			return false;
		}
		try {
			resizeObserverQueueWorking = true;
			resizeObserverWorker(item.entry)
				.then(value => {
					resizeObserverQueueWorking = false;
					item.resolve(value);
					resizeObserverQueueShift();
				})
				.catch(err => {
					resizeObserverQueueWorking = false;
					item.reject(err);
					resizeObserverQueueShift();
				});
		} catch (err) {
			resizeObserverQueueWorking = false;
			item.reject(err);
			resizeObserverQueueShift();
		}
		return true;
	};

	const initResizeObserver = () => {
		// We are basically only using this as some sort of event dispatcher
		// for when any textArea(s) disappears due to switching channels, etc.
		resizeObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				if (!entry.contentRect) return;
				// Push this textArea element to observer worker queue
				resizeObserverQueuePush(entry);
			}
		});

		// Kickstart worker on first launch
		resizeObserverWorker();
	};

	const initModules = () => {
		// Stores
		Modules.ChannelStore = Helper.findByProps('getChannel', 'getDMFromUserId');
		Modules.SelectedChannelStore = Helper.findByProps('getLastSelectedChannelId');
		Modules.UserStore = Helper.findByProps('getCurrentUser', 'getUser');

		// Permissions
		try {
			const module = Helper.find(m => m.Permissions && typeof m.Permissions.ADMINISTRATOR === 'bigint',
				{ searchExports: true });
			Modules.PermissionsBits = module.Permissions;
		} catch {} // do nothing
		Modules.Permissions = Helper.findByProps('computePermissions');

		// Messages & Uploads
		Modules.CloudUtils = Helper.findByProps('CloudUpload');
		Modules.DraftStore = Helper.findByProps('getDraft', 'getState');
		Modules.MessageUpload = Helper.findByProps('instantBatchUpload');
		Modules.MessageUtils = Helper.findByProps('sendMessage');
		Modules.PendingReplyStore = Helper.findByProps('getPendingReply');

		// Misc
		Modules.React = Helper.findByProps('createElement', 'version');
	};

	const getLocalStorage = () => {
		// Temporarily spawn an iframe to duplicate localStorage's descriptors into a local object
		const iframe = document.createElement('iframe');
		document.head.append(iframe);
		storage = Object.getOwnPropertyDescriptor(iframe.contentWindow.frames, 'localStorage').get.call(window);
		iframe.remove();
	};

	const saveToLocalStorage = (key, payload) => {
		if (!allowedStorageKeys.includes(key)) return;
		return storage.setItem(key, JSON.stringify(payload));
	};

	const getFromLocalStorage = key => {
		if (!allowedStorageKeys.includes(key)) return;
		try {
			const stored = storage.getItem(key);
			const parsed = JSON.parse(stored);
			return parsed;
		} catch (ex) {
			console.error(ex);
		}
	};

	const applySettings = data => {
		// Only use keys that were explicitly defined in defaultSettings
		for (const key of Object.keys(defaultSettings)) {
			if (typeof data[key] === 'undefined') {
				settings[key] = defaultSettings[key];
			} else {
				settings[key] = data[key];
			}
		}

		// eslint-disable-next-line no-use-before-define
		setWindowMaganeAPIs(settings.enableWindowMagane);

		frequentlyUsedInput = settings.frequentlyUsed;
		hotkeyInput = settings.hotkey;

		// eslint-disable-next-line no-use-before-define
		parseThenInitHotkey();
	};

	const loadSettings = (reset = false) => {
		// Reset parsed settings, if required (e.g. on settings reload)
		if (reset) {
			applySettings(defaultSettings);
		}

		const storedSettings = getFromLocalStorage('magane.settings');
		if (storedSettings) {
			applySettings(storedSettings);
		}
	};

	const checkUpdate = async (manual = false) => {
		if (mountType !== MountType.BETTERDISCORD) {
			return toastWarn('Sorry, update checker is only available when running on BetterDiscord.');
		}

		// Check if hard-coded plugin name is enabled, sanity-check to ensure the running script is it
		if (!Helper.Plugins.isEnabled(bdPluginName)) {
			return toastWarn(`Update check skipped, is this plugin not named ${bdPluginName}?`);
		}

		const currentVersion = Helper.Plugins.getVersion(bdPluginName);

		log(`Fetching remote dist file from: ${updateUrl}`);
		if (manual) toast('Checking for updates\u2026', { nolog: true });

		await fetch(updateUrl, { cache: 'no-cache' }).then(async response => {
			log('Remote dist file fetched.');

			const data = await response.text();
			const match = data.match(/^ \* @version ([a-zA-Z0-9.-]+)$/m);
			const remoteVersion = match && match[1];

			if (remoteVersion) {
				if (SemverGt(remoteVersion, currentVersion)) {
					log(`Update found: ${remoteVersion} > ${currentVersion}.`);

					Helper.UI.showNotice(`Magane v${currentVersion} found an update: v${remoteVersion}. Please download the update manually.`, {
						buttons: [
							{
								label: 'GitHub',
								onClick: () => window.open(githubUrl, { target: '_blank' })
							},
							{
								label: 'Download',
								onClick: () => window.open(updateUrl, { target: '_blank' })
							}
						]
					});
				} else {
					log(`No updates found: ${remoteVersion} <= ${currentVersion}.`);
					if (manual) toast('No updates found.', { nolog: true });
				}
			} else {
				toastWarn('Failed to parse version string from remote dist file.');
			}
		}).catch(error => {
			console.error(error);
			toastError(`Unexpected error occurred when checking for Magane's updates. Check your console for details.`);
		});
	};

	const isLocalPackID = id => {
		if (typeof id !== 'string') return false;
		// Faster than regex tests, especially if biased to only having imported LINE remote packs
		return id.startsWith('startswith-') ||
			id.startsWith('emojis-') ||
			id.startsWith('custom-');
	};

	const initSimplePackDataEntry = (pack, source) => {
		// Intended for favorites and/or frequently used (e.g. tooltips)
		if (simplePacksData[pack]) return;

		// Allow overriding source wherever applicable for faster look-ups
		// e.g. favoriteSticker() should only look-up from subscribedPacks
		const target = source || availablePacks;

		const index = target.findIndex(p => p.id === pack);
		if (index !== -1) {
			simplePacksData[pack] = {
				name: target[index].name
			};
		}
	};

	const cleanUpSimplePackDataEntry = pack => {
		if (favoriteStickers.some(s => s.pack === pack) || frequentlyUsedSorted.some(s => s.pack === pack)) {
			return;
		}

		// Only delete entry if no longer used by either favorited stickers,
		// or stickers in frequently used section
		delete simplePacksData[pack];
	};

	const grabPacks = async (reset = false) => {
		let packs;
		try {
			const response = await fetch('https://magane.moe/api/packs');
			packs = await response.json();
			baseURL = packs.baseURL;
		} catch (error) {
			// Toast and log to console, but allow to continue as-is
			toastError('Unable to fetch Magane\'s API. Magane will load as-is, but built-in remote packs will temporarily be unavailable.', { timeout: 10000 });
			console.error(error);
		}

		// Reset local arrays/objects, if required (e.g. on settings reload)
		if (reset) {
			availablePacks = [];
			filteredPacks = [];
			subscribedPacks = [];
			subscribedPacksSimple = [];
			favoriteStickers = [];
			stickersStats = [];
			frequentlyUsedSorted = [];
			simplePacksData = {};
		}

		// Load local packs first to have them always before built-in packs
		const availLocalPacks = getFromLocalStorage('magane.available');
		if (Array.isArray(availLocalPacks) && availLocalPacks.length) {
			// This logic is necessary since the old data, prior to the new master rebase,
			// would also store remote built-in packs in local storage (no idea why).
			const filteredLocalPacks = availLocalPacks.filter(pack =>
				typeof pack === 'object' &&
				typeof pack.id !== 'undefined' &&
				isLocalPackID(pack.id));

			// Update database if required
			if (availLocalPacks.length !== filteredLocalPacks.length) {
				log(`magane.available mismatch: ${availLocalPacks.length} !== ${filteredLocalPacks.length}`);
				saveToLocalStorage('magane.available', filteredLocalPacks);
			}

			// Store local packs data in an ID-indexed Object for faster get's in formatURL()
			filteredLocalPacks.forEach(pack => {
				localPacks[pack.id] = pack;
			});
			availablePacks.push(...filteredLocalPacks);
		}

		// Then append remote packs after local packs
		if (packs) {
			availablePacks.push(...packs.packs);
		}

		// Refresh UI
		availablePacks = availablePacks;
		filteredPacks = availablePacks;

		const subscribed = getFromLocalStorage('magane.subscribed');
		if (Array.isArray(subscribed) && subscribed.length) {
			// Init simple caching of pack IDs, and filter-out invalid data
			// (e.g. failed to unsubscribe upon deleting local packs)
			subscribedPacks = subscribed.filter(pack => {
				if (isLocalPackID(pack.id) && !localPacks[pack.id]) {
					return false;
				}
				// Simple caching of pack IDs
				subscribedPacksSimple.push(pack.id);
				return true;
			});

			// Update database if required
			if (subscribed.length !== subscribedPacks.length) {
				log(`magane.subscribed mismatch: ${subscribed.length} !== ${subscribedPacks.length}`);
				saveToLocalStorage('magane.subscribed', subscribedPacks);
			}
		}

		const favorites = getFromLocalStorage('magane.favorites');
		if (Array.isArray(favorites) && favorites.length) {
			// Init simple pack data entry, and filter-out invalid data
			// (e.g. stickers of local packs that have previously been deleted)
			favoriteStickers = favorites.filter(sticker => {
				if (isLocalPackID(sticker.pack) && !localPacks[sticker.pack]) {
					return false;
				}
				initSimplePackDataEntry(sticker.pack);
				return true;
			});

			// Update database if required
			if (favorites.length !== favoriteStickers.length) {
				log(`magane.favorites mismatch: ${favorites.length} !== ${favoriteStickers.length}`);
				saveToLocalStorage('magane.favorites', favoriteStickers);
			}
		}

		const stats = getFromLocalStorage('magane.stats');
		if (Array.isArray(stats) && stats.length) {
			// Filter-out invalid data
			// (e.g. stickers of local packs that have previously been deleted)
			stickersStats = stats.filter(sticker =>
				!isLocalPackID(sticker.pack) || localPacks[sticker.pack]);

			// Update database if required
			if (stats.length !== stickersStats.length) {
				log(`magane.stats mismatch: ${stats.length} !== ${stickersStats.length}`);
				saveToLocalStorage('magane.stats', stickersStats);
			}

			// eslint-disable-next-line no-use-before-define
			updateFrequentlyUsed();
		}
	};

	const subscribeToPack = pack => {
		if (subscribedPacks.findIndex(p => p.id === pack.id) !== -1) return;
		subscribedPacks = [...subscribedPacks, pack];
		subscribedPacksSimple = [...subscribedPacksSimple, pack.id];

		saveToLocalStorage('magane.subscribed', subscribedPacks);
		log(`Subscribed > ${pack.name}`);
		// analyticsSubscribePack([pack.id]);
	};

	const unsubscribeToPack = pack => {
		for (let i = 0; i < subscribedPacks.length; i++) {
			if (subscribedPacks[i].id === pack.id) {
				subscribedPacks.splice(i, 1);
				subscribedPacksSimple.splice(i, 1);

				// No clue how to do with assignments so we cheat here
				subscribedPacks = subscribedPacks;
				subscribedPacksSimple = subscribedPacksSimple;

				log(`Unsubscribed > ${pack.name}`);
				saveToLocalStorage('magane.subscribed', subscribedPacks);
				return;
			}
		}
	};

	const formatUrl = (pack, id, sending, thumbIndex) => {
		let url;
		if (typeof pack === 'number') {
			// Magane's built-in packs
			if (baseURL) {
				url = `${baseURL || ''}${pack}/${id}`;
				if (!sending) {
					url = url.replace(/\.(gif|png)$/i, '_key.$1');
				}
			} else if (sending) {
				// Let sendSticker() handle displaying error
				throw new Error('Magane\'s API was unavailable. Please reload Magane if the API is already back online.');
			} else {
				// Placeholder thumb (❌) if baseURL is missing (i.e. failed to fetch it from Magane's API)
				url = '/assets/8becd37ab9d13cdfe37c08c496a9def3.svg';
			}
		} else if (pack.startsWith('startswith-')) {
			/*
				LINE Store packs
				292p: https://stickershop.line-scdn.net/stickershop/v1/sticker/%id%/iPhone/sticker@2x.png;compress=true
				219p: https://stickershop.line-scdn.net/stickershop/v1/sticker/%id%/android/sticker.png;compress=true
				146p: https://stickershop.line-scdn.net/stickershop/v1/sticker/%id%/iPhone/sticker.png;compress=true
				WARNING: Early packs (can confirm with packs that have their sticker IDs at 4 digits),
				do not have iPhone variants, so we will stick with Android variants, which are always available.
			*/
			const template = 'https://stickershop.line-scdn.net/stickershop/v1/sticker/%id%/android/sticker.png;compress=true';
			url = template.replace(/%id%/g, id.split('.')[0]);
			let append = sending ? '&h=180p' : '&h=100p';
			if (localPacks[pack].animated) {
				url = url.replace(/sticker(@2x)?\.png/, 'sticker_animation$1.png');
				// In case one day wsrv.nl starts properly supporting APNGs -> GIFs
				append += '&output=gif';
			}
			if (!settings.disableDownscale) {
				// Downsizing with wsrv.nl to stay consistent with Magane's built-in packs
				url = `https://wsrv.nl/?url=${encodeURIComponent(url)}${append}`;
			}
		} else if (pack.startsWith('emojis-')) {
			/*
				LINE Store emojis
				220p: https://stickershop.line-scdn.net/sticonshop/v1/sticon/%pack%/iPhone/%id%.png
				154p: https://stickershop.line-scdn.net/sticonshop/v1/sticon/%pack%/android/%id%.png
				WARNING: Stickers may actually have missing iPhone variants,
				so to be safe we will just use Android variant for emojis too.
				Plus, it probably makes more sense to have emojis smaller anyway
				(Android variant of emojis only go up to 154p).
			*/
			const template = 'https://stickershop.line-scdn.net/sticonshop/v1/sticon/%pack%/android/%id%.png';
			url = template.replace(/%pack%/g, pack.split('-')[1]).replace(/%id%/g, id.split('.')[0]);
			let append = sending ? '' : '&h=100p';
			if (localPacks[pack].animated) {
				url = url.replace(/\.png/, '_animation.png');
				// In case one day wsrv.nl starts properly supporting APNGs -> GIFs
				append += '&output=gif';
			}
			if (!settings.disableDownscale) {
				// Downsizing with wsrv.nl to stay consistent with Magane's built-in packs
				url = `https://wsrv.nl/?url=${encodeURIComponent(url)}${append}`;
			}
		} else if (pack.startsWith('custom-')) {
			// Unified imported custom packs
			if (!sending && Array.isArray(localPacks[pack].thumbs)) {
				if (localPacks[pack].thumbs.length) {
					if (typeof thumbIndex !== 'number') {
						// thumbIndex is not available for favorites, so do some work out
						thumbIndex = localPacks[pack].files.findIndex(file => file === id);
					}
					url = thumbIndex >= 0 ? localPacks[pack].thumbs[thumbIndex] : null;
				}
				if (!url) {
					// Immediately return with placeholder thumb (📄)
					return '/assets/eedd4bd948a0da6d75bf5304bff4e17f.svg';
				}
			} else {
				url = id;
			}
			if (typeof localPacks[pack].template === 'string') {
				url = localPacks[pack].template.replace(/%pack%/g, pack.replace('custom-', '')).replace(/%id%/g, url);
			}
		}
		return url;
	};

	const getTextAreaInstance = textArea => {
		// NOTE: If any deeper than the 10th step, then Discord must be changing something again,
		// thus better to inspect further instead of blindly increasing the limit.
		const MAX_LOOKUP_DEPTH = 10;
		const reactInstanceKey = Object.keys(textArea).find(key =>
			key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance'));
		let cursor = textArea[reactInstanceKey];
		for (let i = 0; i < MAX_LOOKUP_DEPTH; i++) {
			if (!cursor) break;
			if (cursor.stateNode && cursor.stateNode.handleTextareaChange) {
				return cursor;
			}
			cursor = cursor.return;
		}
	};

	const hasPermission = (permission, context) => {
		// Always true if could not fetch the necessary modules
		if (!Modules.PermissionsBits || !Modules.Permissions || !Modules.UserStore) {
			return true;
		}

		const user = Modules.UserStore.getCurrentUser();
		if (!user) return false;

		// Always true in non-guild channels (e.g. DMs)
		if (!permission || !context.guild_id || context.isDM() || context.isGroupDM()) {
			return true;
		}

		return Modules.Permissions.can(Modules.PermissionsBits[permission], context);
	};

	const sendSticker = async (pack, id, event) => {
		if (onCooldown) {
			return toastWarn('Sending sticker is still on cooldown\u2026', { timeout: 1500 });
		} else if (!activeComponent) {
			return toastWarn('Selected text area is not found, please re-open Magane window.');
		}

		onCooldown = true;

		try {
			// If multiple active channels (i.e. split-view), SelectedChannelStore will only return the main channel,
			// so determining through active component's textArea instance is more reliable, if available.
			let channelId;

			const textAreaInstance = getTextAreaInstance(activeComponent.textArea);
			if (textAreaInstance) {
				channelId = textAreaInstance.stateNode.props.channel.id;
			} else if (Modules.SelectedChannelStore) {
				channelId = Modules.SelectedChannelStore.getChannelId();
			}

			// Magane will also appear in Create Thread screen,
			// but at that point the thread has not yet been made, and thus will not have ID.
			if (!channelId) {
				onCooldown = false;
				return toastError('Unable to determine channel ID. Is this a pending Thread creation?');
			}

			let channel;
			if (Modules.ChannelStore) {
				channel = Modules.ChannelStore.getChannel(channelId);
			}

			if (!hasPermission('SEND_MESSAGES', channelId)) {
				onCooldown = false;
				return toastError('You do not have permission to send message in this channel.');
			}

			if (settings.closeWindowOnSend) {
				// eslint-disable-next-line no-use-before-define
				toggleStickerWindow(false, activeComponent);
			}

			const url = formatUrl(pack, id, true);

			let messageContent = '';
			if (!settings.disableSendingWithChatInput && Modules.DraftStore) {
				messageContent = Modules.DraftStore.getDraft(channelId, 0);
			}

			let messageOptions;
			if (Modules.PendingReplyStore) {
				const pendingReply = Modules.PendingReplyStore.getPendingReply(channelId);
				if (pendingReply) {
					messageOptions = Modules.MessageUtils.getSendMessageOptionsForReply(pendingReply);
				}
			}

			let sendAsLink = settings.alwaysSendAsLink;
			if (event && event.ctrlKey && settings.ctrlInvertSendBehavior) {
				sendAsLink = !sendAsLink;
			}

			// Always send as link if channel instance is not available (due to missing module)
			if (!sendAsLink && channel && hasPermission('ATTACH_FILES', channel)) {
				toast('Fetching sticker\u2026', { timeout: 1000 });

				log(`Fetching: ${url}`);
				const response = await fetch(url, { cache: 'force-cache' });
				const blob = await response.blob();

				let filename = id;
				if (typeof pack === 'string') {
					if (localPacks[pack].animated && (pack.startsWith('startswith-') || pack.startsWith('emojis-'))) {
						filename = filename.replace(/\.png$/i, '.gif');
						toastWarn('Animated stickers/emojis from LINE Store currently cannot be animated.');
					}
				}

				if (!settings.disableUploadObfuscation) {
					const ext = id.match(/(\.\w+)$/);
					filename = `${Date.now().toString()}${ext ? ext[1] : ''}`;
				}

				if (settings.markAsSpoiler) {
					filename = `SPOILER_${filename}`;
				}
				const file = new File([blob], filename);
				log(`Sending sticker as ${filename}\u2026`);

				toast('Sending\u2026', { timeout: 1000 });
				Modules.MessageUpload.uploadFiles({
					channelId,
					draftType: 0,
					hasSpoiler: false,
					options: messageOptions || {},
					parsedMessage: {
						content: messageContent
					},
					uploads: [
						new Modules.CloudUtils.CloudUpload({
							file,
							isClip: false,
							// isThumbnail: false,
							platform: 1
						}, channelId, false, 0)
					]
				});
			} else if (settings.ignoreEmbedLinksPermission || (channel && hasPermission('EMBED_LINKS', channel))) {
				if (!sendAsLink) {
					if (channel) {
						toastWarn('You do not have permission to attach files, sending sticker as link\u2026');
					} else {
						toastWarn('Unable to fetch ChannelStore module, sending sticker as link\u2026');
					}
				}

				let append = url;

				if (settings.maskStickerLink) {
					append = `[sticker](${append})`;
				}

				toast('Sending\u2026', { timeout: 1000 });
				Modules.MessageUtils._sendMessage(channelId, {
					content: `${messageContent} ${append}`.trim()
				}, messageOptions || {});
			} else {
				toastError('You do not have permissions to attach files nor embed links.');
			}

			// Clear chat input if required
			if (!settings.disableSendingWithChatInput && textAreaInstance) {
				log('Clearing chat input\u2026');
				textAreaInstance.stateNode.setState({
					textValue: '',
					// richValue: modules.richUtils.toRichValue('')
					richValue: [{ type: 'line', children: [{ text: '' }] }]
				});
			}

			// Update sticker's usage stats if using Frequently Used
			if (settings.frequentlyUsed !== 0) {
				const last = stickersStats.findIndex(sticker => sticker.pack === pack && sticker.id === id);
				if (last === -1) {
					stickersStats.push({ pack, id, used: 1, lastUsed: Date.now() });
				} else {
					stickersStats[last].used++;
					stickersStats[last].lastUsed = Date.now();
				}
				saveToLocalStorage('magane.stats', stickersStats);

				// Refresh UI
				// eslint-disable-next-line no-use-before-define
				updateFrequentlyUsed();
			}
		} catch (error) {
			console.error(error);
			toastError(error.toString(), { nolog: true, timeout: 6000 });
		}

		onCooldown = false;
	};

	const favoriteSticker = (pack, id) => {
		const index = favoriteStickers.findIndex(f => f.pack === pack && f.id === id);
		if (index !== -1) return;

		initSimplePackDataEntry(pack, subscribedPacks);

		const favorite = { pack, id };
		favoriteStickers = [...favoriteStickers, favorite];
		saveToLocalStorage('magane.favorites', favoriteStickers);
		log(`Favorited > ${id} of pack ${pack}`);
		toastSuccess('Favorited!', { nolog: true });
	};

	const unfavoriteSticker = (pack, id) => {
		const index = favoriteStickers.findIndex(f => f.pack === pack && f.id === id);
		if (index === -1) return;

		favoriteStickers.splice(index, 1);
		favoriteStickers = favoriteStickers;

		cleanUpSimplePackDataEntry(pack);

		saveToLocalStorage('magane.favorites', favoriteStickers);
		log(`Unfavorited > ${id} of pack ${pack}`);
		toastInfo('Unfavorited!', { nolog: true });
	};

	const filterPacks = () => {
		// Use value from packsSearch var instead of event
		// to allow this function to be called from other actions.
		const query = typeof packsSearch === 'string' && packsSearch.trim().toLowerCase();
		if (query) {
			// Allow searching by IDs too
			filteredPacks = availablePacks.filter(pack =>
				pack.name.toLowerCase().indexOf(query) >= 0 || String(pack.id).indexOf(query) >= 0);
		} else {
			filteredPacks = availablePacks;
		}
	};

	const _appendPack = (id, e, opts = {}) => {
		let availLocalPacks = getFromLocalStorage('magane.available');
		if (!Array.isArray(availLocalPacks) || !availLocalPacks.length) {
			availLocalPacks = [];
		}

		const foundIndex = availLocalPacks.findIndex(p => p.id === id);
		if (foundIndex >= 0) {
			if (opts.overwrite && opts.partial) {
				// Allow partial properties overwrites
				e = Object.assign(availLocalPacks[foundIndex], e);
			} else if (!opts.overwrite) {
				throw new Error(`Pack with ID ${id} already exist.`);
			}
		} else if (opts.overwrite) {
			throw new Error(`Cannot overwrite missing pack with ID ${id}.`);
		}

		if (!e.count || !e.files.length) {
			throw new Error('Invalid stickers count.');
		}

		const result = { pack: e };
		if (isLocalPackID(id)) {
			localPacks[id] = e;
		}

		if (foundIndex >= 0) {
			availLocalPacks[foundIndex] = e;
			const sharedIndex = availablePacks.findIndex(p => p.id === id);
			if (sharedIndex !== -1) {
				availablePacks[sharedIndex] = e;
			}
		} else {
			availLocalPacks.unshift(e);
			availablePacks.unshift(e);
			availablePacks = availablePacks;
		}

		saveToLocalStorage('magane.available', availLocalPacks);
		filterPacks();

		if (opts.overwrite) {
			log(`Overwritten pack with ID ${id}`);
		} else {
			log(`Added a new pack with ID ${id}`);
		}
		return result;
	};

	/*
	const analyticsSubscribePack = async ids => {
		const data = {
			packs: ids.filter(id => typeof id === 'number')
		};
		const response = await fetch('https://magane.moe/api/packs/subscribe', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
  			},
			mode: 'cors',
			body: JSON.stringify(data)
		});
	};

	const sendSubscribedPacksOnce = async () => {
		/*
		if (getFromLocalStorage('magane.alreadySentAnalyticsPacksOnce')) return;
		let data = subscribedPacks.map(pack => pack.id);
		try {
			await analyticsSubscribePack(data);
			saveToLocalStorage('magane.alreadySentAnalyticsPacksOnce', true);
		} catch (err) {
			toastError('Unexpected error. Check your console for details.');
		}
	};
	*/

	const migrateStringPackIds = async () => {
		let dirty = false;

		const favorites = getFromLocalStorage('magane.favorites');
		if (Array.isArray(favorites) && favorites.length) {
			favorites.forEach(item => {
				if (typeof item.pack === 'number' || isLocalPackID(item.pack)) return;
				const result = parseInt(item.pack, 10);
				if (isNaN(item.pack)) return;
				item.pack = result;
				dirty = true;
			});
		}

		const subscribed = getFromLocalStorage('magane.subscribed');
		if (Array.isArray(subscribed) && subscribed.length) {
			subscribed.forEach(item => {
				if (typeof item.id === 'number' || isLocalPackID(item.id)) return;
				const result = parseInt(item.id, 10);
				if (isNaN(item.id)) return;
				item.id = result;
				dirty = true;
			});
		}

		if (dirty) {
			toastInfo('Found packs/stickers to migrate, migrating now...');
			saveToLocalStorage('magane.favorites', favorites);
			saveToLocalStorage('magane.subscribed', subscribed);
			await grabPacks(true);
			toastSuccess('Migration successful.');
		}
	};

	const parseFunctionArgs = (args, argNames = [], minArgs = 0) => {
		// Allow calling window.magane.<function> with
		// func(val1, val2, ..., valN) for backwards-compatibility, and
		// func({arg1: val, arg2: val, ..., argN: val}) for a clean expandable future.
		const isFirstArgAnObj = typeof args[0] === 'object';
		if (!isFirstArgAnObj && args.length < minArgs) {
			throw new Error(`This function expects at least ${minArgs} parameter(s).`);
		}
		const parsed = {};
		for (let i = 0; i < argNames.length; i++) {
			parsed[argNames[i]] = isFirstArgAnObj ? args[0][argNames[i]] : args[i];
		}
		return parsed;
	};

	const appendPack = (...args) => {
		let { name, firstid, count, animated } = parseFunctionArgs(args,
			['name', 'firstid', 'count', 'animated'], 3);

		firstid = Number(firstid);
		if (isNaN(firstid) || !isFinite(firstid) || firstid < 0) {
			throw new Error('Invalid first ID.');
		}

		count = Math.max(Math.min(Number(count), 200), 0) || 0;
		const mid = `startswith-${firstid}`;
		const files = [];
		for (let i = firstid; i < (firstid + count); i += 1) {
			files.push(`${i}.png`);
		}

		return _appendPack(mid, {
			name,
			count,
			id: mid,
			animated: animated ? 1 : null,
			files
		});
	};

	const appendEmojisPack = (...args) => {
		let { name, id, count, animated } = parseFunctionArgs(args,
			['name', 'id', 'count', 'animated'], 3);

		count = Math.max(Math.min(Number(count), 200), 0) || 0;
		const mid = `emojis-${id}`;
		const files = [];
		for (let i = 0; i < count; i += 1) {
			files.push(`${String(i + 1).padStart(3, '0')}.png`);
		}

		return _appendPack(mid, {
			name,
			count,
			id: mid,
			animated: animated ? 1 : null,
			files
		});
	};

	const appendCustomPack = (...args) => {
		let { name, id, count, animated, template, files, thumbs } = parseFunctionArgs(args,
			['name', 'id', 'count', 'animated', 'template', 'files', 'thumbs'], 5);

		count = Math.max(Number(count), 0) || 0;
		const mid = `custom-${id}`;
		if (Array.isArray(files)) {
			if (!files.length) {
				throw new Error('"files" array cannot be empty.');
			}
		} else {
			if (!template) {
				throw new Error('"template" must be set if not using custom "files" array.');
			}
			files = [];
			for (let i = 1; i <= count; i += 1) {
				files.push(i + (animated ? '.gif' : '.png'));
			}
		}

		return _appendPack(mid, {
			name,
			count,
			id: mid,
			animated: animated ? 1 : null,
			files,
			thumbs,
			template
		});
	};

	const editPack = (...args) => {
		const { id, props } = parseFunctionArgs(args,
			['id', 'props'], 2);

		if (typeof props !== 'object') {
			throw new Error('"props" must be an object.');
		}

		return _appendPack(id, props, {
			overwrite: true,
			partial: true
		});
	};

	const deletePack = id => {
		if (!isLocalPackID(id)) {
			throw new Error('Pack ID must start with either "startswith-", "emojis-", or "custom-".');
		}

		const availLocalPacks = getFromLocalStorage('magane.available');
		if (!Array.isArray(availLocalPacks) || !availLocalPacks.length) {
			throw new Error('You have not imported any remote or custom packs');
		}

		const index = availLocalPacks.findIndex(p => p.id === id);
		if (index === -1) {
			throw new Error(`Unable to find pack with ID ${id}`);
		}

		// Force unfavorite stickers
		favoriteStickers = favoriteStickers.filter(s => s.pack !== id);
		saveToLocalStorage('magane.favorites', favoriteStickers);

		// Force clear stickers stats
		stickersStats = stickersStats.filter(s => s.pack !== id);
		saveToLocalStorage('magane.stats', stickersStats);

		// Update frequently used section (will also clean up simple pack data entry)
		// eslint-disable-next-line no-use-before-define
		updateFrequentlyUsed();

		// Force unsubscribe
		const subbedPack = subscribedPacks.find(p => p.id === id);
		if (subbedPack)	{
			unsubscribeToPack(subbedPack);
		}

		availLocalPacks.splice(index, 1);
		saveToLocalStorage('magane.available', availLocalPacks);

		const sharedIndex = availablePacks.findIndex(p => p.id === id);
		if (sharedIndex !== -1) {
			availablePacks.splice(sharedIndex, 1);
			availablePacks = availablePacks;
			filterPacks();
		}

		delete localPacks[id];
		log(`Removed pack with ID ${id} (old index: ${index})`);
		return true;
	};

	const searchPacks = keyword => {
		if (!keyword) {
			throw new Error('Keyword required');
		}

		keyword = keyword.toLowerCase();

		const availLocalPacks = getFromLocalStorage('magane.available');
		if (!Array.isArray(availLocalPacks) || !availLocalPacks.length) {
			throw new Error('You have not imported any remote or custom packs');
		}

		return availLocalPacks.filter(p =>
			p.name.toLowerCase().indexOf(keyword) >= 0 || p.id.indexOf(keyword) >= 0);
	};

	const setWindowMaganeAPIs = state => {
		if (state) {
			window.magane = {
				appendPack,
				appendEmojisPack,
				appendCustomPack,
				editPack,
				deletePack,
				searchPacks,
				Helper,
				Modules,
				hasPermission
			};
		} else if (!(window.magane instanceof Node)) {
			// For unknown reasons, if "window.magane" is not overriden,
			// it ends up being a reference to #magane element (Svelte's quirk?)
			delete window.magane;
		}
	};

	const formatStickersCount = count =>
		`<span class="counts"><span>–</span>${count} sticker${count === 1 ? '' : 's'}</span>`;

	const formatPackAppendix = id => {
		let tmp = `${id}`;
		if (typeof id === 'string') {
			if (id.startsWith('startswith-')) {
				tmp = `LINE ${id.replace('startswith-', '')}`;
			} else if (id.startsWith('emojis-')) {
				tmp = `LINE Emojis ${id.replace('emojis-', '')}`;
			} else if (id.startsWith('custom-')) {
				tmp = id.replace('custom-', '');
			}
		}
		return `<span class="appendix"><span>–</span><span title="ID: ${id}">${tmp}</span></span>`;
	};

	onMount(async () => {
		// Simple check if Magane is mounted with legacy method or MaganeBD
		base = main.parentNode.parentNode;

		// If base is document.body, assumes BetterDiscord
		mountType = document.body
			? MountType.BETTERDISCORD
			: MountType.LEGACY;

		// Build script for other mods should probably find-replace the following if necessary.
		mountType = mountType; // Svelte builds this line into: $$invalidate(0, mountType)

		switch (mountType) {
			case MountType.BETTERDISCORD:
				log('Magane is likely mounted with MaganeBD.');
				break;
			case MountType.VENCORD:
				log('Magane is mounted with MaganeVencord.');
				break;
			default:
				log('Magane is mounted with other or legacy method.');
		}

		const startTime = Date.now();

		try {
			toast('Loading Magane\u2026');

			// Background tasks
			initModules();
			getLocalStorage();
			loadSettings();

			await grabPacks();
			await migrateStringPackIds();

			toastSuccess('Magane is now ready!');

			// Init ResizeObserver
			initResizeObserver();
		} catch (error) {
			console.error(error);
			toastError('Unexpected error occurred when initializing Magane. Check your console for details.');
		}

		log(`Time taken: ${(Date.now() - startTime) / 1000}s.`);

		// Only check for updates if running on BetterDiscord
		if (!settings.disableUpdateCheck && mountType === MountType.BETTERDISCORD) {
			await checkUpdate();
		}
	});

	onDestroy(() => {
		// eslint-disable-next-line no-use-before-define
		document.removeEventListener('click', maganeBlurHandler);
		// eslint-disable-next-line no-use-before-define
		document.removeEventListener('keyup', onKeydownEvent);

		// Destroy any existing button components
		let destroyedCount = 0;
		for (let i = 0; i < components.length; i++) {
			try {
				components[i].$destroy();
				destroyedCount++;
			} catch (_) {}
		}

		// Clear all pending timeouts
		for (const timeout of Object.values(waitForTimeouts)) {
			clearTimeout(timeout);
		}

		// Disconnect all textArea(s) from observer
		if (resizeObserver) {
			resizeObserver.disconnect();
		}

		setWindowMaganeAPIs(false);
		log(`${destroyedCount}/${components.length} internal component(s) cleaned up.`);
	});

	const maganeBlurHandler = e => {
		const stickerWindow = main.querySelector('.stickerWindow');
		if (stickerWindow) {
			const { x, y, width, height } = stickerWindow.getBoundingClientRect();
			if (e.target) {
				if (activeComponent && activeComponent.element.contains(e.target)) return;
				const visibleModals = document.querySelectorAll('[class^="layerContainer-"]');
				if (visibleModals.length && Array.from(visibleModals).some(m => m.contains(e.target))) return;
			}
			if (!((e.clientX <= x + width && e.clientX >= x) &&
				(e.clientY <= y + height && e.clientY >= y))
			) {
				// eslint-disable-next-line no-use-before-define
				toggleStickerWindow(false);
			}
		}
	};

	const toggleStickerWindow = (forceState, component) => {
		if (!document.body.contains(main)) {
			return toastError('Oh no! Magane was unexpectedly destroyed.. Please consider updating to MaganeBD instead.', { timeout: 6000 });
		}

		// Force-close previous active component if it's a different component
		if (component && activeComponent && component !== activeComponent) {
			toggleStickerWindow(false, activeComponent);
			activeComponent = null;
		}

		// If no previously active component, simply assign the first valid one
		// (e.g. on first launch, or after switching channels).
		let toggledComponent = component || activeComponent;
		if (!toggledComponent && components.length) {
			toggledComponent = components.find(component => document.body.contains(component.element));
		}

		// If unable to choose a component, return early
		if (!toggledComponent) return;
		if (!document.body.contains(toggledComponent.textArea)) return;

		const active = typeof forceState === 'undefined' ? !stickerWindowActive : forceState;
		if (active) {
			// Re-position magane's sticker window
			updateStickerWindowPosition(toggledComponent);

			// One-time warning for viewport height <= 700px when opening Magane window
			if (!settings.ignoreViewportSize && !isWarnedAboutViewportHeight) {
				const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
				if (viewportHeight <= 700) {
					toastWarn('Viewport height is less than 700px, Magane window may not display properly.', { timeout: 6000 });
					isWarnedAboutViewportHeight = true;
				}
			}

			// Set toggled component as currently active component
			activeComponent = toggledComponent;
			document.addEventListener('click', maganeBlurHandler);
		} else {
			document.removeEventListener('click', maganeBlurHandler);
		}

		stickerWindowActive = active;
		toggledComponent.active = active;
	};

	const toggleStickerModal = () => {
		const active = !stickerAddModalActive;
		if (active && activeTab === null) {
			// eslint-disable-next-line no-use-before-define
			activateTab(0);
		}
		stickerAddModalActive = active;
	};

	const activateTab = value => {
		activeTab = value;
		if (!stickerAddModalTabsInit[activeTab]) {
			// Trigger DOM build for this tab for the first time (if applicable)
			stickerAddModalTabsInit[activeTab] = true;
		}
	};

	const scrollToStickers = id => {
		animateScroll.scrollTo({
			element: id.replace(/([.])/g, '\\$1'),
			container: main.querySelector('.stickers')
		});
	};

	const movePack = event => {
		const value = event.target.value.trim();
		if (event.keyCode !== 13 || !value.length) return;

		let newIndex = Number(value);
		if (isNaN(newIndex) || newIndex < 1 || newIndex > subscribedPacks.length) {
			return toastError(`New position must be ≥ 1 and ≤ ${subscribedPacks.length}.`);
		}
		newIndex--;

		let packId = event.target.dataset.pack;
		if (typeof packId === 'undefined') return;
		if (!isLocalPackID(packId)) packId = Number(packId);

		const oldIndex = subscribedPacks.findIndex(pack => pack.id === packId);
		if (oldIndex === newIndex) return;

		// Pull pack from its old index
		const packData = subscribedPacks.splice(oldIndex, 1);
		subscribedPacksSimple.splice(oldIndex, 1);

		// Push pack to the new index
		subscribedPacks.splice(newIndex, 0, packData[0]);
		subscribedPacksSimple.splice(newIndex, 0, packData[0].id);

		// Unfocus and restore input box
		event.target.blur();
		event.target.value = String(oldIndex);

		// Update UI and storage
		subscribedPacks = subscribedPacks;
		subscribedPacksSimple = subscribedPacksSimple;
		saveToLocalStorage('magane.subscribed', subscribedPacks);
		toastSuccess(`Moved pack from position ${oldIndex + 1} to ${newIndex + 1}.`);
	};

	const deleteLocalPack = id => {
		try {
			const _name = localPacks[id].name;
			const deleted = deletePack(id);
			if (deleted) {
				toastSuccess(`Removed pack ${_name}.`, { nolog: true, timeout: 6000 });
			}
		} catch (error) {
			console.error(error);
			toastError(error.toString(), { nolog: true });
		}
	};

	const processRemotePack = async (data, opts) => {
		const pack = {
			id: '',
			name: '',
			files: [],
			count: 0,
			remoteType: 0
		};

		if (opts) {
			for (const key of Object.keys(opts)) {
				pack[key] = opts[key];
			}
		}

		// Expandable if required
		switch (pack.remoteType) {
			case 1: // Chibisafe Albums
				pack.name = String(data.album.name);

				pack.thumbs = [];
				for (let i = 0; i < data.album.files.length; i++) {
					pack.files.push(data.album.files[i].url);
					pack.thumbs.push(data.album.files[i].thumb || null);
				}
				break;
			case 2: // Old Chibisafe and Lolisafe v3 Albums
				pack.name = String(data.name);

				pack.thumbs = [];
				for (let i = 0; i < data.files.length; i++) {
					pack.files.push(data.files[i].url);
					pack.thumbs.push(data.files[i].thumb || null);
				}
				break;
			case 0: // Custom JSON
			default:
				if (['id', 'name', 'files'].some(key => !data[key])) {
					throw new Error('Invalid config. Some required fields are missing.');
				}

				pack.id = String(data.id);
				pack.name = String(data.name);

				if (data.files.some(file => typeof file !== 'string')) {
					throw new Error('Invalid "files" array. Some values are not string.');
				}
				pack.files = data.files;

				if (Array.isArray(data.thumbs)) {
					if (data.thumbs.some(thumb => typeof thumb !== 'string' && thumb !== null)) {
						throw new Error('Invalid "thumbs" array. Some values are neither string nor null.');
					}
					pack.thumbs = data.thumbs;
				}

				pack.description = data.description ? String(data.description) : null;
				pack.homeUrl = data.homeUrl ? String(data.homeUrl) : null;
				pack.template = data.template ? String(data.template) : null;

				// Override update URL if required
				if (data.updateUrl) {
					pack.updateUrl = String(data.updateUrl);
				}
				break;
		}

		// General chores
		pack.count = pack.files.length;
		// If all thumbs are missing, just empty the array
		if (Array.isArray(pack.thumbs) && pack.thumbs.every(thumb => thumb === null)) {
			pack.thumbs = [];
		}

		return pack;
	};

	const fetchRemotePack = async url => {
		const opts = { updateUrl: url };

		if (!url || !/^https?:\/\//.test(url)) {
			throw new Error('URL must have HTTP(s) protocol.');
		}

		// Expandable if required
		const regExes = [
			// RegEx for Chibisafe album links (basically /a/identifier)
			/^(.+:\/\/)(.+)\/a\/([^/\s]+)/,
			// RegEx for old method of saving Chibisafe album API (/api/album/identifier)
			/^(.+:\/\/)(.+)\/api\/album\/([^/\s]+)/
		];

		let match = { index: -1 };
		for (let i = 0; i < regExes.length; i++) {
			const _match = url.match(regExes[i]);
			if (_match && !_match.some(m => m === undefined)) {
				match = {
					index: i,
					result: _match
				};
			}
		}

		let data;

		if (match.index === 0 || match.index === 1) {
			// Re-map old method of saving Chibisafe album API
			if (match.index === 1) {
				// Basically restores it to its original public album link
				url = `${match.result[1]}${match.result[2]}/a/${match.result[3]}`;
				opts.updateUrl = url;
			}

			opts.id = `${match.result[2]}-${match.result[3]}`;
			opts.homeUrl = url;

			// API will now be always deteremined on-the-fly,
			// to allow changing this in the future, if required,
			// without breaking packs saved with any older methods.
			const downloadUrl = `${match.result[1]}${match.result[2]}/api/album/${match.result[3]}`;

			// Initially try with latest Chibisafe API
			const chibisafeSuffix = '/view?page=1&limit=500';
			log(`Fetching chibisafe album: ${downloadUrl + chibisafeSuffix}`);
			let response = await fetch(downloadUrl + chibisafeSuffix, { cache: 'no-cache' })
				.catch(response => response); // ignore network errors, mainly CORS

			if (response && (response.status === 200 || response.status === 304)) {
				// Parse as JSON immediately, and assign remote type 1
				data = await response.json();
				opts.remoteType = 1;
			} else {
				// Fallback to old API for backwards-compatibility,
				// also to support my lolisafe v3 forks cause im too lazy to update its API.
				const _status = (response && response.status)
					? `${response.status} ${response.statusText}`.trim()
					: 'N/A';
				log(`HTTP error ${_status}, re-trying with: ${downloadUrl}`);
				response = await fetch(downloadUrl, { cache: 'no-cache' });
				data = await response.json();
				opts.remoteType = 2; // assign remote type 2
			}
		} else {
			// Custom JSON
			const response = await fetch(opts.updateUrl);
			data = await response.json();
			opts.remoteType = 0; // assign remote type 0
		}

		if (!data) {
			throw new Error('Unable to parse data. Check your console for details.');
		}

		return processRemotePack(data, opts);
	};

	const updateRemotePack = async (id, silent = false) => {
		try {
			if (!localPacks[id] || !localPacks[id].updateUrl) return;
			if (!silent) {
				toast('Updating pack information\u2026', { nolog: true, timeout: 1500 });
			}

			// Only pass update URL, the function will determine by itself what to do with it
			const pack = await fetchRemotePack(localPacks[id].updateUrl);
			pack.id = id;

			const stored = _appendPack(pack.id, pack, { overwrite: true });

			// Clean up favorites
			favoriteStickers = favoriteStickers.filter(s =>
				s.pack !== id || stored.pack.files.findIndex(f => f === s.id) !== -1);
			saveToLocalStorage('magane.favorites', favoriteStickers);

			// Clean up stickers stats
			stickersStats = stickersStats.filter(s =>
				s.pack !== id || stored.pack.files.findIndex(f => f === s.id) !== -1);
			saveToLocalStorage('magane.stats', stickersStats);

			// Update simple pack data entry if required
			if (simplePacksData[id]) {
				simplePacksData[id].name = stored.pack.name;
			}

			// Update frequently used section (will also clean up simple pack data entry)
			// eslint-disable-next-line no-use-before-define
			updateFrequentlyUsed();

			// Update subscribed pack data
			const subIndex = subscribedPacks.findIndex(p => p.id === id);
			if (subIndex !== -1)	{
				subscribedPacks[subIndex] = stored.pack;
				subscribedPacksSimple[subIndex] = stored.pack.id;
				saveToLocalStorage('magane.subscribed', subscribedPacks);
			}

			if (!silent) {
				toastSuccess(`Updated pack ${stored.pack.name}.`, { nolog: true, timeout: 6000 });
			}
			return stored;
		} catch (error) {
			console.error(error);
			toastError(error.toString(), { nolog: true });
		}
	};

	const showPackInfo = id => {
		if (!localPacks[id]) return;

		let remoteType = 'N/A';
		if (typeof localPacks[id].remoteType === 'number') {
			remoteType = `${localPacks[id].remoteType} – ${remotePackTypes[localPacks[id].remoteType] || 'N/A'}`;
		} else if (id.startsWith('startswith-')) {
			remoteType = 'LINE';
		} else if (id.startsWith('emojis-')) {
			remoteType = 'LINE Emojis';
		}

		// Formatting is very particular, so we do this the old-fashioned way
		/* eslint-disable prefer-template */
		const content = '**ID:**\n\n' +
			'```\n' + id + '\n```\n\n' +
			'**Name:**\n\n' +
			localPacks[id].name + '\n\n' +
			'**Count:**\n\n' +
			localPacks[id].count + '\n\n' +
			'**Description:**\n\n' +
			(localPacks[id].description || 'N/A') + '\n\n' +
			'**Home URL:**\n\n' +
			(localPacks[id].homeUrl || 'N/A') + '\n\n' +
			'**Update URL:**\n\n' +
			'```\n' + (localPacks[id].updateUrl || 'N/A') + '\n```\n\n' +
			'**Remote Type:**\n\n' +
			remoteType;
		/* eslint-enable prefer-template */

		Helper.Alerts.show(
			localPacks[id].name,
			content
		);
	};

	const parseLinePack = async () => {
		if (!linePackSearch) return;
		try {
			const match = linePackSearch.match(/^(https?:\/\/store\.line\.me\/((sticker|emoji)shop)\/product\/)?([a-z0-9]+)/);
			if (!match) return toastError('Unsupported LINE Store URL or ID.');
			toast('Loading pack information\u2026', { nolog: true });
			let stored;
			if (match[3] === 'emoji') {
				// LINE Emojis will only work when using its full URL
				const id = match[4];
				const response = await fetch(`https://magane.moe/api/proxy/emoji/${id}`);
				const props = await response.json();
				stored = appendEmojisPack({
					name: props.title,
					id: props.id,
					count: props.len,
					animated: props.hasAnimation || null
				});
			} else {
				// LINE Stickers work with either its full URL or just its ID
				const id = Number(match[4]);
				if (isNaN(id) || id < 0) return toastError('Unsupported LINE Stickers ID.');
				const response = await fetch(`https://magane.moe/api/proxy/sticker/${id}`);
				const props = await response.json();
				stored = appendPack({
					name: props.title,
					firstid: props.first,
					count: props.len,
					animated: props.hasAnimation
				});
			}
			toastSuccess(`Added a new pack ${stored.pack.name}. You can now subscribe to it from Packs tab.`, { nolog: true, timeout: 6000 });
			linePackSearch = null;
		} catch (error) {
			console.error(error);
			toastError(error.toString(), { nolog: true });
		}
	};

	const assertRemotePackConsent = (context, onConfirm) => {
		// Markdown, so we do double \n for new line
		const content = `**Please continue only if you trust the remote packs.**\n\n${context}`;
		Helper.Alerts.show(
			'Import Remote Packs',
			content,
			{
				confirmText: 'Import',
				cancelText: 'Cancel',
				danger: true,
				onConfirm
			}
		);
	};

	const parseRemotePackUrl = () => {
		if (!remotePackUrl) return;

		const remotePackUrls = remotePackUrl.split('\n')
			.map(url => url.trim())
			.filter(url => url.length);

		if (!remotePackUrls.length) return;

		/* eslint-disable-next-line prefer-template */
		assertRemotePackConsent('URLs:\n\n```\n' + remotePackUrls.join('\n') + '\n```', async () => {
			const failed = [];
			for (const url of remotePackUrls) {
				try {
					toast('Loading pack information\u2026', { nolog: true });
					const pack = await fetchRemotePack(url);
					pack.id = `custom-${pack.id}`;
					const stored = _appendPack(pack.id, pack);
					toastSuccess(`Added a new pack ${stored.pack.name}.`, { nolog: true, timeout: 6000 });
				} catch (error) {
					console.error(error);
					toastError(error.toString(), { nolog: true });
					failed.push(url);
				}
			}

			if (failed.length) {
				toastError('Failed to add some remote packs. Their URLs have been kept in the input box.');
				remotePackUrl = failed.join('\n');
			} else {
				remotePackUrl = '';
			}
		});
	};

	const onLocalRemotePackChange = async event => {
		const { files } = event.target;
		if (!files.length) return false;

		const results = [];

		toast(`Reading ${files.length} file${files.length === 1 ? '' : 's'}\u2026`);
		for (const file of files) {
			await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = e => {
					try {
						const data = JSON.parse(e.target.result);
						results.push({ name: file.name, data });
						resolve();
					} catch (error) {
						reject(error);
					}
				};
				log(`Reading ${file.name}\u2026`);
				reader.readAsText(file);
			}).catch(error => {
				console.error(error);
				toastError(`${file.name} is not a valid JSON file.`);
			});
		}

		// Reset selected files in the hidden input
		event.target.value = '';

		const fileNames = results.map(result => result.name);

		/* eslint-disable-next-line prefer-template */
		assertRemotePackConsent('Files:\n\n```\n' + fileNames.join('\n') + '\n```', async () => {
			const failedResults = [];
			for (const result of results) {
				try {
					const pack = await processRemotePack(result.data);
					pack.id = `custom-${pack.id}`;
					const stored = _appendPack(pack.id, pack);
					toastSuccess(`Added a new pack ${stored.pack.name}.`, { nolog: true, timeout: 6000 });
				} catch (error) {
					console.error(error);
					toastError(error.toString(), { nolog: true });
					failedResults.push(result.name);
				}
			}

			if (failedResults.length) {
				toastError(`Failed to add: ${failedResults.join(',')}.`);
			}
		});
	};

	const loadLocalRemotePack = () => {
		const element = document.getElementById('localRemotePackInput');
		element.click();
	};

	const bulkUpdateRemotePacks = () => {
		const packs = Object.values(localPacks)
			.filter(pack => pack.updateUrl)
			.map(pack => pack.id);
		if (!packs.length) {
			return toastWarn('You do not have any remote packs that can be updated.');
		}

		// Markdown, so we do double \n for new line
		const content = `**Please confirm that you want to update __${packs.length}__ remote pack${packs.length === 1 ? '' : 's'}.**`;
		Helper.Alerts.show(
			`Update ${packs.length} remote pack${packs.length === 1 ? '' : 's'}`,
			content,
			{
				confirmText: 'Yes, update all!',
				cancelText: 'Cancel',
				danger: true,
				onConfirm: async () => {
					try {
						for (let i = 0; i < packs.length; i++) {
							toast(`Updating pack ${i + 1} out of ${packs.length}\u2026`, { nolog: true, timeout: 500 });
							const stored = await updateRemotePack(packs[i], true);
							if (!stored) break;
						}
						toastSuccess('Updates completed.', { nolog: true });
					} catch (ex) {
						toastWarn('Updates cancelled due to unexpected errors.', { nolog: true });
						// Do nothing
					}
				}
			}
		);
	};

	const onSettingsChange = event => {
		const { name } = event.target;
		if (!name) return false;

		// Value already changed via Svelte's bind:value
		log(`settings['${name}'] = ${settings[name]}`);

		// Settings that require their own on-change tasks
		setWindowMaganeAPIs(settings.enableWindowMagane);

		saveToLocalStorage('magane.settings', settings);
		toastSuccess('Settings saved!', { nolog: true });
	};

	const updateFrequentlyUsed = () => {
		// Get pack IDs of stickers previously included in frequently used section
		const lastPackIDs = frequentlyUsedSorted
			.map(v => v.pack)
			.filter((v, i, a) => a.indexOf(v) === i);

		if (settings.frequentlyUsed) {
			// Only keep stats of ceil(settings.frequentlyUsed * 1.5) frequently used stickers
			// to avoid infinite growth of extraneous useless data.
			// NOTE: If full usage stats is ever required in the future, this check should be removed.
			stickersStats = stickersStats
				.sort((a, b) => b.used - a.used || b.lastUsed - a.lastUsed)
				.slice(0, Math.ceil(settings.frequentlyUsed * 1.5));

			const sliced = stickersStats.slice(0, settings.frequentlyUsed);
			sliced.forEach(sticker => initSimplePackDataEntry(sticker.pack));

			frequentlyUsedSorted = sliced;
		} else if (frequentlyUsedSorted.length) {
			// Refresh UI only if required
			frequentlyUsedSorted = [];
		}

		// Try to clean up simple pack data entry if no longer used
		lastPackIDs.forEach(cleanUpSimplePackDataEntry);
	};

	const parseFrequentlyUsedInput = () => {
		const count = parseInt(frequentlyUsedInput, 10);
		if (isNaN(count) || count < 0) {
			return toastError('Invalid number.');
		}

		settings.frequentlyUsed = count;
		log(`settings['frequentlyUsed'] = ${settings.frequentlyUsed}`);
		saveToLocalStorage('magane.settings', settings);

		if (count === 0) {
			stickersStats = [];
			saveToLocalStorage('magane.stats', stickersStats);
			toastSuccess('Settings saved, and stickers usage cleared!', { nolog: true });
		} else {
			toastSuccess('Settings saved!', { nolog: true });
		}

		// Refresh UI
		updateFrequentlyUsed();
	};

	const onKeydownEvent = event => {
		for (const prop in hotkey) {
			if (prop === 'key' || prop === 'code') {
				if (hotkey[prop] !== event[prop].toLocaleLowerCase()) return;
			} else if (hotkey[prop] !== event[prop]) {
				return;
			}
		}

		if (event.target && event.target.classList.contains('supress-magane-hotkey')) return;
		if (components.length) {
			event.preventDefault();
			toggleStickerWindow();
		}
	};

	const parseThenInitHotkey = save => {
		// Clean input
		const keys = (hotkeyInput || '')
			.split('+')
			.map(key => key.trim());
		hotkeyInput = keys.join('+');
		if (hotkeyInput && keys.length) {
			// Preset with "key" & "code" ordered first for earlier if-checks in listener event
			const tmp = {
				key: null,
				code: null,
				altKey: false,
				metaKey: false,
				shiftKey: false,
				ctrlKey: false
			};

			for (let i = 0; i < keys.length; i++) {
				let key = keys[i].toLocaleLowerCase();
				// If last key, assume not modifiers, thus parse extra information
				if (i === keys.length - 1) {
					if (/^(ctrl|ctl)/.test(key)) {
						key = key.replace(/^(ctrl|ctl)/, 'control');
					}
					if (/(right|left)$/.test(key)) {
						tmp.code = key;
						tmp.key = key.replace(/(right|left)$/, '');
					} else {
						tmp.key = key;
					}
				// Otherwise..
				} else if (/^alt/.test(key)) {
					tmp.altKey = true;
				} else if (/^meta/.test(key)) {
					tmp.metaKey = true;
				} else if (/^shift/.test(key)) {
					tmp.shiftKey = true;
				} else if (/^(control|ctrl|ctl)/.test(key)) {
					tmp.ctrlKey = true;
				} else {
					return toastError('Invalid hotkey. If used with modifier keys, only support 1 other key.',
						{ timeout: 6000 });
				}
			}

			// Useless if unset with side suffix
			if (!tmp.code) {
				delete tmp.code;
			}

			hotkey = tmp;
			document.addEventListener('keyup', onKeydownEvent);
		} else {
			hotkey = null;
			document.removeEventListener('keyup', onKeydownEvent);
		}

		if (save) {
			settings.hotkey = hotkeyInput;
			log(`settings['hotkey'] = ${settings.hotkey}`);

			saveToLocalStorage('magane.settings', settings);
			toastSuccess(hotkey ? 'Hotkey saved.' : 'Hotkey cleared.', { nolog: true });
		}
	};

	const onReplaceDatabaseChange = event => {
		const { files } = event.target;
		if (!files.length) return false;

		const reader = new FileReader();
		reader.onload = e => {
			// Reset selected file in the hidden input
			event.target.value = '';

			let result;
			try {
				result = JSON.parse(e.target.result);
			} catch (error) {
				console.error(error);
				toastError('The selected file is not a valid JSON file.');
			}

			// This accepts Discord's Markdown
			let content = 'This database contains the following data:';

			const valid = [];
			const invalid = [];
			for (const key of allowedStorageKeys) {
				if (typeof (result[key]) === 'undefined' || result[key] === null) {
					invalid.push(key);
				} else {
					let len = null;
					if (Array.isArray(result[key])) {
						len = result[key].length;
					} else {
						try {
							len = Object.keys(result[key]).length;
						} catch (ex) {
							// Do nothing (any other non {}-object values)
						}
					}

					let append = '';
					if (len !== null) {
						append = ` has **${len}** item${len === 1 ? '' : 's'}`;
					}

					content += `\n**${key}**${append}`;
					valid.push(key);
				}
			}

			if (!valid.length) {
				content = '**This is an empty database file.**';
			}

			if (invalid.length) {
				content += `\nThese missing or invalid field${invalid.length === 1 ? '' : 's'} **will be removed**:`;
				content += `\n${invalid.join('\n')}`;
			}

			content += '\n**Please continue only if you trust this database file.**';
			Helper.Alerts.show(
				'Replace Database',
				content.replace(/\n/g, '\n\n'), // Markdown, so we do double \n for new line
				{
					confirmText: 'Go ahead!',
					cancelText: 'Cancel',
					danger: true,
					onConfirm: async () => {
						for (const key of valid) {
							saveToLocalStorage(key, result[key]);
						}
						for (const key of invalid) {
							storage.removeItem(key);
						}

						forceHideMagane = true;
						toast('Reloading Magane database\u2026');

						Object.assign(settings, defaultSettings);
						loadSettings(true);
						await grabPacks(true);
						await migrateStringPackIds();

						toastSuccess('Magane is now ready!');
						forceHideMagane = false;
					}
				}
			);
		};

		log(`Reading ${files[0].name}\u2026`);
		reader.readAsText(files[0]);
	};

	const replaceDatabase = () => {
		const element = document.getElementById('replaceDatabaseInput');
		element.click();
	};

	const exportDatabase = () => {
		const element = document.createElement('a');
		let hrefUrl = '';

		try {
			toast('Exporting database\u2026');
			const database = {};
			for (const key of allowedStorageKeys) {
				const data = getFromLocalStorage(key);
				if (typeof data !== 'undefined') {
					database[key] = data;
				}
			}
			const dbString = JSON.stringify(database);
			const blob = new Blob([dbString]);
			hrefUrl = window.URL.createObjectURL(blob);
			element.href = hrefUrl;
			element.download = `magane.database.${new Date().toISOString()}.json`;
			element.click();
		} catch (error) {
			console.error(error);
			toastError('Unexpected error occurred. Check your console for details.');
		}

		element.remove();
		if (hrefUrl) window.URL.revokeObjectURL(hrefUrl);
	};
</script>

<main bind:this={ main }>
	<div id="magane"
		style="{ mountType === MountType.LEGACY ? `top: ${coords.top}px; left: ${coords.left}px;` : '' } { forceHideMagane ? 'display: none;' : ''}">

		<div class="stickerWindow" style="bottom: { `${coords.wbottom}px` }; right: { `${coords.wright}px` }; { stickerWindowActive ? '' : 'display: none;' }">
			<div class="stickers has-scroll-y { settings.useLeftToolbar ? 'has-left-toolbar' : '' }" style="">
				{ #if !favoriteStickers.length && !subscribedPacks.length }
				<h3 class="getStarted">It seems you aren't subscribed to any pack yet. Click the plus symbol on the bottom-left to get started! 🎉</h3>
				{ /if }
				{ #if favoriteStickers.length }
				<div class="pack">
					<span id="pfavorites">Favorites{ @html formatStickersCount(favoriteStickers.length) }</span>
					{ #each favoriteStickers as sticker, i }
					<div class="sticker">
						<img
							class="image"
							src="{ `${formatUrl(sticker.pack, sticker.id)}` }"
							alt="{ sticker.pack } - { sticker.id }"
							title="{ simplePacksData[sticker.pack] ? simplePacksData[sticker.pack].name : '' }"
							on:click="{ event => sendSticker(sticker.pack, sticker.id, event) }"
						>
						<div class="deleteFavorite"
							title="Unfavorite"
							on:click="{ () => unfavoriteSticker(sticker.pack, sticker.id) }">
							<svg width="20" height="20" viewBox="0 0 24 24">
								<path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path>
							</svg>
						</div>
					</div>
					{ /each }
				</div>
				{ /if }

				{ #if frequentlyUsedSorted.length }
				<div class="pack">
					<span id="pfrequentlyused">Frequently Used{ @html formatStickersCount(frequentlyUsedSorted.length) }</span>
					{ #each frequentlyUsedSorted as sticker, i }
					<div class="sticker">
						<img
							class="image"
							src="{ `${formatUrl(sticker.pack, sticker.id)}` }"
							alt="{ sticker.pack } - { sticker.id }"
							title="{ simplePacksData[sticker.pack] ? `${simplePacksData[sticker.pack].name} – ` : '' }Used: {sticker.used}"
							on:click="{ event => sendSticker(sticker.pack, sticker.id, event) }"
						>
						{ #if favoriteStickers.findIndex(f => f.pack === sticker.pack && f.id === sticker.id) === -1 }
						<div class="addFavorite"
							title="Favorite"
							on:click="{ () => favoriteSticker(sticker.pack, sticker.id) }">
							<svg width="20" height="20" viewBox="0 0 24 24">
								<path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path>
							</svg>
						</div>
						{ :else }
						<div class="deleteFavorite"
							title="Unfavorite"
							on:click="{ () => unfavoriteSticker(sticker.pack, sticker.id) }">
							<svg width="20" height="20" viewBox="0 0 24 24">
								<path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path>
							</svg>
						</div>
						{ /if }
					</div>
					{ /each }
				</div>
				{ /if }

				{ #each subscribedPacks as pack, i }
				<div class="pack">
					<span id="p{pack.id}">{ pack.name }{ @html formatStickersCount(pack.files.length) }</span>

					{ #each pack.files as sticker, i }
					<div class="sticker">
						<img
							class="image"
							src="{ `${formatUrl(pack.id, sticker, false, i)}` }"
							alt="{ pack.id } - { sticker }"
							on:click="{ event => sendSticker(pack.id, sticker, event) }"
						>
						{ #if favoriteStickers.findIndex(f => f.pack === pack.id && f.id === sticker) === -1 }
						<div class="addFavorite"
							title="Favorite"
							on:click="{ () => favoriteSticker(pack.id, sticker) }">
							<svg width="20" height="20" viewBox="0 0 24 24">
								<path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path>
							</svg>
						</div>
						{ :else }
						<div class="deleteFavorite"
							title="Unfavorite"
							on:click="{ () => unfavoriteSticker(pack.id, sticker) }">
							<svg width="20" height="20" viewBox="0 0 24 24">
								<path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path>
							</svg>
						</div>
						{ /if }
					</div>
					{ /each }
				</div>
				{ /each }
			</div>

			<div class="packs-toolbar { settings.useLeftToolbar ? 'has-scroll-y' : 'has-scroll-x' }">
				<div class="packs packs-controls">
					<div class="packs-wrapper">
						<div class="pack"
							on:click="{ () => toggleStickerModal() }"
							title="Manage subscribed packs" >
							<div class="icon-plus" />
						</div>
						{ #if favoriteSticker.length }
						<div class="pack"
							on:click={ () => scrollToStickers('#pfavorites') }
							title="Favorites" >
							<div class="icon-favorite" />
						</div>
						{ /if }
						{ #if frequentlyUsedSorted.length }
						<div class="pack"
							on:click={ () => scrollToStickers('#pfrequentlyused') }
							title="Frequently Used" >
							<div class="icon-frequently-used" />
						</div>
						{ /if }
					</div>
				</div>

				<div class="packs" style="">
					<div class="packs-wrapper">
						{ #each subscribedPacks as pack, i }
						<div class="pack"
							on:click={ () => scrollToStickers(`#p${pack.id}`) }
							title="{ pack.name }"
							style="background-image: { `url(${formatUrl(pack.id, pack.files[0], false, 0)})` }" />
						{ /each }
					</div>
				</div>
			</div>

			<div class="stickersModal" style="{ stickerAddModalActive ? '' : 'display: none;' }">
				<div class="modal-close"
					on:click="{ () => toggleStickerModal() }"></div>

				<div class="modal-content">
					<div class="stickersConfig">
						<div class="tabs">
							<div class="tab"
								on:click="{ () => activateTab(0) }"
								class:is-active="{ activeTab === 0 }">
								Installed
							</div>
							<div class="tab"
								on:click="{ () => activateTab(1) }"
								class:is-active="{ activeTab === 1 }">
								Packs
							</div>
							<div class="tab"
								on:click="{ () => activateTab(2) }"
								class:is-active="{ activeTab === 2 }">
								Import
							</div>
							<div class="tab"
								on:click="{ () => activateTab(3) }"
								class:is-active="{ activeTab === 3 }">
								Misc
							</div>
						</div>

						<!-- tab: Installed -->
						{ #if stickerAddModalTabsInit[0] }
						<div class="tab-content has-scroll-y" style="{ activeTab === 0 ? '' : 'display: none;' }">
							{ #each subscribedPacks as pack, i (pack.id) }
							<div class="pack">
								{ #if subscribedPacks.length > 1 }
								<div class="index">
									<input
										on:click="{ event => event.target.select() }"
										on:keypress="{ movePack }"
										class="inputPackIndex"
										type="text"
										data-pack={ pack.id }
										value={ i + 1 } />
								</div>
								{ /if }
								<div class="preview"
									style="background-image: { `url(${formatUrl(pack.id, pack.files[0], false, 0)})` }" />
								<div class="info">
									<span title="{ settings.showPackAppendix ? '' : `ID: ${pack.id}`}">{ pack.name }</span>
									<span>{ pack.count } stickers{ @html settings.showPackAppendix ? formatPackAppendix(pack.id) : '' }</span>
								</div>
								<div class="action{ localPacks[pack.id] && (isLocalPackID(pack.id) || localPacks[pack.id].updateUrl) ? ' is-tight' : '' }">
									<button class="button is-danger"
										on:click="{ () => unsubscribeToPack(pack) }"
										title="Unsubscribe">Del</button>
									{ #if localPacks[pack.id] }
									{ #if isLocalPackID(pack.id) }
									<button class="button pack-info"
										on:click="{ () => showPackInfo(pack.id) }"
										title="Info">i</button>
									{ /if }
									{ #if localPacks[pack.id].updateUrl }
									<button class="button update-pack"
										on:click="{ () => updateRemotePack(pack.id) }"
										title="Update">Up</button>
									{ /if }
									{ /if }
								</div>
							</div>
							{ /each }
						</div>
						{ /if }<!-- /stickerAddModalTabsInit[0] -->
						<!-- /tab: Installed -->

						<!-- tab: Packs -->
						<div class="tab-content avail-packs" style="{ activeTab === 1 ? '' : 'display: none;' }">
							<input
								on:keyup="{ filterPacks }"
								bind:value={ packsSearch }
								class="inputQuery"
								type="text"
								placeholder="Search" />
							{ #if stickerAddModalTabsInit[1] }
							<div class="packs has-scroll-y" style="">
								{ #each filteredPacks as pack }
								<div class="pack">
									<div class="preview"
										style="background-image: { `url(${formatUrl(pack.id, pack.files[0], false, 0)})` }" />
									<div class="info">
										<span title="{ settings.showPackAppendix ? '' : `ID: ${pack.id}`}">{ pack.name }</span>
										<span>{ pack.count } stickers{ @html settings.showPackAppendix ? formatPackAppendix(pack.id) : '' }</span>
									</div>
									<div class="action{ localPacks[pack.id] ? ' is-tight' : '' }">
										{ #if subscribedPacksSimple.includes(pack.id) }
										<button class="button is-danger"
											on:click="{ () => unsubscribeToPack(pack) }"
											title="Unsubscribe">Del</button>
										{ :else }
										<button class="button is-primary"
											on:click="{ () => subscribeToPack(pack) }"
											title="Subscribe">Add</button>
										{ /if }
										{ #if localPacks[pack.id] }
										{ #if isLocalPackID(pack.id) }
										<button class="button pack-info"
											on:click="{ () => showPackInfo(pack.id) }"
											title="Info">i</button>
										{ /if }
										{ #if localPacks[pack.id].updateUrl }
										<button class="button update-pack"
											on:click="{ () => updateRemotePack(pack.id) }"
											title="Update">Up</button>
										{ /if }
										<button class="button delete-pack is-danger"
											on:click="{ () => deleteLocalPack(pack.id) }"
											title="Purge"></button>
										{ /if }
									</div>
								</div>
								{ /each }
							</div>
							{ /if }<!-- /stickerAddModalTabsInit[1] -->
						</div>
						<!-- /tab: Packs -->

						<!-- tab: Import -->
						<div class="tab-content has-scroll-y import" style="{ activeTab === 2 ? '' : 'display: none;' }">
							<div class="section line-proxy">
								<p class="section-title">LINE Store Proxy</p>
								<p>If you are looking for stickers pack that are not provided by Magane, you can go to the <a href="https://store.line.me/" target="_blank">LINE Store</a>, pick whichever packs you want, then paste their full URLs in the box below (separated by new lines).</p>
								<p>e.g. https://store.line.me/stickershop/product/17573/ja</p>
								<p class="input-grouped">
									<textarea
										bind:value={ linePackSearch }
										autocomplete="off"
										class="inputQuery"
										placeholder="LINE Sticker Pack URLs" />
									<button class="button is-primary"
										on:click="{ () => parseLinePack() }">Add</button>
								</p>
							</div>
							<div class="section remote-packs">
								<p class="section-title">Remote Packs</p>
								<p>You can paste URLs to JSON config files of remote packs in here (separated by new lines).<br>
									This also supports public album links of any file hosting websites running <a href="https://github.com/WeebDev/chibisafe" target="_blank">Chibisafe</a>.</p>
								<p>e.g. https://example.com/packs/my_custom_pack.json<br>
									https://chibisafe.moe/a/my_album</p>
								<p class="input-grouped">
									<textarea
										bind:value={ remotePackUrl }
										autocomplete="off"
										class="inputQuery"
										placeholder="Remote Pack JSON or Chibisafe Album URLs" />
									<button class="button is-primary"
										on:click="{ () => parseRemotePackUrl() }">Add</button>
								</p>
								<p>
									<input
										id="localRemotePackInput"
										type="file"
										multiple
										style="display: none"
										accept="application/JSON"
										on:click="{ event => event.stopPropagation() }"
										on:change="{ onLocalRemotePackChange }" />
									<button class="button has-width-full"
										on:click="{ () => loadLocalRemotePack() }">Load local JSON files</button>
								</p>
								<p>
									<button class="button is-primary has-width-full"
										on:click="{ () => bulkUpdateRemotePacks() }">Update all remote packs</button>
								</p>
							</div>
						</div>
						<!-- /tab: Import -->

						<!-- tab: Misc -->
						<div class="tab-content has-scroll-y misc" style="{ activeTab === 3 ? '' : 'display: none;' }">
							<div class="section checkupdate">
								<p>
									<button class="button has-width-full"
										on:click="{ () => checkUpdate(true) }">Check for updates</button>
								</p>
							</div>
							<div class="section settings" on:change="{ onSettingsChange }">
								<p class="section-title">Settings</p>
								<p>
									<label>
										<input
											name="disableUpdateCheck"
											type="checkbox"
											bind:checked={ settings.disableUpdateCheck } />
										Disable automatically checking for updates on launch
									</label>
								</p>
								<p>
									<label>
										<input
											name="enableWindowMagane"
											type="checkbox"
											bind:checked={ settings.enableWindowMagane } />
										Enable <code>window.magane</code> development utility
									</label>
								</p>
								<p>
									<label>
										<input
											name="disableToasts"
											type="checkbox"
											bind:checked={ settings.disableToasts } />
										Disable Toasts
									</label>
								</p>
								<p>
									<label>
										<input
											name="closeWindowOnSend"
											type="checkbox"
											bind:checked={ settings.closeWindowOnSend } />
										Close window when sending a sticker
									</label>
								</p>
								<p>
									<label>
										<input
											name="useLeftToolbar"
											type="checkbox"
											bind:checked={ settings.useLeftToolbar } />
										Use left toolbar instead of bottom toolbar on main window
									</label>
								</p>
								<p>
									<label>
										<input
											name="showPackAppendix"
											type="checkbox"
											bind:checked={ settings.showPackAppendix } />
										Show pack's appendix in packs list (e.g. its numerical ID)
									</label>
								</p>
								<p>
									<label>
										<input
											name="disableDownscale"
											type="checkbox"
											bind:checked={ settings.disableDownscale } />
										Disable downscaling of imported LINE packs using <code>wsrv.nl</code> (this service is known to be blocked by Discord if sending as links)
									</label>
								</p>
								<p>
									<label>
										<input
											name="disableUploadObfuscation"
											type="checkbox"
											bind:checked={ settings.disableUploadObfuscation } />
										Disable obfuscation of files names for uploaded stickers
									</label>
								</p>
								<p>
									<label>
										<input
											name="alwaysSendAsLink"
											type="checkbox"
											bind:checked={ settings.alwaysSendAsLink } />
										Always send stickers as links instead of uploads
									</label>
								</p>
								<p>
									<label>
										<input
											name="maskStickerLink"
											type="checkbox"
											bind:checked={ settings.maskStickerLink } />
										Mask sticker links with <code>[sticker](url)</code> Markdown
									</label>
								</p>
								<p>
									<label>
										<input
											name="ctrlInvertSendBehavior"
											type="checkbox"
											bind:checked={ settings.ctrlInvertSendBehavior } />
										Allow inverting send behavior if holding Ctrl when sending stickers (if always send as links is enabled, holding Ctrl when sending will instead send as uploads, and vice versa)
									</label>
								</p>
								<p>
									<label>
										<input
											name="ignoreEmbedLinksPermission"
											type="checkbox"
											bind:checked={ settings.ignoreEmbedLinksPermission } />
										Ignore missing embed links permission
									</label>
								</p>
								<p>
									<label>
										<input
											name="markAsSpoiler"
											type="checkbox"
											bind:checked={ settings.markAsSpoiler } />
										Mark as spoiler when sending stickers as uploads
									</label>
								</p>
								<p>
									<label>
										<input
											name="ignoreViewportSize"
											type="checkbox"
											bind:checked={ settings.ignoreViewportSize } />
										Do not warn if viewport height is insufficient
									</label>
								</p>
								<p>
									<label>
										<input
											name="disableSendingWithChatInput"
											type="checkbox"
											bind:checked={ settings.disableSendingWithChatInput } />
										Do not include chat input when sending stickers as links
									</label>
								</p>
							</div>
							<div class="section frequently-used">
								<p class="section-title">Frequently Used</p>
								<p>
									Maximum amount of the most frequently used stickers to list on Frequently Used section.
								</p>
								<p>
									Set to <code>0</code> to completely disable the section and stickers usage counter.
								</p>
								<p class="input-grouped">
									<input
										bind:value={ frequentlyUsedInput }
										class="inputQuery supress-magane-hotkey"
										type="text" />
									<button class="button is-primary"
										on:click="{ () => parseFrequentlyUsedInput() }">Set</button>
								</p>
							</div>
							<div class="section hotkey">
								<p class="section-title">Hotkey</p>
								<p>
									<a href="https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values" target="_blank">See a full list of key values.</a>
								</p>
								<p>
									Ignore notes that will not affect Chromium. Additionally, this may not have full support for everything in the documentation above, but this does support some degree of combinations of modifier keys (<code>Ctrl</code>, <code>Alt</code>, etc.) + other keys.
								</p>
								<p>
									e.g. <code>M</code>, <code>Ctrl+Q</code>, <code>Alt+Shift+Y</code>
								</p>
								<p class="input-grouped">
									<input
										bind:value={ hotkeyInput }
										class="inputQuery supress-magane-hotkey"
										type="text" />
									<button class="button is-primary"
										on:click="{ () => parseThenInitHotkey(true) }">Set</button>
								</p>
							</div>
							<div class="section database">
								<p class="section-title">Database</p>
								<p>
									<input
										id="replaceDatabaseInput"
										type="file"
										style="display: none"
										accept="application/JSON"
										on:click="{ event => event.stopPropagation() }"
										on:change="{ onReplaceDatabaseChange }" />
									<button class="button is-danger has-width-full"
										on:click="{ () => replaceDatabase() }">Replace Database</button>
								</p>
								<p>
									<button class="button is-primary has-width-full"
										on:click="{ () => exportDatabase() }">Export Database</button>
								</p>
							</div>
						</div>
						<!-- /tab: Misc -->
					</div>
				</div>
			</div>
		</div>

	</div>
</main>
