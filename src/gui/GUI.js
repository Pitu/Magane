class GUI {
	constructor(client, localStorage) {
		Object.defineProperty(this, 'client', { value: client });
		this.localStorage = localStorage;

		this.lastKnownLocation; // eslint-disable-line no-unused-expressions
		this.popupWindow; // eslint-disable-line no-unused-expressions
		this.showingPopupWindow = false;
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

		const stickersToProcess = [];
		if (this.favoriteStickers.length > 0) {
			this.favoritePack.files = this.favoriteStickers;
			stickersToProcess.push(this.favoritePack);
		}

		for (const pack of fetchedStickers) stickersToProcess.push(pack);
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

				for (const fav of this.favoriteStickers) {
					if (fav.name === sticker.name) {
						st.classList.toggle('favorited');
						break;
					}
				}

				st.addEventListener('click', async () => {
					this.toggleStickerWindow();
					await this.client.sendSticker(sticker, window.location.href.split('/').slice(-1)[0]);
				});

				st.addEventListener('contextmenu', ev => {
					ev.preventDefault();

					let found = false;
					let index = 0;
					for (const fav of this.favoriteStickers) {
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
		this.stickersButton.addEventListener('click', () => this.toggleStickerWindow(), false);
		this.kuroStickers.appendChild(this.stickersButton);
		this.kuroStickers.appendChild(this.popupWindow);
		this.configButton = this.kuroStickers.querySelector('.sticker-settings-btn');
		this.configButton.classList.toggle('hidden');
		this.stickerContainer = this.kuroStickers.querySelector('.sticker-container');
		this.configContainer = this.kuroStickers.querySelector('.config-container');
		this.configButton.addEventListener('click', () => this.configContainer.classList.toggle('hidden'));
		await this.processStickers();
		document.querySelector('#app-mount').addEventListener('click', event => {
			if (!this.kuroStickers.contains(event.target)) {
				if (this.showingPopupWindow) {
					this.toggleStickerWindow();
				}
			}
		});
		setInterval(() => {
			if (window.location.href !== this.lastKnownLocation) {
				this.lastKnownLocation = window.location.href;
				this.checkDOM();
			}
		}, 1000);
	}

	toggleStickerWindow() {
		this.stickersButton.classList.toggle('active');
		this.popupWindow.classList.toggle('active');
		this.showingPopupWindow = !this.showingPopupWindow;
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
