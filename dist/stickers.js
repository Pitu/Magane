/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

const Client = __webpack_require__(1);
const client = new Client();

client.injectStyle();
client.checkAuth();


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

const CSS = __webpack_require__(2);
const GUI = __webpack_require__(3);

class Client {
	constructor() {
		this.localStorage = document.body.appendChild(document.createElement('iframe')).contentWindow.localStorage;
		this.onCooldown = false;

		this.GUI = new GUI(this, this.localStorage);
	}

	injectStyle() {
		const type = 'text/css';
		const style = document.createElement('style');
		const content = CSS.Style;
		const styling = {
			type,
			style,
			content,
			apply: function() { // eslint-disable-line func-names
				this.style.type = type;
				this.style.appendChild(document.createTextNode(content));
				document.head.appendChild(style);
			}
		};
		styling.apply();
	}

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

	async sendSticker(sticker, channel, token = this.localStorage.token) {
		if (this.onCooldown) return;
		this.onCooldown = true;
		const response = await fetch(sticker.file, { cache: 'force-cache' });
		const myBlob = await response.blob();
		const formData = new FormData();
		formData.append('file', myBlob, sticker.name);
		token = token.replace(/"/ig, '');
		token = token.replace(/^Bot\s*/i, '');
		fetch(`https://discordapp.com/api/channels/${channel}/messages`, {
			headers: { Authorization: token },
			method: 'POST',
			body: formData
		});

		setTimeout(() => this.onCooldown = false, 1000); // eslint-disable-line no-return-assign
	}
}

module.exports = Client;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

exports.Style = `
div#boot-modal { display: none; }
div.channel-textarea-stickers {
    position: absolute;
    top: 12px !important;
    right: 45px;
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
}

div.channel-textarea-stickers:hover {
    transform: scale(1.275);
    -webkit-transform: scale(1.275);
    filter: grayscale(0%);
    -webkit-filter: grayscale(0%);
}

div.sticker-selector {
	z-index: 2000;
	display: none;
	bottom: 46px;
    right: 0px;
	width: 600px;
}

div.sticker-selector.active { display: block; }
.sticker-selector .emoji-picker .scroller .row { height: 96px; }

.emoji-picker .scroller .emoji-item.sticker {
	width: 88px;
	height: 88px;
    position: relative;
}

.emoji-picker .scroller .emoji-item.sticker.favorited .sticker-fav {
    background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');
    background-position: -462px -132px;
    background-size: 924px 704px;
    position: absolute;
    right: 5px;
    bottom: 5px;
    width: 22px;
    height: 22px;
}

.diversity-selector .item.sticker-settings-btn {
    background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');
    background-position: 0px -330px;
    background-size: 924px 704px;
    padding: 0px;
    margin-top: 3px;
}

.kuro-stickers .popout .emoji-picker .scroller-wrap,
.kuro-stickers .popout .emoji-picker .scroller-wrap .scroller {
    min-height: 400px;
}

.sticker-container, .config-container {
    display: block;
}

.sticker-container.hidden, .config-container.hidden {
    display: none;
}

.pack-container {
    position: relative;
    cursor: pointer;
}

.pack-container > img {
    background: #efefef;
}

.pack-name, .pack-length {
    color: #98aab6;
    font-size: 12px;
    font-weight: 500;
    padding: 0 4px;
    text-transform: uppercase;
    position: absolute;
    left: 65px;
    top: 14px;
}

.pack-length {
    top: 27px;
}

.pack-status.active {
    background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');
    /*background-position: -484px -132px;*/
    background-position: -176px -396px;
    background-size: 924px 704px;
    position: absolute;
    right: 12px;
    top: 13px;
    width: 22px;
    height: 22px;
    margin: 3px;
}

.pack-divider {
    width: 50%;
    height: 1px;
    background: #e8e8e8;
    margin-left: 25%;
    margin-top: 10px;
    margin-bottom: 10px;
}
`;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

class GUI {
	constructor(client, localStorage) {
		Object.defineProperty(this, 'client', { value: client });
		this.localStorage = localStorage;

		this.lastKnownLocation; // eslint-disable-line no-unused-expressions
		this.popupWindow; // eslint-disable-line no-unused-expressions
		this.appendableElement; // eslint-disable-line no-unused-expressions
		this.kuroStickers; // eslint-disable-line no-unused-expressions
		this.stickersButton; // eslint-disable-line no-unused-expressions
		this.configContainer; // eslint-disable-line no-unused-expressions
		this.stickerContainer; // eslint-disable-line no-unused-expressions
		this.configButton; // eslint-disable-line no-unused-expressions
		this.favoriteStickers; // eslint-disable-line no-unused-expressions
		this.subscribedPacks; // eslint-disable-line no-unused-expressions
		this.favoriteStickers; // eslint-disable-line no-unused-expressions
		this.favoritePack = {
			name: 'favorites',
			files: []
		};

		this.loadTimer = setInterval(async () => {
			const appendableElement = document.querySelector('[class^="channelTextArea"] [class^="inner"]')
			|| document.querySelector('.channel-textarea-inner');
			if (appendableElement !== null) {
				clearInterval(this.loadTimer);
				await this.prepareDOM();
			}
		}, 1000);
	}

