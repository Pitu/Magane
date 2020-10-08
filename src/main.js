import App from './App.svelte';
const searchForElement = '[class*=baseLayer] > [class*=container] > [class*=base]';

const prepareDOM = () => {
	console.log('[MAGANE] > checkDOM()');
	let maganeContainer = document.getElementById('maganeContainer');
	if (maganeContainer) {
		maganeContainer.parentNode.removeChild(maganeContainer);
		console.log('[MAGANE] > removeChild()');
	}

	const appendableElement = document.querySelector(searchForElement);
	if (!appendableElement) {
		setTimeout(() => prepareDOM(), 500);
		return;
	}

	console.log('[MAGANE] > DOM ready, injecting!');
	maganeContainer = document.createElement('div');
	maganeContainer.id = 'maganeContainer';
	appendableElement.insertAdjacentElement('afterbegin', maganeContainer);

	new App({ // eslint-disable-line no-new
		target: maganeContainer
	});
};

prepareDOM();
