import Vue from 'vue';
import App from './App.vue';
import Vuebar from 'vuebar';
import VueScrollTo from 'vue-scrollto';

Vue.use(Vuebar);
Vue.use(VueScrollTo);

let appendableElement = null;

function prepareDOM() {
	const maganeContainer = document.createElement('div');
	maganeContainer.id = 'maganeContainer';
  appendableElement.insertAdjacentElement('afterbegin', maganeContainer);

	new Vue({
		el: '#maganeContainer',
		render: h => h(App)
	});
}

let loadTimer = setInterval(() => {
	appendableElement = document.querySelector('[class^="channelTextArea"] [class^="inner"] [class^="buttons"]');
	if (appendableElement !== null) {
		clearInterval(loadTimer);
		prepareDOM();
	}
}, 1000);
