const CSS = require('./style');
const GUI = require('../gui/GUI');

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
