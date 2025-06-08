/* global definePlugin */
const App = require('./App.svelte');

export default definePlugin({
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
			const style = document.createElement('style');
			style.id = `MaganeVencord-${id}`;
			style.innerText = window.MAGANE_STYLES[id];
			document.head.appendChild(style);
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
			this.log('Destroying Svelte component\u2026');
			this.app.$destroy();
		}
		if (this.container) {
			this.log('Removing container from DOM\u2026');
			this.container.remove();
		}
		for (const id of Object.keys(window.MAGANE_STYLES)) {
			const _style = document.head.getElementById(`MaganeVencord-${id}`);
			if (_style) {
				_style.remove();
			}
		}
	}
});
