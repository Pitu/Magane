import Vue from 'vue';
import App from './App.vue';
import VueScrollTo from 'vue-scrollto';

Vue.use(VueScrollTo);

let loadTimer = setInterval(() => {
	appendableElement = document.querySelector('[class^="channelTextArea"] [class^="inner"]')
	|| document.querySelector('.channel-textarea-inner');
	if (appendableElement !== null) {
		clearInterval(loadTimer);
		prepareDOM();
	}
}, 1000);

const elemName = 'maganeContainer';
let appendableElement = null;
let maganeContainer = null;
let lastKnownLocation = null;

function prepareDOM() {
	maganeContainer = document.createElement('div');
	maganeContainer.id = elemName;
	appendableElement.appendChild(maganeContainer);

	new Vue({
		el: `#${elemName}`,
		render: h => h(App)
	});
}
