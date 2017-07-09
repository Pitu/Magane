/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Client = __webpack_require__(1);
var client = new Client();

client.injectStyle();
client.checkAuth();

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CSS = __webpack_require__(2);
var GUI = __webpack_require__(3);

var Client = function () {
	function Client() {
		_classCallCheck(this, Client);

		this.localStorage = document.body.appendChild(document.createElement('iframe')).contentWindow.localStorage;
		this.onCooldown = false;

		this.GUI = new GUI(this, this.localStorage);
	}

	_createClass(Client, [{
		key: 'injectStyle',
		value: function injectStyle() {
			var type = 'text/css';
			var style = document.createElement('style');
			var content = CSS.Style;
			var styling = {
				type: type,
				style: style,
				content: content,
				apply: function apply() {
					// eslint-disable-line func-names
					this.style.type = type;
					this.style.appendChild(document.createTextNode(content));
					document.head.appendChild(style);
				}
			};
			styling.apply();
		}
	}, {
		key: 'checkAuth',
		value: function () {
			var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
				var _this = this;

				var token = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.localStorage.token;
				var gateway, gatewayJson, wss;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								if (!this.localStorage.canCallAPI) {
									_context.next = 2;
									break;
								}

								return _context.abrupt('return');

							case 2:
								if (!(typeof token !== 'string')) {
									_context.next = 4;
									break;
								}

								throw new Error('Not a token, buddy.');

							case 4:
								token = token.replace(/"/ig, '');
								token = token.replace(/^Bot\s*/i, '');
								_context.next = 8;
								return fetch('https://discordapp.com/api/v7/gateway');

							case 8:
								gateway = _context.sent;
								_context.next = 11;
								return gateway.json();

							case 11:
								gatewayJson = _context.sent;
								wss = new WebSocket(gatewayJson.url + '/?encoding=json&v6');

								wss.onerror = function (error) {
									return console.error(error);
								}; // eslint-disable-line no-console
								wss.onmessage = function (message) {
									try {
										var json = JSON.parse(message.data);
										_this.localStorage.canCallAPI = true;
										json.op === 0 && json.t === 'READY' && wss.close(); // eslint-disable-line no-unused-expressions
										json.op === 10 && wss.send(JSON.stringify({ // eslint-disable-line no-unused-expressions
											op: 2,
											d: { // eslint-disable-line id-length
												token: token,
												properties: { $browser: 'b1nzy is a meme' },
												large_threshold: 50 // eslint-disable-line camelcase
											}
										}));
										console.log('Sucessful authenticated. You can now make REST request!'); // eslint-disable-line no-console
									} catch (error) {
										console.error(error); // eslint-disable-line no-console
									}
								};

							case 15:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function checkAuth() {
				return _ref.apply(this, arguments);
			}

			return checkAuth;
		}()
	}, {
		key: 'sendSticker',
		value: function () {
			var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(sticker, channel) {
				var _this2 = this;

				var token = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.localStorage.token;
				var response, myBlob, formData;
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								if (!this.onCooldown) {
									_context2.next = 2;
									break;
								}

								return _context2.abrupt('return');

							case 2:
								this.onCooldown = true;
								_context2.next = 5;
								return fetch(sticker.file, { cache: 'force-cache' });

							case 5:
								response = _context2.sent;
								_context2.next = 8;
								return response.blob();

							case 8:
								myBlob = _context2.sent;
								formData = new FormData();

								formData.append('file', myBlob, sticker.name);
								token = token.replace(/"/ig, '');
								token = token.replace(/^Bot\s*/i, '');
								fetch('https://discordapp.com/api/channels/' + channel + '/messages', {
									headers: { Authorization: token },
									method: 'POST',
									body: formData
								});

								setTimeout(function () {
									return _this2.onCooldown = false;
								}, 1000); // eslint-disable-line no-return-assign

							case 15:
							case 'end':
								return _context2.stop();
						}
					}
				}, _callee2, this);
			}));

			function sendSticker(_x3, _x4) {
				return _ref2.apply(this, arguments);
			}

			return sendSticker;
		}()
	}]);

	return Client;
}();

