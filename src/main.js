import App from './App.svelte';
const searchForElement = '[class*=baseLayer] > [class*=container] > [class*=base]';

const prepareDOM = () => {
	console.log('[MAGANE] > checkDOM()');
	let maganeContainer = document.getElementById('maganeContainer');
	if (maganeContainer) return;

	const appendableElement = document.querySelector(searchForElement);
	if (!appendableElement) {
		return setTimeout(() => prepareDOM(), 500);
	}

	console.log('[MAGANE] > DOM ready, injecting!');
	maganeContainer = document.createElement('div');
	maganeContainer.id = 'maganeContainer';
	appendableElement.insertAdjacentElement('afterbegin', maganeContainer);

	new App({
		target: maganeContainer
	});
}

prepareDOM();

export default app;
