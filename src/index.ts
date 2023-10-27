import styles from './styles/main.css';
import MyComponent from './component';

// @ts-expect-error
const BdApi = window.BdApi;

export default class Magane {
	meta: any;

	constructor(meta: any) {
		this.meta = meta;
	}

	start() {
		BdApi.DOM.addStyle(this.meta.name, styles);
	}

	stop() {
		BdApi.DOM.removeStyle(this.meta.name);
	}

	getSettingsPanel() {
		return MyComponent;
	}
}
