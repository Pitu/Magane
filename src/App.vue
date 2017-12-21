<template>
	<div id="magane">
		<div class="channel-textarea-emoji channel-textarea-stickers" @click="stickerWindowActive = !stickerWindowActive"></div>
		<div class="stickerWindow" v-show="stickerWindowActive">
			<!--<div class="handle" id="maganeDragHandle"></div>-->
			<!--<div class="search">
				<input type="text">
			</div>-->


			<div v-bar class="vuebar-element">
			<div class="stickers" id="stickers">
				<h3 class="getStarted" v-show="favoriteStickers.length === 0 && subscribedPacks.length === 0">It seems you aren't subscribed to any pack yet. Click the plus symbol on the bottom-left to get started! 🎉</h3>
				<div class="pack" v-show="favoriteStickers.length > 0">
					<span id="pfavorites">Favorites</span>
					<div class="sticker"
						v-for="sticker in favoriteStickers"
						v-bind:key="sticker.id">
						<div class="image"
							v-bind:style="{ 'background-image': 'url(' + baseURL + '/' + sticker.pack + '/' + sticker.id.replace('.png', '_key.png') + ')' }"
							@click="sendSticker(sticker.pack, sticker.id)"></div>
						<div class="deleteFavorite" @click="unfavoriteSticker(sticker.pack, sticker.id)">
							<svg width="20" height="20" viewBox="0 0 24 24">
								<path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path>
							</svg>
						</div>
					</div>
				</div>
				<div class="pack" v-for="pack in subscribedPacks" v-bind:key="pack.id">
					<span :id="'p' + pack.id">{{ pack.name }}</span>
					<div class="sticker"
						v-for="sticker in pack.files"
						v-bind:key="sticker">
						<div class="image"
							v-bind:style="{ 'background-image': 'url(' + baseURL + '/' + pack.id + '/' + sticker.replace('.png', '_key.png') + ')' }"
							@click="sendSticker(pack.id, sticker)"></div>
						<div class="addFavorite" @click="favoriteSticker(pack.id, sticker)">
							<svg width="20" height="20" viewBox="0 0 24 24">
								<path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path>
							</svg>
						</div>
					</div>
				</div>
			</div>
			</div>


			<div class="packs">
				<div class="pack" @click="isStickerAddModalActive = true">
					<div class="icon-plus"></div>
				</div>
				<div class="pack"
					v-show="favoriteStickers.length > 0"
					v-scroll-to="{
						el: '#pfavorites',
						container: '#stickers',
						duration: 400,
						easing: 'ease-in-out',
						offset: -50,
						cancelable: true,
						x: false,
						y: true
					}">
					<div class="icon-favorite"></div>
				</div>
				<div class="pack"
					v-for="pack in subscribedPacks"
					v-bind:key="pack.id"
					v-bind:style="{ 'background-image': 'url(' + baseURL + '/' + pack.id + '/tab_on.png' + ')' }"
					v-scroll-to="{
						el: '#p' + pack.id,
						container: '#stickers',
						duration: 400,
						easing: 'ease-in-out',
						offset: -50,
						cancelable: true,
						x: false,
						y: true
					}">
				</div>
			</div>
		</div>

		<div v-show="isStickerAddModalActive" class="stickersModal">
			<div class="modal-background" @click="isStickerAddModalActive = !isStickerAddModalActive"></div>
			<div class="modal-close" @click="isStickerAddModalActive = !isStickerAddModalActive"></div>

			<div class="modal-content">
				<div class="stickersConfig">
					<div class="tabs">
						<div class="tab" @click="activeTab = 0" v-bind:class="{ 'is-active': activeTab == 0 }">Installed</div>
						<div class="tab" @click="activeTab = 1" v-bind:class="{ 'is-active': activeTab == 1 }">Packs</div>
					</div>
					<div v-bar class="vuebar-element">
						<div class="tabContent" v-show="activeTab == 0">
							<div class="pack" v-for="pack in subscribedPacks" v-bind:key="pack.id">
								<div class="preview"
									v-bind:style="{ 'background-image': 'url(' + baseURL + '/' + pack.id + '/' + pack.files[0].replace('.png', '_key.png') + ')' }">
								</div>
								<div class="info">
									<span>{{ pack.name }}</span>
									<span>{{ pack.count }} stickers</span>
								</div>
								<div class="action">
									<a class="button is-danger" @click="unsubscribeToPack(pack)">Del</a>
								</div>
							</div>
						</div>
					</div>

					<div v-bar class="vuebar-element">
						<div class="tabContent" v-show="activeTab == 1">
							<div class="pack" v-for="pack in availablePacks" v-bind:key="pack.id">
								<div class="preview"
									v-bind:style="{ 'background-image': 'url(' + baseURL + '/' + pack.id + '/' + pack.files[0].replace('.png', '_key.png') + ')' }">
								</div>
								<div class="info">
									<span>{{ pack.name }}</span>
									<span>{{ pack.count }} stickers</span>
								</div>
								<div class="action">
									<a class="button is-primary" v-show="!subscribedPacksSimple.includes(pack.id)" @click="subscribeToPack(pack)">Add</a>
									<a class="button is-danger" v-show="subscribedPacksSimple.includes(pack.id)" @click="unsubscribeToPack(pack)">Del</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
