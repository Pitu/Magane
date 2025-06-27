/* global definePlugin */
const App = require('./App.svelte');

module.exports = definePlugin({
	name: 'MaganeVencord',
	authors: [
		{
			id: 176200089226706944n,
			name: 'Pitu'
		},
		{
			id: 530445553562025984n,
			name: 'Bobby'
		}
	],
	description: 'Bringing LINE stickers to Discord in a chaotic way. Vencord edition.',

	log(message, type = 'log') {
		return console[type]('%c[MaganeVencord]%c', 'color: #3a71c1; font-weight: 700', '', message);
	},

	start() {
		for (const id of Object.keys(window.MAGANE_STYLES)) {
			const _id = `MaganeVencord-${id}`;
			const style = document.createElement('style');
			style.id = _id;
			style.innerText = window.MAGANE_STYLES[id];
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
	},

	stop() {
		if (this.app) {
			this.app.$destroy();
			this.log('Destroyed Svelte component.');
		}
		if (this.container) {
			this.container.remove();
			this.log('Removed container from DOM.');
		}
		for (const id of Object.keys(window.MAGANE_STYLES)) {
			const _id = `MaganeVencord-${id}`;
			const _style = document.querySelector(`head style#${_id}`);
			if (_style) {
				_style.remove();
				this.log(`Cleared CSS with ID "${_id}".`);
			}
		}
	}
});
