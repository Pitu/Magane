<script>
	// implement grsmto/simplebar
	import { onMount } from 'svelte';

	// Let's make the scrollbars pretty
	import 'simplebar';
	import './styles/global.css';
	import './styles/main.scss';

	const elementToCheck = '[class^=channelTextArea] [class^=buttons]';
	const coords = { top: 0, left: 0 };
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

	const keepMaganeInPlace = () => {
		const el = document.querySelector(elementToCheck);
		if (!el) {
			if (showIcon) showIcon = false;
			return;
		}
		if (!showIcon) showIcon = true;
		const props = el.getBoundingClientRect();
		coords.top = isThereTopBar ? props.top - 21 : props.top;
		coords.left = props.left - 107;
	};

	const checkAuth = async (token = storage.token) => {
		if (storage.canCallAPI) return;
		if (typeof token !== 'string') throw new Error('Not a token, buddy.');
		token = token.replace(/"/ig, '');
		token = token.replace(/^Bot\s*/i, '');
		const gateway = await fetch('https://discordapp.com/api/v7/gateway');
		const gatewayJson = await gateway.json();
		const wss = new WebSocket(`${gatewayJson.url}/?encoding=json&v6`);
		wss.onerror = error => console.error(error);
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
			} catch (error) {
				console.error(error);
			}
		};
	};

	const getLocalStorage = () => {
		const localStorageIframe = document.createElement('iframe');
		localStorageIframe.id = 'localStorageIframe';
		storage = document.body.appendChild(localStorageIframe).contentWindow.localStorage;
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
		if (onCooldown) return;
		onCooldown = true;
		stickerWindowActive = false;
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
		});
		setTimeout(() => onCooldown = false, 1000);
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
		console.log('[MAGANE] > mounted on DOM');
		getLocalStorage();
		checkAuth();
		grabPacks();
		setInterval(() => keepMaganeInPlace(), 500);
		isThereTopBar = document.querySelector('html.platform-win');
	});
</script>

<main>
	<div id="magane"
		style="top: { `${coords.top}px` }; left: { `${coords.left}px` }; display: { showIcon ? 'flex' : 'none' };">
		<div class="channel-textarea-emoji channel-textarea-stickers"
			class:active="{ stickerWindowActive }"
			on:click="{ () => stickerWindowActive = !stickerWindowActive }"
			on:contextmenu|stopPropagation|preventDefault="{ () => grabPacks() }">
			<div class="channel-textarea-stickers-content" />
		</div>

		{ #if stickerWindowActive }
		<div class="stickerWindow">
			<div id="stickers"
				class="stickers"
				data-simplebar
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
					on:click="{ () => isStickerAddModalActive = true }">
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
					on:click="{ () => isStickerAddModalActive = !isStickerAddModalActive }"></div>

				<div class="modal-content">
					<div class="stickersConfig">
						<div class="tabs">
							<div class="tab"
								on:click="{ () => activeTab = 0 }"
								class:is-active="{ activeTab === 0 }">
								Installed
							</div>
							<div class="tab"
								on:click="{ () => activeTab = 1 }"
								class:is-active="{ activeTab === 1 }">
								Packs
							</div>
						</div>

						{ #if activeTab === 0 }
						<div class="tabContent">
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
						<div class="tabContent" data-simplebar>
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
