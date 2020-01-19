<script>
	// implement grsmto/simplebar
	import { onMount } from 'svelte';
	import { beforeUpdate, afterUpdate } from 'svelte'; // https://svelte.dev/tutorial/update

	// Let's make the scrollbars pretty
	import 'simplebar';
	import './simplebar.css';

	const elementToCheck = '[class^=channelTextArea] [class^=buttons]';
	const coords = { top: 0, left: 0 }
	let showIcon = true;

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
	let lastKnownLocation = null;
	let subscribedSearch = null;
	let packsSearch = null;
	let stickerContainer = null;

	onMount(async () => {
		console.log('[MAGANE] > mounted on DOM');
		getLocalStorage();
		checkAuth();
		grabPacks();
		setInterval(() => keepMaganeInPlace(), 500);
	});

	const keepMaganeInPlace = () => {
		const el = document.querySelector(elementToCheck);
		if (!el) {
			if (showIcon) showIcon = false;
			return;
		}
		if (!showIcon) showIcon = true;
		const props = el.getBoundingClientRect();
		coords.top = props.top - 21;
		coords.left = props.left - 107;
	}

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
	}

	const getLocalStorage = () => {
		const localStorageIframe = document.createElement('iframe');
		localStorageIframe.id = 'localStorageIframe';
		storage = document.body.appendChild(localStorageIframe).contentWindow.localStorage;
	}

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
				for (let subbedPacks of subscribedPacks) {
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
	}

	const subscribeToPack = pack => {
		if (subscribedPacks.includes(pack)) return;
		// subscribedPacks.push(pack);
		// subscribedPacksSimple.push(pack.id);

		// Svelte reactivity only works with assignments
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

	const saveToLocalStorage = (key, payload) => {
		storage.setItem(key, JSON.stringify(payload));
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
	}

	const favoriteSticker = (pack, id) => {
		for (let favorite of favoriteStickers) {
			if (favorite.id === id) return
		}

		const favorite = { pack, id }
		// favoriteStickers.push(favorite);
		favoriteStickers = [...favoriteStickers, favorite];
		saveToLocalStorage('magane.favorites', favoriteStickers);
	}

	const unfavoriteSticker = (pack, id) => {
		let found = false;
		for (let favorite of favoriteStickers) {
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
	}

	const filterPacks = () => {
		filteredPacks = availablePacks.filter(pack => pack.name.toLowerCase().indexOf(event.target.value.toLowerCase()) >= 0);
	}
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
						<div class="image"
							style="background-image: { `url(${baseURL}${sticker.pack}/${sticker.id.replace('.png', '_key.png')})` }"
							on:click="{ () => sendSticker(sticker.pack, sticker.id) }"></div>
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
						<div class="image"
							style="background-image: { `url(${baseURL}${pack.id}/${sticker.replace('.png', '_key.png')})` }"
							on:click="{ () => sendSticker(pack.id, sticker) }"></div>
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
								class:active="{ activeTab == 0 }">
								Installed
							</div>
							<div class="tab"
								on:click="{ () => activeTab = 1 }"
								class:active="{ activeTab == 1 }">
								Packs
							</div>
						</div>

						{ #if activeTab == 0 }
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
						{ :else if activeTab == 1 }
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

<style lang="scss">
	div#magane {
		// position: relative;
		height: 100%;
		display: flex;
		flex-direction: row;
		height: 44px;
		position: absolute;
		z-index: 99;

		button, input, select, label, span, p, a, li, ul, div {
			font-family: BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;
			color: #d2d2d2;
			font-size: 1rem;
			font-weight: 400;
			line-height: 1.5;
			font-size: 16px;
			-moz-osx-font-smoothing: grayscale;
			-webkit-font-smoothing: antialiased;
			text-rendering: optimizeLegibility;
			-webkit-text-size-adjust: 100%;
			-moz-text-size-adjust: 100%;
			-ms-text-size-adjust: 100%;
			text-size-adjust: 100%;
		}

		div.channel-textarea-stickers {
			position: relative;
			width: auto;
			padding: 6px;
			align-items: center;
			cursor: pointer;
			display: flex;
			justify-content: center;
			max-height: 50px;
			cursor: pointer;
			filter: grayscale(100%);
			transition: all 0.2s ease;

			 &:hover, &.active {
				transform: scale(1.15);
				filter: grayscale(0%);
			}
		}
		div.channel-textarea-stickers-content {
			background-image: url('https://discordapp.com/assets/a42df564f00ed8bbca652dc9345d3834.svg');
			background-size: 100%;
			width: 22px;
			height: 22px;
		}

		div.stickerWindow {
			z-index: 2000;
			width: 600px;
			min-height: 200px;
			right: 270px;
			bottom: 82px;
			position: fixed;
			background: #202225;
			max-height: 600px;
			overflow: hidden;
			transition: all 0.2s ease;
			border-radius: 4px;

			div.stickers {
				overflow: auto;
				height: 550px !important;
				margin-bottom: 100px;
				position: relative;

				h3.getStarted {
					text-align: center;
					padding-top: 40%;
					pointer-events: none;
				}

				div.pack {
					float: left;
					display: flex;
					flex-flow: wrap;
					justify-content: center;
					padding: 25px;

					span {
						display: block;
						color: #d2d2d2;
						width: 100%;
						cursor: auto;
						padding-left: 10px;
						margin: 10px 0px;
					}

					div.sticker {
						width: 100px;
						height: 100px;
						float: left;
						position: relative;

						div.image {
							background-position: center;
							background-size: cover;
							background-repeat: no-repeat;
							cursor: pointer;
							width: 100px;
							height: 100px;
						}

						div.addFavorite, div.deleteFavorite {
							width: 20px;
							height: 20px;
							position: absolute;
							right: 0;
							transition: all 0.2s ease;
							display: none;
							z-index: 2;
							&:hover {
								transform: scale(1.25);
								svg path {
									transition: all 0.2s ease;
									fill: white;
								}
							}
						}
						div.addFavorite {
							bottom: 0;
						}
						div.deleteFavorite {
							top: 0px;
							transform: rotateZ(45deg);
						}

						&:hover div.addFavorite,
						&:hover div.deleteFavorite {
							display: block;
						}
					}
				}
			}

			> div.packs {
				position: absolute;
				bottom: 0;
				width: 100%;
				height: 50px;
				background: #151617;

				div.pack {
					display: block;
					height: 40px;
					width: 40px;
					float: left;
					margin-top: 5px;
					margin-right: 10px;
					cursor: pointer;
					background-position: center;
					background-size: cover;
					background-repeat: no-repeat;
					transition: all 0.2s ease;
					filter: grayscale(100%);

					&:nth-of-type(1) {
						margin-left: 10px;
					}

					&:hover,
					div.pack.active {
						transform: scale(1.25);
						-webkit-transform: scale(1.25);
						-webkit-filter: grayscale(0%);
						filter: grayscale(0%);
					}

					> div {
						background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');
						width: 22px;
						height: 22px;
						background-size: 924px 704px;
						background-repeat: no-repeat;
						margin-top: 8px;
						margin-left: 9px;
					}

					div.icon-favorite {
						background-position: -462px -132px;
					}

					div.icon-plus {
						background-position: -374px -484px;
						-webkit-filter: invert(100%);
						filter: invert(100%);
					}
				}
			}
		}

		.stickersModal {
			z-index: 2001;
			bottom: 0;
			left: 0;
			position: absolute;
			right: 0;
			top: 0;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			// position: fixed;

			&.is-active {
				display: -webkit-box;
				display: -ms-flexbox;
				display: flex;
			}

			.inputQuery {
				width: calc(100% - 20px);
				float: left;
				display: -webkit-box;
				display: -ms-flexbox;
				display: flex;
				height: 36px;
				box-sizing: border-box;
				margin-left: 15px;
				margin-bottom: 10px;
				padding: 5px 12px;
				border-radius: 3px;
				border: 1px solid #151617;
				color: #151617;
			}

			.modal-background {
				bottom: 0;
				left: 0;
				position: absolute;
				right: 0;
				top: 0;
				width: 100%;
				height: 100%;
				background-color: rgba(10, 10, 10, 0.86);
			}

			.modal-content,
			.modal-card {
				// max-height: calc(100vh - 160px);
				position: absolute;
				width: 100%;
				height: 100%;
				// margin-left: -320px;
				// margin-top: -320px;
				left: 0;
				top: 0;
				background: #151617;
				overflow: hidden;
			}

			.modal-content {
				.stickersConfig {
					height: 100%;
					width: 100%;

					.tabs {
						height: 75px;
						text-align: center;

						.tab {
							color: #888;
							display: inline-block;
							border: none;
							border-top: 0px transparent;
							border-left: 0px transparent;
							border-right: 0px transparent;
							border-width: 1px;
							border-style: solid;
							border-bottom-color: #888;
							padding: 20px;
							cursor: pointer;

							&:hover,
							&.is-active {
								border-bottom-color: #fff;
								color: #fbfbfb;
							}
						}
					}

					div.tabContent {
						height: 525px !important;
					}

					div.pack {
						width: calc(100% - 20px);
						float: left;
						display: flex;
						margin-left: 20px;
						margin-bottom: 10px;
						height: 75px;

						div.handle,
						div.preview,
						div.action {
							flex: none;
							width: 75px;
							height: 75px;
						}

						div.preview {
							background-position: center;
							background-size: cover;
							background-repeat: no-repeat;
						}

						div.handle {
							padding: 20px;
							cursor: move;
							padding-top: 30px;

							span {
								background: #555;
								height: 2px;
								width: 100%;
								display: block;
								margin-bottom: 6px;
							}
						}

						div.action {
							padding-top: 20px;
							padding-left: 10px;
						}

						div.info {
							flex: 1;
							padding: 14px;

							span {
								display: block;
								width: 100%;
								color: #989797;

								&:nth-of-type(1) {
									font-weight: bold;
									color: #d2d2d2;
								}
							}
						}

						div.preview img {
							height: 100%;
							width: 100%;
						}
					}
				}
			}

			.modal-close {
				user-select: none;
				-webkit-appearance: none;
				background-color: rgba(10, 10, 10, 0.2);
				border: none;
				border-radius: 290486px;
				cursor: pointer;
				display: inline-block;
				flex-grow: 0;
				flex-shrink: 0;
				font-size: 0;
				outline: none;
				vertical-align: top;
				background: none;
				position: absolute;
				right: 20px;
				top: 20px;
				height: 32px;
				max-height: 32px;
				max-width: 32px;
				min-height: 32px;
				min-width: 32px;
				width: 32px;
				z-index: 1;

				&:before,
				&:after {
					background-color: white;
					content: "";
					display: block;
					left: 50%;
					position: absolute;
					top: 50%;
					transform: translateX(-50%) translateY(-50%) rotate(45deg);
					transform-origin: center center;
				}

				&:before {
					height: 2px;
					width: 50%;
				}

				&:after {
					height: 50%;
					width: 2px;
				}

				&:hover,
				&:focus {
					background-color: rgba(10, 10, 10, 0.3);
				}
			}
		}

		.button {
			-moz-appearance: none;
			-webkit-appearance: none;
			align-items: center;
			border: 1px solid transparent;
			border-radius: 3px;
			box-shadow: none;
			display: inline-flex;
			font-size: 1rem;
			padding: calc(0.375em - 1px) 0.75em;
			position: relative;
			vertical-align: top;
			user-select: none;
			cursor: pointer;
			justify-content: center;
			text-align: center;
			white-space: nowrap;
			border-color: transparent;
			color: white;
			background-color: #696080;

			&.button.is-danger {
				background-color: #883030;
			}

			&:hover, &.is-primary:hover {
				background-color: #4a425f;
			}

			&.is-danger:hover {
				background-color: #652525;
			}
		}
	}

	iframe#localStorageIframe {
		display: none;
	}
</style>
