//META{"name":"magane"}*//
const magane = function() {};
magane.prototype.vars = {
	className: 'magane-script',
	src: 'http://localhost:10001/magane.js',
	unloadIds: [
		'maganeContainer',
		'localStorageIframe'
	],
	styleRegex: /^\/\*\*\* Magane \*\*\*\//
};
magane.prototype.start = function() {
	// Try to unload first.
	magane.prototype.unload();
	const element = document.createElement('script');
	element.className = magane.prototype.vars.className;
	element.setAttribute('src', magane.prototype.vars.src);
	document.head.appendChild(element);
	console.log(`[MAGANE-BD] > appendChild(): .${magane.prototype.vars.className}`);
};
magane.prototype.load = function() {};
magane.prototype.unload = function() {};
magane.prototype.stop = function() {
	// Destroy styles
	for (const style of document.head.getElementsByTagName('style')) {
		if (style.getAttribute('type') === 'text/css') {
			if (magane.prototype.vars.styleRegex.test(style.innerText)) {
				style.parentNode.removeChild(style);
				console.log(`[MAGANE-BD] > removeChild(): ${magane.prototype.vars.styleRegex.toString()}`);
			}
		}
	}
	// Destroy elements
	for (const id of magane.prototype.vars.unloadIds) {
		const element = document.getElementById(id);
		if (element) {
			element.parentNode.removeChild(element);
			console.log(`[MAGANE-BD] > removeChild(): #${id}`);
		}
	}
	// Destroy script tags
	const elements = document.head.getElementsByClassName(magane.prototype.vars.className);
	for (const element of elements) {
		element.parentNode.removeChild(element);
	}
};
magane.prototype.getSettingsPanel = function() {};
magane.prototype.getName = function() { return 'Magane (DEV)'; };
magane.prototype.getDescription = function() { return 'Bringing LINE stickers to Discord in a chaotic way.'; };
magane.prototype.getVersion = function() { return '0.2.0-DEV'; };
magane.prototype.getAuthor = function() { return 'Kana'; };
