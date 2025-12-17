/* global BdApi */
const App = require('./App.svelte');

module.exports = class MaganeBD {
	log(message, type = 'log') {
		return console[type]('%c[MaganeBD]%c', 'color: #3a71c1; font-weight: 700', '', message);
	}

	load() {}

	start() {
		for (const id of Object.keys(global.MAGANE_STYLES)) {
			const _id = `MaganeBD-${id}`;
			const style = document.createElement('style');
			style.id = _id;
			style.innerText = global.MAGANE_STYLES[id];
			document.head.appendChild(style);
			this.log(`Injected CSS with ID "${_id}".`);
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
			this.app.$destroy();
			this.log('Destroyed Svelte component.');
		}
		if (this.container) {
			this.container.remove();
			this.log('Removed container from DOM.');
		}
		for (const id of Object.keys(global.MAGANE_STYLES)) {
			const _id = `MaganeBD-${id}`;
			const _style = document.querySelector(`head style#${_id}`);
			if (_style) {
				_style.remove();
				this.log(`Cleared CSS with ID "${_id}".`);
			}
		}
	}
};