const baseURL = '';
export default {
	name: 'app',
	mounted() {
		console.log('Magane mounted on DOM');
		this.getLocalStorage();
		this.checkAuth();
		this.grabPacks();
		// registerResize();
		setInterval(() => {
			if (window.location.href !== this.lastKnownLocation) {
				this.lastKnownLocation = window.location.href;
				this.restoreDom();
			}
		}, 1000);
	},
	data() {
		return {
			baseURL: '',
			stickerWindowActive: false,
			isStickerAddModalActive: false,
			availablePacks: [],
			subscribedPacks: [],
			subscribedPacksSimple: [],
			favoriteStickers: [],
			onCooldown: false,
			localStorage: null,
			activeTab: 0,
			lastKnownLocation: null
		}
	},
	methods: {
		restoreDom: function() {
			const appendableElement = document.querySelector('[class^="channelTextArea"] [class^="inner"]')
			|| document.querySelector('.channel-textarea-inner');
			if (appendableElement !== null) {
				appendableElement.appendChild(this.$el);
			}
		},
		getLocalStorage: function() {
			const localStorageIframe = document.createElement('iframe');
			localStorageIframe.id = 'localStorageIframe';
			this.localStorage = document.body.appendChild(localStorageIframe).contentWindow.localStorage;
		},
		async grabPacks() {
			const response = await fetch('https://magane.moe/api/packs');
			const packs = await response.json();
			this.baseURL = packs.baseURL;
			this.availablePacks = packs.packs;

			const subscribedPacks = this.localStorage.getItem('magane.subscribed');
			if (subscribedPacks) {
				try {
					this.subscribedPacks = JSON.parse(subscribedPacks);
					for (let subbedPacks of this.subscribedPacks) {
						this.subscribedPacksSimple.push(subbedPacks.id);
					}
				} catch (ex) {
					// Do nothing
				}
			}

			const favoriteStickers = this.localStorage.getItem('magane.favorites');
			if (favoriteStickers) {
				try {
					this.favoriteStickers = JSON.parse(favoriteStickers);
				} catch (ex) {
					// Do nothing
				}
			}
		},
		subscribeToPack: function(pack) {
			if (this.subscribedPacks.includes(pack)) return;
			this.subscribedPacks.push(pack);
			this.subscribedPacksSimple.push(pack.id);
			this.saveToLocalStorage('magane.subscribed', this.subscribedPacks);
		},
		unsubscribeToPack: function(pack) {
			if (!this.subscribedPacks.includes(pack)) return;

			for (let i = 0; i < this.subscribedPacks.length; i++) {
				if (this.subscribedPacks[i].id === pack.id) {
					this.subscribedPacks.splice(i, 1);
					this.subscribedPacksSimple.splice(i, 1);
				}
			}

			this.saveToLocalStorage('magane.subscribed', this.subscribedPacks);
		},
		saveToLocalStorage: function(key, payload) {
			this.localStorage.setItem(key, JSON.stringify(payload));
		},
		async sendSticker(packId, sticker, token = this.localStorage.token) {
			const channel = window.location.href.split('/').slice(-1)[0];
			if (this.onCooldown) return;
			this.onCooldown = true;
			this.stickerWindowActive = false;
			const response = await fetch(`${this.baseURL}/${packId}/${sticker}`, { cache: 'force-cache' });
			const myBlob = await response.blob();
			const formData = new FormData();
			formData.append('file', myBlob, sticker);
			token = token.replace(/"/ig, '');
			token = token.replace(/^Bot\s*/i, '');
			fetch(`https://discordapp.com/api/channels/${channel}/messages`, {
				headers: { Authorization: token },
				method: 'POST',
				body: formData
			});
			setTimeout(() => this.onCooldown = false, 1000); // eslint-disable-line no-return-assign
		},
		favoriteSticker: function(packId, sticker) {
			for (let favorite of this.favoriteStickers) {
				if (favorite.id === sticker) return
			}

			const favorite = { pack: packId, id: sticker }
			this.favoriteStickers.push(favorite);
			this.saveToLocalStorage('magane.favorites', this.favoriteStickers);
		},
		unfavoriteSticker: function(packId, sticker) {
			let found = false;
			for (let favorite of this.favoriteStickers) {
				if (favorite.id === sticker) found = true;
			}

			if (!found) return;

			for (let i = 0; i < this.favoriteStickers.length; i++) {
				if (this.favoriteStickers[i].id === sticker) {
					this.favoriteStickers.splice(i, 1);
				}
			}

			this.saveToLocalStorage('magane.favorites', this.favoriteStickers);
		},
		async checkAuth(token = this.localStorage.token) {
			if (this.localStorage.canCallAPI) return;
			if (typeof token !== 'string') throw new Error('Not a token, buddy.');
			token = token.replace(/"/ig, '');
			token = token.replace(/^Bot\s*/i, '');
			const gateway = await fetch('https://discordapp.com/api/v7/gateway');
			const gatewayJson = await gateway.json();
			const wss = new WebSocket(`${gatewayJson.url}/?encoding=json&v6`);
			wss.onerror = error => console.error(error); // eslint-disable-line no-console
			wss.onmessage = message => {
				try {
					const json = JSON.parse(message.data);
					this.localStorage.canCallAPI = true;
					json.op === 0 && json.t === 'READY' && wss.close(); // eslint-disable-line no-unused-expressions
					json.op === 10 && wss.send(JSON.stringify({ // eslint-disable-line no-unused-expressions
						op: 2,
						d: { // eslint-disable-line id-length
							token,
							properties: { $browser: 'b1nzy is a meme' },
							large_threshold: 50 // eslint-disable-line camelcase
						}
					}));
					console.log('Sucessful authenticated. You can now make REST request!'); // eslint-disable-line no-console
				} catch (error) {
					console.error(error); // eslint-disable-line no-console
				}
			};
		}
	},
	computed: {
		subscribed() {
			return this.$store.state.subscribed;
		},
		favorites() {
			return this.$store.state.favorites;
		}
	}
};

/*
function registerResize() {
	var drag1 = new drag();
	drag1.init({
		id: "maganeDragHandle",
		direction: "xy",
		limit: {
			x: [100,500],
			y: [50,300]
		}
	});
}

function drag(id) {
	this.id = id;
}

drag.prototype = {
	init:function() {
		this.elem = document.getElementById('maganeDragHandle');
		this.elem.onmousedown = this._mouseDown.bind(this);
	},
	_mouseDown: function(e) {
		e = e || window.event;
		this.elem.onselectstart=function(){ return false };
		this._event_docMouseMove = this._docMouseMove.bind(this);
		this._event_docMouseUp = this._docMouseUp.bind(this);
		if (this.onstart) this.onstart();
		this.x = e.clientX||e.PageX;
		this.y = e.clientY||e.PageY;
		this.left = parseInt(this.elem.style.left);
		this.top = parseInt(this.elem.style.top);
		document.addEventListener('mousemove', this._event_docMouseMove);
		document.addEventListener('mousemove', this._event_docMouseUp);
		// addEvent(document, 'mousemove', this._event_docMouseMove);
		// addEvent(document, 'mouseup', this._event_docMouseUp);
		return false;
	},

	_docMouseMove: function(e) {
		this.setValuesClick(e);
		if (this.ondrag) this.ondrag();
	},

	_docMouseUp: function(e) {
		document.removeEventListener('mousemove', this._event_docMouseMove);
		// removeEvent(document, 'mousemove', this._event_docMouseMove);
		if (this.onstop) this.onstop();
		document.removeEventListener('mousemove', this._event_docMouseUp);
		// removeEvent(document, 'mouseup', this._event_docMouseUp);
	},

	setValuesClick: function(e){
		this.mouseX = e.clientX||e.PageX;
		this.mouseY = e.clientY||e.pageY;
		this.X = this.left+ this.mouseX - this.x;
		this.Y = this.top + this.mouseY - this.y;
		this.elem.style.left = this.X+"px";
		this.elem.style.top = this.Y +"px";
	}
}
*/

</script>

<style lang="scss" scoped>
	$darkishBackground: #4b4c4e;
	$darkBackground: #202225;
	$darkerBackground: #151617;

	div.channel-textarea-stickers {
		position: absolute;
		top: 12px !important;
		right: 45px;
		//background-color: red;
		background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');
		width: 22px;
		height: 22px;
		background-position: -176px -396px;
		background-size: 924px 704px;
		background-repeat: no-repeat;
		transition: border-bottom-color .1s ease-in-out;
		-webkit-filter: grayscale(100%);
		filter: grayscale(100%);
		cursor: pointer;
		transition: all .2s ease;
	}

	div.channel-textarea-stickers:hover, div.channel-textarea-stickers.active {
		transform: scale(1.275);
		-webkit-transform: scale(1.275);
		filter: grayscale(0%);
		-webkit-filter: grayscale(0%);
		opacity: 1;
		transition: all .2s ease;
	}

	div#magane button,
	div#magane input,
	div#magane select,
	div#magane label,
	div#magane span,
	div#magane p,
	div#magane a,
	div#magane li,
	div#magane ul,
	div#magane div {
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

	div#magane div.stickerWindow {
		z-index: 2000;
		width: 600px;
		min-height: 200px;
		right: 0px;
		bottom: 46px;
		position: absolute;
		background: $darkBackground;
		max-height: 600px;
		overflow: hidden;
		transition: all .2s ease;
	}

	div#magane div.stickerWindow div.handle {
		background-image: url(data:image/gif;base64,R0lGODlhEAAQALMAAP///+fn54eHh9ra2oaGhtzc3NfX19vb29XV1dnZ2QAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAAAALAAAAAAQABAAAAQwEMhJq70Yl1wL4dNBBCAgkmAyAltmCKTnwsCwXi850BdC7zoLsPYTVIZIXmnJ5EQAADs=);
		position: absolute;
		width: 16px;
		height: 16px;
		left: -3px;
		top: -3px;
		cursor: nw-resize;
		transform: rotateZ(180deg);
	}

	div#magane div.stickerWindow div.stickers {
		overflow: auto;
		height: 550px !important;
		margin-bottom: 100px;
	}

	div#magane div.stickerWindow div.stickers h3.getStarted {
		text-align: center;
		padding-top: 40%;
		pointer-events: none;
	}

	div#magane div.stickerWindow div.stickers > div.pack {
		float: left;
		display: flex;
		flex-flow: wrap;
		justify-content: center;
		padding: 25px;
	}

	div#magane div.stickerWindow div.stickers > div.pack span {
		display: block;
		color: #d2d2d2;
		width: 100%;
		cursor: auto;
		padding-left: 10px;
		margin: 10px 0px;
	}

	div#magane div.stickerWindow div.stickers > div.pack div.sticker {
		width: 100px;
		height: 100px;
		float: left;
		position: relative;
	}

	div#magane div.stickerWindow div.stickers > div.pack div.sticker div.image {
		background-position: center;
		background-size: cover;
		background-repeat: no-repeat;
		cursor: pointer;
		width: 100px;
		height: 100px;
	}

	div#magane div.stickerWindow div.stickers > div.pack div.sticker div.addFavorite,
	div#magane div.stickerWindow div.stickers > div.pack div.sticker div.deleteFavorite {
		width: 20px;
		height: 20px;
		position: absolute;
		right: 0;
		transition: all .2s ease;
		display: none;
		z-index: 2;
	}

	div#magane div.stickerWindow div.stickers > div.pack div.sticker div.addFavorite {
		bottom: 0;
	}

	div#magane div.stickerWindow div.stickers > div.pack div.sticker div.deleteFavorite {
		top: 0px;
		transform: rotateZ(45deg);
	}

	div#magane div.stickerWindow div.stickers > div.pack div.sticker:hover div.addFavorite,
	div#magane div.stickerWindow div.stickers > div.pack div.sticker:hover div.deleteFavorite {
		display: block;
	}

	div#magane div.stickerWindow div.stickers > div.pack div.sticker div.addFavorite:hover {
		transform: scale(1.25);
		-webkit-transform: scale(1.25);
	}
	div#magane div.stickerWindow div.stickers > div.pack div.sticker div.deleteFavorite:hover {
		transform: scale(1.25) rotateZ(45deg);
		-webkit-transform: scale(1.25) rotateZ(45deg);
	}

	div#magane div.stickerWindow div.stickers > div.pack div.sticker div.addFavorite:hover svg path,
	div#magane div.stickerWindow div.stickers > div.pack div.sticker div.deleteFavorite:hover svg path {
		transition: all .2s ease;
		fill: white;
	}

	div#magane div.stickerWindow > div.packs {
		position: absolute;
		bottom: 0;
		width: 100%;
		height: 50px;
		background: $darkerBackground;
	}

	div#magane div.stickerWindow > div.packs div.pack {
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
		transition: all .2s ease;
		-webkit-filter: grayscale(100%);
		filter: grayscale(100%);
	}

	div#magane div.stickerWindow > div.packs div.pack:nth-of-type(1) {
		margin-left: 10px;
	}

	div#magane div.stickerWindow > div.packs div.pack > div {
		background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');
		width: 22px;
		height: 22px;
		background-size: 924px 704px;
		background-repeat: no-repeat;
		margin-top: 8px;
		margin-left: 9px;
	}
	div#magane div.stickerWindow > div.packs div.pack div.icon-favorite {
		background-position: -462px -132px;
	}
	div#magane div.stickerWindow > div.packs div.pack div.icon-plus {
		background-position: -374px -484px;
		-webkit-filter: invert(100%);
				filter: invert(100%);
	}

	div#magane div.stickerWindow > div.packs div.pack:hover,
	div#magane div.stickerWindow > div.packs div.pack.active {
		transform: scale(1.25);
		-webkit-transform: scale(1.25);
		-webkit-filter: grayscale(0%);
		filter: grayscale(0%);
	}

	div#magane div.stickersConfig {
		min-width: 480px;
		max-width: 640px;
		min-height: 480px;
		max-height: 750px;
	}

	div#magane div.stickersConfig div.tabContent {
		height: 565px !important;
	}

	div#magane div.stickersConfig div.pack {
		width: calc(100% - 20px);
		float: left;
		display: flex;
		margin-left: 20px;
		margin-bottom: 10px;
		height: 75px;
	}

	div#magane div.stickersConfig div.pack div.handle,
	div#magane div.stickersConfig div.pack div.preview,
	div#magane div.stickersConfig div.pack div.action {
		flex: none;
		width: 75px;
		height: 75px;
	}

	div#magane div.stickersConfig div.pack div.preview {
		background-position: center;
		background-size: cover;
		background-repeat: no-repeat;
	}

	div#magane div.stickersConfig div.pack div.handle {
		padding: 20px;
		cursor: move;
		padding-top: 30px;
	}

	div#magane div.stickersConfig div.pack div.handle span {
		background: #555555;
		height: 2px;
		width: 100%;
		display: block;
		margin-bottom: 6px;
	}
	div#magane div.stickersConfig div.pack div.action {
		padding-top: 20px;
		padding-left: 10px;
	}

	div#magane div.stickersConfig div.pack div.info {
		flex: 1;
		padding: 14px;
	}

	div#magane div.stickersConfig div.pack div.info span {
		display: block;
		width: 100%;
		color: #989797;
	}

	div#magane div.stickersConfig div.pack div.info span:nth-of-type(1) {
		font-weight: bold;
		color: #d2d2d2;
	}

	div#magane div.stickersConfig div.pack div.preview img {
		height: 100%;
		width: 100%;
	}

	div#magane a.button {
		-moz-appearance: none;
		-webkit-appearance: none;
		-webkit-box-align: center;
		-ms-flex-align: center;
		align-items: center;
		border: 1px solid transparent;
		border-radius: 3px;
		-webkit-box-shadow: none;
		box-shadow: none;
		display: -webkit-inline-box;
		display: -ms-inline-flexbox;
		display: inline-flex;
		font-size: 1rem;
		height: 1.5em;
		-webkit-box-pack: start;
		-ms-flex-pack: start;
		justify-content: flex-start;
		line-height: 1.5;
		padding-bottom: calc(0.375em - 1px);
		padding-left: calc(0.625em - 1px);
		padding-right: calc(0.625em - 1px);
		padding-top: calc(0.375em - 1px);
		position: relative;
		vertical-align: top;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		background-color: white;
		border-color: #dbdbdb;
		color: #363636;
		cursor: pointer;
		-webkit-box-pack: center;
		-ms-flex-pack: center;
		justify-content: center;
		padding-left: 0.75em;
		padding-right: 0.75em;
		text-align: center;
		white-space: nowrap;
		border-color: transparent;
		color: white;
		background-color: #696080;
	}

	div#magane a.button.is-danger {
		background-color: #883030;
	}

	div#magane a.button:hover, div#magane a.button.is-primary:hover {
		background-color: #4a425f;
	}

	div#magane a.button.is-danger:hover {
		background-color: #652525;
	}

	div#magane div.stickersModal {
		z-index: 2001;
		bottom: 0;
		left: 0;
		position: absolute;
		right: 0;
		top: 0;
		-webkit-box-align: center;
		-ms-flex-align: center;
		align-items: center;
		-webkit-box-pack: center;
		-ms-flex-pack: center;
		justify-content: center;
		overflow: hidden;
		position: fixed;

	}

	div#magane div.stickersModal .modal-background {
		bottom: 0;
		left: 0;
		position: absolute;
		right: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(10, 10, 10, 0.86);
	}

	div#magane div.stickersModal.is-active {
		display: -webkit-box;
		display: -ms-flexbox;
		display: flex;
	}

	div#magane div.stickersModal .modal-content,
	div#magane div.stickersModal .modal-card {
		max-height: calc(100vh - 160px);
		position: absolute;
		width: 640px;
		height: 640px;
		margin-left: -320px;
		margin-top: -320px;
		left: 50%;
		top: 50%;
		background: $darkerBackground;
		overflow: hidden;
	}

	div#magane div.stickersModal .modal .animation-content {
		margin: 0 20px;
	}

	div#magane .tabs {
		height: 75px;
		text-align: center;
	}

	div#magane .tabs .tab {
		color: #888888;
		display: inline-block;
		border: none;
		border-top: 0px transparent;
		border-left: 0px transparent;
		border-right: 0px transparent;
		border-width: 1px;
		border-style: solid;
		border-bottom-color: #888888;
		padding: 20px;
		cursor: pointer;
	}

	div#magane .tabs .tab:hover,
	div#magane .tabs .tab.is-active {
		border-bottom-color: #ffffff;
		color: #fbfbfb;
	}

	div#magane .modal-close {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		-moz-appearance: none;
		-webkit-appearance: none;
		background-color: rgba(10, 10, 10, 0.2);
		border: none;
		border-radius: 290486px;
		cursor: pointer;
		display: inline-block;
		-webkit-box-flex: 0;
		-ms-flex-positive: 0;
		flex-grow: 0;
		-ms-flex-negative: 0;
		flex-shrink: 0;
		font-size: 0;
		outline: none;
		position: relative;
		vertical-align: top;
		background: none;
		position: fixed;
		right: 20px;
		top: 20px;

		height: 32px;
		max-height: 32px;
		max-width: 32px;
		min-height: 32px;
		min-width: 32px;
		width: 32px;
	}

	div#magane .modal-close:before, .modal-close:after {
		background-color: white;
		content: "";
		display: block;
		left: 50%;
		position: absolute;
		top: 50%;
		-webkit-transform: translateX(-50%) translateY(-50%) rotate(45deg);
		transform: translateX(-50%) translateY(-50%) rotate(45deg);
		-webkit-transform-origin: center center;
		transform-origin: center center;
	}

	div#magane .modal-close:before {
		height: 2px;
		width: 50%;
	}

	div#magane .modal-close:after {
		height: 50%;
		width: 2px;
	}

	div#magane .modal-close:hover, .modal-close:focus {
		background-color: rgba(10, 10, 10, 0.3);
	}


