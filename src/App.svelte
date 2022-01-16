<script>
	import { onMount, afterUpdate } from 'svelte';

	// Let's make the scrollbars pretty
	import SimpleBar from '@woden/svelte-simplebar';
	import * as animateScroll from 'svelte-scrollto';
	import './styles/global.css';
	import './styles/main.scss';

	// APIs
	window.magane = {};

	const elementToCheck = '[class^=channelTextArea] [class^=buttons]';
	const coords = { top: 0, left: 0 };
	const selectorTextArea = 'div[class^=textArea] div[aria-multiline][contenteditable]';
	const selectorStickersContainer = '#magane .stickers .simplebar-content-wrapper';
	const selectorStickerModalContent = '#magane .stickersModal .simplebar-content-wrapper';
	let textArea = document.querySelector(selectorTextArea);
	let showIcon = true;
	let isThereTopBar = null;

	let baseURL = '';
	let stickerWindowActive = false;
	let isStickerAddModalActive = false;
	let activeTab = 0;
	let favoriteStickers = [];
	const favoriteStickersData = {};
	let availablePacks = [];
	let subscribedPacks = [];
	let subscribedPacksSimple = [];
	let filteredPacks = [];
	const localPackIdRegex = /^(startswith|emojis|custom)-/;
	const localPacks = {};
	let linePackSearch = null;

	const stickerWindowScrolls = [
		{ selector: selectorStickersContainer, type: 'scrollTop', position: 0 },
		{ selector: '#magane .packs .simplebar-content-wrapper', type: 'scrollLeft', position: 0 }
	];
	const stickerModalScrolls = [0, 0];
	let doStickerWindowScrolls = false;
	let doStickerModalScrolls = false;

	let onCooldown = false;
	let storage = null;
	let packsSearch = null;
	let resizeObserver;

	const log = (message, type = 'log') =>
		console[type]('%c[Magane]%c', 'color: #3a71c1; font-weight: 700', '', message);

	const toast = (message, options = {}) => {
		/* global BdApi */
		if (typeof BdApi === 'object' && typeof BdApi.showToast === 'function') {
			return BdApi.showToast(message, options);
		}

		if (options.nolog) return;

		// Fallback if not in BetterDiscord
		if (!options.type || !['log', 'info', 'warn', 'error'].includes(options.type)) {
			options.type = 'log';
		}
		return log(message, options.type);
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
			coords.left = props.left - 100;
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

	const checkAuth = async (token = storage.token) => {
		// No need if we are already authed
		if (storage.canCallAPI) return;
		if (typeof token !== 'string') throw new Error('Not a token, buddy.');
		token = token.replace(/"/ig, '');
		token = token.replace(/^Bot\s*/i, '');
		const gateway = await fetch('https://discordapp.com/api/v7/gateway');
		const gatewayJson = await gateway.json();
		const wss = new WebSocket(`${gatewayJson.url}/?encoding=json&v6`);
		await new Promise((resolve, reject) => {
			wss.onerror = error => reject(error);
			wss.onmessage = message => {
				try {
					const json = JSON.parse(message.data);
					storage.canCallAPI = true;
					json.op === 0 && json.t === 'READY' && wss.close();
					json.op === 10 && wss.send(JSON.stringify({
						op: 2,
						d: {
							token,
							properties: { $browser: 'b1nzy is a meme' },
							large_threshold: 50
						}
					}));
					resolve();
				} catch (error) {
					reject(error);
				}
			};
		});
	};

	const getLocalStorage = () => {
		const localStorageIframe = document.createElement('iframe');
		localStorageIframe.id = 'localStorageIframe';
		storage = document.body.appendChild(localStorageIframe).contentWindow.frames.localStorage;
	};

	const saveToLocalStorage = (key, payload) => {
		storage.setItem(key, JSON.stringify(payload));
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

	const formatUrl = (pack, id, sending) => {
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
			url = `https://images.weserv.nl/?url=${encodeURIComponent(url)}${append}`;
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
			url = `https://images.weserv.nl/?url=${encodeURIComponent(url)}${append}`;
		} else if (pack.startsWith('custom-')) {
			// Custom packs
			const template = localPacks[pack].template;
			url = template.replace(/%pack%/g, pack.split('-')[1]).replace(/%id%/g, id);
		}
		return url;
	};

	const sendSticker = async (pack, id, token = storage.token) => {
		if (onCooldown) {
			return toastWarn('Sending sticker is still on cooldown\u2026', { timeout: 1000 });
		}

		onCooldown = true;
		// stickerWindowActive = false;

		try {
			toast('Sending\u2026');
			const channel = window.location.href.split('/').slice(-1)[0];

			const url = formatUrl(pack, id, true);
			log(`Fetching sticker from remote: ${url}`);
			const response = await fetch(url, { cache: 'force-cache' });
			const myBlob = await response.blob();

			let filename = id;
			if (typeof pack === 'string') {
				if (pack.startsWith('startswith-') && localPacks[pack].animated) {
					filename = filename.replace(/\.png$/i, '.gif');
					toastWarn('Animated stickers from LINE Store currently cannot be animated!');
				} else if (pack.startsWith('custom-')) {
					// Obfuscate file name of stickers from custom packs
					filename = `${Date.now().toString()}.${id.split('.')[1]}`;
				}
			}

			const formData = new FormData();
			formData.append('file', myBlob, filename);

			log(`Sending\u2026`);
			token = token.replace(/"/ig, '');
			token = token.replace(/^Bot\s*/i, '');
			const res = await fetch(`https://discordapp.com/api/channels/${channel}/messages`, {
				headers: { Authorization: token },
				method: 'POST',
				body: formData
			});
			if (res.status === 200) {
				toastSuccess('Sent!');
			} else if (res.status === 403) {
				toastError('Permission denied!');
			} else {
				toastError(`HTTP error ${res.status}!`);
			}
		} catch (error) {
			console.error(error);
			toastError('Unexpected error occurred when sending sticker. Check your console for details.');
		}

		onCooldown = false;
	};

	const favoriteSticker = (pack, id) => {
		for (const favorite of favoriteStickers) {
			if (favorite.id === id) {
				return toastError('This sticker is already in your favorites.');
			}
		}

		if (!favoriteStickersData[pack]) {
			const data = subscribedPacks.find(p => p.id === pack);
			favoriteStickersData[pack] = {
				name: data && data.name
			};
		}

		const favorite = { pack, id };
		favoriteStickers = [...favoriteStickers, favorite];
		saveToLocalStorage('magane.favorites', favoriteStickers);
		log(`Favorited sticker > ${id} of pack ${pack}`);
		toastSuccess('Favorited!', { nolog: true });
	};

	const unfavoriteSticker = (pack, id) => {
		let found = false;
		for (const favorite of favoriteStickers) {
			if (favorite.id === id) found = true;
		}

		if (!found) return;

		for (let i = 0; i < favoriteStickers.length; i++) {
			if (favoriteStickers[i].id === id) {
				favoriteStickers.splice(i, 1);
				favoriteStickers = favoriteStickers;
			}
		}

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
		try { // eslint-disable-line no-useless-catch
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
			return true;
		} catch (ex) {
			throw ex;
		}
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
			toastSuccess('Migration successful');
		}
	};

	window.magane.appendPack = (title, firstid, count, animated, _) => {
		if (_) {
			throw new Error('This function expects only 4 parameters. Were you looking for appendCustomPack()?');
		}

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
			name: title,
			count: count,
			id: mid,
			animated: animated ? 1 : null,
			files: files
		});
	};

	window.magane.appendEmojisPack = (title, id, count, _) => {
		if (_) {
			throw new Error('This function expects only 3 parameters.');
		}

		count = Math.max(Math.min(Number(count), 200), 0) || 0;
		const mid = `emojis-${id}`;
		const files = [];
		for (let i = 0; i < count; i += 1) {
			files.push(`${String(i + 1).padStart(3, '0')}.png`);
		}

		return _appendPack(mid, {
			name: title,
			count: count,
			id: mid,
			files: files
		});
	};

	window.magane.appendCustomPack = (title, id, count, animated, template) => {
		if (!template) {
			throw new Error('Missing URL template.');
		}

		count = Math.max(Number(count), 0) || 0;
		const mid = `custom-${id}`;
		const files = [];
		for (let i = 1; i <= count; i += 1) {
			files.push(i + (animated ? '.gif' : '.png'));
		}

		return _appendPack(mid, {
			name: title,
			count: count,
			id: mid,
			animated: animated ? 1 : null,
			files: files,
			template: template
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
		try {
			log('Mounted on DOM');
			getLocalStorage();
			await checkAuth();
			await grabPacks();
			toastSuccess('Magane initialized!');
			resizeObserver = new ResizeObserver(positionMagane);
			await waitForTextArea();
			resizeObserver.observe(textArea);
			keepMaganeInPlace();
			isThereTopBar = document.querySelector('html.platform-win');
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
			if (
				!document.querySelector('#magane img').isSameNode(e.target) &&
				!((e.clientX <= x + width && e.clientX >= x) &&
				(e.clientY <= y + height && e.clientY >= y))
			) {
				// eslint-disable-next-line no-use-before-define
				toggleStickerWindow();
			}
		}
	};

	const restoreStickerWindowScrolls = () => {
		for (let i = 0; i < stickerWindowScrolls.length; i++) {
			const element = document.querySelector(stickerWindowScrolls[i].selector);
			if (element) {
				element[stickerWindowScrolls[i].type] = stickerWindowScrolls[i].position;
			}
		}
	};

	const storeStickerWindowScrolls = () => {
		for (let i = 0; i < stickerWindowScrolls.length; i++) {
			const element = document.querySelector(stickerWindowScrolls[i].selector);
			if (element) {
				stickerWindowScrolls[i].position = element[stickerWindowScrolls[i].type];
			}
		}
	};

	const restoreStickerModalScrolls = () => {
		const element = document.querySelector(selectorStickerModalContent);
		if (element) {
			element.scrollTop = stickerModalScrolls[activeTab];
		}
	};

	const storeStickerModalScrolls = () => {
		const element = document.querySelector(selectorStickerModalContent);
		if (element) {
			stickerModalScrolls[activeTab] = element.scrollTop;
		}
	};

	afterUpdate(() => {
		// Only do stuff if the Magane window is open
		if (!stickerWindowActive) return;

		if (doStickerWindowScrolls) {
			restoreStickerWindowScrolls();
			doStickerWindowScrolls = false;
		}

		if (doStickerModalScrolls) {
			restoreStickerModalScrolls();
			doStickerModalScrolls = false;
		}
	});

	const toggleStickerWindow = () => {
		const active = !stickerWindowActive;
		if (active) {
			document.addEventListener('click', maganeBlurHandler);
			doStickerWindowScrolls = true;
			if (isStickerAddModalActive) {
				doStickerModalScrolls = true;
			}
		} else {
			document.removeEventListener('click', maganeBlurHandler);
			storeStickerWindowScrolls();
			if (isStickerAddModalActive) {
				storeStickerModalScrolls();
			}
		}
		stickerWindowActive = active;
	};

	const toggleStickerModal = () => {
		const active = !isStickerAddModalActive;
		if (active) {
			doStickerModalScrolls = true;
		} else {
			storeStickerModalScrolls();
		}
		isStickerAddModalActive = active;
	};

	const activateTab = value => {
		storeStickerModalScrolls();
		activeTab = value;
		doStickerModalScrolls = true;
	};

	const scrollToStickers = id => {
		animateScroll.scrollTo({
			element: id,
			container: document.querySelector(selectorStickersContainer)
		});
	};

	const movePack = event => {
		const value = event.target.value.trim();
		if (event.keyCode !== 13 || !value.length) return;

		let newIndex = Number(value);
		if (isNaN(newIndex) || newIndex < 1 || newIndex > subscribedPacks.length) {
			return toastError(`New position must be ≥ 1 and ≤ ${subscribedPacks.length}!`);
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
		toastSuccess(`Moved pack from position ${oldIndex + 1} to ${newIndex + 1}!`);
	};

	const parseLinePack = async () => {
		if (!linePackSearch) return;
		try {
			const match = linePackSearch.match(/^(https?:\/\/store\.line\.me\/((sticker|emoji)shop)\/product\/)?([a-z0-9]+)/);
			if (!match) return toastError('Unsupported LINE Store URL or ID.');
			if (match[3] === 'emoji') {
				// LINE Emojis will only work when using its full URL
				const id = match[4];
				const response = await fetch(`https://magane.moe/api/proxy/emoji/${id}`);
				const props = await response.json();
				linePackSearch = null;
				window.magane.appendEmojisPack(props.title, props.id, props.len);
			} else {
				// LINE Stickers work with either its full URL or just its ID
				const id = Number(match[4]);
				if (isNaN(id) || id < 0) return toastError('Unsupported LINE Stickers ID.');
				const response = await fetch(`https://magane.moe/api/proxy/sticker/${id}`);
				const props = await response.json();
				linePackSearch = null;
				window.magane.appendPack(props.title, props.first, props.len, props.hasAnimation);
			}
		} catch (error) {
			console.error(error);
			toastError('Unexpected error occurred. Check your console for details.');
		}
	};
</script>

<main>
	<div id="magane"
		style="top: { `${coords.top}px` }; left: { `${coords.left}px` }; display: { showIcon ? 'flex' : 'none' };">
		<div class="channel-textarea-emoji channel-textarea-stickers"
			class:active="{ stickerWindowActive }"
			on:click="{ () => toggleStickerWindow() }"
			on:contextmenu|stopPropagation|preventDefault="{ () => grabPacks() }">
			<img class="channel-textarea-stickers-content" src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20width%3D%2224%22%20height%3D%2224%22%20preserveAspectRatio%3D%22xMidYMid%20meet%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M18.5%2011c-4.136%200-7.5%203.364-7.5%207.5c0%20.871.157%201.704.432%202.482l9.551-9.551A7.462%207.462%200%200%200%2018.5%2011z%22%20fill%3D%22%23b9bbbe%22%2F%3E%3Cpath%20d%3D%22M12%202C6.486%202%202%206.486%202%2012c0%204.583%203.158%208.585%207.563%209.69A9.431%209.431%200%200%201%209%2018.5C9%2013.262%2013.262%209%2018.5%209c1.12%200%202.191.205%203.19.563C20.585%205.158%2016.583%202%2012%202z%22%20fill%3D%22%23b9bbbe%22%2F%3E%3C%2Fsvg%3E" alt="Magane menu button">
		</div>

		{ #if stickerWindowActive }
		<div class="stickerWindow">
			<SimpleBar class="stickers" style="">
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
							title="{ favoriteStickersData[sticker.pack].name }"
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
							src="{ `${formatUrl(pack.id, sticker)}` }"
							alt="{ pack.id } - { sticker }"
							on:click="{ () => sendSticker(pack.id, sticker) }"
						>
						<div class="addFavorite"
							title="Favorite"
							on:click="{ () => favoriteSticker(pack.id, sticker) }">
							<svg width="20" height="20" viewBox="0 0 24 24">
								<path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path>
							</svg>
						</div>
					</div>
					{ /each }
				</div>
				{ /each }
			</SimpleBar>

			<div class="bottom-toolbar">
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
							style="background-image: { `url(${formatUrl(pack.id, pack.files[0])})` }" />
						{ /each }
					</div>
				</SimpleBar>
			</div>

			<!-- Sticker add modal -->
			{ #if isStickerAddModalActive }
			<div class="stickersModal">
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
						</div>

						{ #if activeTab === 0 }
						<SimpleBar class="tabContent" style="">
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
									style="background-image: { `url(${formatUrl(pack.id, pack.files[0])})` }" />
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
						{ :else if activeTab === 1 }
						<input
							on:keyup="{ filterPacks }"
							bind:value={ packsSearch }
							class="inputQuery"
							type="text"
							placeholder="Search" />
						<SimpleBar class="tabContent" style="">
							{ #each filteredPacks as pack }
							<div class="pack">
								<div class="preview"
									style="background-image: { `url(${formatUrl(pack.id, pack.files[0])})` }" />
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
						{ :else if activeTab === 2 }
						<div class="tabContent line-proxy">
							<p>If you are looking for a sticker pack that is not provided by magane, you can go to the LINE store and pick whatever pack you want and paste the full URL in the box below. <br><br>For example: https://store.line.me/stickershop/product/17573/ja</p>
							<input
								bind:value={ linePackSearch }
								class="inputQuery"
								type="text"
								placeholder="LINE Sticker Pack URL" />
							<button class="button is-primary"
								on:click="{ () => parseLinePack() }">Add</button>
						</div>
						{ /if }
					</div>
				</div>
			</div>
			{ /if }
			<!-- /Sticker add modal -->

		</div>

		{ /if }
	</div>
</main>