	async processStickers() {
		const response = await fetch('https://lolisafe.moe/stickers.json');
		const packs = await response.json();
		this.updateConfigGUI(packs);
	}

	updateConfigGUI(fetchedStickers) {
		if (!this.localStorage.subscribedPacks) this.localStorage.subscribedPacks = JSON.stringify([]);
		if (!this.localStorage.favoriteStickers) this.localStorage.favoriteStickers = JSON.stringify([]);
		this.subscribedPacks = JSON.parse(this.localStorage.subscribedPacks);
		this.favoriteStickers = JSON.parse(this.localStorage.favoriteStickers);
		for (const pack of fetchedStickers) {
			let image = pack.files[0].thumb;
			if (!image) image = pack.files[0].file;
			let subscribed = '';
			if (this.subscribedPacks.includes(pack.name)) subscribed = ' active';

			const sticker = document.createElement('div');
			sticker.className = 'pack-container';
			sticker.innerHTML = `
				<img src="${image}" style="width: 50px; height: 50px;">
				<div class="pack-name">${pack.name}</div>
				<div class="pack-length">${pack.files.length} Stickers</div>
				<div class="pack-status ${subscribed}"></div>
			`;

			sticker.addEventListener('click', () => {
				sticker.querySelector('.pack-status').classList.toggle('active');
				if (this.subscribedPacks.includes(pack.name)) this.subscribedPacks.splice(this.subscribedPacks.indexOf(pack.name), 1);
				else this.subscribedPacks.push(pack.name);
				this.localStorage.subscribedPacks = JSON.stringify(this.subscribedPacks);
				this.updateStickersGUI(fetchedStickers, this.subscribedPacks);
			});
			const divider = document.createElement('div');
			divider.className = 'pack-divider';
			this.configContainer.appendChild(sticker);
			this.configContainer.appendChild(divider);
		}
		this.updateStickersGUI(fetchedStickers);
	}

