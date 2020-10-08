<script>
	import { onMount, afterUpdate } from 'svelte';

	// Let's make the scrollbars pretty
	import SimpleBar from 'simplebar';
	import './styles/global.css';
	import './styles/main.scss';

	const elementToCheck = '[class^=channelTextArea] [class^=buttons]';
	const coords = { top: 0, left: 0 };
	const selectorTextArea = 'div[class^=textArea] div[aria-multiline][contenteditable]';
	let textArea = document.querySelector(selectorTextArea);
	let showIcon = true;
	let isThereTopBar = null;

	let baseURL = '';
	let stickerWindowActive = false;
	let isStickerAddModalActive = false;
	let activeTab = 0;
	let favoriteStickers = [];
	let availablePacks = [];
	let subscribedPacks = [];
	let subscribedPacksSimple = [];
	let filteredPacks = [];

	let onCooldown = false;
	let storage = null;
	let packsSearch = null;
	let stickerContainer = null;
	let resizeObserver;

	let mainScrollBar;
	let packsScrollBar;

	const toast = (message, options) => {
		if (BdApi && typeof BdApi.showToast === 'function')
			return BdApi.showToast(message, options);

		// Fallback if not in BetterDiscord
		if (!options.type || !['log', 'info', 'warn', 'error'].includes(options.type))
			options.type = 'log';
		return console[options.type]('%c[Magane]%c', 'color: #3a71c1; font-weight: 700', '', content);
	}

	const toastInfo = (message, options = {}) => {
		options.type = 'info';
		return toast(message, options);
	}

	const toastSuccess = (message, options = {}) => {
		options.type = 'success';
		return toast(message, options);
	}

	const toastError = (message, options = {}) => {
		options.type = 'error';
		return toast(message, options);
	}

	const toastWarn = (message, options = {}) => {
		options.type = 'warn';
		return toast(message, options);
	}

	afterUpdate(() => {
		// Only do stuff if the Magane window is open
		if (!stickerWindowActive) return;

		if (!mainScrollBar) {
			const exists = document.getElementById('stickers');
			if (exists) mainScrollBar = new SimpleBar(exists);
		}

		if (!packsScrollBar) {
			const exists = document.getElementById('packsBar');
			if (exists) packsScrollBar = new SimpleBar(exists);
		}
	});

	const keepMaganeInPlace = () => {
		setTimeout(() => {
			const el = document.querySelector(elementToCheck);
			if (!el) {
				if (showIcon) showIcon = false;
				return;
			}
			if (!showIcon) showIcon = true;
			const props = el.getBoundingClientRect();
			coords.top = isThereTopBar ? props.top - 21 : props.top;
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
					console.error(error);
					reject(error);
				}
			};
		});
	};

	const getLocalStorage = () => {
		const id = 'localStorageIframe';
		let element = document.getElementById(id);
		if (!element) {
			element = document.createElement('iframe');
			element.id = id;
			document.body.appendChild(element);
		}
		storage = element.contentWindow.frames.localStorage;
	};

	const saveToLocalStorage = (key, payload) => {
		storage.setItem(key, JSON.stringify(payload));
	};

	const grabPacks = async () => {
		const response = await fetch('https://magane.moe/api/packs');
		const packs = await response.json();
		baseURL = packs.baseURL;
		availablePacks = packs.packs;
		filteredPacks = availablePacks;

		const subbedPacks = storage.getItem('magane.subscribed');
		if (subbedPacks) {
			try {
				subscribedPacks = JSON.parse(subbedPacks);
				for (const subbedPacks of subscribedPacks) {
					subscribedPacksSimple.push(subbedPacks.id);
				}
			} catch (ex) {
				// Do nothing
			}
		}

		const favStickers = storage.getItem('magane.favorites');
		if (favStickers) {
			try {
				favoriteStickers = JSON.parse(favStickers);
			} catch (ex) {
				// Do nothing
			}
		}
	};

	const subscribeToPack = pack => {
		if (subscribedPacks.includes(pack)) return;
		subscribedPacks = [...subscribedPacks, pack];
		subscribedPacksSimple = [...subscribedPacksSimple, pack.id];

		saveToLocalStorage('magane.subscribed', subscribedPacks);
		console.log(`[MAGANE] > Subscribed to pack > ${pack.name}`);
	};

	const unsubscribeToPack = pack => {
		if (!subscribedPacks.includes(pack)) return;

		for (let i = 0; i < subscribedPacks.length; i++) {
			if (subscribedPacks[i].id === pack.id) {
				subscribedPacks.splice(i, 1);
				subscribedPacksSimple.splice(i, 1);

				// No clue how to do with assignments so we cheat here
				subscribedPacks = subscribedPacks;
				subscribedPacksSimple = subscribedPacksSimple;

				console.log(`[MAGANE] > Unsubscribed from pack > ${pack.name}`);
			}
		}

		saveToLocalStorage('magane.subscribed', subscribedPacks);
	};

	const sendSticker = async (pack, id, token = storage.token) => {
		const channel = window.location.href.split('/').slice(-1)[0];
		if (onCooldown)
			return toastWarn('Sending sticker is still on cooldown\u2026', { timeout: 1000 });
		onCooldown = true;
		// I personally don't like the sticker window closing after sending one
		// stickerWindowActive = false;
		toast('Sending sticker\u2026');
		const response = await fetch(`${baseURL}${pack}/${id}`, { cache: 'force-cache' });
		const myBlob = await response.blob();
		const formData = new FormData();
		formData.append('file', myBlob, id);
		token = token.replace(/"/ig, '');
		token = token.replace(/^Bot\s*/i, '');
		fetch(`https://discordapp.com/api/channels/${channel}/messages`, {
			headers: { Authorization: token },
			method: 'POST',
			body: formData
		}).then(() => {
			toastSuccess('Sticker sent!');
			onCooldown = false;
		});
	};

	const favoriteSticker = (pack, id) => {
		for (const favorite of favoriteStickers) {
			if (favorite.id === id) return;
		}

		const favorite = { pack, id };
		favoriteStickers = [...favoriteStickers, favorite];
		saveToLocalStorage('magane.favorites', favoriteStickers);
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

		saveToLocalStorage('magane.favorites', favoriteStickers);
	};

	const filterPacks = () => {
		filteredPacks = availablePacks.filter(pack => pack.name.toLowerCase().indexOf(event.target.value.toLowerCase()) >= 0);
	};

	onMount(async () => {
		try {
			console.log('[MAGANE] > mounted on DOM');
			toastInfo('Initializing Magane\u2026');
			getLocalStorage();
			await checkAuth();
			await grabPacks();
			toastSuccess('Magane initialized. You can start sending stickers now!');
			resizeObserver = new ResizeObserver(positionMagane);
			await waitForTextArea();
			resizeObserver.observe(textArea);
			keepMaganeInPlace();
			isThereTopBar = document.querySelector('html.platform-win');
		} catch (error) {
			console.error(error);
			toastError('Unexpected errors occurred when initializing Magane. Check your console for details.');
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

	const toggleStickerWindow = () => {
		mainScrollBar = null;
		stickerWindowActive = !stickerWindowActive;
		if (stickerWindowActive) {
			document.addEventListener('click', maganeBlurHandler);
		} else {
			document.removeEventListener('click', maganeBlurHandler);
		}
	};

	const toggleStickerModal = () => {
		mainScrollBar = null;
		packsScrollBar = null;
		isStickerAddModalActive = !isStickerAddModalActive;
	};

	const activateTab = value => {
		packsScrollBar = null;
		activeTab = value;
	};
</script>

<main>
	<div id="magane"
		style="top: { `${coords.top}px` }; left: { `${coords.left}px` }; display: { showIcon ? 'flex' : 'none' };">
		<div class="channel-textarea-emoji channel-textarea-stickers"
			class:active="{ stickerWindowActive }"
			on:click="{ () => toggleStickerWindow() }"
			on:contextmenu|stopPropagation|preventDefault="{ () => grabPacks() }">
			<img class="channel-textarea-stickers-content" src="https://discordapp.com/assets/a42df564f00ed8bbca652dc9345d3834.svg" alt="Magane menu button">
		</div>

		{ #if stickerWindowActive }
		<div class="stickerWindow">
			<div id="stickers"
				class="stickers"
				bind:this={ stickerContainer }>
				{ #if !favoriteStickers && !subscribedPacks }
				<h3 class="getStarted">It seems you aren't subscribed to any pack yet. Click the plus symbol on the bottom-left to get started! 🎉</h3>
				{ /if }
				{ #if favoriteStickers && favoriteStickers.length }
				<div class="pack">
					<span id="pfavorites">Favorites</span>
					{ #each favoriteStickers as sticker, i }
					<div class="sticker">
						<img
							class="image"
							src="{ `${baseURL}${sticker.pack}/${sticker.id.replace('.png', '_key.png')}` }"
							alt="{ sticker.pack } - { sticker.id }"
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
					<span id="p{pack.id}">{ pack.name }</span>

					{ #each pack.files as sticker, i }
					<div class="sticker">
						<img
							class="image"
							src="{ `${baseURL}${pack.id}/${sticker.replace('.png', '_key.png')}` }"
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
			</div>

			<div class="packs">
				<div class="pack"
					on:click="{ () => toggleStickerModal() }">
					<div class="icon-plus" />
				</div>
				{ #if favoriteSticker && favoriteSticker.length }
				<div class="pack">
					<div class="icon-favorite" />
				</div>
				{ /if }
				{ #each subscribedPacks as pack, i }
				<div class="pack"
					on:click="{ () => stickerContainer.scrollTo }"
					style="background-image: { `url(${baseURL}${pack.id}/tab_on.png)` }" />
				{ /each }
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
						</div>

						{ #if activeTab === 0 }
						<div class="tabContent"
							id="packsBar">
							{ #each subscribedPacks as pack }
							<div class="pack">
								<div class="preview"
									style="background-image: { `url(${baseURL}${pack.id}/${pack.files[0].replace('.png', '_key.png')})` }" />
								<div class="info">
									<span>{ pack.name }</span>
									<span>{ pack.count } stickers</span>
								</div>
								<div class="action">
									<button class="button is-danger"
										on:click="{ () => unsubscribeToPack(pack) }">Del</button>
								</div>
							</div>
							{ /each }
						</div>
						{ :else if activeTab === 1 }
						<div class="tabContent"
							id="packsBar">
							<input
								on:keyup="{ filterPacks }"
								bind:value={ packsSearch }
								class="inputQuery"
								type="text"
								placeholder="Search" />
							{ #each filteredPacks as pack }
							<div class="pack">
								<div class="preview"
									style="background-image: { `url(${baseURL}${pack.id}/${pack.files[0].replace('.png', '_key.png')})` }" />
								<div class="info">
									<span>{ pack.name }</span>
									<span>{ pack.count } stickers</span>
								</div>
								<div class="action">
									{ #if subscribedPacksSimple.includes(pack.id) }
									<button class="button is-danger"
										on:click="{ () => unsubscribeToPack(pack) }">Del</button>
									{ :else }
									<button class="button is-primary"
										on:click="{ () => subscribeToPack(pack) }">Add</button>
									{ /if }
								</div>
							</div>
							{ /each }
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