module.exports = Client;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.Style = "\ndiv#boot-modal { display: none; }\ndiv.channel-textarea-stickers {\n    position: absolute;\n    top: 12px !important;\n    right: 45px;\n    background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');\n    width: 22px;\n    height: 22px;\n    background-position: -176px -396px;\n    background-size: 924px 704px;\n    background-repeat: no-repeat;\n    transition: border-bottom-color .1s ease-in-out;\n    -webkit-filter: grayscale(100%);\n    filter: grayscale(100%);\n    cursor: pointer;\n}\n\ndiv.channel-textarea-stickers:hover {\n    transform: scale(1.275);\n    -webkit-transform: scale(1.275);\n    filter: grayscale(0%);\n    -webkit-filter: grayscale(0%);\n}\n\ndiv.sticker-selector {\n\tz-index: 2000;\n\tdisplay: none;\n\tbottom: 46px;\n    right: 0px;\n\twidth: 600px;\n}\n\ndiv.sticker-selector.active { display: block; }\n.sticker-selector .emoji-picker .scroller .row { height: 96px; }\n\n.emoji-picker .scroller .emoji-item.sticker {\n\twidth: 88px;\n\theight: 88px;\n    position: relative;\n}\n\n.emoji-picker .scroller .emoji-item.sticker.favorited .sticker-fav {\n    background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');\n    background-position: -462px -132px;\n    background-size: 924px 704px;\n    position: absolute;\n    right: 5px;\n    bottom: 5px;\n    width: 22px;\n    height: 22px;\n}\n\n.diversity-selector .item.sticker-settings-btn {\n    background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');\n    background-position: 0px -330px;\n    background-size: 924px 704px;\n    padding: 0px;\n    margin-top: 3px;\n}\n\n.kuro-stickers .popout .emoji-picker .scroller-wrap,\n.kuro-stickers .popout .emoji-picker .scroller-wrap .scroller {\n    min-height: 400px;\n}\n\n.sticker-container, .config-container {\n    display: block;\n}\n\n.sticker-container.hidden, .config-container.hidden {\n    display: none;\n}\n\n.pack-container {\n    position: relative;\n    cursor: pointer;\n}\n\n.pack-container > img {\n    background: #efefef;\n}\n\n.pack-name, .pack-length {\n    color: #98aab6;\n    font-size: 12px;\n    font-weight: 500;\n    padding: 0 4px;\n    text-transform: uppercase;\n    position: absolute;\n    left: 65px;\n    top: 14px;\n}\n\n.pack-length {\n    top: 27px;\n}\n\n.pack-status.active {\n    background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');\n    /*background-position: -484px -132px;*/\n    background-position: -176px -396px;\n    background-size: 924px 704px;\n    position: absolute;\n    right: 12px;\n    top: 13px;\n    width: 22px;\n    height: 22px;\n    margin: 3px;\n}\n\n.pack-divider {\n    width: 50%;\n    height: 1px;\n    background: #e8e8e8;\n    margin-left: 25%;\n    margin-top: 10px;\n    margin-bottom: 10px;\n}\n";

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GUI = function () {
	function GUI(client, localStorage) {
		var _this = this;

		_classCallCheck(this, GUI);

		Object.defineProperty(this, 'client', { value: client });
		this.localStorage = localStorage;

		this.lastKnownLocation; // eslint-disable-line no-unused-expressions
		this.popupWindow; // eslint-disable-line no-unused-expressions
		this.appendableElement; // eslint-disable-line no-unused-expressions
		this.kuroStickers; // eslint-disable-line no-unused-expressions
		this.stickersButton; // eslint-disable-line no-unused-expressions
		this.configContainer; // eslint-disable-line no-unused-expressions
		this.stickerContainer; // eslint-disable-line no-unused-expressions
		this.configButton; // eslint-disable-line no-unused-expressions
		this.favoriteStickers; // eslint-disable-line no-unused-expressions
		this.subscribedPacks; // eslint-disable-line no-unused-expressions
		this.favoriteStickers; // eslint-disable-line no-unused-expressions
		this.favoritePack = {
			name: 'favorites',
			files: []
		};

		this.loadTimer = setInterval(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
			var appendableElement;
			return regeneratorRuntime.wrap(function _callee$(_context) {
				while (1) {
					switch (_context.prev = _context.next) {
						case 0:
							appendableElement = document.querySelector('[class^="channelTextArea"] [class^="inner"]') || document.querySelector('.channel-textarea-inner');

							if (!(appendableElement !== null)) {
								_context.next = 5;
								break;
							}

							clearInterval(_this.loadTimer);
							_context.next = 5;
							return _this.prepareDOM();

						case 5:
						case 'end':
							return _context.stop();
					}
				}
			}, _callee, _this);
		})), 1000);
	}

	_createClass(GUI, [{
		key: 'processStickers',
		value: function () {
			var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
				var response, packs;
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								_context2.next = 2;
								return fetch('https://lolisafe.moe/stickers.json');

							case 2:
								response = _context2.sent;
								_context2.next = 5;
								return response.json();

							case 5:
								packs = _context2.sent;

								this.updateConfigGUI(packs);

							case 7:
							case 'end':
								return _context2.stop();
						}
					}
				}, _callee2, this);
			}));

			function processStickers() {
				return _ref2.apply(this, arguments);
			}

			return processStickers;
		}()
	}, {
		key: 'updateConfigGUI',
		value: function updateConfigGUI(fetchedStickers) {
			var _this2 = this;

			if (!this.localStorage.subscribedPacks) this.localStorage.subscribedPacks = JSON.stringify([]);
			if (!this.localStorage.favoriteStickers) this.localStorage.favoriteStickers = JSON.stringify([]);
			this.subscribedPacks = JSON.parse(this.localStorage.subscribedPacks);
			this.favoriteStickers = JSON.parse(this.localStorage.favoriteStickers);

			var _loop = function _loop(pack) {
				var image = pack.files[0].thumb;
				if (!image) image = pack.files[0].file;
				var subscribed = '';
				if (_this2.subscribedPacks.includes(pack.name)) subscribed = ' active';

				var sticker = document.createElement('div');
				sticker.className = 'pack-container';
				sticker.innerHTML = '\n\t\t\t\t<img src="' + image + '" style="width: 50px; height: 50px;">\n\t\t\t\t<div class="pack-name">' + pack.name + '</div>\n\t\t\t\t<div class="pack-length">' + pack.files.length + ' Stickers</div>\n\t\t\t\t<div class="pack-status ' + subscribed + '"></div>\n\t\t\t';

				sticker.addEventListener('click', function () {
					sticker.querySelector('.pack-status').classList.toggle('active');
					if (_this2.subscribedPacks.includes(pack.name)) _this2.subscribedPacks.splice(_this2.subscribedPacks.indexOf(pack.name), 1);else _this2.subscribedPacks.push(pack.name);
					_this2.localStorage.subscribedPacks = JSON.stringify(_this2.subscribedPacks);
					_this2.updateStickersGUI(fetchedStickers, _this2.subscribedPacks);
				});
				var divider = document.createElement('div');
				divider.className = 'pack-divider';
				_this2.configContainer.appendChild(sticker);
				_this2.configContainer.appendChild(divider);
			};

			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = fetchedStickers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var pack = _step.value;

					_loop(pack);
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			this.updateStickersGUI(fetchedStickers);
		}
	}, {
		key: 'updateStickersGUI',
		value: function updateStickersGUI(fetchedStickers) {
			var _this3 = this;

			while (this.stickerContainer.firstChild) {
				this.stickerContainer.removeChild(this.stickerContainer.firstChild);
			}var stickersToProcess = [];
			if (this.favoriteStickers.length > 0) {
				this.favoritePack.files = this.favoriteStickers;
				stickersToProcess.push(this.favoritePack);
			}

			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = fetchedStickers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var pack = _step2.value;
					stickersToProcess.push(pack);
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			var _iteratorNormalCompletion3 = true;
			var _didIteratorError3 = false;
			var _iteratorError3 = undefined;

			try {
				for (var _iterator3 = stickersToProcess[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
					var _pack = _step3.value;

					if (_pack.name !== 'favorites') if (!this.subscribedPacks.includes(_pack.name)) continue;
					var title = document.createElement('div');
					title.className = 'category';
					title.innerText = _pack.name + ' - ' + _pack.files.length + ' Stickers';
					this.stickerContainer.appendChild(title);

					var _loop2 = function _loop2(_sticker) {
						var image = _sticker.thumb;
						if (!image) image = _sticker.file;
						var st = document.createElement('div');
						st.className = 'emoji-item sticker';
						st.style.backgroundImage = 'url(' + image + ')';
						_this3.stickerContainer.appendChild(st);

						var favIcon = document.createElement('div');
						favIcon.className = 'sticker-fav';
						st.appendChild(favIcon);

						var _iteratorNormalCompletion5 = true;
						var _didIteratorError5 = false;
						var _iteratorError5 = undefined;

						try {
							for (var _iterator5 = _this3.favoriteStickers[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
								var fav = _step5.value;

								if (fav.name === _sticker.name) {
									st.classList.toggle('favorited');
									break;
								}
							}
						} catch (err) {
							_didIteratorError5 = true;
							_iteratorError5 = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion5 && _iterator5.return) {
									_iterator5.return();
								}
							} finally {
								if (_didIteratorError5) {
									throw _iteratorError5;
								}
							}
						}

						st.addEventListener('click', _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
							return regeneratorRuntime.wrap(function _callee3$(_context3) {
								while (1) {
									switch (_context3.prev = _context3.next) {
										case 0:
											_context3.next = 2;
											return _this3.client.sendSticker(_sticker, window.location.href.split('/').slice(-1)[0]);

										case 2:
											_this3.popupWindow.classList.toggle('active');

										case 3:
										case 'end':
											return _context3.stop();
									}
								}
							}, _callee3, _this3);
						})));

						st.addEventListener('contextmenu', function (ev) {
							ev.preventDefault();

							var found = false;
							var index = 0;
							var _iteratorNormalCompletion6 = true;
							var _didIteratorError6 = false;
							var _iteratorError6 = undefined;

							try {
								for (var _iterator6 = _this3.favoriteStickers[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
									var _fav = _step6.value;

									if (_fav.name === _sticker.name) {
										_this3.favoriteStickers.splice(index, 1);
										found = true;
									}
									index++;
								}
							} catch (err) {
								_didIteratorError6 = true;
								_iteratorError6 = err;
							} finally {
								try {
									if (!_iteratorNormalCompletion6 && _iterator6.return) {
										_iterator6.return();
									}
								} finally {
									if (_didIteratorError6) {
										throw _iteratorError6;
									}
								}
							}

							if (!found) _this3.favoriteStickers.push(_sticker);
							_this3.localStorage.favoriteStickers = JSON.stringify(_this3.favoriteStickers);
							_this3.updateStickersGUI(fetchedStickers);
							return false;
						}, false);
					};

					var _iteratorNormalCompletion4 = true;
					var _didIteratorError4 = false;
					var _iteratorError4 = undefined;

					try {
						for (var _iterator4 = _pack.files[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
							var _sticker = _step4.value;

							_loop2(_sticker);
						}
					} catch (err) {
						_didIteratorError4 = true;
						_iteratorError4 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion4 && _iterator4.return) {
								_iterator4.return();
							}
						} finally {
							if (_didIteratorError4) {
								throw _iteratorError4;
							}
						}
					}
				}
			} catch (err) {
				_didIteratorError3 = true;
				_iteratorError3 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion3 && _iterator3.return) {
						_iterator3.return();
					}
				} finally {
					if (_didIteratorError3) {
						throw _iteratorError3;
					}
				}
			}
		}
	}, {
		key: 'prepareDOM',
		value: function () {
			var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
				var _this4 = this;

				return regeneratorRuntime.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								this.kuroStickers = document.createElement('div');
								this.kuroStickers.className = 'kuro-stickers';
								this.createPopupWindow();
								this.stickersButton = document.createElement('div');
								this.stickersButton.className = 'channel-textarea-emoji channel-textarea-stickers';
								this.stickersButton.addEventListener('click', function () {
									return _this4.popupWindow.classList.toggle('active');
								});
								this.kuroStickers.appendChild(this.stickersButton);
								this.kuroStickers.appendChild(this.popupWindow);
								this.configButton = this.kuroStickers.querySelector('.sticker-settings-btn');
								this.configButton.classList.toggle('hidden');
								this.stickerContainer = this.kuroStickers.querySelector('.sticker-container');
								this.configContainer = this.kuroStickers.querySelector('.config-container');
								this.configButton.addEventListener('click', function () {
									return _this4.configContainer.classList.toggle('hidden');
								});
								_context4.next = 15;
								return this.processStickers();

							case 15:
								setInterval(function () {
									if (window.location.href !== _this4.lastKnownLocation) {
										_this4.lastKnownLocation = window.location.href;
										_this4.checkDOM();
									}
								}, 1000);

							case 16:
							case 'end':
								return _context4.stop();
						}
					}
				}, _callee4, this);
			}));

			function prepareDOM() {
				return _ref4.apply(this, arguments);
			}

			return prepareDOM;
		}()
	}, {
		key: 'createPopupWindow',
		value: function createPopupWindow() {
			this.popupWindow = document.createElement('div');
			this.popupWindow.className = 'popout popout-top-right no-arrow no-shadow sticker-selector';
			this.popupWindow.innerHTML = '\n\t\t\t<div class="emoji-picker">\n\t\t\t\t<div class="dimmer"></div>\n\t\t\t\t<div class="header">\n\t\t\t\t\t<div class="search-bar search-bar-light">\n\t\t\t\t\t\t<div class="search-bar-inner">\n\t\t\t\t\t\t\t<input type="text" placeholder="Search stickers" value="" />\n\t\t\t\t\t\t\t<div class="search-bar-icon">\n\t\t\t\t\t\t\t\t<i class="icon icon-search-bar-eye-glass visible"></i>\n\t\t\t\t\t\t\t\t<i class="icon icon-search-bar-clear"></i>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class="diversity-selector">\n\t\t\t\t\t\t<div class="item sticker-settings-btn"></div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class="scrollerWrap-2uBjct scroller-wrap scrollerThemed-19vinI themeLight-1WK0Av scrollerFade-28dRsO scrollerTrack-3hhmU0">\n\t\t\t\t\t<div class="scroller-fzNley scroller sticker-container"></div>\n\t\t\t\t\t<div class="scroller-fzNley scroller config-container hidden">\n\t\t\t\t\t\t<div class="category">Subscribed sticker pack list</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t';
		}
	}, {
		key: 'checkDOM',
		value: function checkDOM() {
			this.appendableElement = document.querySelector('[class^="channelTextArea"] [class^="inner"]') || document.querySelector('.channel-textarea-inner');
			if (this.appendableElement !== null) this.appendableElement.appendChild(this.kuroStickers);
		}
	}]);

	return GUI;
}();

module.exports = GUI;

/***/ })
/******/ ]);