/**
 * @name Magane
 * @displayName Magane
 * @description Bringing LINE stickers to Discord in a chaotic way. BetterDiscord-plugin edition.
 * @author Kana, Bobby
 * @authorId 176200089226706944
 * @authorLink https://github.com/Pitu
 * @license MIT - https://opensource.org/licenses/MIT
 * @invite 5g6vgwn
 * @source https://github.com/Pitu/Magane
 * @updateUrl https://raw.githubusercontent.com/Pitu/Magane/master/dist/magane.plugin.js
 * @website https://magane.moe
 * @donate https://github.com/sponsors/Pitu
 * @patreon https://patreon.com/pitu
 * @version 4.0.0
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/styles/main.css":
/*!*****************************!*\
  !*** ./src/styles/main.css ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ("");

/***/ }),

/***/ "./src/component.ts":
/*!**************************!*\
  !*** ./src/component.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MyComponent)
/* harmony export */ });
// @ts-expect-error
var BdApi = window.BdApi;
var ce = BdApi.React.createElement;
var useState = BdApi.React.useState;
function MyComponent(_a) {
    var _b = _a.disabled, disabled = _b === void 0 ? false : _b;
    var _c = useState(disabled), isDisabled = _c[0], setDisabled = _c[1];
    return ce('button', { className: 'my-component', disabled: isDisabled }, 'Hello World!');
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _styles_main_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./styles/main.css */ "./src/styles/main.css");
/* harmony import */ var _component__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./component */ "./src/component.ts");


// @ts-expect-error
var BdApi = window.BdApi;
var Magane = /** @class */ (function () {
    function Magane(meta) {
        this.meta = meta;
    }
    Magane.prototype.start = function () {
        BdApi.DOM.addStyle(this.meta.name, _styles_main_css__WEBPACK_IMPORTED_MODULE_0__["default"]);
    };
    Magane.prototype.stop = function () {
        BdApi.DOM.removeStyle(this.meta.name);
    };
    Magane.prototype.getSettingsPanel = function () {
        return _component__WEBPACK_IMPORTED_MODULE_1__["default"];
    };
    return Magane;
}());
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Magane);

})();

module.exports = __webpack_exports__["default"];
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFnYW5lLnBsdWdpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpRUFBZSxFQUFFOzs7Ozs7Ozs7Ozs7OztBQ0FqQixtQkFBbUI7QUFDbkIsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUMzQixJQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQztBQUM3QixZQUFRLEdBQUssS0FBSyxDQUFDLEtBQUssU0FBaEIsQ0FBaUI7QUFFbEIsU0FBUyxXQUFXLENBQUMsRUFBb0I7UUFBbEIsZ0JBQWdCLEVBQWhCLFFBQVEsbUJBQUcsS0FBSztJQUMvQyxTQUE0QixRQUFRLENBQUMsUUFBUSxDQUFDLEVBQTdDLFVBQVUsVUFBRSxXQUFXLFFBQXNCLENBQUM7SUFDckQsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDMUYsQ0FBQzs7Ozs7OztVQ1JEO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7Ozs7O0FDTnVDO0FBQ0Q7QUFFdEMsbUJBQW1CO0FBQ25CLElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFFM0I7SUFHQyxnQkFBWSxJQUFTO1FBQ3BCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxzQkFBSyxHQUFMO1FBQ0MsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsd0RBQU0sQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxxQkFBSSxHQUFKO1FBQ0MsS0FBSyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQsaUNBQWdCLEdBQWhCO1FBQ0MsT0FBTyxrREFBVyxDQUFDO0lBQ3BCLENBQUM7SUFDRixhQUFDO0FBQUQsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL21hZ2FuZS8uL3NyYy9zdHlsZXMvbWFpbi5jc3MiLCJ3ZWJwYWNrOi8vbWFnYW5lLy4vc3JjL2NvbXBvbmVudC50cyIsIndlYnBhY2s6Ly9tYWdhbmUvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vbWFnYW5lL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9tYWdhbmUvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9tYWdhbmUvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9tYWdhbmUvLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgXCJcIjsiLCIvLyBAdHMtZXhwZWN0LWVycm9yXHJcbmNvbnN0IEJkQXBpID0gd2luZG93LkJkQXBpO1xyXG5jb25zdCBjZSA9IEJkQXBpLlJlYWN0LmNyZWF0ZUVsZW1lbnQ7XHJcbmNvbnN0IHsgdXNlU3RhdGUgfSA9IEJkQXBpLlJlYWN0O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gTXlDb21wb25lbnQoeyBkaXNhYmxlZCA9IGZhbHNlIH0pIHtcclxuXHRjb25zdCBbaXNEaXNhYmxlZCwgc2V0RGlzYWJsZWRdID0gdXNlU3RhdGUoZGlzYWJsZWQpO1xyXG5cdHJldHVybiBjZSgnYnV0dG9uJywgeyBjbGFzc05hbWU6ICdteS1jb21wb25lbnQnLCBkaXNhYmxlZDogaXNEaXNhYmxlZCB9LCAnSGVsbG8gV29ybGQhJyk7XHJcbn1cclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgc3R5bGVzIGZyb20gJy4vc3R5bGVzL21haW4uY3NzJztcclxuaW1wb3J0IE15Q29tcG9uZW50IGZyb20gJy4vY29tcG9uZW50JztcclxuXHJcbi8vIEB0cy1leHBlY3QtZXJyb3JcclxuY29uc3QgQmRBcGkgPSB3aW5kb3cuQmRBcGk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYWdhbmUge1xyXG5cdG1ldGE6IGFueTtcclxuXHJcblx0Y29uc3RydWN0b3IobWV0YTogYW55KSB7XHJcblx0XHR0aGlzLm1ldGEgPSBtZXRhO1xyXG5cdH1cclxuXHJcblx0c3RhcnQoKSB7XHJcblx0XHRCZEFwaS5ET00uYWRkU3R5bGUodGhpcy5tZXRhLm5hbWUsIHN0eWxlcyk7XHJcblx0fVxyXG5cclxuXHRzdG9wKCkge1xyXG5cdFx0QmRBcGkuRE9NLnJlbW92ZVN0eWxlKHRoaXMubWV0YS5uYW1lKTtcclxuXHR9XHJcblxyXG5cdGdldFNldHRpbmdzUGFuZWwoKSB7XHJcblx0XHRyZXR1cm4gTXlDb21wb25lbnQ7XHJcblx0fVxyXG59XHJcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==