//META{"name":"magane"}*//
const magane = function() {};
magane.prototype.vars = {
	id: 'magane-script',
	src: 'http://localhost:10001/magane.js',
	unloadIds: [
		'maganeContainer',
		'localStorageIframe'
	]
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
	console.log(`[MAGANE-BD] > appendChild(): #${magane.prototype.vars.id}`);
};
magane.prototype.unload = function() {
	const ids = magane.prototype.vars.unloadIds.concat([magane.prototype.vars.id]);
	for (const id of ids) {
		const element = document.getElementById(id);
		if (element) {
			element.parentNode.removeChild(element);
			console.log(`[MAGANE-BD] > removeChild(): #${id}`);
		}
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
