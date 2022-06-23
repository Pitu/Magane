/* global BdApi */
const App = require('./App.svelte');

module.exports = class MaganeBD {
	log(message, type = 'log') {
		return console[type]('%c[MaganeBD]%c', 'color: #3a71c1; font-weight: 700', '', message);
	}

	load() {}

	start() {
		for (const id of Object.keys(global.MAGANE_STYLES)) {
			BdApi.injectCSS(`${this.constructor.name}-${id}`, global.MAGANE_STYLES[id]);
		}
		this.log('Mounting container into DOM\u2026');
		this.container = document.createElement('div');
		this.container.id = 'maganeContainer';
		document.body.appendChild(this.container);
		this.app = new App({
			target: this.container
		});
	}

	stop() {
		if (this.app) {
			this.log('Destroying Svelte component\u2026');
			this.app.$destroy();
		}
		if (this.container) {
			this.log('Removing container from DOM\u2026');
			this.container.remove();
		}
		for (const id of Object.keys(global.MAGANE_STYLES)) {
			BdApi.clearCSS(`${this.constructor.name}-${id}`);
		}
	}
};
