<template>
	<div id="magane">
		<div class="channel-textarea-emoji channel-textarea-stickers" @click="stickerWindowActive = !stickerWindowActive"></div>
		<div class="stickerWindow" v-show="stickerWindowActive">
			<!--<div class="handle" id="maganeDragHandle"></div>-->
			<!--<div class="search">
				<input type="text">
			</div>-->
			<div class="stickers" id="stickers">
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
</template>

<script>
/* .
		TODO:
			- No devolver la ruta completa del pack desde la api
*/
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
	@import url('./style.scss');
</style>

<style lang="scss">
	iframe#localStorageIframe { display: none }
</style>