</style>

<style lang="scss">
	iframe#localStorageIframe { display: none }

	$darkishBackground: #4b4c4e;
	$darkBackground: #202225;

	.vb > .vb-dragger {
		z-index: 2005;
		width: 12px;
		right: 0;
	}

	.vb > .vb-dragger > .vb-dragger-styler {
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		-webkit-transform: rotate3d(0,0,0,0);
		transform: rotate3d(0,0,0,0);
		-webkit-transition:
			background-color 100ms ease-out,
			margin 100ms ease-out,
			height 100ms ease-out;
		transition:
			background-color 100ms ease-out,
			margin 100ms ease-out,
			height 100ms ease-out;
		background-color: $darkBackground;
		margin: 5px 5px 5px 0;
		border-radius: 20px;
		height: calc(100% - 10px);
		display: block;
	}

	.vb.vb-scrolling-phantom > .vb-dragger > .vb-dragger-styler {
		background-color: $darkishBackground;
	}

	.vb > .vb-dragger:hover > .vb-dragger-styler {
		background-color: $darkishBackground;
		margin: 0px;
		height: 100%;
	}

	.vb.vb-dragging > .vb-dragger > .vb-dragger-styler {
		background-color: $darkishBackground;
		margin: 0px;
		height: 100%;
	}

	.vb.vb-dragging-phantom > .vb-dragger > .vb-dragger-styler {
		background-color: $darkishBackground;
	}

</style>
