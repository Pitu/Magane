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
		this.stickerPacks = [];

		this.loadTimer = setInterval(async () => {
			const appendableElement = document.querySelector('[class^="channelTextArea"] [class^="inner"]')
			|| document.querySelector('.channel-textarea-inner');
			if (appendableElement !== null) {
				clearInterval(this.loadTimer);
				await this.prepareDOM();
			}
		});
	}

	async processStickers() {
		const response = await fetch('https://lolisafe.moe/stickers.json');
		const packs = await response.json();
		this.updateConfigGUI(packs);
		// Not needed anymore? this.updateStickersGUI(packs);
	}

	updateConfigGUI(fetchedStickers) {
		if (!this.localStorage.subscribedPacks) this.localStorage.subscribedPacks = JSON.stringify([]);
		const subscribedPacks = JSON.parse(this.localStorage.subscribedPacks);
		for (const pack of fetchedStickers) {
			let image = pack.files[0].thumb;
			if (!image) image = pack.files[0].file;
			let subscribed = '';
			if (subscribedPacks.includes(pack.name)) subscribed = ' active';

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
				if (subscribedPacks.includes(pack.name)) subscribedPacks.splice(subscribedPacks.indexOf(pack.name), 1);
				else subscribedPacks.push(pack.name);
				this.localStorage.subscribedPacks = JSON.stringify(subscribedPacks);
				this.updateStickersGUI(fetchedStickers, subscribedPacks);
			});
			const divider = document.createElement('div');
			divider.className = 'pack-divider';
			this.configContainer.appendChild(sticker);
			this.configContainer.appendChild(divider);
			this.updateStickersGUI(fetchedStickers, subscribedPacks);
		}
	}

	updateStickersGUI(fetchedStickers, subscribedPacks) {
		if (this.stickerPacks.length === fetchedStickers.length) return;
		while (this.stickerContainer.firstChild) this.stickerContainer.removeChild(this.stickerContainer.firstChild);

		for (const pack of fetchedStickers) {
			if (!subscribedPacks.includes(pack.name)) continue;
			this.stickerPacks.push(fetchedStickers);
			const title = document.createElement('div');
			title.className = 'category';
			title.id = pack.name;
			title.innerText = `${pack.name} - ${pack.files.length} Stickers`;
			this.stickerContainer.appendChild(title);

			for (const sticker of pack.files) {
				let image = sticker.thumb;
				if (!image) image = sticker.file;
				const st = document.createElement('div');
				st.className = 'emoji-item sticker';
				st.style.backgroundImage = `url(${image})`;
				this.stickerContainer.appendChild(st);

				st.addEventListener('click', async () => {
					await this.client.sendSticker(sticker, window.location.href.split('/').slice(-1)[0]);
					this.popupWindow.classList.toggle('active');
				});

				st.addEventListener('contextmenu', ev => {
					ev.preventDefault();
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
					<div class="scroller-fzNley scroller sticker-container">
						<!--
						<div class="row"></div>
						-->
					</div>
					<div class="scroller-fzNley scroller config-container hidden">
						<div class="category">Subscribed sticker pack list</div>
					</div>
				</div>

				<!--
				<div class="categories sticker-packs">
					<div class="item recent selected"></div>
					<div class="item custom"></div>
					<div class="item people"></div>
					<div class="item nature"></div>
					<div class="item food"></div>
					<div class="item activity"></div>
					<div class="item travel"></div>
					<div class="item objects"></div>
					<div class="item symbols"></div>
					<div class="item flags"></div>
				</div>
				-->
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