	updateStickersGUI(fetchedStickers) {
		while (this.stickerContainer.firstChild) this.stickerContainer.removeChild(this.stickerContainer.firstChild);

		let stickersToProcess = [];
		if (this.favoriteStickers.length > 0) {
			this.favoritePack.files = this.favoriteStickers;
			stickersToProcess.push(this.favoritePack);
		}

		for (let pack of fetchedStickers) stickersToProcess.push(pack);

		for (const pack of stickersToProcess) {
			if (pack.name !== 'favorites') if (!this.subscribedPacks.includes(pack.name)) continue;
			const title = document.createElement('div');
			title.className = 'category';
			title.innerText = `${pack.name} - ${pack.files.length} Stickers`;
			this.stickerContainer.appendChild(title);

			for (const sticker of pack.files) {
				let image = sticker.thumb;
				if (!image) image = sticker.file;
				const st = document.createElement('div');
				st.className = 'emoji-item sticker';
				st.style.backgroundImage = `url(${image})`;
				this.stickerContainer.appendChild(st);

				const favIcon = document.createElement('div');
				favIcon.className = 'sticker-fav';
				st.appendChild(favIcon);

				for (let fav of this.favoriteStickers) {
					if (fav.name === sticker.name) {
						st.classList.toggle('favorited');
						break;
					}
				}

				st.addEventListener('click', async () => {
					await this.client.sendSticker(sticker, window.location.href.split('/').slice(-1)[0]);
					this.popupWindow.classList.toggle('active');
				});

				st.addEventListener('contextmenu', ev => {
					ev.preventDefault();

					let found = false;
					let index = 0;
					for (let fav of this.favoriteStickers) {
						if (fav.name === sticker.name) {
							this.favoriteStickers.splice(index, 1);
							found = true;
						}
						index++;
					}
					if (!found) this.favoriteStickers.push(sticker);
					this.localStorage.favoriteStickers = JSON.stringify(this.favoriteStickers);
					this.updateStickersGUI(fetchedStickers);
					return false;
				}, false);
			}
		}
	}

	async prepareDOM() {
		this.kuroStickers = document.createElement('div');
		this.kuroStickers.className = 'kuro-stickers';
		this.createPopupWindow();
		this.stickersButton = document.createElement('div');
		this.stickersButton.className = 'channel-textarea-emoji channel-textarea-stickers';
		this.stickersButton.addEventListener('click', () => this.popupWindow.classList.toggle('active'));
		this.kuroStickers.appendChild(this.stickersButton);
		this.kuroStickers.appendChild(this.popupWindow);
		this.configButton = this.kuroStickers.querySelector('.sticker-settings-btn');
		this.configButton.classList.toggle('hidden');
		this.stickerContainer = this.kuroStickers.querySelector('.sticker-container');
		this.configContainer = this.kuroStickers.querySelector('.config-container');
		this.configButton.addEventListener('click', () => this.configContainer.classList.toggle('hidden'));
		await this.processStickers();
		setInterval(() => {
			if (window.location.href !== this.lastKnownLocation) {
				this.lastKnownLocation = window.location.href;
				this.checkDOM();
			}
		}, 1000);
	}

	createPopupWindow() {
		this.popupWindow = document.createElement('div');
		this.popupWindow.className = 'popout popout-top-right no-arrow no-shadow sticker-selector';
		this.popupWindow.innerHTML = `
			<div class="emoji-picker">
				<div class="dimmer"></div>
				<div class="header">
					<div class="search-bar search-bar-light">
						<div class="search-bar-inner">
							<input type="text" placeholder="Search stickers" value="" />
							<div class="search-bar-icon">
								<i class="icon icon-search-bar-eye-glass visible"></i>
								<i class="icon icon-search-bar-clear"></i>
							</div>
						</div>
					</div>
					<div class="diversity-selector">
						<div class="item sticker-settings-btn"></div>
					</div>
				</div>
				<div class="scrollerWrap-2uBjct scroller-wrap scrollerThemed-19vinI themeLight-1WK0Av scrollerFade-28dRsO scrollerTrack-3hhmU0">
					<div class="scroller-fzNley scroller sticker-container"></div>
					<div class="scroller-fzNley scroller config-container hidden">
						<div class="category">Subscribed sticker pack list</div>
					</div>
				</div>
			</div>
		`;
	}

	checkDOM() {
		this.appendableElement = document.querySelector('[class^="channelTextArea"] [class^="inner"]')
		|| document.querySelector('.channel-textarea-inner');
		if (this.appendableElement !== null) this.appendableElement.appendChild(this.kuroStickers);
	}
}

module.exports = GUI;


/***/ })
/******/ ]);