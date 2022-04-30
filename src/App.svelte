<script>
	/* global BdApi */
	import { onMount } from 'svelte';

	// Let's make the scrollbars pretty
	import SimpleBar from '@jbfulgencio/svelte-simplebar';
	import * as animateScroll from 'svelte-scrollto';
	import './styles/global.css';
	import './styles/main.scss';

	// APIs
	window.magane = {};
	const modules = {};

	const elementToCheck = '[class^=channelTextArea] [class^=buttons]';
	const coords = { top: 0, left: 0 };
	const selectorTextArea = '[class^=channelTextArea-]';
	const selectorStickerWindowScroller = '#magane .stickers .simplebar-content-wrapper';
	let textArea = document.querySelector(selectorTextArea);
	let showIcon = true;
	let isThereTopBar = null;

	let baseURL = '';
	let stickerWindowActive = false;
	let stickerAddModalActive = false;
	const stickerAddModalTabsInit = {};
	let activeTab = null;
	let favoriteStickers = [];
	const favoriteStickersData = {};
	let availablePacks = [];
	let subscribedPacks = [];
	let subscribedPacksSimple = [];
	let filteredPacks = [];
	const localPackIdRegex = /^(startswith|emojis|custom)-/;
	const localPacks = {};
	let linePackSearch = null;
	let onCooldown = false;
	let storage = null;
	let packsSearch = null;
	let resizeObserver;

	const settings = {
		disableToasts: false,
		closeWindowOnSend: false,
		disableDownscale: false,
		useLeftToolbar: false
	};

	// NOTE: For the time being only used to limit keys in replace/export database functions
	const allowedStorageKeys = [
		'magane.available',
		'magane.subscribed',
		'magane.favorites',
		'magane.settings'
	];

	const log = (message, type = 'log') =>
		console[type]('%c[Magane]%c', 'color: #3a71c1; font-weight: 700', '', message);

	const toast = (message, options = {}) => {
		if (!options.nolog || settings.disableToasts) {
			const type = ['log', 'info', 'warn', 'error'].includes(options.type) ? options.type : 'log';
			log(message, type);
		}
		if (!settings.disableToasts) {
			BdApi.showToast(message, options);
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

	const keepMaganeInPlace = () => {
		setTimeout(() => {
			const el = document.querySelector(elementToCheck);
			if (!el) {
				if (showIcon) showIcon = false;
				return;
			}
			if (!showIcon) showIcon = true;
			const props = el.getBoundingClientRect();
			coords.top = (isThereTopBar ? props.top - 21 : props.top) + 1;
			coords.left = props.left - 108;
		}, 0);
	};

	const waitForTextArea = () => {
		let pollForTextArea;
		return new Promise(resolve => {
			(pollForTextArea = () => {
				textArea = document.querySelector(selectorTextArea);
				if (textArea) return resolve();
				setTimeout(pollForTextArea, 500);
			})();
		});
	};

	const positionMagane = async entries => {
		for (const entry of entries) {
			if (!entry.contentRect) return;
			keepMaganeInPlace();
			if (entry.contentRect.width || entry.contentRect.height) return;

			resizeObserver.unobserve(textArea);
			await waitForTextArea();
			resizeObserver.observe(textArea);
			keepMaganeInPlace();
		}
	};

	const initModules = () => {
		// Channel store & actions
		modules.channelStore = BdApi.findModuleByProps('getChannel', 'getDMFromUserId');
		modules.selectedChannelStore = BdApi.findModuleByProps('getLastSelectedChannelId');

		// User store
		modules.userStore = BdApi.findModuleByProps('getCurrentUser', 'getUser');

		// Discord objects & utils
		modules.discordConstants = BdApi.findModuleByProps('Permissions', 'ActivityTypes', 'StatusTypes');
		modules.discordPermissions = modules.discordConstants.Permissions;
		modules.permissionRoleUtils = BdApi.findModuleByProps('can', 'ALLOW', 'DENY');
		modules.computePermissions = BdApi.findModuleByProps('computePermissions');

		// Misc
		modules.messageUpload = BdApi.findModuleByProps('upload', 'instantBatchUpload');
		modules.richUtils = BdApi.findModuleByProps('toRichValue', 'createEmptyState');
	};

	const getLocalStorage = () => {
		const localStorageIframe = document.createElement('iframe');
		localStorageIframe.id = 'localStorageIframe';
		storage = document.body.appendChild(localStorageIframe).contentWindow.frames.localStorage;
	};

	const saveToLocalStorage = (key, payload) => {
		storage.setItem(key, JSON.stringify(payload));
	};

	const loadSettings = () => {
		const storedSettings = storage.getItem('magane.settings');
		if (storedSettings) {
			try {
				const parsed = JSON.parse(storedSettings);

				// Only use keys that were explicitly defined in settings var
				for (const key of Object.keys(settings)) {
					if (typeof parsed[key] !== 'undefined' && parsed[key] !== null) {
						settings[key] = parsed[key];
					}
				}
			} catch (ex) {
				console.error(ex);
				// Do nothing
			}
		}
	};

	const grabPacks = async () => {
		const response = await fetch('https://magane.moe/api/packs');
		const packs = await response.json();
		baseURL = packs.baseURL;

		// Load local packs first to have them always before built-in packs
		const storedLocalPacks = storage.getItem('magane.available');
		if (storedLocalPacks) {
			try {
				const availLocalPacks = JSON.parse(storedLocalPacks);

				// This logic is necessary since the old data, prior to the new master rebase,
				// would also store remote built-in packs in local storage (no idea why).
				const filteredLocalPacks = availLocalPacks.filter(pack =>
					typeof pack === 'object' &&
					typeof pack.id !== 'undefined' &&
					localPackIdRegex.test(pack.id));
				if (availLocalPacks.length !== filteredLocalPacks.length) {
					saveToLocalStorage('magane.available', filteredLocalPacks);
				}

				// Store local packs data in an ID-indexed Object for faster get's in formatURL()
				filteredLocalPacks.forEach(pack => {
					localPacks[pack.id] = pack;
				});
				availablePacks.push(...filteredLocalPacks);
			} catch (ex) {
				console.error(ex);
				// Do nothing
			}
		}

		availablePacks.push(...packs.packs);
		availablePacks = availablePacks;
		filteredPacks = availablePacks;

		const subbedPacks = storage.getItem('magane.subscribed');
		if (subbedPacks) {
			try {
				subscribedPacks = JSON.parse(subbedPacks);
				for (const subbedPacks of subscribedPacks) {
					subscribedPacksSimple.push(subbedPacks.id);
				}
				// Prioritize data of subscribed packs
				subscribedPacks.forEach(pack => {
					if (localPackIdRegex.test(pack.id)) {
						localPacks[pack.id] = pack;
					}
				});
			} catch (ex) {
				console.error(ex);
				// Do nothing
			}
		}

		const favStickers = storage.getItem('magane.favorites');
		if (favStickers) {
			try {
				favoriteStickers = JSON.parse(favStickers)
					.filter(sticker => {
						if (favoriteStickersData[sticker.pack])	{
							return true;
						}
						const index = availablePacks.findIndex(pack => pack.id === sticker.pack);
						if (index !== -1) {
							// Simple caching of pack names, for tooltips
							favoriteStickersData[sticker.pack] = {
								name: availablePacks[index].name
							};
							return true;
						}
					});
			} catch (ex) {
				console.error(ex);
				// Do nothing
			}
		}
	};

	const subscribeToPack = pack => {
		if (subscribedPacks.findIndex(p => p.id === pack.id) !== -1) return;
		subscribedPacks = [...subscribedPacks, pack];
		subscribedPacksSimple = [...subscribedPacksSimple, pack.id];

		saveToLocalStorage('magane.subscribed', subscribedPacks);
		log(`Subscribed to pack > ${pack.name}`);
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

				log(`Unsubscribed from pack > ${pack.name}`);
				saveToLocalStorage('magane.subscribed', subscribedPacks);
				return;
			}
		}
	};

	const formatUrl = (pack, id, sending, thumbIndex) => {
		let url;
		if (typeof pack === 'number') {
			// Magane's built-in packs
			url = `${baseURL}${pack}/${id}`;
			if (!sending) {
				url = url.replace(/\.(gif|png)$/i, '_key.$1');
			}
		} else if (pack.startsWith('startswith-')) {
			// LINE Store packs
			// 292p: https://stickershop.line-scdn.net/stickershop/v1/sticker/%id%/iPhone/sticker@2x.png;compress=true
			// 219p: https://stickershop.line-scdn.net/stickershop/v1/sticker/%id%/android/sticker.png;compress=true
			// 146p: https://stickershop.line-scdn.net/stickershop/v1/sticker/%id%/iPhone/sticker.png;compress=true
			// WARNING: Early packs (can confirm with packs that have their sticker IDs at 4 digits),
			// do not have iPhone variants, so we will stick with Android variant, which is always available.
			// Downsizing with images.weserv.nl to stay consistent with Magane's built-in packs
			const template = 'https://stickershop.line-scdn.net/stickershop/v1/sticker/%id%/android/sticker.png;compress=true';
			url = template.replace(/%id%/g, id.split('.')[0]);
			let append = sending ? '&h=180p' : '&h=100p';
			if (localPacks[pack].animated) {
				url = url.replace(/sticker(@2x)?\.png/, 'sticker_animation$1.png');
				// In case one day images.weserv.nl starts properly supporting APNGs -> GIFs
				append += '&output=gif';
			}
			if (!settings.disableDownscale) {
				url = `https://images.weserv.nl/?url=${encodeURIComponent(url)}${append}`;
			}
		} else if (pack.startsWith('emojis-')) {
			// LINE Store emojis
			// 220p: https://stickershop.line-scdn.net/sticonshop/v1/sticon/%pack%/iPhone/%id%.png
			// 154p: https://stickershop.line-scdn.net/sticonshop/v1/sticon/%pack%/android/%id%.png
			// WARNING: Stickers may actually have missing iPhone variants, so to be safe we will just use
			// Android variant for emojis too. Plus, it probably makes more sense to have emojis smaller
			// anyway (Android variant of emojis only go up to 154p).
			// Downsizing with images.weserv.nl to stay consistent with Magane's built-in packs
			const template = 'https://stickershop.line-scdn.net/sticonshop/v1/sticon/%pack%/android/%id%.png';
			url = template.replace(/%pack%/g, pack.split('-')[1]).replace(/%id%/g, id.split('.')[0]);
			const append = sending ? '' : '&h=100p';
			if (!settings.disableDownscale) {
				url = `https://images.weserv.nl/?url=${encodeURIComponent(url)}${append}`;
			}
		} else if (pack.startsWith('custom-')) {
			// Unified imported custom packs
			if (!sending && Array.isArray(localPacks[pack].thumbs)) {
				if (typeof thumbIndex !== 'number') {
					// thumbIndex is not available for favorites, so do some work out
					thumbIndex = localPacks[pack].files.findIndex(file => file === id);
				}
				url = thumbIndex >= 0 && localPacks[pack].thumbs[thumbIndex];
				if (!url) {
					// Page emoji for missing thumbs
					url = '/assets/eedd4bd948a0da6d75bf5304bff4e17f.svg';
				}
			} else if (typeof localPacks[pack].template === 'string') {
				const template = localPacks[pack].template;
				url = template.replace(/%pack%/g, pack.split('-')[1]).replace(/%id%/g, id);
			} else {
				url = id;
			}
		}
		return url;
	};

	const getTextAreaInstance = () => {
		let cursor = textArea[Object.keys(textArea).find(key =>
			key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'))];
		if (!cursor) return null;
		while (
			!(
				cursor.stateNode &&
				cursor.stateNode.constructor &&
				cursor.stateNode.constructor.displayName ===
					'ChannelTextAreaForm'
			)
		) {
			cursor = cursor.return;
		}
		return cursor;
	};

	const hasPermissions = (permissions, user, context) => {
		if (!user) return false;
		// Always true in non-guild channels (e.g. DMs)
		if (!permissions || !context.guild_id) return true;
		permissions = Array.isArray(permissions) ? permissions : [permissions];
		for (const permission of permissions) {
			// Fallback of the old method as it appeared to be a rolling update
			if (!modules.permissionRoleUtils.can({ permission, user, context }) &&
				!modules.computePermissions.can(permission, user, context)) {
				return false;
			}
		}
		return true;
	};

	const sendSticker = async (pack, id) => {
		if (onCooldown) {
			return toastWarn('Sending sticker is still on cooldown\u2026', { timeout: 1000 });
		}

		onCooldown = true;

		try {
			const userId = modules.userStore.getCurrentUser().id;
			const channelId = modules.selectedChannelStore.getChannelId();
			const channel = modules.channelStore.getChannel(channelId);
			if (!hasPermissions([
				modules.discordPermissions.ATTACH_FILES,
				modules.discordPermissions.SEND_MESSAGES
			], userId, channel)) {
				onCooldown = false;
				return toastError('You do not have permission to attach files in this channel.');
			}

			toast('Sending\u2026', { nolog: true });
			if (settings.closeWindowOnSend) {
				// eslint-disable-next-line no-use-before-define
				toggleStickerWindow(false);
			}

			const url = formatUrl(pack, id, true);
			log(`Fetching sticker from remote: ${url}`);
			const response = await fetch(url, { cache: 'force-cache' });
			const myBlob = await response.arrayBuffer();

			let filename = id;
			if (typeof pack === 'string') {
				if (pack.startsWith('startswith-') && localPacks[pack].animated) {
					filename = filename.replace(/\.png$/i, '.gif');
					toastWarn('Animated stickers from LINE Store currently cannot be animated.');
				} else if (pack.startsWith('custom-')) {
					// Obfuscate file name of stickers from custom packs
					filename = `${Date.now().toString()}.${id.split('.')[1]}`;
				}
			}

			// NOTE: Buffer is Node API, but it is perfectly usable in Discord-context (Electron thing?)
			const file = new File([Buffer.from(myBlob)], filename);

			log(`Sending\u2026`);

			let messageContent = '';
			const textAreaInstance = getTextAreaInstance();
			if (textAreaInstance) {
				messageContent = textAreaInstance.stateNode.state.textValue;
			} else {
				log('Unable to fetch text area of chat input, attempting workaround\u2026', 'warn');
				let element = textArea.querySelector('span');
				if (!element) element = textArea;
				messageContent = element.innerText;
			}

			modules.messageUpload.upload({
				channelId,
				file,
				message: {
					content: messageContent
				}
			});

			// Clear chat input (if it was filled, the content would have been sent alongside the sticker)
			if (textAreaInstance) {
				textAreaInstance.stateNode.setState({
					textValue: '',
					richValue: modules.richUtils.toRichValue('')
				});
			}
		} catch (error) {
			console.error(error);
			toastError('Unexpected error occurred when sending sticker. Check your console for details.');
		}

		onCooldown = false;
	};

	const favoriteSticker = (pack, id) => {
		const index = favoriteStickers.findIndex(f => f.pack === pack && f.id === id);
		if (index !== -1) return;

		if (!favoriteStickersData[pack]) {
			const data = subscribedPacks.find(p => p.id === pack);
			if (data) {
				favoriteStickersData[pack] = {
					name: data.name
				};
			}
		}

		const favorite = { pack, id };
		favoriteStickers = [...favoriteStickers, favorite];
		saveToLocalStorage('magane.favorites', favoriteStickers);
		log(`Favorited sticker > ${id} of pack ${pack}`);
		toastSuccess('Favorited!', { nolog: true });
	};

	const unfavoriteSticker = (pack, id) => {
		const index = favoriteStickers.findIndex(f => f.pack === pack && f.id === id);
		if (index === -1) return;

		favoriteStickers.splice(index, 1);
		favoriteStickers = favoriteStickers;

		if (!favoriteStickers.some(s => s.pack === pack)) {
			delete favoriteStickersData[pack];
		}

		saveToLocalStorage('magane.favorites', favoriteStickers);
		log(`Unfavorited sticker > ${id} of pack ${pack}`);
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

	const _appendPack = (id, e) => {
		if (!e.count || !e.files.length) {
			throw new Error('Invalid stickers count.');
		}

		let availLocalPacks = [];
		const storedLocalPacks = storage.getItem('magane.available');
		if (storedLocalPacks) {
			availLocalPacks = JSON.parse(storedLocalPacks);
			if (availLocalPacks) {
				const index = availLocalPacks.findIndex(p => p.id === id);
				if (index >= 0) {
					throw new Error(`Pack with ID ${id} already exist`);
				}
			}
		}

		if (localPackIdRegex.test(id)) {
			localPacks[id] = e;
		}

		availLocalPacks.unshift(e);
		saveToLocalStorage('magane.available', availLocalPacks);

		availablePacks.unshift(e);
		availablePacks = availablePacks;
		filterPacks();

		log(`Added a new pack with ID ${id}`);
		return e;
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
		if (storage.getItem('magane.alreadySentAnalyticsPacksOnce')) return;
		let data = subscribedPacks.map(pack => pack.id);
		try {
			await analyticsSubscribePack(data);
			storage.setItem('magane.alreadySentAnalyticsPacksOnce', true);
		} catch (err) {
			toastError('Unexpected error. Check your console for details.');
		}
	};
	*/

	const migrateStringPackIds = async () => {
		let dirty = false;
		const favorites = JSON.parse(storage.getItem('magane.favorites'));
		const subscribed = JSON.parse(storage.getItem('magane.subscribed'));

		favorites.forEach(item => {
			if (typeof item.pack === 'number') return;
			const result = parseInt(item.pack, 10);
			if (isNaN(item.pack)) return;
			item.pack = result;
			dirty = true;
		});

		subscribed.forEach(item => {
			if (typeof item.id === 'number') return;
			const result = parseInt(item.id, 10);
			if (isNaN(item.id)) return;
			item.id = result;
			dirty = true;
		});

		if (dirty) {
			toastInfo('Found packs/stickers to migrate, migrating now...');
			storage.setItem('magane.favorites', JSON.stringify(favorites));
			storage.setItem('magane.subscribed', JSON.stringify(subscribed));
			await grabPacks();
			toastSuccess('Migration successful.');
		}
	};

	const parseFunctionArgs = (args, argNames, minArgs) => {
		// Allow calling window.magane.X functions with
		// func(val1, val2, ..., valN) for backwards-compatibility, and
		// func({arg1: val, arg2: val, ..., argN: val}) for a clean expandable future.
		const isFirstArgAnObj = typeof args[0] === 'object';
		if (!isFirstArgAnObj && typeof minArgs === 'number' && args.length < minArgs) {
			throw new Error(`This function expects at least ${minArgs} parameter(s).`);
		}
		const parsed = {};
		for (let i = 0; i < argNames.length; i++) {
			parsed[argNames[i]] = isFirstArgAnObj ? args[0][argNames[i]] : args[i];
		}
		return parsed;
	};

	window.magane.appendPack = (...args) => {
		let { name, firstid, count, animated } = parseFunctionArgs(args,
			['name', 'firstid', 'count', 'animated'], 4);

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

	window.magane.appendEmojisPack = (...args) => {
		let { name, id, count } = parseFunctionArgs(args,
			['name', 'id', 'count'], 3);

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
			files
		});
	};

	window.magane.appendCustomPack = (...args) => {
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

	window.magane.appendSafePack = async (...args) => {
		// Only compatible with public albums of safes running WeebDev/chibisafe or
		// BobbyWibowo/lolisafe (this have chibisafe-alike /api/album/:id)
		let { url, id, name } = parseFunctionArgs(args,
			['url', 'id', 'name'], 1);

		const match = url.match(/^(.+:\/\/)?(.+)\/a\/([^/\s]+)/);
		if (!match || match.some(m => m === undefined)) {
			throw new Error('Unsupported album URL.');
		}

		const apiUrl = `${match[1]}${match[2]}/api/album/${match[3]}`;
		log(`Fetching album info from: ${apiUrl}`);
		const response = await fetch(apiUrl, { cache: 'no-cache' });
		const album = await response.json();
		if (!album) {
			throw new Error('Unable to parse album data.');
		}

		let files;
		let thumbs;
		if (!Array.isArray(album.files) || !album.files.length) {
			throw new Error('Specified album have no files.');
		} else {
			files = album.files.map(file => file.url);
			if (album.files.some(file => file.thumb)) {
				thumbs = album.files.map(file => file.thumb);
			}
		}

		name = name || album.name;
		if (!name) {
			throw new Error('Specified album do not have a name, please provide a custom one.');
		}

		const mid = id ? `custom-${id}` : `custom-${match[2]}-${match[3]}`;
		return _appendPack(mid, {
			name,
			count: files.length,
			id: mid,
			files,
			thumbs,
			url
		});
	};

	window.magane.deletePack = id => {
		if (!id && !localPackIdRegex.test(id)) {
			throw new Error('Pack ID must start with either "startswith-", "emojis-", or "custom-".');
		}

		const storedLocalPacks = storage.getItem('magane.available');
		if (storedLocalPacks) {
			try { // eslint-disable-line no-useless-catch
				const availLocalPacks = JSON.parse(storedLocalPacks);
				const index = availLocalPacks.findIndex(p => p.id === id);
				if (index === -1) {
					throw new Error(`Unable to find pack with ID ${id}`);
				}

				// Force unfavorite stickers
				const favedStickers = favoriteStickers.filter(s => s.pack === id);
				if (favedStickers.length) {
					favedStickers.forEach(s => unfavoriteSticker(id, s.id));
				}

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

				log(`Removed pack with ID ${id} (old index: ${index})`);
				return true;
			} catch (ex) {
				throw ex;
			}
		}
	};

	window.magane.searchPacks = keyword => {
		if (!keyword) {
			throw new Error('Keyword required');
		}

		keyword = keyword.toLowerCase();
		const storedLocalPacks = storage.getItem('magane.available');
		if (storedLocalPacks) {
			try { // eslint-disable-line no-useless-catch
				const availLocalPacks = JSON.parse(storedLocalPacks);
				return availLocalPacks.filter(p =>
					p.name.toLowerCase().indexOf(keyword) >= 0 || p.id.indexOf(keyword) >= 0);
			} catch (ex) {
				throw ex;
			}
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
				tmp = `Custom ${id.replace('custom-', '')}`;
			}
		}
		return `<span class="appendix"><span>–</span><span title="ID: ${id}">${tmp}</span></span>`;
	};

	onMount(async () => {
		log('Mounted on DOM');
		try {
			initModules();
			getLocalStorage();
			loadSettings();
			await grabPacks();
			resizeObserver = new ResizeObserver(positionMagane);
			await waitForTextArea();
			resizeObserver.observe(textArea);
			isThereTopBar = document.querySelector('html.platform-win');
			keepMaganeInPlace();
			toastSuccess('Magane is now ready!');
			// sendSubscribedPacksOnce();
			migrateStringPackIds();
		} catch (error) {
			console.error(error);
			toastError('Unexpected error occurred when initializing Magane. Check your console for details.');
		}
	});

	const maganeBlurHandler = e => {
		const stickerWindow = document.querySelector('#magane .stickerWindow');
		if (stickerWindow) {
			const { x, y, width, height } = stickerWindow.getBoundingClientRect();
			const maganeButton = document.querySelector('#magane .magane-button');
			if (
				!(e.target === maganeButton || e.target.parentNode === maganeButton) &&
				!((e.clientX <= x + width && e.clientX >= x) &&
				(e.clientY <= y + height && e.clientY >= y))
			) {
				// eslint-disable-next-line no-use-before-define
				toggleStickerWindow();
			}
		}
	};

	const toggleStickerWindow = forceState => {
		const active = typeof forceState === 'undefined' ? !stickerWindowActive : forceState;
		if (active) {
			document.addEventListener('click', maganeBlurHandler);
		} else {
			document.removeEventListener('click', maganeBlurHandler);
		}
		stickerWindowActive = active;
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
			container: document.querySelector(selectorStickerWindowScroller)
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
		if (!localPackIdRegex.test(packId)) packId = Number(packId);

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
				linePackSearch = null;
				stored = window.magane.appendEmojisPack(props.title, props.id, props.len);
			} else {
				// LINE Stickers work with either its full URL or just its ID
				const id = Number(match[4]);
				if (isNaN(id) || id < 0) return toastError('Unsupported LINE Stickers ID.');
				const response = await fetch(`https://magane.moe/api/proxy/sticker/${id}`);
				const props = await response.json();
				linePackSearch = null;
				stored = window.magane.appendPack(props.title, props.first, props.len, props.hasAnimation);
			}
			toastSuccess(`Added a new pack ${stored.name}.`, { nolog: true, timeout: 6000 });
		} catch (error) {
			console.error(error);
			toastError('Unexpected error occurred. Check your console for details.');
		}
	};

	const onSettingsChange = event => {
		const { name } = event.target;
		if (!name) return false;

		// Value already changed via Svelte's bind:value
		log(`settings['${name}'] = ${settings[name]}`);

		saveToLocalStorage('magane.settings', settings);
		toastSuccess('Settings saved!', { nolog: true });
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
			BdApi.showConfirmationModal(
				'Replace Database',
				content.replace(/\n/g, '\n\n'), // Markdown, so we do double \n for new line
				{
					confirmText: 'Replace',
					cancelText: 'Cancel',
					danger: true,
					onConfirm: () => {
						for (const key of valid) {
							saveToLocalStorage(key, result[key]);
						}
						for (const key of invalid) {
							storage.removeItem(key);
						}
						BdApi.showConfirmationModal(
							'Reload Now',
							'Please reload Discord immediately (Ctrl + R) to complete Magane database replacement.',
							{
								cancelText: 'Later',
								onConfirm: () => window.location.reload()
							}
						);
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
				const data = storage.getItem(key);
				if (data !== null) {
					database[key] = JSON.parse(data);
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

<main>
	<div id="magane"
		style="top: { `${coords.top}px` }; left: { `${coords.left}px` }; display: { showIcon ? 'flex' : 'none' };">
		<div class="magane-button channel-textarea-emoji channel-textarea-stickers"
			class:active="{ stickerWindowActive }"
			on:click="{ () => toggleStickerWindow() }"
			on:contextmenu|stopPropagation|preventDefault="{ () => grabPacks() }">
			<img class="channel-textarea-stickers-content" src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20width%3D%2224%22%20height%3D%2224%22%20preserveAspectRatio%3D%22xMidYMid%20meet%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M18.5%2011c-4.136%200-7.5%203.364-7.5%207.5c0%20.871.157%201.704.432%202.482l9.551-9.551A7.462%207.462%200%200%200%2018.5%2011z%22%20fill%3D%22%23b9bbbe%22%2F%3E%3Cpath%20d%3D%22M12%202C6.486%202%202%206.486%202%2012c0%204.583%203.158%208.585%207.563%209.69A9.431%209.431%200%200%201%209%2018.5C9%2013.262%2013.262%209%2018.5%209c1.12%200%202.191.205%203.19.563C20.585%205.158%2016.583%202%2012%202z%22%20fill%3D%22%23b9bbbe%22%2F%3E%3C%2Fsvg%3E" alt="Magane menu button">
		</div>

		<div class="stickerWindow" style="{ stickerWindowActive ? '' : 'display: none;' }">
			<SimpleBar class="stickers { settings.useLeftToolbar ? 'has-left-toolbar' : '' }" style="">
				{ #if !favoriteStickers && !subscribedPacks }
				<h3 class="getStarted">It seems you aren't subscribed to any pack yet. Click the plus symbol on the bottom-left to get started! 🎉</h3>
				{ /if }
				{ #if favoriteStickers && favoriteStickers.length }
				<div class="pack">
					<span id="pfavorites">Favorites{ @html formatStickersCount(favoriteStickers.length) }</span>
					{ #each favoriteStickers as sticker, i }
					<div class="sticker">
						<img
							class="image"
							src="{ `${formatUrl(sticker.pack, sticker.id)}` }"
							alt="{ sticker.pack } - { sticker.id }"
							title="{
								(favoriteStickersData[sticker.pack] ? favoriteStickersData[sticker.pack].name : 'N/A') +
								(typeof sticker.pack === 'string' && sticker.pack.startsWith('custom-') ? ` – ${sticker.id}` : '')
							}"
							on:click="{ () => sendSticker(sticker.pack, sticker.id) }"
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

				{ #each subscribedPacks as pack, i }
				<div class="pack">
					<span id="p{pack.id}">{ pack.name }{ @html formatStickersCount(pack.files.length) }</span>

					{ #each pack.files as sticker, i }
					<div class="sticker">
						<img
							class="image"
							src="{ `${formatUrl(pack.id, sticker, false, i)}` }"
							alt="{ pack.id } - { sticker }"
							title="{ typeof pack.id === 'string' && pack.id.startsWith('custom-') ? sticker : '' }"
							on:click="{ () => sendSticker(pack.id, sticker) }"
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
			</SimpleBar>

			<div class="packs-toolbar { settings.useLeftToolbar ? 'left-toolbar' : 'bottom-toolbar' }">
				<div class="packs packs-controls">
					<div class="packs-wrapper">
						<div class="pack"
							on:click="{ () => toggleStickerModal() }"
							title="Manage subscribed packs" >
							<div class="icon-plus" />
						</div>
						{ #if favoriteSticker && favoriteSticker.length }
						<div class="pack"
							on:click={ () => scrollToStickers('#pfavorites') }
							title="Favorites" >
							<div class="icon-favorite" />
						</div>
						{ /if }
					</div>
				</div>

				<SimpleBar class="packs" style="">
					<div class="packs-wrapper">
						{ #each subscribedPacks as pack, i }
						<div class="pack"
							on:click={ () => scrollToStickers(`#p${pack.id}`) }
							title="{ pack.name }"
							style="background-image: { `url(${formatUrl(pack.id, pack.files[0], false, 0)})` }" />
						{ /each }
					</div>
				</SimpleBar>
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
								LINE
							</div>
							<div class="tab"
								on:click="{ () => activateTab(3) }"
								class:is-active="{ activeTab === 3 }">
								Misc
							</div>
						</div>

						<!-- tab: Installed -->
						{ #if stickerAddModalTabsInit[0] }
						<SimpleBar class="tab-content" style="{ activeTab === 0 ? '' : 'display: none;' }">
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
									<span>{ pack.name }</span>
									<span>{ pack.count } stickers{ @html formatPackAppendix(pack.id) }</span>
								</div>
								<div class="action">
									<button class="button is-danger"
										on:click="{ () => unsubscribeToPack(pack) }">Del</button>
								</div>
							</div>
							{ /each }
						</SimpleBar>
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
							<SimpleBar class="tab-content" style="">
								{ #each filteredPacks as pack }
								<div class="pack">
									<div class="preview"
										style="background-image: { `url(${formatUrl(pack.id, pack.files[0], false, 0)})` }" />
									<div class="info">
										<span>{ pack.name }</span>
										<span>{ pack.count } stickers{ @html formatPackAppendix(pack.id) }</span>
									</div>
									<div class="action">
										{ #if subscribedPacksSimple.includes(pack.id) }
										<button class="button is-danger"
											on:click="{ () => unsubscribeToPack(pack) }">Del</button>
										{ :else }
										<button class="button is-primary"
											on:click="{ () => subscribeToPack(pack) }">Add</button>
										{ /if }
										{ #if localPacks[pack.id] }
										<button class="button deletePack"
											on:click="{ () => window.magane.deletePack(pack.id) }"></button>
										{ /if }
									</div>
								</div>
								{ /each }
							</SimpleBar>
							{ /if }<!-- /stickerAddModalTabsInit[1] -->
						</div>
						<!-- /tab: Packs -->

						<!-- tab: LINE -->
						<div class="tab-content line-proxy" style="{ activeTab === 2 ? '' : 'display: none;' }">
							<p>If you are looking for a sticker pack that is not provided by Magane, you can go to the LINE Store and pick whatever pack you want and paste the full URL in the box below. <br><br>For example: https://store.line.me/stickershop/product/17573/ja</p>
							<input
								bind:value={ linePackSearch }
								class="inputQuery"
								type="text"
								placeholder="LINE Sticker Pack URL" />
							<button class="button is-primary"
								on:click="{ () => parseLinePack() }">Add</button>
						</div>
						<!-- /tab: LINE -->

						<!-- tab: Misc -->
						<SimpleBar class="tab-content misc" style="{ activeTab === 3 ? '' : 'display: none;' }">
							<div class="section settings" on:change="{ onSettingsChange }">
								<p class="section-title">Settings</p>
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
											name="disableDownscale"
											type="checkbox"
											bind:checked={ settings.disableDownscale } />
										Disable downscaling of manually imported LINE Store packs
									</label>
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
						</SimpleBar>
						<!-- /tab: Misc -->
					</div>
				</div>
			</div>
		</div>

	</div>
</main>
