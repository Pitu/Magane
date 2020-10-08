//META{"name":"magane"}*//
const magane = function() {};
magane.prototype.vars = {
	id: 'magane-script',
	src: 'http://localhost:10001/magane.js'
};
magane.prototype.start = function() {
	return magane.prototype.load();
};
magane.prototype.load = function() {
	// Try to unload first.
	magane.prototype.unload();
	const element = document.createElement('script');
	element.id = magane.prototype.vars.id;
	element.setAttribute('src', magane.prototype.vars.src);
	element.dataset.timestamp = Date.now();
	document.head.appendChild(element);
	console.log('[MAGANE-BD] > appendChild()');
};
magane.prototype.unload = function() {
	const element = document.getElementById(magane.prototype.vars.id);
	if (element) {
		document.head.removeChild(element);
		console.log('[MAGANE-BD] > removeChild()');
	}
};
magane.prototype.stop = function() {
	return magane.prototype.unload();
};
magane.prototype.getSettingsPanel = function() {};
magane.prototype.getName = function() { return 'Magane (DEV)'; };
magane.prototype.getDescription = function() { return 'Bringing LINE stickers to Discord in a chaotic way.'; };
magane.prototype.getVersion = function() { return '0.2.0-DEV'; };
magane.prototype.getAuthor = function() { return 'Kana'; };
