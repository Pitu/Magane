/**
 * @name MaganeVencord
 * @displayName MaganeVencord
 * @description Bringing LINE stickers to Discord in a chaotic way. Vencord edition.
 * @author Kana, Bobby
 * @authorId 176200089226706944
 * @authorLink https://github.com/Pitu
 * @license MIT - https://opensource.org/licenses/MIT
 * @version 3.2.24
 * @invite 5g6vgwn
 * @source https://github.com/Pitu/Magane
 * @updateUrl https://raw.githubusercontent.com/Pitu/Magane/master/dist/maganevencord
 * @website https://magane.moe
 * @donate https://github.com/sponsors/Pitu
 * @patreon https://patreon.com/pitu
 */

"use strict";

import definePlugin from "@utils/types";
import { findByPropsLazy, findLazy } from "@webpack";
import { Alerts, Toasts } from "@webpack/common";
import { Notices } from "@api/index";
import { ApngBlendOp, ApngDisposeOp, parseAPNG } from "@utils/apng";
import { applyPalette, GIFEncoder, quantize } from "gifenc";

function noop() {}

function run(fn) {
	return fn();
}

function blank_object() {
	return Object.create(null);
}

function run_all(fns) {
	fns.forEach(run);
}

function is_function(thing) {
	return "function" == typeof thing;
}

function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || a && "object" == typeof a || "function" == typeof a;
}

let src_url_equal_anchor, current_component;

function src_url_equal(element_src, url) {
	return src_url_equal_anchor || (src_url_equal_anchor = document.createElement("a")), 
	src_url_equal_anchor.href = url, element_src === src_url_equal_anchor.href;
}

function append(target, node) {
	target.appendChild(node);
}

function insert(target, node, anchor) {
	target.insertBefore(node, anchor || null);
}

function detach(node) {
	node.parentNode.removeChild(node);
}

function destroy_each(iterations, detaching) {
	for (let i = 0; i < iterations.length; i += 1) iterations[i] && iterations[i].d(detaching);
}

function element(name) {
	return document.createElement(name);
}

function text(data) {
	return document.createTextNode(data);
}

function space() {
	return text(" ");
}

function listen(node, event, handler, options) {
	return node.addEventListener(event, handler, options), () => node.removeEventListener(event, handler, options);
}

function prevent_default(fn) {
	return function(event) {
		return event.preventDefault(), fn.call(this, event);
	};
}

function stop_propagation(fn) {
	return function(event) {
		return event.stopPropagation(), fn.call(this, event);
	};
}

function attr(node, attribute, value) {
	null == value ? node.removeAttribute(attribute) : node.getAttribute(attribute) !== value && node.setAttribute(attribute, value);
}

function to_number(value) {
	return "" === value ? null : +value;
}

function set_data(text, data) {
	data = "" + data, text.wholeText !== data && (text.data = data);
}

function set_input_value(input, value) {
	input.value = value ?? "";
}

function set_style(node, key, value, important) {
	null === value ? node.style.removeProperty(key) : node.style.setProperty(key, value, important ? "important" : "");
}

function toggle_class(element, name, toggle) {
	element.classList[toggle ? "add" : "remove"](name);
}

class HtmlTag {
	constructor(is_svg = !1) {
		this.is_svg = !1, this.is_svg = is_svg, this.e = this.n = null;
	}
	c(html) {
		this.h(html);
	}
	m(html, target, anchor = null) {
		this.e || (this.is_svg ? this.e = function svg_element(name) {
			return document.createElementNS("http://www.w3.org/2000/svg", name);
		}(target.nodeName) : this.e = element(target.nodeName), this.t = target, this.c(html)), 
		this.i(anchor);
	}
	h(html) {
		this.e.innerHTML = html, this.n = Array.from(this.e.childNodes);
	}
	i(anchor) {
		for (let i = 0; i < this.n.length; i += 1) insert(this.t, this.n[i], anchor);
	}
	p(html) {
		this.d(), this.h(html), this.i(this.a);
	}
	d() {
		this.n.forEach(detach);
	}
}

function set_current_component(component) {
	current_component = component;
}

function get_current_component() {
	if (!current_component) throw new Error("Function called outside component initialization");
	return current_component;
}

function onMount(fn) {
	get_current_component().$$.on_mount.push(fn);
}

function onDestroy(fn) {
	get_current_component().$$.on_destroy.push(fn);
}

function createEventDispatcher() {
	const component = get_current_component();
	return (type, detail, {cancelable = !1} = {}) => {
		const callbacks = component.$$.callbacks[type];
		if (callbacks) {
			const event = function custom_event(type, detail, {bubbles = !1, cancelable = !1} = {}) {
				const e = document.createEvent("CustomEvent");
				return e.initCustomEvent(type, bubbles, cancelable, detail), e;
			}(type, detail, {
				cancelable
			});
			return callbacks.slice().forEach((fn => {
				fn.call(component, event);
			})), !event.defaultPrevented;
		}
		return !0;
	};
}

const dirty_components = [], binding_callbacks = [], render_callbacks = [], flush_callbacks = [], resolved_promise = Promise.resolve();

let update_scheduled = !1;

function add_render_callback(fn) {
	render_callbacks.push(fn);
}

const seen_callbacks = new Set;

let flushidx = 0;

function flush() {
	const saved_component = current_component;
	do {
		for (;flushidx < dirty_components.length; ) {
			const component = dirty_components[flushidx];
			flushidx++, set_current_component(component), update(component.$$);
		}
		for (set_current_component(null), dirty_components.length = 0, flushidx = 0; binding_callbacks.length; ) binding_callbacks.pop()();
		for (let i = 0; i < render_callbacks.length; i += 1) {
			const callback = render_callbacks[i];
			seen_callbacks.has(callback) || (seen_callbacks.add(callback), callback());
		}
		render_callbacks.length = 0;
	} while (dirty_components.length);
	for (;flush_callbacks.length; ) flush_callbacks.pop()();
	update_scheduled = !1, seen_callbacks.clear(), set_current_component(saved_component);
}

function update($$) {
	if (null !== $$.fragment) {
		$$.update(), run_all($$.before_update);
		const dirty = $$.dirty;
		$$.dirty = [ -1 ], $$.fragment && $$.fragment.p($$.ctx, dirty), $$.after_update.forEach(add_render_callback);
	}
}

const outroing = new Set;

function transition_in(block, local) {
	block && block.i && (outroing.delete(block), block.i(local));
}

function destroy_block(block, lookup) {
	block.d(1), lookup.delete(block.key);
}

function make_dirty(component, i) {
	-1 === component.$$.dirty[0] && (dirty_components.push(component), function schedule_update() {
		update_scheduled || (update_scheduled = !0, resolved_promise.then(flush));
	}(), component.$$.dirty.fill(0)), component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}

function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [ -1 ]) {
	const parent_component = current_component;
	set_current_component(component);
	const $$ = component.$$ = {
		fragment: null,
		ctx: null,
		props,
		update: noop,
		not_equal,
		bound: blank_object(),
		on_mount: [],
		on_destroy: [],
		on_disconnect: [],
		before_update: [],
		after_update: [],
		context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
		callbacks: blank_object(),
		dirty,
		skip_bound: !1,
		root: options.target || parent_component.$$.root
	};
	append_styles && append_styles($$.root);
	let ready = !1;
	if ($$.ctx = instance ? instance(component, options.props || {}, ((i, ret, ...rest) => {
		const value = rest.length ? rest[0] : ret;
		return $$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value) && (!$$.skip_bound && $$.bound[i] && $$.bound[i](value), 
		ready && make_dirty(component, i)), ret;
	})) : [], $$.update(), ready = !0, run_all($$.before_update), $$.fragment = !!create_fragment && create_fragment($$.ctx), 
	options.target) {
		if (options.hydrate) {
			const nodes = function children(element) {
				return Array.from(element.childNodes);
			}(options.target);
			$$.fragment && $$.fragment.l(nodes), nodes.forEach(detach);
		} else $$.fragment && $$.fragment.c();
		options.intro && transition_in(component.$$.fragment), function mount_component(component, target, anchor, customElement) {
			const {fragment, on_mount, on_destroy, after_update} = component.$$;
			fragment && fragment.m(target, anchor), customElement || add_render_callback((() => {
				const new_on_destroy = on_mount.map(run).filter(is_function);
				on_destroy ? on_destroy.push(...new_on_destroy) : run_all(new_on_destroy), component.$$.on_mount = [];
			})), after_update.forEach(add_render_callback);
		}(component, options.target, options.anchor, options.customElement), flush();
	}
	set_current_component(parent_component);
}

class SvelteComponent {
	$destroy() {
		!function destroy_component(component, detaching) {
			const $$ = component.$$;
			null !== $$.fragment && (run_all($$.on_destroy), $$.fragment && $$.fragment.d(detaching), 
			$$.on_destroy = $$.fragment = null, $$.ctx = []);
		}(this, 1), this.$destroy = noop;
	}
	$on(type, callback) {
		const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
		return callbacks.push(callback), () => {
			const index = callbacks.indexOf(callback);
			-1 !== index && callbacks.splice(index, 1);
		};
	}
	$set($$props) {
		this.$$set && !function is_empty(obj) {
			return 0 === Object.keys(obj).length;
		}($$props) && (this.$$.skip_bound = !0, this.$$set($$props), this.$$.skip_bound = !1);
	}
}

function create_fragment(ctx) {
	let div, mounted, dispose;
	return {
		c() {
			div = element("div"), div.innerHTML = '<img class="channel-textarea-stickers-content" src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20width%3D%2224%22%20height%3D%2224%22%20preserveAspectRatio%3D%22xMidYMid%20meet%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M18.5%2011c-4.136%200-7.5%203.364-7.5%207.5c0%20.871.157%201.704.432%202.482l9.551-9.551A7.462%207.462%200%200%200%2018.5%2011z%22%20fill%3D%22%23b9bbbe%22%2F%3E%3Cpath%20d%3D%22M12%202C6.486%202%202%206.486%202%2012c0%204.583%203.158%208.585%207.563%209.69A9.431%209.431%200%200%201%209%2018.5C9%2013.262%2013.262%209%2018.5%209c1.12%200%202.191.205%203.19.563C20.585%205.158%2016.583%202%2012%202z%22%20fill%3D%22%23b9bbbe%22%2F%3E%3C%2Fsvg%3E" alt="Magane menu button"/>', 
			attr(div, "id", "maganeButton"), attr(div, "class", "channel-textarea-emoji channel-textarea-stickers"), 
			attr(div, "title", "Right-click to reload Magane's built-in remote packs."), toggle_class(div, "active", ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor), ctx[5](div), mounted || (dispose = [ listen(div, "click", ctx[6]), listen(div, "contextmenu", stop_propagation(prevent_default(ctx[7]))) ], 
			mounted = !0);
		},
		p(ctx, [dirty]) {
			2 & dirty && toggle_class(div, "active", ctx[1]);
		},
		i: noop,
		o: noop,
		d(detaching) {
			detaching && detach(div), ctx[5](null), mounted = !1, run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let {element} = $$props, {active = !1} = $$props, {textArea} = $$props, {lastTextAreaSize = {}} = $$props;
	const dispatch = createEventDispatcher(), log = message => console.log("%c[MaganeButton]%c", "color: #3a71c1; font-weight: 700", "", message);
	onMount((() => log("Mounted."))), onDestroy((() => log("Destroyed.")));
	return $$self.$$set = $$props => {
		"element" in $$props && $$invalidate(0, element = $$props.element), "active" in $$props && $$invalidate(1, active = $$props.active), 
		"textArea" in $$props && $$invalidate(3, textArea = $$props.textArea), "lastTextAreaSize" in $$props && $$invalidate(4, lastTextAreaSize = $$props.lastTextAreaSize);
	}, [ element, active, dispatch, textArea, lastTextAreaSize, function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"]((() => {
			element = $$value, $$invalidate(0, element);
		}));
	}, e => dispatch("click", e), e => dispatch("grabPacks", e) ];
}

class Button extends SvelteComponent {
	constructor(options) {
		super(), init(this, options, instance, create_fragment, safe_not_equal, {
			element: 0,
			active: 1,
			textArea: 3,
			lastTextAreaSize: 4
		});
	}
	get element() {
		return this.$$.ctx[0];
	}
	set element(element) {
		this.$$set({
			element
		}), flush();
	}
	get active() {
		return this.$$.ctx[1];
	}
	set active(active) {
		this.$$set({
			active
		}), flush();
	}
	get textArea() {
		return this.$$.ctx[3];
	}
	set textArea(textArea) {
		this.$$set({
			textArea
		}), flush();
	}
	get lastTextAreaSize() {
		return this.$$.ctx[4];
	}
	set lastTextAreaSize(lastTextAreaSize) {
		this.$$set({
			lastTextAreaSize
		}), flush();
	}
}

function noop$1() {}

const is_client = "undefined" != typeof window;

let now = is_client ? () => window.performance.now() : () => Date.now(), raf = is_client ? cb => requestAnimationFrame(cb) : noop$1;

const tasks = new Set;

function run_tasks(now) {
	tasks.forEach((task => {
		task.c(now) || (tasks.delete(task), task.f());
	})), 0 !== tasks.size && raf(run_tasks);
}

var _ = {
	$: selector => "string" == typeof selector ? document.querySelector(selector) : selector,
	extend: (...args) => Object.assign(...args),
	cumulativeOffset(element) {
		let top = 0, left = 0;
		do {
			top += element.offsetTop || 0, left += element.offsetLeft || 0, element = element.offsetParent;
		} while (element);
		return {
			top,
			left
		};
	},
	directScroll: element => element && element !== document && element !== document.body,
	scrollTop(element, value) {
		let inSetter = void 0 !== value;
		return this.directScroll(element) ? inSetter ? element.scrollTop = value : element.scrollTop : inSetter ? document.documentElement.scrollTop = document.body.scrollTop = value : window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
	},
	scrollLeft(element, value) {
		let inSetter = void 0 !== value;
		return this.directScroll(element) ? inSetter ? element.scrollLeft = value : element.scrollLeft : inSetter ? document.documentElement.scrollLeft = document.body.scrollLeft = value : window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
	}
};

const defaultOptions = {
	container: "body",
	duration: 500,
	delay: 0,
	offset: 0,
	easing: function cubicInOut(t) {
		return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
	},
	onStart: noop$1,
	onDone: noop$1,
	onAborting: noop$1,
	scrollX: !1,
	scrollY: !0
}, _scrollTo = options => {
	let {offset, duration, delay, easing, x = 0, y = 0, scrollX, scrollY, onStart, onDone, container, onAborting, element} = options;
	"function" == typeof offset && (offset = offset());
	var cumulativeOffsetContainer = _.cumulativeOffset(container), cumulativeOffsetTarget = element ? _.cumulativeOffset(element) : {
		top: y,
		left: x
	}, initialX = _.scrollLeft(container), initialY = _.scrollTop(container), targetX = cumulativeOffsetTarget.left - cumulativeOffsetContainer.left + offset, targetY = cumulativeOffsetTarget.top - cumulativeOffsetContainer.top + offset, diffX = targetX - initialX, diffY = targetY - initialY;
	let scrolling = !0, started = !1, start_time = now() + delay, end_time = start_time + duration;
	function start(delayStart) {
		delayStart || (started = !0, onStart(element, {
			x,
			y
		}));
	}
	function tick(progress) {
		!function scrollToTopLeft(element, top, left) {
			scrollX && _.scrollLeft(element, left), scrollY && _.scrollTop(element, top);
		}(container, initialY + diffY * progress, initialX + diffX * progress);
	}
	function stop() {
		scrolling = !1;
	}
	return function loop(callback) {
		let task;
		return 0 === tasks.size && raf(run_tasks), {
			promise: new Promise((fulfill => {
				tasks.add(task = {
					c: callback,
					f: fulfill
				});
			})),
			abort() {
				tasks.delete(task);
			}
		};
	}((now => {
		if (!started && now >= start_time && start(!1), started && now >= end_time && (tick(1), 
		stop(), onDone(element, {
			x,
			y
		})), !scrolling) return onAborting(element, {
			x,
			y
		}), !1;
		if (started) {
			tick(0 + 1 * easing((now - start_time) / duration));
		}
		return !0;
	})), start(delay), tick(0), stop;
}, scrollTo = options => _scrollTo((options => {
	let opts = _.extend({}, defaultOptions, options);
	return opts.container = _.$(opts.container), opts.element = _.$(opts.element), opts;
})(options));

var debug_1 = "object" == typeof process && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {};

var constants = {
	MAX_LENGTH: 256,
	MAX_SAFE_COMPONENT_LENGTH: 16,
	MAX_SAFE_BUILD_LENGTH: 250,
	MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER || 9007199254740991,
	RELEASE_TYPES: [ "major", "premajor", "minor", "preminor", "patch", "prepatch", "prerelease" ],
	SEMVER_SPEC_VERSION: "2.0.0",
	FLAG_INCLUDE_PRERELEASE: 0b001,
	FLAG_LOOSE: 0b010
};

var re_1 = function createCommonjsModule(fn, module) {
	return fn(module = {
		exports: {}
	}, module.exports), module.exports;
}((function(module, exports) {
	const {MAX_SAFE_COMPONENT_LENGTH, MAX_SAFE_BUILD_LENGTH} = constants, re = (exports = module.exports = {}).re = [], safeRe = exports.safeRe = [], src = exports.src = [], t = exports.t = {};
	let R = 0;
	const safeRegexReplacements = [ [ "\\s", 1 ], [ "\\d", MAX_SAFE_COMPONENT_LENGTH ], [ "[a-zA-Z0-9-]", MAX_SAFE_BUILD_LENGTH ] ], createToken = (name, value, isGlobal) => {
		const safe = (value => {
			for (const [token, max] of safeRegexReplacements) value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
			return value;
		})(value), index = R++;
		debug_1(name, index, value), t[name] = index, src[index] = value, re[index] = new RegExp(value, isGlobal ? "g" : void 0), 
		safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
	};
	createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*"), createToken("NUMERICIDENTIFIERLOOSE", "\\d+"), 
	createToken("NONNUMERICIDENTIFIER", "\\d*[a-zA-Z-][a-zA-Z0-9-]*"), createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`), 
	createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`), 
	createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NUMERICIDENTIFIER]}|${src[t.NONNUMERICIDENTIFIER]})`), 
	createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NUMERICIDENTIFIERLOOSE]}|${src[t.NONNUMERICIDENTIFIER]})`), 
	createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`), 
	createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`), 
	createToken("BUILDIDENTIFIER", "[a-zA-Z0-9-]+"), createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`), 
	createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`), 
	createToken("FULL", `^${src[t.FULLPLAIN]}$`), createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`), 
	createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`), createToken("GTLT", "((?:<|>)?=?)"), 
	createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), 
	createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`), createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`), 
	createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`), 
	createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`), createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`), 
	createToken("COERCE", `(^|[^\\d])(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:$|[^\\d])`), 
	createToken("COERCERTL", src[t.COERCE], !0), createToken("LONETILDE", "(?:~>?)"), 
	createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, !0), exports.tildeTrimReplace = "$1~", 
	createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`), createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`), 
	createToken("LONECARET", "(?:\\^)"), createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, !0), 
	exports.caretTrimReplace = "$1^", createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`), 
	createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`), createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`), 
	createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`), createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, !0), 
	exports.comparatorTrimReplace = "$1$2$3", createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`), 
	createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`), 
	createToken("STAR", "(<|>)?=?\\s*\\*"), createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), 
	createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
}));

re_1.re, re_1.safeRe, re_1.src, re_1.t, re_1.tildeTrimReplace, re_1.caretTrimReplace, 
re_1.comparatorTrimReplace;

const looseOption = Object.freeze({
	loose: !0
}), emptyOpts = Object.freeze({});

var parseOptions_1 = options => options ? "object" != typeof options ? looseOption : options : emptyOpts;

const numeric = /^[0-9]+$/, compareIdentifiers = (a, b) => {
	const anum = numeric.test(a), bnum = numeric.test(b);
	return anum && bnum && (a = +a, b = +b), a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
};

var identifiers = {
	compareIdentifiers,
	rcompareIdentifiers: (a, b) => compareIdentifiers(b, a)
};

const {MAX_LENGTH: MAX_LENGTH$1, MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$1} = constants, {safeRe: re, t} = re_1, {compareIdentifiers: compareIdentifiers$1} = identifiers;

class SemVer {
	constructor(version, options) {
		if (options = parseOptions_1(options), version instanceof SemVer) {
			if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) return version;
			version = version.version;
		} else if ("string" != typeof version) throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
		if (version.length > MAX_LENGTH$1) throw new TypeError(`version is longer than ${MAX_LENGTH$1} characters`);
		debug_1("SemVer", version, options), this.options = options, this.loose = !!options.loose, 
		this.includePrerelease = !!options.includePrerelease;
		const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
		if (!m) throw new TypeError(`Invalid Version: ${version}`);
		if (this.raw = version, this.major = +m[1], this.minor = +m[2], this.patch = +m[3], 
		this.major > MAX_SAFE_INTEGER$1 || this.major < 0) throw new TypeError("Invalid major version");
		if (this.minor > MAX_SAFE_INTEGER$1 || this.minor < 0) throw new TypeError("Invalid minor version");
		if (this.patch > MAX_SAFE_INTEGER$1 || this.patch < 0) throw new TypeError("Invalid patch version");
		m[4] ? this.prerelease = m[4].split(".").map((id => {
			if (/^[0-9]+$/.test(id)) {
				const num = +id;
				if (num >= 0 && num < MAX_SAFE_INTEGER$1) return num;
			}
			return id;
		})) : this.prerelease = [], this.build = m[5] ? m[5].split(".") : [], this.format();
	}
	format() {
		return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), 
		this.version;
	}
	toString() {
		return this.version;
	}
	compare(other) {
		if (debug_1("SemVer.compare", this.version, this.options, other), !(other instanceof SemVer)) {
			if ("string" == typeof other && other === this.version) return 0;
			other = new SemVer(other, this.options);
		}
		return other.version === this.version ? 0 : this.compareMain(other) || this.comparePre(other);
	}
	compareMain(other) {
		return other instanceof SemVer || (other = new SemVer(other, this.options)), compareIdentifiers$1(this.major, other.major) || compareIdentifiers$1(this.minor, other.minor) || compareIdentifiers$1(this.patch, other.patch);
	}
	comparePre(other) {
		if (other instanceof SemVer || (other = new SemVer(other, this.options)), this.prerelease.length && !other.prerelease.length) return -1;
		if (!this.prerelease.length && other.prerelease.length) return 1;
		if (!this.prerelease.length && !other.prerelease.length) return 0;
		let i = 0;
		do {
			const a = this.prerelease[i], b = other.prerelease[i];
			if (debug_1("prerelease compare", i, a, b), void 0 === a && void 0 === b) return 0;
			if (void 0 === b) return 1;
			if (void 0 === a) return -1;
			if (a !== b) return compareIdentifiers$1(a, b);
		} while (++i);
	}
	compareBuild(other) {
		other instanceof SemVer || (other = new SemVer(other, this.options));
		let i = 0;
		do {
			const a = this.build[i], b = other.build[i];
			if (debug_1("prerelease compare", i, a, b), void 0 === a && void 0 === b) return 0;
			if (void 0 === b) return 1;
			if (void 0 === a) return -1;
			if (a !== b) return compareIdentifiers$1(a, b);
		} while (++i);
	}
	inc(release, identifier, identifierBase) {
		switch (release) {
		  case "premajor":
			this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", identifier, identifierBase);
			break;

		  case "preminor":
			this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", identifier, identifierBase);
			break;

		  case "prepatch":
			this.prerelease.length = 0, this.inc("patch", identifier, identifierBase), this.inc("pre", identifier, identifierBase);
			break;

		  case "prerelease":
			0 === this.prerelease.length && this.inc("patch", identifier, identifierBase), this.inc("pre", identifier, identifierBase);
			break;

		  case "major":
			0 === this.minor && 0 === this.patch && 0 !== this.prerelease.length || this.major++, 
			this.minor = 0, this.patch = 0, this.prerelease = [];
			break;

		  case "minor":
			0 === this.patch && 0 !== this.prerelease.length || this.minor++, this.patch = 0, 
			this.prerelease = [];
			break;

		  case "patch":
			0 === this.prerelease.length && this.patch++, this.prerelease = [];
			break;

		  case "pre":
			{
				const base = Number(identifierBase) ? 1 : 0;
				if (!identifier && !1 === identifierBase) throw new Error("invalid increment argument: identifier is empty");
				if (0 === this.prerelease.length) this.prerelease = [ base ]; else {
					let i = this.prerelease.length;
					for (;--i >= 0; ) "number" == typeof this.prerelease[i] && (this.prerelease[i]++, 
					i = -2);
					if (-1 === i) {
						if (identifier === this.prerelease.join(".") && !1 === identifierBase) throw new Error("invalid increment argument: identifier already exists");
						this.prerelease.push(base);
					}
				}
				if (identifier) {
					let prerelease = [ identifier, base ];
					!1 === identifierBase && (prerelease = [ identifier ]), 0 === compareIdentifiers$1(this.prerelease[0], identifier) ? isNaN(this.prerelease[1]) && (this.prerelease = prerelease) : this.prerelease = prerelease;
				}
				break;
			}

		  default:
			throw new Error(`invalid increment argument: ${release}`);
		}
		return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), 
		this;
	}
}

var semver = SemVer;

var compare_1 = (a, b, loose) => new semver(a, loose).compare(new semver(b, loose));

var gt_1 = (a, b, loose) => compare_1(a, b, loose) > 0;

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[176] = list[i], child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[176] = list[i], child_ctx[180] = i, child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[176] = list[i], child_ctx[180] = i, child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[176] = list[i], child_ctx[180] = i, child_ctx;
}

function get_each_context_4(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[183] = list[i], child_ctx[180] = i, child_ctx;
}

function get_each_context_5(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[183] = list[i], child_ctx[180] = i, child_ctx;
}

function get_each_context_6(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[183] = list[i], child_ctx[180] = i, child_ctx;
}

function create_if_block_18(ctx) {
	let h3;
	return {
		c() {
			h3 = element("h3"), h3.textContent = "It seems you aren't subscribed to any pack yet. Click the plus symbol on the bottom-left to get started! 🎉", 
			attr(h3, "class", "getStarted");
		},
		m(target, anchor) {
			insert(target, h3, anchor);
		},
		d(detaching) {
			detaching && detach(h3);
		}
	};
}

function create_if_block_17(ctx) {
	let div, span, t0, html_tag, t1, raw_value = ctx[33](ctx[8].length) + "", each_value_6 = ctx[8], each_blocks = [];
	for (let i = 0; i < each_value_6.length; i += 1) each_blocks[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
	return {
		c() {
			div = element("div"), span = element("span"), t0 = text("Favorites"), html_tag = new HtmlTag(!1), 
			t1 = space();
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
			html_tag.a = null, attr(span, "id", "pfavorites"), attr(div, "class", "pack");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, span), append(span, t0), html_tag.m(raw_value, span), 
			append(div, t1);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div, null);
		},
		p(ctx, dirty) {
			if (256 & dirty[0] && raw_value !== (raw_value = ctx[33](ctx[8].length) + "") && html_tag.p(raw_value), 
			939532544 & dirty[0] | 1 & dirty[1]) {
				let i;
				for (each_value_6 = ctx[8], i = 0; i < each_value_6.length; i += 1) {
					const child_ctx = get_each_context_6(ctx, each_value_6, i);
					each_blocks[i] ? each_blocks[i].p(child_ctx, dirty) : (each_blocks[i] = create_each_block_6(child_ctx), 
					each_blocks[i].c(), each_blocks[i].m(div, null));
				}
				for (;i < each_blocks.length; i += 1) each_blocks[i].d(1);
				each_blocks.length = each_value_6.length;
			}
		},
		d(detaching) {
			detaching && detach(div), destroy_each(each_blocks, detaching);
		}
	};
}

function create_each_block_6(ctx) {
	let div1, img, img_src_value, img_alt_value, img_title_value, t0, div0, t1, mounted, dispose;
	function click_handler(...args) {
		return ctx[56](ctx[183], ...args);
	}
	function click_handler_1() {
		return ctx[57](ctx[183]);
	}
	return {
		c() {
			div1 = element("div"), img = element("img"), t0 = space(), div0 = element("div"), 
			div0.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></svg>', 
			t1 = space(), attr(img, "class", "image"), src_url_equal(img.src, img_src_value = `${ctx[27](ctx[183].pack, ctx[183].id)}`) || attr(img, "src", img_src_value), 
			attr(img, "alt", img_alt_value = ctx[183].pack + " - " + ctx[183].id), attr(img, "title", img_title_value = ctx[13][ctx[183].pack] ? ctx[13][ctx[183].pack].name : ""), 
			attr(div0, "class", "deleteFavorite"), attr(div0, "title", "Unfavorite"), attr(div1, "class", "sticker");
		},
		m(target, anchor) {
			insert(target, div1, anchor), append(div1, img), append(div1, t0), append(div1, div0), 
			append(div1, t1), mounted || (dispose = [ listen(img, "click", click_handler), listen(img, "contextmenu", stop_propagation(prevent_default(ctx[29]))), listen(div0, "click", click_handler_1) ], 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 256 & dirty[0] && !src_url_equal(img.src, img_src_value = `${ctx[27](ctx[183].pack, ctx[183].id)}`) && attr(img, "src", img_src_value), 
			256 & dirty[0] && img_alt_value !== (img_alt_value = ctx[183].pack + " - " + ctx[183].id) && attr(img, "alt", img_alt_value), 
			8448 & dirty[0] && img_title_value !== (img_title_value = ctx[13][ctx[183].pack] ? ctx[13][ctx[183].pack].name : "") && attr(img, "title", img_title_value);
		},
		d(detaching) {
			detaching && detach(div1), mounted = !1, run_all(dispose);
		}
	};
}

function create_if_block_15(ctx) {
	let div, span, t0, html_tag, t1, raw_value = ctx[33](ctx[12].length) + "", each_value_5 = ctx[12], each_blocks = [];
	for (let i = 0; i < each_value_5.length; i += 1) each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
	return {
		c() {
			div = element("div"), span = element("span"), t0 = text("Frequently Used"), html_tag = new HtmlTag(!1), 
			t1 = space();
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
			html_tag.a = null, attr(span, "id", "pfrequentlyused"), attr(div, "class", "pack");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, span), append(span, t0), html_tag.m(raw_value, span), 
			append(div, t1);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div, null);
		},
		p(ctx, dirty) {
			if (4096 & dirty[0] && raw_value !== (raw_value = ctx[33](ctx[12].length) + "") && html_tag.p(raw_value), 
			2013278464 & dirty[0] | 1 & dirty[1]) {
				let i;
				for (each_value_5 = ctx[12], i = 0; i < each_value_5.length; i += 1) {
					const child_ctx = get_each_context_5(ctx, each_value_5, i);
					each_blocks[i] ? each_blocks[i].p(child_ctx, dirty) : (each_blocks[i] = create_each_block_5(child_ctx), 
					each_blocks[i].c(), each_blocks[i].m(div, null));
				}
				for (;i < each_blocks.length; i += 1) each_blocks[i].d(1);
				each_blocks.length = each_value_5.length;
			}
		},
		d(detaching) {
			detaching && detach(div), destroy_each(each_blocks, detaching);
		}
	};
}

function create_else_block_2(ctx) {
	let div, mounted, dispose;
	function click_handler_4() {
		return ctx[60](ctx[183]);
	}
	return {
		c() {
			div = element("div"), div.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></svg>', 
			attr(div, "class", "deleteFavorite"), attr(div, "title", "Unfavorite");
		},
		m(target, anchor) {
			insert(target, div, anchor), mounted || (dispose = listen(div, "click", click_handler_4), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			detaching && detach(div), mounted = !1, dispose();
		}
	};
}

function create_if_block_16(ctx) {
	let div, mounted, dispose;
	function click_handler_3() {
		return ctx[59](ctx[183]);
	}
	return {
		c() {
			div = element("div"), div.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></svg>', 
			attr(div, "class", "addFavorite"), attr(div, "title", "Favorite");
		},
		m(target, anchor) {
			insert(target, div, anchor), mounted || (dispose = listen(div, "click", click_handler_3), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			detaching && detach(div), mounted = !1, dispose();
		}
	};
}

function create_each_block_5(ctx) {
	let div, img, img_src_value, img_alt_value, img_title_value, t0, show_if, t1, mounted, dispose;
	function func_1(...args) {
		return ctx[55](ctx[183], ...args);
	}
	function click_handler_2(...args) {
		return ctx[58](ctx[183], ...args);
	}
	function select_block_type(ctx, dirty) {
		return 4352 & dirty[0] && (show_if = null), null == show_if && (show_if = !(-1 !== ctx[8].findIndex(func_1))), 
		show_if ? create_if_block_16 : create_else_block_2;
	}
	let current_block_type = select_block_type(ctx, [ -1, -1, -1, -1, -1, -1, -1 ]), if_block = current_block_type(ctx);
	return {
		c() {
			div = element("div"), img = element("img"), t0 = space(), if_block.c(), t1 = space(), 
			attr(img, "class", "image"), src_url_equal(img.src, img_src_value = `${ctx[27](ctx[183].pack, ctx[183].id)}`) || attr(img, "src", img_src_value), 
			attr(img, "alt", img_alt_value = ctx[183].pack + " - " + ctx[183].id), attr(img, "title", img_title_value = (ctx[13][ctx[183].pack] ? `${ctx[13][ctx[183].pack].name} – ` : "") + "Used: " + ctx[183].used), 
			attr(div, "class", "sticker");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, img), append(div, t0), if_block.m(div, null), 
			append(div, t1), mounted || (dispose = [ listen(img, "click", click_handler_2), listen(img, "contextmenu", stop_propagation(prevent_default(ctx[29]))) ], 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 4096 & dirty[0] && !src_url_equal(img.src, img_src_value = `${ctx[27](ctx[183].pack, ctx[183].id)}`) && attr(img, "src", img_src_value), 
			4096 & dirty[0] && img_alt_value !== (img_alt_value = ctx[183].pack + " - " + ctx[183].id) && attr(img, "alt", img_alt_value), 
			12288 & dirty[0] && img_title_value !== (img_title_value = (ctx[13][ctx[183].pack] ? `${ctx[13][ctx[183].pack].name} – ` : "") + "Used: " + ctx[183].used) && attr(img, "title", img_title_value), 
			current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block ? if_block.p(ctx, dirty) : (if_block.d(1), 
			if_block = current_block_type(ctx), if_block && (if_block.c(), if_block.m(div, t1)));
		},
		d(detaching) {
			detaching && detach(div), if_block.d(), mounted = !1, run_all(dispose);
		}
	};
}

function create_if_block_14(ctx) {
	let span;
	return {
		c() {
			span = element("span"), span.textContent = "Right-click the sticker to replay its animation.", 
			attr(span, "class", "subtext");
		},
		m(target, anchor) {
			insert(target, span, anchor);
		},
		d(detaching) {
			detaching && detach(span);
		}
	};
}

function create_else_block_1(ctx) {
	let div, mounted, dispose;
	function click_handler_7() {
		return ctx[63](ctx[176], ctx[183]);
	}
	return {
		c() {
			div = element("div"), div.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></svg>', 
			attr(div, "class", "deleteFavorite"), attr(div, "title", "Unfavorite");
		},
		m(target, anchor) {
			insert(target, div, anchor), mounted || (dispose = listen(div, "click", click_handler_7), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			detaching && detach(div), mounted = !1, dispose();
		}
	};
}

function create_if_block_13(ctx) {
	let div, mounted, dispose;
	function click_handler_6() {
		return ctx[62](ctx[176], ctx[183]);
	}
	return {
		c() {
			div = element("div"), div.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></svg>', 
			attr(div, "class", "addFavorite"), attr(div, "title", "Favorite");
		},
		m(target, anchor) {
			insert(target, div, anchor), mounted || (dispose = listen(div, "click", click_handler_6), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			detaching && detach(div), mounted = !1, dispose();
		}
	};
}

function create_each_block_4(ctx) {
	let div, img, img_src_value, img_alt_value, t, show_if, mounted, dispose;
	function func(...args) {
		return ctx[54](ctx[176], ctx[183], ...args);
	}
	function click_handler_5(...args) {
		return ctx[61](ctx[176], ctx[183], ...args);
	}
	function select_block_type_1(ctx, dirty) {
		return 768 & dirty[0] && (show_if = null), null == show_if && (show_if = !(-1 !== ctx[8].findIndex(func))), 
		show_if ? create_if_block_13 : create_else_block_1;
	}
	let current_block_type = select_block_type_1(ctx, [ -1, -1, -1, -1, -1, -1, -1 ]), if_block = current_block_type(ctx);
	return {
		c() {
			div = element("div"), img = element("img"), t = space(), if_block.c(), attr(img, "class", "image"), 
			src_url_equal(img.src, img_src_value = `${ctx[27](ctx[176].id, ctx[183], !1, ctx[180])}`) || attr(img, "src", img_src_value), 
			attr(img, "alt", img_alt_value = ctx[176].id + " - " + ctx[183]), attr(div, "class", "sticker");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, img), append(div, t), if_block.m(div, null), 
			mounted || (dispose = [ listen(img, "click", click_handler_5), listen(img, "contextmenu", stop_propagation(prevent_default(ctx[29]))) ], 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 512 & dirty[0] && !src_url_equal(img.src, img_src_value = `${ctx[27](ctx[176].id, ctx[183], !1, ctx[180])}`) && attr(img, "src", img_src_value), 
			512 & dirty[0] && img_alt_value !== (img_alt_value = ctx[176].id + " - " + ctx[183]) && attr(img, "alt", img_alt_value), 
			current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block ? if_block.p(ctx, dirty) : (if_block.d(1), 
			if_block = current_block_type(ctx), if_block && (if_block.c(), if_block.m(div, null)));
		},
		d(detaching) {
			detaching && detach(div), if_block.d(), mounted = !1, run_all(dispose);
		}
	};
}

function create_each_block_3(ctx) {
	let div, span, t0, html_tag, span_id_value, t1, t2, t3, t0_value = ctx[176].name + "", raw_value = ctx[33](ctx[176].files.length) + "", show_if = ctx[176].animated && ctx[0] === ctx[22].VENCORD && (ctx[176].id.startsWith("startswith-") || ctx[176].id.startsWith("emojis-")), if_block = show_if && create_if_block_14(), each_value_4 = ctx[176].files, each_blocks = [];
	for (let i = 0; i < each_value_4.length; i += 1) each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
	return {
		c() {
			div = element("div"), span = element("span"), t0 = text(t0_value), html_tag = new HtmlTag(!1), 
			t1 = space(), if_block && if_block.c(), t2 = space();
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
			t3 = space(), html_tag.a = null, attr(span, "id", span_id_value = "p" + ctx[176].id), 
			attr(div, "class", "pack");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, span), append(span, t0), html_tag.m(raw_value, span), 
			append(div, t1), if_block && if_block.m(div, null), append(div, t2);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div, null);
			append(div, t3);
		},
		p(ctx, dirty) {
			if (512 & dirty[0] && t0_value !== (t0_value = ctx[176].name + "") && set_data(t0, t0_value), 
			512 & dirty[0] && raw_value !== (raw_value = ctx[33](ctx[176].files.length) + "") && html_tag.p(raw_value), 
			512 & dirty[0] && span_id_value !== (span_id_value = "p" + ctx[176].id) && attr(span, "id", span_id_value), 
			513 & dirty[0] && (show_if = ctx[176].animated && ctx[0] === ctx[22].VENCORD && (ctx[176].id.startsWith("startswith-") || ctx[176].id.startsWith("emojis-"))), 
			show_if ? if_block || (if_block = create_if_block_14(), if_block.c(), if_block.m(div, t2)) : if_block && (if_block.d(1), 
			if_block = null), 2013266688 & dirty[0] | 1 & dirty[1]) {
				let i;
				for (each_value_4 = ctx[176].files, i = 0; i < each_value_4.length; i += 1) {
					const child_ctx = get_each_context_4(ctx, each_value_4, i);
					each_blocks[i] ? each_blocks[i].p(child_ctx, dirty) : (each_blocks[i] = create_each_block_4(child_ctx), 
					each_blocks[i].c(), each_blocks[i].m(div, t3));
				}
				for (;i < each_blocks.length; i += 1) each_blocks[i].d(1);
				each_blocks.length = each_value_4.length;
			}
		},
		d(detaching) {
			detaching && detach(div), if_block && if_block.d(), destroy_each(each_blocks, detaching);
		}
	};
}

function create_if_block_11(ctx) {
	let div1, mounted, dispose;
	return {
		c() {
			div1 = element("div"), div1.innerHTML = '<div class="icon-frequently-used"></div>', 
			attr(div1, "class", "pack"), attr(div1, "title", "Frequently Used");
		},
		m(target, anchor) {
			insert(target, div1, anchor), mounted || (dispose = listen(div1, "click", ctx[66]), 
			mounted = !0);
		},
		p: noop,
		d(detaching) {
			detaching && detach(div1), mounted = !1, dispose();
		}
	};
}

function create_each_block_2(ctx) {
	let div, div_title_value, mounted, dispose;
	function click_handler_11() {
		return ctx[67](ctx[176]);
	}
	return {
		c() {
			div = element("div"), attr(div, "class", "pack"), attr(div, "title", div_title_value = ctx[176].name), 
			set_style(div, "background-image", `url(${ctx[27](ctx[176].id, ctx[176].files[0], !1, 0)})`);
		},
		m(target, anchor) {
			insert(target, div, anchor), mounted || (dispose = listen(div, "click", click_handler_11), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 512 & dirty[0] && div_title_value !== (div_title_value = ctx[176].name) && attr(div, "title", div_title_value), 
			512 & dirty[0] && set_style(div, "background-image", `url(${ctx[27](ctx[176].id, ctx[176].files[0], !1, 0)})`);
		},
		d(detaching) {
			detaching && detach(div), mounted = !1, dispose();
		}
	};
}

function create_if_block_6(ctx) {
	let div, div_style_value, each_blocks = [], each_1_lookup = new Map, each_value_1 = ctx[9];
	const get_key = ctx => ctx[176].id;
	for (let i = 0; i < each_value_1.length; i += 1) {
		let child_ctx = get_each_context_1(ctx, each_value_1, i), key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
	}
	return {
		c() {
			div = element("div");
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
			attr(div, "class", "tab-content has-scroll-y"), attr(div, "style", div_style_value = 0 === ctx[7] ? "" : "display: none;");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div, null);
		},
		p(ctx, dirty) {
			220217856 & dirty[0] | 1672 & dirty[1] && (each_value_1 = ctx[9], each_blocks = function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
				let o = old_blocks.length, n = list.length, i = o;
				const old_indexes = {};
				for (;i--; ) old_indexes[old_blocks[i].key] = i;
				const new_blocks = [], new_lookup = new Map, deltas = new Map;
				for (i = n; i--; ) {
					const child_ctx = get_context(ctx, list, i), key = get_key(child_ctx);
					let block = lookup.get(key);
					block ? dynamic && block.p(child_ctx, dirty) : (block = create_each_block(key, child_ctx), 
					block.c()), new_lookup.set(key, new_blocks[i] = block), key in old_indexes && deltas.set(key, Math.abs(i - old_indexes[key]));
				}
				const will_move = new Set, did_move = new Set;
				function insert(block) {
					transition_in(block, 1), block.m(node, next), lookup.set(block.key, block), next = block.first, 
					n--;
				}
				for (;o && n; ) {
					const new_block = new_blocks[n - 1], old_block = old_blocks[o - 1], new_key = new_block.key, old_key = old_block.key;
					new_block === old_block ? (next = new_block.first, o--, n--) : new_lookup.has(old_key) ? !lookup.has(new_key) || will_move.has(new_key) ? insert(new_block) : did_move.has(old_key) ? o-- : deltas.get(new_key) > deltas.get(old_key) ? (did_move.add(new_key), 
					insert(new_block)) : (will_move.add(old_key), o--) : (destroy(old_block, lookup), 
					o--);
				}
				for (;o--; ) {
					const old_block = old_blocks[o];
					new_lookup.has(old_block.key) || destroy(old_block, lookup);
				}
				for (;n; ) insert(new_blocks[n - 1]);
				return new_blocks;
			}(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, destroy_block, create_each_block_1, null, get_each_context_1)), 
			128 & dirty[0] && div_style_value !== (div_style_value = 0 === ctx[7] ? "" : "display: none;") && attr(div, "style", div_style_value);
		},
		d(detaching) {
			detaching && detach(div);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();
		}
	};
}

function create_if_block_10(ctx) {
	let div, input, input_data_pack_value, input_value_value, mounted, dispose;
	return {
		c() {
			div = element("div"), input = element("input"), attr(input, "class", "inputPackIndex"), 
			attr(input, "type", "text"), attr(input, "data-pack", input_data_pack_value = ctx[176].id), 
			input.value = input_value_value = ctx[180] + 1, attr(div, "class", "index");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, input), mounted || (dispose = [ listen(input, "click", click_handler_16), listen(input, "keypress", ctx[38]) ], 
			mounted = !0);
		},
		p(ctx, dirty) {
			512 & dirty[0] && input_data_pack_value !== (input_data_pack_value = ctx[176].id) && attr(input, "data-pack", input_data_pack_value), 
			512 & dirty[0] && input_value_value !== (input_value_value = ctx[180] + 1) && input.value !== input_value_value && (input.value = input_value_value);
		},
		d(detaching) {
			detaching && detach(div), mounted = !1, run_all(dispose);
		}
	};
}

function create_if_block_7(ctx) {
	let t, if_block1_anchor, show_if = ctx[24](ctx[176].id), if_block0 = show_if && create_if_block_9(ctx), if_block1 = ctx[14][ctx[176].id].updateUrl && create_if_block_8(ctx);
	return {
		c() {
			if_block0 && if_block0.c(), t = space(), if_block1 && if_block1.c(), if_block1_anchor = function empty() {
				return text("");
			}();
		},
		m(target, anchor) {
			if_block0 && if_block0.m(target, anchor), insert(target, t, anchor), if_block1 && if_block1.m(target, anchor), 
			insert(target, if_block1_anchor, anchor);
		},
		p(ctx, dirty) {
			512 & dirty[0] && (show_if = ctx[24](ctx[176].id)), show_if ? if_block0 ? if_block0.p(ctx, dirty) : (if_block0 = create_if_block_9(ctx), 
			if_block0.c(), if_block0.m(t.parentNode, t)) : if_block0 && (if_block0.d(1), if_block0 = null), 
			ctx[14][ctx[176].id].updateUrl ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_8(ctx), 
			if_block1.c(), if_block1.m(if_block1_anchor.parentNode, if_block1_anchor)) : if_block1 && (if_block1.d(1), 
			if_block1 = null);
		},
		d(detaching) {
			if_block0 && if_block0.d(detaching), detaching && detach(t), if_block1 && if_block1.d(detaching), 
			detaching && detach(if_block1_anchor);
		}
	};
}

function create_if_block_9(ctx) {
	let button, mounted, dispose;
	function click_handler_18() {
		return ctx[73](ctx[176]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "i", attr(button, "class", "button pack-info"), 
			attr(button, "title", "Info");
		},
		m(target, anchor) {
			insert(target, button, anchor), mounted || (dispose = listen(button, "click", click_handler_18), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			detaching && detach(button), mounted = !1, dispose();
		}
	};
}

function create_if_block_8(ctx) {
	let button, mounted, dispose;
	function click_handler_19() {
		return ctx[74](ctx[176]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "Up", attr(button, "class", "button update-pack"), 
			attr(button, "title", "Update");
		},
		m(target, anchor) {
			insert(target, button, anchor), mounted || (dispose = listen(button, "click", click_handler_19), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			detaching && detach(button), mounted = !1, dispose();
		}
	};
}

function create_each_block_1(key_1, ctx) {
	let div3, t0, div0, t1, div1, span0, t2, span0_title_value, t3, span1, t4, t5, html_tag, t6, div2, button, t8, div2_class_value, t9, mounted, dispose, t2_value = ctx[176].name + "", t4_value = ctx[176].count + "", raw_value = (ctx[21].showPackAppendix ? ctx[34](ctx[176].id) : "") + "", if_block0 = ctx[9].length > 1 && create_if_block_10(ctx);
	function click_handler_17() {
		return ctx[72](ctx[176]);
	}
	let if_block1 = ctx[14][ctx[176].id] && create_if_block_7(ctx);
	return {
		key: key_1,
		first: null,
		c() {
			div3 = element("div"), if_block0 && if_block0.c(), t0 = space(), div0 = element("div"), 
			t1 = space(), div1 = element("div"), span0 = element("span"), t2 = text(t2_value), 
			t3 = space(), span1 = element("span"), t4 = text(t4_value), t5 = text(" stickers"), 
			html_tag = new HtmlTag(!1), t6 = space(), div2 = element("div"), button = element("button"), 
			button.textContent = "Del", t8 = space(), if_block1 && if_block1.c(), t9 = space(), 
			attr(div0, "class", "preview"), set_style(div0, "background-image", `url(${ctx[27](ctx[176].id, ctx[176].files[0], !1, 0)})`), 
			attr(span0, "title", span0_title_value = ctx[21].showPackAppendix ? "" : `ID: ${ctx[176].id}`), 
			html_tag.a = null, attr(div1, "class", "info"), attr(button, "class", "button is-danger"), 
			attr(button, "title", "Unsubscribe"), attr(div2, "class", div2_class_value = "action" + (ctx[14][ctx[176].id] && (ctx[24](ctx[176].id) || ctx[14][ctx[176].id].updateUrl) ? " is-tight" : "")), 
			attr(div3, "class", "pack"), this.first = div3;
		},
		m(target, anchor) {
			insert(target, div3, anchor), if_block0 && if_block0.m(div3, null), append(div3, t0), 
			append(div3, div0), append(div3, t1), append(div3, div1), append(div1, span0), append(span0, t2), 
			append(div1, t3), append(div1, span1), append(span1, t4), append(span1, t5), html_tag.m(raw_value, span1), 
			append(div3, t6), append(div3, div2), append(div2, button), append(div2, t8), if_block1 && if_block1.m(div2, null), 
			append(div3, t9), mounted || (dispose = listen(button, "click", click_handler_17), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			(ctx = new_ctx)[9].length > 1 ? if_block0 ? if_block0.p(ctx, dirty) : (if_block0 = create_if_block_10(ctx), 
			if_block0.c(), if_block0.m(div3, t0)) : if_block0 && (if_block0.d(1), if_block0 = null), 
			512 & dirty[0] && set_style(div0, "background-image", `url(${ctx[27](ctx[176].id, ctx[176].files[0], !1, 0)})`), 
			512 & dirty[0] && t2_value !== (t2_value = ctx[176].name + "") && set_data(t2, t2_value), 
			2097664 & dirty[0] && span0_title_value !== (span0_title_value = ctx[21].showPackAppendix ? "" : `ID: ${ctx[176].id}`) && attr(span0, "title", span0_title_value), 
			512 & dirty[0] && t4_value !== (t4_value = ctx[176].count + "") && set_data(t4, t4_value), 
			2097664 & dirty[0] && raw_value !== (raw_value = (ctx[21].showPackAppendix ? ctx[34](ctx[176].id) : "") + "") && html_tag.p(raw_value), 
			ctx[14][ctx[176].id] ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_7(ctx), 
			if_block1.c(), if_block1.m(div2, null)) : if_block1 && (if_block1.d(1), if_block1 = null), 
			16896 & dirty[0] && div2_class_value !== (div2_class_value = "action" + (ctx[14][ctx[176].id] && (ctx[24](ctx[176].id) || ctx[14][ctx[176].id].updateUrl) ? " is-tight" : "")) && attr(div2, "class", div2_class_value);
		},
		d(detaching) {
			detaching && detach(div3), if_block0 && if_block0.d(), if_block1 && if_block1.d(), 
			mounted = !1, dispose();
		}
	};
}

function create_if_block_1(ctx) {
	let div, each_value = ctx[11], each_blocks = [];
	for (let i = 0; i < each_value.length; i += 1) each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	return {
		c() {
			div = element("div");
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
			attr(div, "class", "packs has-scroll-y"), attr(div, "style", "");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div, null);
		},
		p(ctx, dirty) {
			if (253774848 & dirty[0] | 1800 & dirty[1]) {
				let i;
				for (each_value = ctx[11], i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);
					each_blocks[i] ? each_blocks[i].p(child_ctx, dirty) : (each_blocks[i] = create_each_block(child_ctx), 
					each_blocks[i].c(), each_blocks[i].m(div, null));
				}
				for (;i < each_blocks.length; i += 1) each_blocks[i].d(1);
				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			detaching && detach(div), destroy_each(each_blocks, detaching);
		}
	};
}

function create_else_block(ctx) {
	let button, mounted, dispose;
	function click_handler_21() {
		return ctx[77](ctx[176]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "Add", attr(button, "class", "button is-primary"), 
			attr(button, "title", "Subscribe");
		},
		m(target, anchor) {
			insert(target, button, anchor), mounted || (dispose = listen(button, "click", click_handler_21), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			detaching && detach(button), mounted = !1, dispose();
		}
	};
}

function create_if_block_5(ctx) {
	let button, mounted, dispose;
	function click_handler_20() {
		return ctx[76](ctx[176]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "Del", attr(button, "class", "button is-danger"), 
			attr(button, "title", "Unsubscribe");
		},
		m(target, anchor) {
			insert(target, button, anchor), mounted || (dispose = listen(button, "click", click_handler_20), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			detaching && detach(button), mounted = !1, dispose();
		}
	};
}

function create_if_block_2(ctx) {
	let t0, t1, button, mounted, dispose, show_if = ctx[24](ctx[176].id), if_block0 = show_if && create_if_block_4(ctx), if_block1 = ctx[14][ctx[176].id].updateUrl && create_if_block_3(ctx);
	function click_handler_24() {
		return ctx[80](ctx[176]);
	}
	return {
		c() {
			if_block0 && if_block0.c(), t0 = space(), if_block1 && if_block1.c(), t1 = space(), 
			button = element("button"), attr(button, "class", "button delete-pack is-danger"), 
			attr(button, "title", "Purge");
		},
		m(target, anchor) {
			if_block0 && if_block0.m(target, anchor), insert(target, t0, anchor), if_block1 && if_block1.m(target, anchor), 
			insert(target, t1, anchor), insert(target, button, anchor), mounted || (dispose = listen(button, "click", click_handler_24), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 2048 & dirty[0] && (show_if = ctx[24](ctx[176].id)), show_if ? if_block0 ? if_block0.p(ctx, dirty) : (if_block0 = create_if_block_4(ctx), 
			if_block0.c(), if_block0.m(t0.parentNode, t0)) : if_block0 && (if_block0.d(1), if_block0 = null), 
			ctx[14][ctx[176].id].updateUrl ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_3(ctx), 
			if_block1.c(), if_block1.m(t1.parentNode, t1)) : if_block1 && (if_block1.d(1), if_block1 = null);
		},
		d(detaching) {
			if_block0 && if_block0.d(detaching), detaching && detach(t0), if_block1 && if_block1.d(detaching), 
			detaching && detach(t1), detaching && detach(button), mounted = !1, dispose();
		}
	};
}

function create_if_block_4(ctx) {
	let button, mounted, dispose;
	function click_handler_22() {
		return ctx[78](ctx[176]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "i", attr(button, "class", "button pack-info"), 
			attr(button, "title", "Info");
		},
		m(target, anchor) {
			insert(target, button, anchor), mounted || (dispose = listen(button, "click", click_handler_22), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			detaching && detach(button), mounted = !1, dispose();
		}
	};
}

function create_if_block_3(ctx) {
	let button, mounted, dispose;
	function click_handler_23() {
		return ctx[79](ctx[176]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "Up", attr(button, "class", "button update-pack"), 
			attr(button, "title", "Update");
		},
		m(target, anchor) {
			insert(target, button, anchor), mounted || (dispose = listen(button, "click", click_handler_23), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			detaching && detach(button), mounted = !1, dispose();
		}
	};
}

function create_each_block(ctx) {
	let div3, div0, t0, div1, span0, t1, span0_title_value, t2, span1, t3, t4, html_tag, t5, div2, show_if, t6, div2_class_value, t7, t1_value = ctx[176].name + "", t3_value = ctx[176].count + "", raw_value = (ctx[21].showPackAppendix ? ctx[34](ctx[176].id) : "") + "";
	function select_block_type_2(ctx, dirty) {
		return 3072 & dirty[0] && (show_if = null), null == show_if && (show_if = !!ctx[10].includes(ctx[176].id)), 
		show_if ? create_if_block_5 : create_else_block;
	}
	let current_block_type = select_block_type_2(ctx, [ -1, -1, -1, -1, -1, -1, -1 ]), if_block0 = current_block_type(ctx), if_block1 = ctx[14][ctx[176].id] && create_if_block_2(ctx);
	return {
		c() {
			div3 = element("div"), div0 = element("div"), t0 = space(), div1 = element("div"), 
			span0 = element("span"), t1 = text(t1_value), t2 = space(), span1 = element("span"), 
			t3 = text(t3_value), t4 = text(" stickers"), html_tag = new HtmlTag(!1), t5 = space(), 
			div2 = element("div"), if_block0.c(), t6 = space(), if_block1 && if_block1.c(), 
			t7 = space(), attr(div0, "class", "preview"), set_style(div0, "background-image", `url(${ctx[27](ctx[176].id, ctx[176].files[0], !1, 0)})`), 
			attr(span0, "title", span0_title_value = ctx[21].showPackAppendix ? "" : `ID: ${ctx[176].id}`), 
			html_tag.a = null, attr(div1, "class", "info"), attr(div2, "class", div2_class_value = "action" + (ctx[14][ctx[176].id] ? " is-tight" : "")), 
			attr(div3, "class", "pack");
		},
		m(target, anchor) {
			insert(target, div3, anchor), append(div3, div0), append(div3, t0), append(div3, div1), 
			append(div1, span0), append(span0, t1), append(div1, t2), append(div1, span1), append(span1, t3), 
			append(span1, t4), html_tag.m(raw_value, span1), append(div3, t5), append(div3, div2), 
			if_block0.m(div2, null), append(div2, t6), if_block1 && if_block1.m(div2, null), 
			append(div3, t7);
		},
		p(ctx, dirty) {
			2048 & dirty[0] && set_style(div0, "background-image", `url(${ctx[27](ctx[176].id, ctx[176].files[0], !1, 0)})`), 
			2048 & dirty[0] && t1_value !== (t1_value = ctx[176].name + "") && set_data(t1, t1_value), 
			2099200 & dirty[0] && span0_title_value !== (span0_title_value = ctx[21].showPackAppendix ? "" : `ID: ${ctx[176].id}`) && attr(span0, "title", span0_title_value), 
			2048 & dirty[0] && t3_value !== (t3_value = ctx[176].count + "") && set_data(t3, t3_value), 
			2099200 & dirty[0] && raw_value !== (raw_value = (ctx[21].showPackAppendix ? ctx[34](ctx[176].id) : "") + "") && html_tag.p(raw_value), 
			current_block_type === (current_block_type = select_block_type_2(ctx, dirty)) && if_block0 ? if_block0.p(ctx, dirty) : (if_block0.d(1), 
			if_block0 = current_block_type(ctx), if_block0 && (if_block0.c(), if_block0.m(div2, t6))), 
			ctx[14][ctx[176].id] ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_2(ctx), 
			if_block1.c(), if_block1.m(div2, null)) : if_block1 && (if_block1.d(1), if_block1 = null), 
			18432 & dirty[0] && div2_class_value !== (div2_class_value = "action" + (ctx[14][ctx[176].id] ? " is-tight" : "")) && attr(div2, "class", div2_class_value);
		},
		d(detaching) {
			detaching && detach(div3), if_block0.d(), if_block1 && if_block1.d();
		}
	};
}

function create_if_block(ctx) {
	let p;
	return {
		c() {
			p = element("p"), p.innerHTML = "<i>This always applies to imported animated LINE stickers, because Vencord has a built-in APNG to GIF conversion library.</i>";
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		d(detaching) {
			detaching && detach(p);
		}
	};
}

function create_fragment$1(ctx) {
	let main_1, div29, div28, div0, t0, t1, t2, div0_class_value, t3, div7, div4, div3, div2, t4, t5, t6, div6, div5, div6_class_value, div7_class_value, t7, div27, div25, div24, div12, div8, t9, div9, t11, div10, t13, div11, t15, t16, div13, input0, t17, div13_style_value, t18, div16, div14, p0, t20, p1, t24, p2, t26, p3, textarea0, t27, button0, t29, div15, p4, t31, p5, t36, p6, t39, p7, textarea1, t40, button1, t42, p8, input1, t43, button2, t45, p9, button3, div16_style_value, t47, div23, div17, p10, button4, t49, div18, p11, t51, p12, label0, input2, t52, t53, p13, label1, input3, t54, code0, t56, t57, p14, label2, input4, t58, t59, p15, label3, input5, t60, t61, p16, label4, input6, t62, t63, p17, label5, input7, t64, t65, p18, label6, input8, t66, a2, t68, p19, label7, input9, t69, t70, p20, label8, input10, t71, t72, p21, label9, input11, t73, code1, t75, t76, p22, label10, input12, t77, t78, p23, label11, input13, t79, t80, p24, label12, input14, t81, t82, p25, label13, input15, t83, t84, p26, label14, input16, t85, t86, div19, p27, t88, p28, t90, p29, t94, t95, p30, input17, t96, button5, t98, div20, p31, t100, p32, t102, p33, t106, p34, input18, t107, button6, t109, div21, p35, t111, p36, t113, p37, t119, p38, t126, p39, input19, t127, button7, t129, div22, p40, t131, p41, input20, t132, button8, t134, p42, button9, div23_style_value, t136, div26, div27_style_value, div28_style_value, div29_style_value, mounted, dispose, if_block0 = !ctx[8].length && !ctx[9].length && create_if_block_18(), if_block1 = ctx[8].length && create_if_block_17(ctx), if_block2 = ctx[12].length && create_if_block_15(ctx), each_value_3 = ctx[9], each_blocks_1 = [];
	for (let i = 0; i < each_value_3.length; i += 1) each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	let if_block3 = ctx[30].length && function create_if_block_12(ctx) {
		let div1, mounted, dispose;
		return {
			c() {
				div1 = element("div"), div1.innerHTML = '<div class="icon-favorite"></div>', attr(div1, "class", "pack"), 
				attr(div1, "title", "Favorites");
			},
			m(target, anchor) {
				insert(target, div1, anchor), mounted || (dispose = listen(div1, "click", ctx[65]), 
				mounted = !0);
			},
			p: noop,
			d(detaching) {
				detaching && detach(div1), mounted = !1, dispose();
			}
		};
	}(ctx), if_block4 = ctx[12].length && create_if_block_11(ctx), each_value_2 = ctx[9], each_blocks = [];
	for (let i = 0; i < each_value_2.length; i += 1) each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	let if_block5 = ctx[6][0] && create_if_block_6(ctx), if_block6 = ctx[6][1] && create_if_block_1(ctx), if_block7 = ctx[0] === ctx[22].VENCORD && create_if_block();
	return {
		c() {
			main_1 = element("main"), div29 = element("div"), div28 = element("div"), div0 = element("div"), 
			if_block0 && if_block0.c(), t0 = space(), if_block1 && if_block1.c(), t1 = space(), 
			if_block2 && if_block2.c(), t2 = space();
			for (let i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].c();
			t3 = space(), div7 = element("div"), div4 = element("div"), div3 = element("div"), 
			div2 = element("div"), div2.innerHTML = '<div class="icon-plus"></div>', t4 = space(), 
			if_block3 && if_block3.c(), t5 = space(), if_block4 && if_block4.c(), t6 = space(), 
			div6 = element("div"), div5 = element("div");
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
			t7 = space(), div27 = element("div"), div25 = element("div"), div24 = element("div"), 
			div12 = element("div"), div8 = element("div"), div8.textContent = "Installed", t9 = space(), 
			div9 = element("div"), div9.textContent = "Packs", t11 = space(), div10 = element("div"), 
			div10.textContent = "Import", t13 = space(), div11 = element("div"), div11.textContent = "Misc", 
			t15 = space(), if_block5 && if_block5.c(), t16 = space(), div13 = element("div"), 
			input0 = element("input"), t17 = space(), if_block6 && if_block6.c(), t18 = space(), 
			div16 = element("div"), div14 = element("div"), p0 = element("p"), p0.textContent = "LINE Store Proxy", 
			t20 = space(), p1 = element("p"), p1.innerHTML = 'If you are looking for stickers pack that are not provided by Magane, you can go to the <a href="https://store.line.me/" target="_blank">LINE Store</a>, pick whichever packs you want, then paste their full URLs in the box below (separated by new lines).', 
			t24 = space(), p2 = element("p"), p2.textContent = "e.g. https://store.line.me/stickershop/product/17573/ja", 
			t26 = space(), p3 = element("p"), textarea0 = element("textarea"), t27 = space(), 
			button0 = element("button"), button0.textContent = "Add", t29 = space(), div15 = element("div"), 
			p4 = element("p"), p4.textContent = "Remote Packs", t31 = space(), p5 = element("p"), 
			p5.innerHTML = 'You can paste URLs to JSON config files of remote packs in here (separated by new lines).<br/>\n\t\t\t\t\t\t\t\t\tThis also supports public album links of any file hosting websites running <a href="https://github.com/WeebDev/chibisafe" target="_blank">Chibisafe</a>.', 
			t36 = space(), p6 = element("p"), p6.innerHTML = "e.g. https://example.com/packs/my_custom_pack.json<br/>\n\t\t\t\t\t\t\t\t\thttps://chibisafe.moe/a/my_album", 
			t39 = space(), p7 = element("p"), textarea1 = element("textarea"), t40 = space(), 
			button1 = element("button"), button1.textContent = "Add", t42 = space(), p8 = element("p"), 
			input1 = element("input"), t43 = space(), button2 = element("button"), button2.textContent = "Load local JSON files", 
			t45 = space(), p9 = element("p"), button3 = element("button"), button3.textContent = "Update all remote packs", 
			t47 = space(), div23 = element("div"), div17 = element("div"), p10 = element("p"), 
			button4 = element("button"), button4.textContent = "Check for updates", t49 = space(), 
			div18 = element("div"), p11 = element("p"), p11.textContent = "Settings", t51 = space(), 
			p12 = element("p"), label0 = element("label"), input2 = element("input"), t52 = text("\n\t\t\t\t\t\t\t\t\t\tDisable automatically checking for updates on launch"), 
			t53 = space(), p13 = element("p"), label1 = element("label"), input3 = element("input"), 
			t54 = text("\n\t\t\t\t\t\t\t\t\t\tEnable "), code0 = element("code"), code0.textContent = "window.magane", 
			t56 = text(" development utility"), t57 = space(), p14 = element("p"), label2 = element("label"), 
			input4 = element("input"), t58 = text("\n\t\t\t\t\t\t\t\t\t\tDisable Toasts"), t59 = space(), 
			p15 = element("p"), label3 = element("label"), input5 = element("input"), t60 = text("\n\t\t\t\t\t\t\t\t\t\tClose window when sending a sticker"), 
			t61 = space(), p16 = element("p"), label4 = element("label"), input6 = element("input"), 
			t62 = text("\n\t\t\t\t\t\t\t\t\t\tUse left toolbar instead of bottom toolbar on main window"), 
			t63 = space(), p17 = element("p"), label5 = element("label"), input7 = element("input"), 
			t64 = text("\n\t\t\t\t\t\t\t\t\t\tShow pack's appendix in packs list (e.g. its numerical ID)"), 
			t65 = space(), p18 = element("p"), label6 = element("label"), input8 = element("input"), 
			t66 = text("\n\t\t\t\t\t\t\t\t\t\tDisable downscaling stickers with "), a2 = element("a"), 
			a2.textContent = "wsrv.nl", t68 = space(), p19 = element("p"), label7 = element("label"), 
			input9 = element("input"), t69 = text("\n\t\t\t\t\t\t\t\t\t\tDisable obfuscation of files names for uploaded stickers"), 
			t70 = space(), p20 = element("p"), label8 = element("label"), input10 = element("input"), 
			t71 = text("\n\t\t\t\t\t\t\t\t\t\tAlways send stickers as links instead of uploads"), 
			t72 = space(), p21 = element("p"), label9 = element("label"), input11 = element("input"), 
			t73 = text("\n\t\t\t\t\t\t\t\t\t\tMask sticker links with "), code1 = element("code"), 
			code1.textContent = "[sticker](url)", t75 = text(" Markdown"), t76 = space(), p22 = element("p"), 
			label10 = element("label"), input12 = element("input"), t77 = text("\n\t\t\t\t\t\t\t\t\t\tAllow inverting send behavior if holding Ctrl when sending stickers (if always send as links is enabled, holding Ctrl when sending will instead send as uploads, and vice versa)"), 
			t78 = space(), p23 = element("p"), label11 = element("label"), input13 = element("input"), 
			t79 = text("\n\t\t\t\t\t\t\t\t\t\tIgnore missing embed links permission"), t80 = space(), 
			p24 = element("p"), label12 = element("label"), input14 = element("input"), t81 = text("\n\t\t\t\t\t\t\t\t\t\tMark as spoiler when sending stickers as uploads"), 
			t82 = space(), p25 = element("p"), label13 = element("label"), input15 = element("input"), 
			t83 = text("\n\t\t\t\t\t\t\t\t\t\tDo not warn if viewport height is insufficient"), 
			t84 = space(), p26 = element("p"), label14 = element("label"), input16 = element("input"), 
			t85 = text("\n\t\t\t\t\t\t\t\t\t\tDo not include chat input when sending stickers as links"), 
			t86 = space(), div19 = element("div"), p27 = element("p"), p27.textContent = "Sticker Size", 
			t88 = space(), p28 = element("p"), p28.textContent = "Maximum height of stickers to send. Downscaling-only.", 
			t90 = space(), p29 = element("p"), p29.innerHTML = "This depends on <b>wsrv.nl</b> not being disabled.", 
			t94 = space(), if_block7 && if_block7.c(), t95 = space(), p30 = element("p"), input17 = element("input"), 
			t96 = space(), button5 = element("button"), button5.textContent = "Set", t98 = space(), 
			div20 = element("div"), p31 = element("p"), p31.textContent = "Frequently Used", 
			t100 = space(), p32 = element("p"), p32.textContent = "Maximum amount of the most frequently used stickers to list on Frequently Used section.", 
			t102 = space(), p33 = element("p"), p33.innerHTML = "Set to <code>0</code> to completely disable the section and stickers usage counter.", 
			t106 = space(), p34 = element("p"), input18 = element("input"), t107 = space(), 
			button6 = element("button"), button6.textContent = "Set", t109 = space(), div21 = element("div"), 
			p35 = element("p"), p35.textContent = "Hotkey", t111 = space(), p36 = element("p"), 
			p36.innerHTML = '<a href="https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values" target="_blank">See a full list of key values.</a>', 
			t113 = space(), p37 = element("p"), p37.innerHTML = "Ignore notes that will not affect Chromium. Additionally, this may not have full support for everything in the documentation above, but this does support some degree of combinations of modifier keys (<code>Ctrl</code>, <code>Alt</code>, etc.) + other keys.", 
			t119 = space(), p38 = element("p"), p38.innerHTML = "e.g. <code>M</code>, <code>Ctrl+Q</code>, <code>Alt+Shift+Y</code>", 
			t126 = space(), p39 = element("p"), input19 = element("input"), t127 = space(), 
			button7 = element("button"), button7.textContent = "Set", t129 = space(), div22 = element("div"), 
			p40 = element("p"), p40.textContent = "Database", t131 = space(), p41 = element("p"), 
			input20 = element("input"), t132 = space(), button8 = element("button"), button8.textContent = "Replace Database", 
			t134 = space(), p42 = element("p"), button9 = element("button"), button9.textContent = "Export Database", 
			t136 = space(), div26 = element("div"), attr(div0, "class", div0_class_value = "stickers has-scroll-y " + (ctx[21].useLeftToolbar ? "has-left-toolbar" : "")), 
			attr(div0, "style", ""), attr(div2, "class", "pack"), attr(div2, "title", "Manage subscribed packs"), 
			attr(div3, "class", "packs-wrapper"), attr(div4, "class", "packs packs-controls"), 
			attr(div5, "class", "packs-wrapper"), attr(div6, "class", div6_class_value = "packs " + (ctx[21].useLeftToolbar ? "has-scroll-y" : "has-scroll-x")), 
			attr(div6, "style", ""), attr(div7, "class", div7_class_value = "packs-toolbar " + (ctx[21].useLeftToolbar ? "is-left" : "is-bottom")), 
			attr(div8, "class", "tab"), toggle_class(div8, "is-active", 0 === ctx[7]), attr(div9, "class", "tab"), 
			toggle_class(div9, "is-active", 1 === ctx[7]), attr(div10, "class", "tab"), toggle_class(div10, "is-active", 2 === ctx[7]), 
			attr(div11, "class", "tab"), toggle_class(div11, "is-active", 3 === ctx[7]), attr(div12, "class", "tabs"), 
			attr(input0, "class", "inputQuery"), attr(input0, "type", "text"), attr(input0, "placeholder", "Search"), 
			attr(div13, "class", "tab-content avail-packs"), attr(div13, "style", div13_style_value = 1 === ctx[7] ? "" : "display: none;"), 
			attr(p0, "class", "section-title"), attr(textarea0, "autocomplete", "off"), attr(textarea0, "class", "inputQuery"), 
			attr(textarea0, "placeholder", "LINE Sticker Pack URLs"), attr(button0, "class", "button is-primary"), 
			attr(p3, "class", "input-grouped"), attr(div14, "class", "section line-proxy"), 
			attr(p4, "class", "section-title"), attr(textarea1, "autocomplete", "off"), attr(textarea1, "class", "inputQuery"), 
			attr(textarea1, "placeholder", "Remote Pack JSON or Chibisafe Album URLs"), attr(button1, "class", "button is-primary"), 
			attr(p7, "class", "input-grouped"), attr(input1, "id", "localRemotePackInput"), 
			attr(input1, "type", "file"), input1.multiple = !0, set_style(input1, "display", "none"), 
			attr(input1, "accept", "application/JSON"), attr(button2, "class", "button has-width-full"), 
			attr(button3, "class", "button is-primary has-width-full"), attr(div15, "class", "section remote-packs"), 
			attr(div16, "class", "tab-content has-scroll-y import"), attr(div16, "style", div16_style_value = 2 === ctx[7] ? "" : "display: none;"), 
			attr(button4, "class", "button has-width-full"), attr(div17, "class", "section checkupdate"), 
			attr(p11, "class", "section-title"), attr(input2, "name", "disableUpdateCheck"), 
			attr(input2, "type", "checkbox"), attr(input3, "name", "enableWindowMagane"), attr(input3, "type", "checkbox"), 
			attr(input4, "name", "disableToasts"), attr(input4, "type", "checkbox"), attr(input5, "name", "closeWindowOnSend"), 
			attr(input5, "type", "checkbox"), attr(input6, "name", "useLeftToolbar"), attr(input6, "type", "checkbox"), 
			attr(input7, "name", "showPackAppendix"), attr(input7, "type", "checkbox"), attr(input8, "name", "disableDownscale"), 
			attr(input8, "type", "checkbox"), attr(a2, "href", "https://wsrv.nl/"), attr(a2, "target", "_blank"), 
			attr(input9, "name", "disableUploadObfuscation"), attr(input9, "type", "checkbox"), 
			attr(input10, "name", "alwaysSendAsLink"), attr(input10, "type", "checkbox"), attr(input11, "name", "maskStickerLink"), 
			attr(input11, "type", "checkbox"), attr(input12, "name", "ctrlInvertSendBehavior"), 
			attr(input12, "type", "checkbox"), attr(input13, "name", "ignoreEmbedLinksPermission"), 
			attr(input13, "type", "checkbox"), attr(input14, "name", "markAsSpoiler"), attr(input14, "type", "checkbox"), 
			attr(input15, "name", "ignoreViewportSize"), attr(input15, "type", "checkbox"), 
			attr(input16, "name", "disableSendingWithChatInput"), attr(input16, "type", "checkbox"), 
			attr(div18, "class", "section settings"), attr(p27, "class", "section-title"), attr(input17, "class", "inputQuery supress-magane-hotkey"), 
			attr(input17, "type", "number"), attr(button5, "class", "button is-primary"), attr(p30, "class", "input-grouped"), 
			attr(div19, "class", "section sticker-size"), attr(p31, "class", "section-title"), 
			attr(input18, "class", "inputQuery supress-magane-hotkey"), attr(input18, "type", "number"), 
			attr(button6, "class", "button is-primary"), attr(p34, "class", "input-grouped"), 
			attr(div20, "class", "section frequently-used"), attr(p35, "class", "section-title"), 
			attr(input19, "class", "inputQuery supress-magane-hotkey"), attr(input19, "type", "text"), 
			attr(button7, "class", "button is-primary"), attr(p39, "class", "input-grouped"), 
			attr(div21, "class", "section hotkey"), attr(p40, "class", "section-title"), attr(input20, "id", "replaceDatabaseInput"), 
			attr(input20, "type", "file"), set_style(input20, "display", "none"), attr(input20, "accept", "application/JSON"), 
			attr(button8, "class", "button is-danger has-width-full"), attr(button9, "class", "button is-primary has-width-full"), 
			attr(div22, "class", "section database"), attr(div23, "class", "tab-content has-scroll-y misc"), 
			attr(div23, "style", div23_style_value = 3 === ctx[7] ? "" : "display: none;"), 
			attr(div24, "class", "stickersConfig"), attr(div25, "class", "modal-content"), attr(div26, "class", "modal-close"), 
			attr(div27, "class", "stickersModal"), attr(div27, "style", div27_style_value = ctx[5] ? "" : "display: none;"), 
			attr(div28, "class", "stickerWindow"), attr(div28, "style", div28_style_value = `bottom: ${ctx[1].wbottom}px; right: ${ctx[1].wright}px; ` + (ctx[4] ? "" : "display: none;")), 
			attr(div29, "id", "magane"), attr(div29, "style", div29_style_value = (ctx[0] === ctx[22].LEGACY ? `top: ${ctx[1].top}px; left: ${ctx[1].left}px;` : "") + " " + (ctx[3] ? "display: none;" : ""));
		},
		m(target, anchor) {
			insert(target, main_1, anchor), append(main_1, div29), append(div29, div28), append(div28, div0), 
			if_block0 && if_block0.m(div0, null), append(div0, t0), if_block1 && if_block1.m(div0, null), 
			append(div0, t1), if_block2 && if_block2.m(div0, null), append(div0, t2);
			for (let i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].m(div0, null);
			append(div28, t3), append(div28, div7), append(div7, div4), append(div4, div3), 
			append(div3, div2), append(div3, t4), if_block3 && if_block3.m(div3, null), append(div3, t5), 
			if_block4 && if_block4.m(div3, null), append(div7, t6), append(div7, div6), append(div6, div5);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div5, null);
			append(div28, t7), append(div28, div27), append(div27, div25), append(div25, div24), 
			append(div24, div12), append(div12, div8), append(div12, t9), append(div12, div9), 
			append(div12, t11), append(div12, div10), append(div12, t13), append(div12, div11), 
			append(div24, t15), if_block5 && if_block5.m(div24, null), append(div24, t16), append(div24, div13), 
			append(div13, input0), set_input_value(input0, ctx[20]), append(div13, t17), if_block6 && if_block6.m(div13, null), 
			append(div24, t18), append(div24, div16), append(div16, div14), append(div14, p0), 
			append(div14, t20), append(div14, p1), append(div14, t24), append(div14, p2), append(div14, t26), 
			append(div14, p3), append(p3, textarea0), set_input_value(textarea0, ctx[15]), append(p3, t27), 
			append(p3, button0), append(div16, t29), append(div16, div15), append(div15, p4), 
			append(div15, t31), append(div15, p5), append(div15, t36), append(div15, p6), append(div15, t39), 
			append(div15, p7), append(p7, textarea1), set_input_value(textarea1, ctx[16]), append(p7, t40), 
			append(p7, button1), append(div15, t42), append(div15, p8), append(p8, input1), 
			append(p8, t43), append(p8, button2), append(div15, t45), append(div15, p9), append(p9, button3), 
			append(div24, t47), append(div24, div23), append(div23, div17), append(div17, p10), 
			append(p10, button4), append(div23, t49), append(div23, div18), append(div18, p11), 
			append(div18, t51), append(div18, p12), append(p12, label0), append(label0, input2), 
			input2.checked = ctx[21].disableUpdateCheck, append(label0, t52), append(div18, t53), 
			append(div18, p13), append(p13, label1), append(label1, input3), input3.checked = ctx[21].enableWindowMagane, 
			append(label1, t54), append(label1, code0), append(label1, t56), append(div18, t57), 
			append(div18, p14), append(p14, label2), append(label2, input4), input4.checked = ctx[21].disableToasts, 
			append(label2, t58), append(div18, t59), append(div18, p15), append(p15, label3), 
			append(label3, input5), input5.checked = ctx[21].closeWindowOnSend, append(label3, t60), 
			append(div18, t61), append(div18, p16), append(p16, label4), append(label4, input6), 
			input6.checked = ctx[21].useLeftToolbar, append(label4, t62), append(div18, t63), 
			append(div18, p17), append(p17, label5), append(label5, input7), input7.checked = ctx[21].showPackAppendix, 
			append(label5, t64), append(div18, t65), append(div18, p18), append(p18, label6), 
			append(label6, input8), input8.checked = ctx[21].disableDownscale, append(label6, t66), 
			append(label6, a2), append(div18, t68), append(div18, p19), append(p19, label7), 
			append(label7, input9), input9.checked = ctx[21].disableUploadObfuscation, append(label7, t69), 
			append(div18, t70), append(div18, p20), append(p20, label8), append(label8, input10), 
			input10.checked = ctx[21].alwaysSendAsLink, append(label8, t71), append(div18, t72), 
			append(div18, p21), append(p21, label9), append(label9, input11), input11.checked = ctx[21].maskStickerLink, 
			append(label9, t73), append(label9, code1), append(label9, t75), append(div18, t76), 
			append(div18, p22), append(p22, label10), append(label10, input12), input12.checked = ctx[21].ctrlInvertSendBehavior, 
			append(label10, t77), append(div18, t78), append(div18, p23), append(p23, label11), 
			append(label11, input13), input13.checked = ctx[21].ignoreEmbedLinksPermission, 
			append(label11, t79), append(div18, t80), append(div18, p24), append(p24, label12), 
			append(label12, input14), input14.checked = ctx[21].markAsSpoiler, append(label12, t81), 
			append(div18, t82), append(div18, p25), append(p25, label13), append(label13, input15), 
			input15.checked = ctx[21].ignoreViewportSize, append(label13, t83), append(div18, t84), 
			append(div18, p26), append(p26, label14), append(label14, input16), input16.checked = ctx[21].disableSendingWithChatInput, 
			append(label14, t85), append(div23, t86), append(div23, div19), append(div19, p27), 
			append(div19, t88), append(div19, p28), append(div19, t90), append(div19, p29), 
			append(div19, t94), if_block7 && if_block7.m(div19, null), append(div19, t95), append(div19, p30), 
			append(p30, input17), set_input_value(input17, ctx[17]), append(p30, t96), append(p30, button5), 
			append(div23, t98), append(div23, div20), append(div20, p31), append(div20, t100), 
			append(div20, p32), append(div20, t102), append(div20, p33), append(div20, t106), 
			append(div20, p34), append(p34, input18), set_input_value(input18, ctx[18]), append(p34, t107), 
			append(p34, button6), append(div23, t109), append(div23, div21), append(div21, p35), 
			append(div21, t111), append(div21, p36), append(div21, t113), append(div21, p37), 
			append(div21, t119), append(div21, p38), append(div21, t126), append(div21, p39), 
			append(p39, input19), set_input_value(input19, ctx[19]), append(p39, t127), append(p39, button7), 
			append(div23, t129), append(div23, div22), append(div22, p40), append(div22, t131), 
			append(div22, p41), append(p41, input20), append(p41, t132), append(p41, button8), 
			append(div22, t134), append(div22, p42), append(p42, button9), append(div27, t136), 
			append(div27, div26), ctx[112](main_1), mounted || (dispose = [ listen(div2, "click", ctx[64]), listen(div8, "click", ctx[68]), listen(div9, "click", ctx[69]), listen(div10, "click", ctx[70]), listen(div11, "click", ctx[71]), listen(input0, "keyup", ctx[32]), listen(input0, "input", ctx[75]), listen(textarea0, "input", ctx[81]), listen(button0, "click", ctx[82]), listen(textarea1, "input", ctx[83]), listen(button1, "click", ctx[84]), listen(input1, "click", click_handler_27), listen(input1, "change", ctx[44]), listen(button2, "click", ctx[85]), listen(button3, "click", ctx[86]), listen(button4, "click", ctx[87]), listen(input2, "change", ctx[88]), listen(input3, "change", ctx[89]), listen(input4, "change", ctx[90]), listen(input5, "change", ctx[91]), listen(input6, "change", ctx[92]), listen(input7, "change", ctx[93]), listen(input8, "change", ctx[94]), listen(input9, "change", ctx[95]), listen(input10, "change", ctx[96]), listen(input11, "change", ctx[97]), listen(input12, "change", ctx[98]), listen(input13, "change", ctx[99]), listen(input14, "change", ctx[100]), listen(input15, "change", ctx[101]), listen(input16, "change", ctx[102]), listen(div18, "change", ctx[47]), listen(input17, "input", ctx[103]), listen(button5, "click", ctx[104]), listen(input18, "input", ctx[105]), listen(button6, "click", ctx[106]), listen(input19, "input", ctx[107]), listen(button7, "click", ctx[108]), listen(input20, "click", click_handler_34), listen(input20, "change", ctx[51]), listen(button8, "click", ctx[109]), listen(button9, "click", ctx[110]), listen(div26, "click", ctx[111]) ], 
			mounted = !0);
		},
		p(ctx, dirty) {
			if (ctx[8].length || ctx[9].length ? if_block0 && (if_block0.d(1), if_block0 = null) : if_block0 || (if_block0 = create_if_block_18(), 
			if_block0.c(), if_block0.m(div0, t0)), ctx[8].length ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_17(ctx), 
			if_block1.c(), if_block1.m(div0, t1)) : if_block1 && (if_block1.d(1), if_block1 = null), 
			ctx[12].length ? if_block2 ? if_block2.p(ctx, dirty) : (if_block2 = create_if_block_15(ctx), 
			if_block2.c(), if_block2.m(div0, t2)) : if_block2 && (if_block2.d(1), if_block2 = null), 
			2017460993 & dirty[0] | 5 & dirty[1]) {
				let i;
				for (each_value_3 = ctx[9], i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);
					each_blocks_1[i] ? each_blocks_1[i].p(child_ctx, dirty) : (each_blocks_1[i] = create_each_block_3(child_ctx), 
					each_blocks_1[i].c(), each_blocks_1[i].m(div0, null));
				}
				for (;i < each_blocks_1.length; i += 1) each_blocks_1[i].d(1);
				each_blocks_1.length = each_value_3.length;
			}
			if (2097152 & dirty[0] && div0_class_value !== (div0_class_value = "stickers has-scroll-y " + (ctx[21].useLeftToolbar ? "has-left-toolbar" : "")) && attr(div0, "class", div0_class_value), 
			ctx[30].length && if_block3.p(ctx, dirty), ctx[12].length ? if_block4 ? if_block4.p(ctx, dirty) : (if_block4 = create_if_block_11(ctx), 
			if_block4.c(), if_block4.m(div3, null)) : if_block4 && (if_block4.d(1), if_block4 = null), 
			134218240 & dirty[0] | 64 & dirty[1]) {
				let i;
				for (each_value_2 = ctx[9], i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);
					each_blocks[i] ? each_blocks[i].p(child_ctx, dirty) : (each_blocks[i] = create_each_block_2(child_ctx), 
					each_blocks[i].c(), each_blocks[i].m(div5, null));
				}
				for (;i < each_blocks.length; i += 1) each_blocks[i].d(1);
				each_blocks.length = each_value_2.length;
			}
			2097152 & dirty[0] && div6_class_value !== (div6_class_value = "packs " + (ctx[21].useLeftToolbar ? "has-scroll-y" : "has-scroll-x")) && attr(div6, "class", div6_class_value), 
			2097152 & dirty[0] && div7_class_value !== (div7_class_value = "packs-toolbar " + (ctx[21].useLeftToolbar ? "is-left" : "is-bottom")) && attr(div7, "class", div7_class_value), 
			128 & dirty[0] && toggle_class(div8, "is-active", 0 === ctx[7]), 128 & dirty[0] && toggle_class(div9, "is-active", 1 === ctx[7]), 
			128 & dirty[0] && toggle_class(div10, "is-active", 2 === ctx[7]), 128 & dirty[0] && toggle_class(div11, "is-active", 3 === ctx[7]), 
			ctx[6][0] ? if_block5 ? if_block5.p(ctx, dirty) : (if_block5 = create_if_block_6(ctx), 
			if_block5.c(), if_block5.m(div24, t16)) : if_block5 && (if_block5.d(1), if_block5 = null), 
			1048576 & dirty[0] && input0.value !== ctx[20] && set_input_value(input0, ctx[20]), 
			ctx[6][1] ? if_block6 ? if_block6.p(ctx, dirty) : (if_block6 = create_if_block_1(ctx), 
			if_block6.c(), if_block6.m(div13, null)) : if_block6 && (if_block6.d(1), if_block6 = null), 
			128 & dirty[0] && div13_style_value !== (div13_style_value = 1 === ctx[7] ? "" : "display: none;") && attr(div13, "style", div13_style_value), 
			32768 & dirty[0] && set_input_value(textarea0, ctx[15]), 65536 & dirty[0] && set_input_value(textarea1, ctx[16]), 
			128 & dirty[0] && div16_style_value !== (div16_style_value = 2 === ctx[7] ? "" : "display: none;") && attr(div16, "style", div16_style_value), 
			2097152 & dirty[0] && (input2.checked = ctx[21].disableUpdateCheck), 2097152 & dirty[0] && (input3.checked = ctx[21].enableWindowMagane), 
			2097152 & dirty[0] && (input4.checked = ctx[21].disableToasts), 2097152 & dirty[0] && (input5.checked = ctx[21].closeWindowOnSend), 
			2097152 & dirty[0] && (input6.checked = ctx[21].useLeftToolbar), 2097152 & dirty[0] && (input7.checked = ctx[21].showPackAppendix), 
			2097152 & dirty[0] && (input8.checked = ctx[21].disableDownscale), 2097152 & dirty[0] && (input9.checked = ctx[21].disableUploadObfuscation), 
			2097152 & dirty[0] && (input10.checked = ctx[21].alwaysSendAsLink), 2097152 & dirty[0] && (input11.checked = ctx[21].maskStickerLink), 
			2097152 & dirty[0] && (input12.checked = ctx[21].ctrlInvertSendBehavior), 2097152 & dirty[0] && (input13.checked = ctx[21].ignoreEmbedLinksPermission), 
			2097152 & dirty[0] && (input14.checked = ctx[21].markAsSpoiler), 2097152 & dirty[0] && (input15.checked = ctx[21].ignoreViewportSize), 
			2097152 & dirty[0] && (input16.checked = ctx[21].disableSendingWithChatInput), ctx[0] === ctx[22].VENCORD ? if_block7 || (if_block7 = create_if_block(), 
			if_block7.c(), if_block7.m(div19, t95)) : if_block7 && (if_block7.d(1), if_block7 = null), 
			131072 & dirty[0] && to_number(input17.value) !== ctx[17] && set_input_value(input17, ctx[17]), 
			262144 & dirty[0] && to_number(input18.value) !== ctx[18] && set_input_value(input18, ctx[18]), 
			524288 & dirty[0] && input19.value !== ctx[19] && set_input_value(input19, ctx[19]), 
			128 & dirty[0] && div23_style_value !== (div23_style_value = 3 === ctx[7] ? "" : "display: none;") && attr(div23, "style", div23_style_value), 
			32 & dirty[0] && div27_style_value !== (div27_style_value = ctx[5] ? "" : "display: none;") && attr(div27, "style", div27_style_value), 
			18 & dirty[0] && div28_style_value !== (div28_style_value = `bottom: ${ctx[1].wbottom}px; right: ${ctx[1].wright}px; ` + (ctx[4] ? "" : "display: none;")) && attr(div28, "style", div28_style_value), 
			11 & dirty[0] && div29_style_value !== (div29_style_value = (ctx[0] === ctx[22].LEGACY ? `top: ${ctx[1].top}px; left: ${ctx[1].left}px;` : "") + " " + (ctx[3] ? "display: none;" : "")) && attr(div29, "style", div29_style_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			detaching && detach(main_1), if_block0 && if_block0.d(), if_block1 && if_block1.d(), 
			if_block2 && if_block2.d(), destroy_each(each_blocks_1, detaching), if_block3 && if_block3.d(), 
			if_block4 && if_block4.d(), destroy_each(each_blocks, detaching), if_block5 && if_block5.d(), 
			if_block6 && if_block6.d(), if_block7 && if_block7.d(), ctx[112](null), mounted = !1, 
			run_all(dispose);
		}
	};
}

"object" != typeof window.MAGANE_STYLES && (window.MAGANE_STYLES = {}), window.MAGANE_STYLES.main_scss = '/** Magane: main.scss **/\ndiv#magane {\n  display: flex;\n  flex-direction: row;\n  height: 44px;\n  position: absolute;\n  z-index: 1001;\n  scrollbar-width: auto !important;\n  scrollbar-color: auto !important;\n}\ndiv#magane button, div#magane input, div#magane select, div#magane label, div#magane span, div#magane p, div#magane a, div#magane li, div#magane ul, div#magane div, div#magane textarea {\n  font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;\n  font-family: var(--font-display, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif);\n  color: #efeff0;\n  color: var(--header-secondary, #efeff0);\n  font-weight: 400;\n  line-height: 1.5;\n  font-size: 16px;\n  text-rendering: optimizeLegibility;\n  -webkit-text-size-adjust: 100%;\n\t -moz-text-size-adjust: 100%;\n\t\t  text-size-adjust: 100%;\n}\ndiv#magane div.stickerWindow {\n  width: 608px;\n  min-height: 200px;\n  position: fixed;\n  background: #242429;\n  background: var(--background-surface-high, #242429);\n  max-height: 608px;\n  transition: all 0.2s ease;\n  border-radius: 8px;\n  border-radius: var(--radius-sm, 8px);\n  box-shadow: 0 0 0 1px #020203, 0 8px 16px #000;\n  box-shadow: var(--elevation-stroke, 0 0 0 1px #020203), var(--elevation-high, 0 8px 16px #000);\n}\ndiv#magane div.stickerWindow div.stickers {\n  height: 550px !important;\n  margin-bottom: 58px;\n  position: relative;\n}\ndiv#magane div.stickerWindow div.stickers.has-left-toolbar {\n  height: 608px !important;\n  margin-left: 58px;\n  margin-bottom: 0;\n}\ndiv#magane div.stickerWindow div.stickers h3.getStarted {\n  text-align: center;\n  padding-top: 40%;\n  pointer-events: none;\n}\ndiv#magane div.stickerWindow div.stickers div.pack {\n  float: left;\n  display: flex;\n  flex-flow: wrap;\n  justify-content: center;\n  padding: 20px;\n  width: 100%;\n  box-sizing: border-box;\n}\ndiv#magane div.stickerWindow div.stickers div.pack span {\n  color: #efeff0;\n  color: var(--header-secondary, #efeff0);\n  width: 100%;\n  cursor: auto;\n  padding-left: 10px;\n  margin: 10px 0px;\n}\ndiv#magane div.stickerWindow div.stickers div.pack span .counts {\n  padding-left: 0;\n}\ndiv#magane div.stickerWindow div.stickers div.pack span .counts span {\n  padding: 0 0.5em;\n}\ndiv#magane div.stickerWindow div.stickers div.pack span[\\:has\\(\\%2B\\%20.subtext\\)] {\n  margin-bottom: 0;\n}\ndiv#magane div.stickerWindow div.stickers div.pack span:has(+ .subtext) {\n  margin-bottom: 0;\n}\ndiv#magane div.stickerWindow div.stickers div.pack span.subtext {\n  color: #94959c;\n  color: var(--text-muted, #94959c);\n  font-size: 13px;\n  margin-top: 0;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100px;\n  height: 100px;\n  float: left;\n  position: relative;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker .image {\n  cursor: pointer;\n  max-height: 100%;\n  max-width: 100%;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite, div#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite {\n  width: 20px;\n  height: 20px;\n  position: absolute;\n  right: 0;\n  transition: all 0.2s ease;\n  display: none;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite:hover, div#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite:hover {\n  transform: scale(1.25);\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite:hover svg path, div#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite:hover svg path {\n  transition: all 0.2s ease;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite {\n  bottom: 0;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite:hover svg path {\n  fill: #2ECC71;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite {\n  top: 0px;\n  transform: rotateZ(45deg);\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite:hover {\n  transform: scale(1.25) rotateZ(45deg);\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite:hover svg path {\n  fill: #F04747;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker:hover div.addFavorite, div#magane div.stickerWindow div.stickers div.pack div.sticker:hover div.deleteFavorite {\n  display: block;\n  cursor: pointer;\n}\ndiv#magane div.stickerWindow div.packs-toolbar {\n  position: absolute;\n  bottom: 0;\n  display: flex;\n  background: #1a1a1e;\n  background: var(--background-base-lower, #1a1a1e);\n}\ndiv#magane div.stickerWindow div.packs-toolbar.is-bottom {\n  width: 100%;\n  height: 58px;\n  border-bottom-right-radius: 8px;\n  border-bottom-right-radius: var(--radius-sm, 8px);\n  border-bottom-left-radius: 8px;\n  border-bottom-left-radius: var(--radius-sm, 8px);\n}\ndiv#magane div.stickerWindow div.packs-toolbar.is-bottom div.packs {\n  flex: 1 1 auto;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.is-bottom div.packs.packs-controls {\n  flex: 0 0 auto;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.is-bottom div.packs div.packs-wrapper {\n  white-space: nowrap;\n  float: left;\n  width: 100%;\n  font-size: 0; /* clear whitespace */\n}\ndiv#magane div.stickerWindow div.packs-toolbar.is-bottom div.packs div.pack {\n  margin: 9px 6px;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.is-left {\n  width: 58px;\n  height: 100%;\n  flex-direction: column;\n  border-top-left-radius: 8px;\n  border-top-left-radius: var(--radius-sm, 8px);\n  border-bottom-left-radius: 8px;\n  border-bottom-left-radius: var(--radius-sm, 8px);\n}\ndiv#magane div.stickerWindow div.packs-toolbar.is-left div.packs {\n  flex: 1 1 auto;\n  height: 100%;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.is-left div.packs.packs-controls {\n  flex: 0 0 auto;\n  height: auto;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.is-left div.packs div.packs-wrapper {\n  font-size: 0; /* clear whitespace */\n}\ndiv#magane div.stickerWindow div.packs-toolbar.is-left div.packs div.pack {\n  margin: 6px 9px;\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack {\n  display: inline-block;\n  height: 40px;\n  width: 40px;\n  cursor: pointer;\n  background-position: center;\n  background-size: contain;\n  background-repeat: no-repeat;\n  transition: all 0.2s ease;\n  filter: grayscale(100%);\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack:hover,\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack div.pack.active {\n  transform: scale(1.25);\n  filter: grayscale(0%);\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack > div {\n  background-image: url("/assets/62ed7720accb1adfe95565b114e843c6.png");\n  width: 32px;\n  height: 32px;\n  background-size: 1344px 1216px;\n  background-repeat: no-repeat;\n  margin-top: 4px;\n  margin-left: 4px;\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack div.icon-favorite {\n  background-position: -1056px -288px;\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack div.icon-plus {\n  background-position: -384px -896px;\n  /* make it greenish */\n  /* thanks to the magic of https://codepen.io/sosuke/pen/Pjoqqp */\n  filter: invert(63%) sepia(25%) saturate(813%) hue-rotate(55deg) brightness(98%) contrast(82%);\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack div.icon-frequently-used {\n  background-position: -160px -960px;\n}\ndiv#magane .stickersModal {\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n  align-items: center;\n  justify-content: center;\n}\ndiv#magane .stickersModal.is-active {\n  display: flex;\n}\ndiv#magane .stickersModal .inputQuery {\n  width: calc(100% - 30px);\n  height: 36px;\n  box-sizing: border-box;\n  margin: 0 15px 10px;\n  padding: 5px 12px;\n  border-radius: 8px;\n  border-radius: var(--radius-sm, 8px);\n  border: 1px solid #242429;\n  border: 1px solid var(--background-surface-high, #242429);\n  background: #242429;\n  background: var(--background-surface-high, #242429);\n  color: #efeff0;\n  color: var(--header-secondary, #efeff0);\n}\ndiv#magane .stickersModal textarea.inputQuery {\n  height: auto;\n  min-height: 54px;\n}\ndiv#magane .stickersModal .inputPackIndex {\n  width: 55px;\n  height: 36px;\n  box-sizing: border-box;\n  padding: 5px 12px;\n  border-radius: 8px;\n  border-radius: var(--radius-sm, 8px);\n  border: 1px solid #242429;\n  border: 1px solid var(--background-surface-high, #242429);\n  background: #242429;\n  background: var(--background-surface-high, #242429);\n  color: #efeff0;\n  color: var(--header-secondary, #efeff0);\n  text-align: center;\n}\ndiv#magane .stickersModal .modal-background {\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n  width: 100%;\n  height: 100%;\n  background-color: rgba(10, 10, 10, 0.86);\n}\ndiv#magane .stickersModal .modal-content {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  left: 0;\n  top: 0;\n  background: #1a1a1e;\n  background: var(--background-base-lower, #1a1a1e);\n  border-radius: 8px;\n  border-radius: var(--radius-sm, 8px);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig {\n  height: 100%;\n  width: 100%;\n  display: flex;\n  flex-direction: column;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig .tabs {\n  padding: 16px;\n  width: 100%;\n  box-sizing: border-box;\n  text-align: center;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig .tabs .tab {\n  color: #efeff0;\n  color: var(--header-secondary, #efeff0);\n  display: inline-block;\n  border-radius: 8px;\n  border-radius: var(--radius-sm, 8px);\n  font-weight: 600;\n  padding: 4px 12px;\n  transition: background-color 0.1s ease-in-out, color 0.1s ease-in-out;\n  cursor: pointer;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig .tabs .tab:hover {\n  color: #fbfbfb;\n  color: var(--interactive-hover, #fbfbfb);\n  background: rgba(151, 151, 159, 0.2);\n  background: var(--button-secondary-background-hover, rgba(151, 151, 159, 0.2));\n}\ndiv#magane .stickersModal .modal-content .stickersConfig .tabs .tab.is-active {\n  color: #ebebed;\n  color: var(--button-secondary-text, #ebebed);\n  background: rgba(151, 151, 159, 0.1215686275);\n  background: var(--button-secondary-background, rgba(151, 151, 159, 0.1215686275));\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content {\n  height: calc(100% - 64px); /* .tabs height */\n  width: 100%;\n  padding: 10px 0;\n  box-sizing: border-box;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.avail-packs {\n  display: flex;\n  flex-direction: column;\n  padding-bottom: 0;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.avail-packs .packs {\n  height: 100%;\n  width: 100%;\n  padding-bottom: 10px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc {\n  -webkit-user-select: text;\n\t -moz-user-select: text;\n\t\t  user-select: text;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section {\n  padding: 0 24px 14px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section .section-title, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section .section-title {\n  font-weight: 800;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section > p:last-of-type, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section > p:last-of-type {\n  margin-bottom: 0;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section a, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section a {\n  color: #5197ed;\n  color: var(--text-link, #5197ed);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section a:hover, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section a:hover {\n  text-decoration: underline;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .input-grouped, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .input-grouped {\n  display: flex;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .input-grouped input, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .input-grouped input {\n  margin: 0;\n  width: auto;\n  flex-grow: 1;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .input-grouped textarea, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .input-grouped textarea {\n  margin: 0;\n  width: auto;\n  flex-grow: 1;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .input-grouped button, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .input-grouped button {\n  margin-left: 4px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack {\n  height: 75px;\n  width: 100%;\n  float: left;\n  display: flex;\n  padding: 0 20px;\n  box-sizing: border-box;\n  margin-bottom: 5px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack:last-of-type {\n  margin-bottom: 0;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.index,\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.handle,\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.preview {\n  flex: 0 0 auto;\n  min-width: 75px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action {\n  flex: 1 0 auto;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action.is-tight button {\n  width: auto;\n  padding-right: 0.5em;\n  padding-left: 0.5em;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack {\n  width: 36px;\n  height: 36px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack:before, div#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack:after {\n  background-color: #efeff0;\n  background-color: var(--header-secondary, #efeff0);\n  content: "";\n  display: block;\n  left: 50%;\n  position: absolute;\n  top: 50%;\n  transform: translateX(-50%) translateY(-50%) rotate(45deg);\n  transform-origin: center center;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack:before {\n  height: 2px;\n  width: 50%;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack:after {\n  height: 50%;\n  width: 2px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.index {\n  padding-top: 20px;\n  text-align: left;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.preview {\n  height: 75px;\n  background-position: center;\n  background-size: contain;\n  background-repeat: no-repeat;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.handle {\n  padding: 20px;\n  cursor: move;\n  padding-top: 30px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.handle span {\n  background: #555;\n  height: 2px;\n  width: 100%;\n  display: block;\n  margin-bottom: 6px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action {\n  padding-top: 20px;\n  text-align: right;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info {\n  flex: 1 1 auto;\n  padding: 14px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info > span {\n  display: block;\n  width: 100%;\n  color: #efeff0;\n  color: var(--header-secondary, #efeff0);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info > span:nth-of-type(1) {\n  font-weight: bold;\n  color: #efeff0;\n  color: var(--header-secondary, #efeff0);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info > span .appendix span:nth-of-type(1) {\n  padding: 0 0.5em;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info > span .appendix span:nth-of-type(2) {\n  -webkit-user-select: text;\n\t -moz-user-select: text;\n\t\t  user-select: text;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.preview img {\n  height: 100%;\n  width: 100%;\n}\ndiv#magane .stickersModal .modal-close {\n  -webkit-user-select: none;\n\t -moz-user-select: none;\n\t\t  user-select: none;\n  background-color: rgba(10, 10, 10, 0.2);\n  border: none;\n  border-radius: 290486px;\n  cursor: pointer;\n  display: inline-block;\n  flex-grow: 0;\n  flex-shrink: 0;\n  font-size: 0;\n  outline: none;\n  vertical-align: top;\n  background: none;\n  position: absolute;\n  right: 16px;\n  top: 16px;\n  height: 32px;\n  max-height: 32px;\n  max-width: 32px;\n  min-height: 32px;\n  min-width: 32px;\n  width: 32px;\n}\ndiv#magane .stickersModal .modal-close:before, div#magane .stickersModal .modal-close:after {\n  background-color: #efeff0;\n  background-color: var(--header-secondary, #efeff0);\n  content: "";\n  display: block;\n  left: 50%;\n  position: absolute;\n  top: 50%;\n  transform: translateX(-50%) translateY(-50%) rotate(45deg);\n  transform-origin: center center;\n}\ndiv#magane .stickersModal .modal-close:before {\n  height: 2px;\n  width: 50%;\n}\ndiv#magane .stickersModal .modal-close:after {\n  height: 50%;\n  width: 2px;\n}\ndiv#magane .stickersModal .modal-close:hover, div#magane .stickersModal .modal-close:focus {\n  background-color: rgba(10, 10, 10, 0.3);\n}\ndiv#magane .button {\n  align-items: center;\n  border: 1px solid transparent;\n  border-radius: 8px;\n  border-radius: var(--radius-sm, 8px);\n  box-shadow: none;\n  display: inline-flex;\n  font-size: 1rem;\n  font-weight: 500;\n  font-weight: var(--font-weight-medium, 500);\n  padding: calc(0.375em - 1px) 0.75em;\n  position: relative;\n  vertical-align: top;\n  -webkit-user-select: none;\n\t -moz-user-select: none;\n\t\t  user-select: none;\n  cursor: pointer;\n  justify-content: center;\n  text-align: center;\n  white-space: nowrap;\n  border-color: transparent;\n  color: #efeff0;\n  color: var(--header-secondary, #efeff0);\n  background-color: #242429;\n  background-color: var(--background-surface-high, #242429);\n  width: 62px; /* consistent width */\n}\ndiv#magane .button.is-danger {\n  color: #ffffff;\n  border-color: rgba(240, 71, 71, 0.3);\n  background: #f04747;\n}\ndiv#magane .button:hover, div#magane .button.is-primary:hover {\n  transform: scale3d(1.1, 1.1, 1.1);\n}\ndiv#magane .button.has-width-full {\n  width: 100%;\n}\ndiv#magane .button.has-width-full:hover {\n  /* TODO: Figure out how to do a more consistent scaling,\n\tregardless of the button\'s dynamic size. */\n  transform: scale3d(1.04, 1.04, 1.04);\n}\ndiv#magane .has-scroll-x {\n  overflow-x: auto;\n  overflow-y: hidden;\n  overflow: auto hidden;\n}\ndiv#magane .has-scroll-y {\n  overflow-x: hidden;\n  overflow-y: auto;\n  overflow: hidden auto;\n}\n\ndiv#maganeButton.channel-textarea-stickers {\n  display: flex;\n  align-items: center;\n  cursor: pointer;\n}\ndiv#maganeButton.channel-textarea-stickers:hover, div#maganeButton.channel-textarea-stickers.active {\n  filter: brightness(1.35);\n}\ndiv#maganeButton img.channel-textarea-stickers-content {\n  width: 24px;\n  height: 24px;\n  padding: 4px;\n  margin-left: 2px;\n  margin-right: 2px;\n}\n\ndiv.magane-vencord-modal {\n  color: #efeff0;\n  color: var(--header-secondary, #efeff0);\n  -webkit-user-select: text;\n\t -moz-user-select: text;\n\t\t  user-select: text;\n}\ndiv.magane-vencord-modal p {\n  margin: 0;\n  margin-bottom: 8px;\n}\n\ndiv#magane code,\ndiv.magane-vencord-modal code {\n  font-family: "gg mono", "Source Code Pro", Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace;\n  font-family: var(--font-code, "gg mono", "Source Code Pro", Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace);\n  border-radius: 4px;\n  border-radius: var(--radius-xs, 4px);\n  margin: -0.2em 0;\n  padding: 0 0.2em;\n  box-sizing: border-box;\n  border: 1px solid rgba(151, 151, 159, 0.2);\n  border: 1px solid var(--border-normal, rgba(151, 151, 159, 0.2));\n  background: rgba(88, 101, 242, 0.0784313725);\n  background: var(--background-code, rgba(88, 101, 242, 0.0784313725));\n  color: #efeff0;\n  color: var(--header-secondary, #efeff0);\n}\ndiv#magane pre code,\ndiv.magane-vencord-modal pre code {\n  display: block;\n  padding: 0.5em;\n  overflow-x: auto;\n}\n\n/* Scrollbars, also apply to Vencord modals */\ndiv#magane ::-webkit-scrollbar,\ndiv[class*=-outerContainer][\\:has\\(div\\[data-mana-component\\%3Dmodal\\]\\%20div.magane-vencord-modal\\)] ::-webkit-scrollbar {\n  height: 8px !important;\n  width: 8px !important;\n}\ndiv#magane ::-webkit-scrollbar,\ndiv[class*=-outerContainer]:has(div[data-mana-component=modal] div.magane-vencord-modal) ::-webkit-scrollbar {\n  height: 8px !important;\n  width: 8px !important;\n}\ndiv#magane ::-webkit-scrollbar-corner,\ndiv[class*=-outerContainer][\\:has\\(div\\[data-mana-component\\%3Dmodal\\]\\%20div.magane-vencord-modal\\)] ::-webkit-scrollbar-corner {\n  background-color: transparent;\n}\ndiv#magane ::-webkit-scrollbar-corner,\ndiv[class*=-outerContainer]:has(div[data-mana-component=modal] div.magane-vencord-modal) ::-webkit-scrollbar-corner {\n  background-color: transparent;\n}\ndiv#magane ::-webkit-scrollbar-track,\ndiv[class*=-outerContainer][\\:has\\(div\\[data-mana-component\\%3Dmodal\\]\\%20div.magane-vencord-modal\\)] ::-webkit-scrollbar-track {\n  background-color: transparent;\n  background-color: var(--scrollbar-auto-track, transparent);\n  margin: 8px 0 !important;\n  margin: var(--radius-sm, 8px) 0 !important;\n}\ndiv#magane ::-webkit-scrollbar-track,\ndiv[class*=-outerContainer]:has(div[data-mana-component=modal] div.magane-vencord-modal) ::-webkit-scrollbar-track {\n  background-color: transparent;\n  background-color: var(--scrollbar-auto-track, transparent);\n  margin: 8px 0 !important;\n  margin: var(--radius-sm, 8px) 0 !important;\n}\ndiv#magane ::-webkit-scrollbar-thumb,\ndiv[class*=-outerContainer][\\:has\\(div\\[data-mana-component\\%3Dmodal\\]\\%20div.magane-vencord-modal\\)] ::-webkit-scrollbar-thumb {\n  background-color: #666771;\n  background-color: var(--scrollbar-auto-thumb, #666771);\n  min-height: 40px;\n}\ndiv#magane ::-webkit-scrollbar-thumb,\ndiv[class*=-outerContainer]:has(div[data-mana-component=modal] div.magane-vencord-modal) ::-webkit-scrollbar-thumb {\n  background-color: #666771;\n  background-color: var(--scrollbar-auto-thumb, #666771);\n  min-height: 40px;\n}\ndiv#magane ::-webkit-scrollbar-track, div#magane ::-webkit-scrollbar-thumb,\ndiv[class*=-outerContainer][\\:has\\(div\\[data-mana-component\\%3Dmodal\\]\\%20div.magane-vencord-modal\\)] ::-webkit-scrollbar-track,\ndiv[class*=-outerContainer][\\:has\\(div\\[data-mana-component\\%3Dmodal\\]\\%20div.magane-vencord-modal\\)] ::-webkit-scrollbar-thumb {\n  background-clip: padding-box;\n  border: 0 solid transparent !important;\n  border-radius: 8px;\n  border-radius: var(--radius-sm, 8px);\n}\ndiv#magane ::-webkit-scrollbar-track, div#magane ::-webkit-scrollbar-thumb,\ndiv[class*=-outerContainer]:has(div[data-mana-component=modal] div.magane-vencord-modal) ::-webkit-scrollbar-track,\ndiv[class*=-outerContainer]:has(div[data-mana-component=modal] div.magane-vencord-modal) ::-webkit-scrollbar-thumb {\n  background-clip: padding-box;\n  border: 0 solid transparent !important;\n  border-radius: 8px;\n  border-radius: var(--radius-sm, 8px);\n}\n\n/* Fix Vencord modals width */\ndiv[data-mana-component=modal][\\:has\\(div.magane-vencord-modal\\)] {\n  max-width: 650px !important;\n  min-width: 400px;\n  width: auto;\n  overflow-y: auto;\n}\ndiv[data-mana-component=modal]:has(div.magane-vencord-modal) {\n  max-width: 650px !important;\n  min-width: 400px;\n  width: auto;\n  overflow-y: auto;\n}\ndiv[data-mana-component=modal][\\:has\\(div.magane-vencord-modal\\)] div[class*=-headerSubtitle] {\n  width: 100%;\n}\ndiv[data-mana-component=modal]:has(div.magane-vencord-modal) div[class*=-headerSubtitle] {\n  width: 100%;\n}\n\n/* Visually hide Magane button in certain scenarios */\ndiv[class*=-submitContainer] div#maganeButton { /* create thread */\n  display: none;\n}\n\ndiv[data-list-item-id^=forum-channel-list-] div#maganeButton { /* create forum post */\n  display: none;\n}';

const PACKAGE_URL = "https://raw.githubusercontent.com/Pitu/Magane/refs/heads/master/package.json", click_handler_16 = event => event.target.select(), click_handler_27 = event => event.stopPropagation(), click_handler_34 = event => event.stopPropagation();

function instance$1($$self, $$props, $$invalidate) {
	const log = (message, type = "log") => (type = [ "log", "info", "warn", "error" ].includes(type) ? type : "log", 
	console[type]("%c[Magane]%c", "color: #3a71c1; font-weight: 700", "", message)), MountType = {
		LEGACY: "legacy",
		BETTERDISCORD: "betterdiscord",
		VENCORD: "vencord"
	};
	let mountType = null;
	const Modules = {}, MOCK_API = {}, VENCORD_TOASTS_TYPE = {
		info: 0,
		success: 1,
		error: 2,
		warn: 2
	}, Helper = {
		findByProps(...args) {
			switch (mountType) {
			  case MountType.BETTERDISCORD:
				return BdApi.Webpack.getByKeys(...args);

			  case MountType.VENCORD:
				return findByPropsLazy(...args);

			  default:
				return MOCK_API.FINDBYPROPS(...args);
			}
		},
		find(...args) {
			switch (mountType) {
			  case MountType.BETTERDISCORD:
				return BdApi.Webpack.getModule(...args);

			  case MountType.VENCORD:
				return findLazy(args[0]);

			  default:
				return MOCK_API.FIND(...args);
			}
		},
		Alerts: {
			show(...args) {
				if (mountType === MountType.BETTERDISCORD) return BdApi.UI.showConfirmationModal(...args);
				if (mountType === MountType.VENCORD) {
					const title = args[0], html = args[1].split("\n\n").map((p => `<p>${p}</p>`)).join("").replace(/\*\*(.*?)\*\*/gm, "<b>$1</b>").replace(/__(.*?)__/gm, "<u>$1</u>").replace(/\[(.*?)\]\((.*?)\)/gm, '<a href="$2" target="_blank">$1</a>').replace(/```\n(.*?)\n```/gms, "<pre><code>$1</code></pre>").replace(/`(.*?)`/gm, "<code>$1</code>"), body = Modules.React.createElement("div", {
						class: "magane-vencord-modal",
						dangerouslySetInnerHTML: {
							__html: html
						}
					});
					return Alerts.show(Object.assign({
						title,
						body
					}, ...args.slice(2)));
				}
				return MOCK_API.ALERTS_SHOW(...args);
			}
		},
		Toasts: {
			show(...args) {
				if (mountType === MountType.BETTERDISCORD) return BdApi.UI.showToast(...args);
				if (mountType === MountType.VENCORD) {
					const message = args[0], options = Object.assign({}, ...args.slice(1));
					let type = 0;
					return options.type && (type = VENCORD_TOASTS_TYPE[options.type], delete options.type), 
					void 0 === options.timeout ? options.duration = 3000 : (options.duration = options.timeout, 
					delete options.timeout), options.position = 1, Toasts.show({
						message,
						type,
						options
					});
				}
				return MOCK_API.TOASTS_SHOW(...args);
			}
		},
		UI: {
			showNotice(...args) {
				if (mountType === MountType.BETTERDISCORD) return BdApi.UI.showNotice(...args);
				if (mountType === MountType.VENCORD) {
					let buttonText = "OK", onOkClick = () => Notices.popNotice();
					return Array.isArray(args[1]?.buttons) && args[1].buttons.length && (buttonText = args[1].buttons[0].label, 
					onOkClick = args[1].buttons[0].onClick), Notices.showNotice(args[0], buttonText, onOkClick);
				}
				return MOCK_API.UI_SHOWNOTICE(...args);
			}
		},
		fetch: async (...args) => mountType === MountType.BETTERDISCORD ? fetch(...args) : mountType === MountType.VENCORD ? VencordNative.pluginHelpers.MaganeVencord.fetchNative(...args) : MOCK_API.FETCH(...args),
		fetchJson: async (...args) => {
			if (mountType === MountType.BETTERDISCORD) {
				const response = await fetch(...args);
				return {
					response,
					data: await response.json()
				};
			}
			return mountType === MountType.VENCORD ? VencordNative.pluginHelpers.MaganeVencord.fetchNativeJson(...args) : MOCK_API.FETCHJSON(...args);
		},
		fetchArrayBuffer: async (...args) => {
			if (mountType === MountType.BETTERDISCORD) {
				const response = await fetch(...args);
				return {
					response,
					data: await response.arrayBuffer()
				};
			}
			return mountType === MountType.VENCORD ? VencordNative.pluginHelpers.MaganeVencord.fetchNativeArrayBuffer(...args) : MOCK_API.FETCHARRAYBUFFER(...args);
		}
	}, coords = {
		top: 0,
		left: 0
	};
	let main = null, base = null, forceHideMagane = !1, components = [], activeComponent = null, baseURL = "", stickerWindowActive = !1, stickerAddModalActive = !1;
	const stickerAddModalTabsInit = {};
	let activeTab = null, favoriteStickers = [], availablePacks = [], subscribedPacks = [], subscribedPacksSimple = [], filteredPacks = [], stickersStats = [], frequentlyUsedSorted = [], simplePacksData = {};
	const localPacks = {};
	let linePackSearch = null, remotePackUrl = null, stickerSizeInput = 180, frequentlyUsedInput = 10, hotkeyInput = null, hotkey = {}, onCooldown = !1, storage = null, packsSearch = null, resizeObserver = null;
	const resizeObserverQueue = [];
	let resizeObserverQueueWorking = !1, isWarnedAboutViewportHeight = !1;
	const waitForTimeouts = {}, remotePackTypes = {
		0: "Custom JSON",
		1: "Chibisafe Albums",
		2: "Old Chibisafe / Lolisafe v3 Albums"
	}, settings = {
		disableUpdateCheck: !1,
		enableWindowMagane: !1,
		disableToasts: !1,
		closeWindowOnSend: !1,
		useLeftToolbar: !1,
		showPackAppendix: !1,
		disableDownscale: !1,
		disableUploadObfuscation: !1,
		alwaysSendAsLink: !1,
		maskStickerLink: !1,
		ctrlInvertSendBehavior: !1,
		ignoreEmbedLinksPermission: !1,
		markAsSpoiler: !1,
		ignoreViewportSize: !1,
		disableSendingWithChatInput: !1,
		stickerSize: stickerSizeInput,
		frequentlyUsed: frequentlyUsedInput,
		hotkey: null
	}, defaultSettings = Object.freeze(Object.assign({}, settings)), allowedStorageKeys = [ "magane.available", "magane.subscribed", "magane.favorites", "magane.settings", "magane.stats" ], toast = (message, options = {}) => {
		const show = options.force || !settings.disableToasts;
		delete options.force, options.nolog && show || log(message, options.type), show && (delete options.nolog, 
		Helper.Toasts.show(message, options));
	}, toastInfo = (message, options = {}) => (options.type = "info", toast(message, options)), toastSuccess = (message, options = {}) => (options.type = "success", 
	toast(message, options)), toastError = (message, options = {}) => (options.type = "error", 
	options.force = !0, toast(message, options)), toastWarn = (message, options = {}) => (options.type = "warn", 
	options.force = !0, toast(message, options)), mountButtonComponent = textArea => {
		const buttonsContainer = textArea.querySelector('[class*="-buttons"]'), component = new Button({
			target: buttonsContainer,
			anchor: buttonsContainer.firstElementChild
		});
		return component.$on("click", (() => toggleStickerWindow(void 0, component))), component.$on("grabPacks", (async () => {
			$$invalidate(3, forceHideMagane = !0), toast("Reloading Magane's built-in packs…", {
				timeout: 1000,
				force: !0
			});
			await grabPacks(!0) && toastSuccess("Magane is now ready!", {
				force: !0
			}), $$invalidate(3, forceHideMagane = !1);
		})), component.textArea = textArea, component.lastTextAreaSize = {
			width: textArea.clientWidth,
			height: textArea.clientHeight
		}, component;
	}, updateStickerWindowPosition = component => {
		log("Updating window's position…");
		const props = component.textArea.querySelector('[class*="-buttons"]').getBoundingClientRect();
		if ($$invalidate(1, coords.wbottom = base.clientHeight - props.top + 8, coords), 
		$$invalidate(1, coords.wright = base.clientWidth - props.right - 12, coords), mountType === MountType.LEGACY) {
			const baseProps = base.getBoundingClientRect();
			$$invalidate(1, coords.wbottom += baseProps.top, coords), $$invalidate(1, coords.wright += baseProps.left, coords);
		}
	}, resizeObserverWorker = async entry => {
		if (0 !== entry?.contentRect.width && 0 !== entry?.contentRect.height) for (const component of components) if (component.textArea === entry.target) {
			if (component.lastTextAreaSize.width === entry.contentRect.width) return;
			break;
		}
		const textAreas = await ((selector, options = {}) => {
			let poll;
			return options.logname && log(`Waiting for ${options.logname}…`), new Promise((resolve => {
				(poll = () => {
					const found = [], elements = document.querySelectorAll(selector);
					for (let i = 0; i < elements.length && (("function" != typeof options.assert || options.assert(elements[i])) && found.push(elements[i]), 
					!found.length || options.multiple); i++) ;
					if (found.length) return delete waitForTimeouts[selector], resolve(found);
					waitForTimeouts[selector] = setTimeout(poll, 500);
				})();
			}));
		})('[class*="-channelTextArea"]:not([class*="-channelTextAreaDisabled"])', {
			logname: "textarea",
			assert: element => Boolean(element.querySelector('[class*="-buttons"]')),
			multiple: !0
		}), componentsOld = components.slice(), componentsNew = [];
		for (const textArea of textAreas) {
			textArea.dataset.magane_id || (textArea.dataset.magane_id = Date.now());
			let valid = !1;
			for (let i = 0; i < componentsOld.length; i++) if (componentsOld[i].textArea === textArea) {
				valid = !0, componentsOld[i].lastTextAreaSize = {
					width: textArea.clientWidth,
					height: textArea.clientHeight
				}, componentsNew.push(componentsOld[i]), componentsOld.splice(i, 1);
				break;
			}
			if (valid) {
				log(`Textarea #${textArea.dataset.magane_id}: still attached`);
				continue;
			}
			const component = mountButtonComponent(textArea);
			component ? (log(`Textarea #${textArea.dataset.magane_id}: attached`), resizeObserver.observe(textArea), 
			componentsNew.push(component)) : log(`Textarea #${textArea.dataset.magane_id}: failed to attach`);
		}
		for (const component of componentsOld) log(`Textarea #${component.textArea.dataset.magane_id}: outdated, destroying…`), 
		activeComponent === component && (toggleStickerWindow(!1, activeComponent), activeComponent = null), 
		resizeObserver.unobserve(component.textArea), component.$destroy();
		components = componentsNew, components.length ? activeComponent && updateStickerWindowPosition(activeComponent) : resizeObserverWorker();
	}, resizeObserverQueuePush = entry => new Promise(((resolve, reject) => {
		resizeObserverQueue.push({
			entry,
			resolve,
			reject
		}), resizeObserverQueueShift();
	})), resizeObserverQueueShift = () => {
		if (resizeObserverQueueWorking) return !1;
		const item = resizeObserverQueue.shift();
		if (!item) return !1;
		try {
			resizeObserverQueueWorking = !0, resizeObserverWorker(item.entry).then((value => {
				resizeObserverQueueWorking = !1, item.resolve(value), resizeObserverQueueShift();
			})).catch((err => {
				resizeObserverQueueWorking = !1, item.reject(err), resizeObserverQueueShift();
			}));
		} catch (err) {
			resizeObserverQueueWorking = !1, item.reject(err), resizeObserverQueueShift();
		}
		return !0;
	}, saveToLocalStorage = (key, payload) => {
		if (allowedStorageKeys.includes(key)) return storage.setItem(key, JSON.stringify(payload));
	}, getFromLocalStorage = key => {
		if (allowedStorageKeys.includes(key)) try {
			const stored = storage.getItem(key);
			return JSON.parse(stored);
		} catch (ex) {
			console.error(ex);
		}
	}, applySettings = data => {
		for (const key of Object.keys(defaultSettings)) void 0 === data[key] ? $$invalidate(21, settings[key] = defaultSettings[key], settings) : $$invalidate(21, settings[key] = data[key], settings);
		setWindowMaganeAPIs(settings.enableWindowMagane), $$invalidate(17, stickerSizeInput = settings.stickerSize), 
		$$invalidate(18, frequentlyUsedInput = settings.frequentlyUsed), $$invalidate(19, hotkeyInput = settings.hotkey), 
		parseThenInitHotkey();
	}, loadSettings = (reset = !1) => {
		reset && applySettings(defaultSettings);
		const storedSettings = getFromLocalStorage("magane.settings");
		storedSettings && applySettings(storedSettings);
	}, checkUpdate = async (manual = !1) => {
		log(`Fetching remote dist file from: ${PACKAGE_URL}`), manual && toast("Checking for updates…", {
			nolog: !0,
			timeout: 1000,
			force: !0
		}), await Helper.fetchJson(PACKAGE_URL, {
			cache: "no-cache"
		}).then((async result => {
			log("Remote dist file fetched.");
			const data = result.data;
			if (data.version) if (gt_1(data.version, "3.2.24")) {
				log(`Update found: ${data.version} > 3.2.24.`);
				const buttons = [ {
					label: "Download",
					onClick: () => window.open("https://raw.githubusercontent.com/Pitu/Magane/master/dist/maganevencord", {
						target: "_blank"
					})
				} ];
				buttons.unshift({
					label: "GitHub",
					onClick: () => window.open("https://github.com/Pitu/Magane", {
						target: "_blank"
					})
				}), Helper.UI.showNotice(`Magane v3.2.24 found an update: v${data.version}. Please download the update manually.`, {
					buttons
				});
			} else log(`No updates found: ${data.version} <= 3.2.24.`), manual && toast("No updates found.", {
				nolog: !0,
				force: !0
			}); else toastWarn("Failed to parse version string from remote dist file.");
		})).catch((error => {
			console.error(error), toastError("Unexpected error occurred when checking for Magane's updates. Check your console for details.");
		}));
	}, isLocalPackID = id => "string" == typeof id && (id.startsWith("startswith-") || id.startsWith("emojis-") || id.startsWith("custom-")), initSimplePackDataEntry = (pack, source) => {
		if (simplePacksData[pack]) return;
		const target = source || availablePacks, index = target.findIndex((p => p.id === pack));
		-1 !== index && $$invalidate(13, simplePacksData[pack] = {
			name: target[index].name
		}, simplePacksData);
	}, cleanUpSimplePackDataEntry = pack => {
		favoriteStickers.some((s => s.pack === pack)) || frequentlyUsedSorted.some((s => s.pack === pack)) || delete simplePacksData[pack];
	}, grabPacks = async (reset = !1) => {
		let packs;
		try {
			packs = (await Helper.fetchJson("https://magane.moe/api/packs")).data, baseURL = packs.baseURL;
		} catch (error) {
			toastError("Unable to fetch Magane's API. Magane will load as-is, but built-in remote packs will be unavailable.", {
				timeout: 6000
			}), console.error(error);
		}
		reset && (availablePacks = [], $$invalidate(11, filteredPacks = []), $$invalidate(9, subscribedPacks = []), 
		$$invalidate(10, subscribedPacksSimple = []), $$invalidate(8, favoriteStickers = []), 
		stickersStats = [], $$invalidate(12, frequentlyUsedSorted = []), $$invalidate(13, simplePacksData = {}));
		const availLocalPacks = getFromLocalStorage("magane.available");
		if (Array.isArray(availLocalPacks) && availLocalPacks.length) {
			const filteredLocalPacks = availLocalPacks.filter((pack => "object" == typeof pack && void 0 !== pack.id && isLocalPackID(pack.id)));
			availLocalPacks.length !== filteredLocalPacks.length && (log(`magane.available mismatch: ${availLocalPacks.length} !== ${filteredLocalPacks.length}`), 
			saveToLocalStorage("magane.available", filteredLocalPacks)), filteredLocalPacks.forEach((pack => {
				$$invalidate(14, localPacks[pack.id] = pack, localPacks);
			})), availablePacks.push(...filteredLocalPacks);
		}
		packs && availablePacks.push(...packs.packs), $$invalidate(11, filteredPacks = availablePacks);
		const subscribed = getFromLocalStorage("magane.subscribed");
		Array.isArray(subscribed) && subscribed.length && ($$invalidate(9, subscribedPacks = subscribed.filter((pack => !(isLocalPackID(pack.id) && !localPacks[pack.id]) && (subscribedPacksSimple.push(pack.id), 
		!0)))), subscribed.length !== subscribedPacks.length && (log(`magane.subscribed mismatch: ${subscribed.length} !== ${subscribedPacks.length}`), 
		saveToLocalStorage("magane.subscribed", subscribedPacks)));
		const favorites = getFromLocalStorage("magane.favorites");
		Array.isArray(favorites) && favorites.length && ($$invalidate(8, favoriteStickers = favorites.filter((sticker => !(isLocalPackID(sticker.pack) && !localPacks[sticker.pack]) && (initSimplePackDataEntry(sticker.pack), 
		!0)))), favorites.length !== favoriteStickers.length && (log(`magane.favorites mismatch: ${favorites.length} !== ${favoriteStickers.length}`), 
		saveToLocalStorage("magane.favorites", favoriteStickers)));
		const stats = getFromLocalStorage("magane.stats");
		return Array.isArray(stats) && stats.length && (stickersStats = stats.filter((sticker => !isLocalPackID(sticker.pack) || localPacks[sticker.pack])), 
		stats.length !== stickersStats.length && (log(`magane.stats mismatch: ${stats.length} !== ${stickersStats.length}`), 
		saveToLocalStorage("magane.stats", stickersStats)), updateFrequentlyUsed()), Boolean(packs);
	}, subscribeToPack = pack => {
		-1 === subscribedPacks.findIndex((p => p.id === pack.id)) && ($$invalidate(9, subscribedPacks = [ ...subscribedPacks, pack ]), 
		$$invalidate(10, subscribedPacksSimple = [ ...subscribedPacksSimple, pack.id ]), 
		saveToLocalStorage("magane.subscribed", subscribedPacks), log(`Subscribed > ${pack.name}`));
	}, unsubscribeToPack = pack => {
		for (let i = 0; i < subscribedPacks.length; i++) if (subscribedPacks[i].id === pack.id) return subscribedPacks.splice(i, 1), 
		subscribedPacksSimple.splice(i, 1), $$invalidate(9, subscribedPacks), $$invalidate(10, subscribedPacksSimple), 
		log(`Unsubscribed > ${pack.name}`), void saveToLocalStorage("magane.subscribed", subscribedPacks);
	}, formatUrl = (pack, id, sending, thumbIndex) => {
		let url;
		if ("number" == typeof pack) {
			if (!baseURL) {
				if (sending) throw new Error("Magane's API was unavailable. Please reload Magane if the API is already back online.");
				return "/assets/8becd37ab9d13cdfe37c08c496a9def3.svg";
			}
			if (url = `${baseURL || ""}${pack}/${id}`, !sending) return url.replace(/\.(gif|png)$/i, "_key.$1");
			if (!settings.disableDownscale && settings.stickerSize < 180) {
				const append = `&h=${settings.stickerSize}p&fit=inside&we`;
				return `https://wsrv.nl/?url=${encodeURIComponent(url)}${append}`;
			}
		} else if (pack.startsWith("startswith-")) {
			url = "https://stickershop.line-scdn.net/stickershop/v1/sticker/%id%/android/sticker.png;compress=true".replace(/%id%/g, id.split(".")[0]);
			let append = (sending ? `&h=${settings.stickerSize}p` : "&h=100p") + "&fit=inside&we";
			if (localPacks[pack].animated) {
				if (url = url.replace(/sticker(@2x)?\.png/, "sticker_animation$1.png"), mountType === MountType.VENCORD) return url;
				append += "&output=gif";
			} else append += "&af&output=png";
			settings.disableDownscale || (url = `https://wsrv.nl/?url=${encodeURIComponent(url)}${append}`);
		} else if (pack.startsWith("emojis-")) {
			url = "https://stickershop.line-scdn.net/sticonshop/v1/sticon/%pack%/android/%id%.png".replace(/%pack%/g, pack.split("-")[1]).replace(/%id%/g, id.split(".")[0]);
			let append = (sending ? `&h=${settings.stickerSize}p` : "&h=100p") + "&fit=inside&we";
			if (localPacks[pack].animated) {
				if (url = url.replace(/\.png/, "_animation.png"), mountType === MountType.VENCORD) return url;
				append += "&output=gif";
			} else append += "&af&output=png";
			settings.disableDownscale || (url = `https://wsrv.nl/?url=${encodeURIComponent(url)}${append}`);
		} else if (pack.startsWith("custom-")) {
			if (!sending && Array.isArray(localPacks[pack].thumbs)) {
				if (localPacks[pack].thumbs.length && ("number" != typeof thumbIndex && (thumbIndex = localPacks[pack].files.findIndex((file => file === id))), 
				url = thumbIndex >= 0 ? localPacks[pack].thumbs[thumbIndex] : null), !url) return "/assets/eedd4bd948a0da6d75bf5304bff4e17f.svg";
			} else url = id;
			url.includes(" ") && (url = url.substring(0, url.indexOf(" ")));
			const template = sending ? localPacks[pack].template : localPacks[pack].thumbsTemplate || localPacks[pack].template;
			"string" == typeof template && (url = template.replace(/%pack%/g, (() => pack.replace("custom-", ""))).replace(/%id%/g, url).replace(/%idencoded%/g, (() => encodeURIComponent(url))).replace(/%size%/g, settings.stickerSize));
		}
		return url;
	}, hasPermission = (permission, context) => {
		if (!Modules.PermissionsBits || !Modules.Permissions || !Modules.UserStore) return !0;
		return !!Modules.UserStore.getCurrentUser() && (!(permission && context.guild_id && !context.isDM() && !context.isGroupDM()) || Modules.Permissions.can(Modules.PermissionsBits[permission], context));
	}, sendSticker = async (pack, id, event) => {
		if (onCooldown) return toastWarn("Sending sticker is still on cooldown…", {
			timeout: 1000
		});
		if (!activeComponent) return toastWarn("Selected text area is not found, please re-open Magane window.");
		onCooldown = !0;
		try {
			const textAreaInstance = (textArea => {
				let cursor = textArea[Object.keys(textArea).find((key => key.startsWith("__reactFiber") || key.startsWith("__reactInternalInstance")))];
				for (let i = 0; i < 10 && cursor; i++) {
					if (cursor.stateNode?.handleTextareaChange) return cursor;
					cursor = cursor.return;
				}
			})(activeComponent.textArea);
			if (!textAreaInstance) throw new Error("Unable to determine textarea instance.");
			const channelId = textAreaInstance.stateNode.props.channel.id;
			if (!channelId) throw new Error("Unable to determine channel ID associated with the textarea.");
			let channel;
			if (Modules.ChannelStore && (channel = Modules.ChannelStore.getChannel(channelId)), 
			!hasPermission("SEND_MESSAGES", channelId)) throw new Error("No permission to send message in this channel.");
			settings.closeWindowOnSend && toggleStickerWindow(!1, activeComponent);
			const url = formatUrl(pack, id, !0);
			let messageContent = "";
			!settings.disableSendingWithChatInput && Modules.DraftStore && (messageContent = Modules.DraftStore.getDraft(channelId, 0) || "");
			let messageOptions = {};
			if (Modules.PendingReplyStore) {
				const pendingReply = Modules.PendingReplyStore.getPendingReply(channelId);
				pendingReply && (messageOptions = Modules.MessageUtils.getSendMessageOptionsForReply(pendingReply) || {});
			}
			let sendAsLink = settings.alwaysSendAsLink;
			if (event?.ctrlKey && settings.ctrlInvertSendBehavior && (sendAsLink = !sendAsLink), 
			!sendAsLink && channel && hasPermission("ATTACH_FILES", channel)) {
				toast("Fetching sticker…", {
					timeout: 1000
				}), log(`Fetching: ${url}`);
				let arrayBuffer = (await Helper.fetchArrayBuffer(url, {
					cache: "force-cache"
				})).data, filename = id;
				if ("string" == typeof pack && (localPacks[pack].animated && (pack.startsWith("startswith-") || pack.startsWith("emojis-")) ? (filename = filename.replace(/\.png$/i, ".gif"), 
				mountType === MountType.VENCORD ? (toast("Converting APNG to GIF…", {
					timeout: 1000
				}), arrayBuffer = await (async arrayBuffer => {
					const {frames, width, height} = await parseAPNG(arrayBuffer), gif = GIFEncoder(), maxHeight = Math.min(settings.stickerSize, height), maxWidth = width / height * maxHeight, canvas = document.createElement("canvas");
					canvas.width = maxWidth, canvas.height = maxHeight;
					const ctx = canvas.getContext("2d", {
						willReadFrequently: !0
					}), scale = maxHeight / height;
					let previousFrameData;
					ctx.scale(scale, scale);
					for (const frame of frames) {
						const {left, top, width, height, img, delay, blendOp, disposeOp} = frame;
						previousFrameData = ctx.getImageData(left, top, width, height), blendOp === ApngBlendOp.SOURCE && ctx.clearRect(left, top, width, height), 
						ctx.drawImage(img, left, top, width, height);
						const {data} = ctx.getImageData(0, 0, maxWidth, maxHeight), palette = quantize(data, 256), index = applyPalette(data, palette);
						gif.writeFrame(index, maxWidth, maxHeight, {
							transparent: !0,
							palette,
							delay
						}), disposeOp === ApngDisposeOp.BACKGROUND ? ctx.clearRect(left, top, width, height) : disposeOp === ApngDisposeOp.PREVIOUS && ctx.putImageData(previousFrameData, left, top);
					}
					return gif.finish(), gif.bytesView();
				})(arrayBuffer)) : log("This release does not have APNG to GIF conversion library, so the sticker may end up being sent as a static image.")) : pack.startsWith("custom-") && (filename = id.includes(" ") ? id.substring(id.indexOf(" ") + 1) : id.substring(id.lastIndexOf("/") + 1).split("?")[0])), 
				!settings.disableUploadObfuscation) {
					const ext = filename.match(/(\.\w+)$/);
					filename = `${Date.now().toString()}${ext ? ext[1] : ""}`;
				}
				settings.markAsSpoiler && (filename = `SPOILER_${filename}`), log(`Sending sticker as ${filename}…`), 
				messageOptions.attachmentsToUpload = [ new Modules.CloudUpload({
					file: new File([ arrayBuffer ], filename),
					isClip: !1,
					isThumbnail: !1,
					platform: 1
				}, channelId, !1, 0) ];
			} else {
				if (!(settings.ignoreEmbedLinksPermission || channel && hasPermission("EMBED_LINKS", channel))) throw new Error("No permission to attach files nor embed links.");
				{
					sendAsLink || toastWarn(channel ? "You do not have permission to attach files, sending sticker as link…" : "Unable to fetch ChannelStore module, sending sticker as link…");
					let append = url;
					settings.maskStickerLink && (append = `[sticker](${append})`), messageContent += ` ${append}`;
				}
			}
			if (toast("Sending…", {
				timeout: 1000
			}), Modules.MessageUtils._sendMessage(channelId, {
				content: messageContent
			}, messageOptions), !settings.disableSendingWithChatInput && textAreaInstance && (log("Clearing chat input…"), 
			textAreaInstance.stateNode.setState({
				textValue: "",
				richValue: [ {
					type: "line",
					children: [ {
						text: ""
					} ]
				} ]
			})), 0 !== settings.frequentlyUsed) {
				const last = stickersStats.findIndex((sticker => sticker.pack === pack && sticker.id === id));
				-1 === last ? stickersStats.push({
					pack,
					id,
					used: 1,
					lastUsed: Date.now()
				}) : (stickersStats[last].used++, stickersStats[last].lastUsed = Date.now()), saveToLocalStorage("magane.stats", stickersStats), 
				updateFrequentlyUsed();
			}
		} catch (error) {
			console.error(error), toastError(error.toString(), {
				nolog: !0,
				timeout: 6000
			});
		}
		onCooldown = !1;
	}, favoriteSticker = (pack, id) => {
		if (-1 !== favoriteStickers.findIndex((f => f.pack === pack && f.id === id))) return;
		initSimplePackDataEntry(pack, subscribedPacks);
		const favorite = {
			pack,
			id
		};
		$$invalidate(8, favoriteStickers = [ ...favoriteStickers, favorite ]), saveToLocalStorage("magane.favorites", favoriteStickers), 
		log(`Favorited > ${id} of pack ${pack}`), toastSuccess("Favorited!", {
			nolog: !0
		});
	}, unfavoriteSticker = (pack, id) => {
		const index = favoriteStickers.findIndex((f => f.pack === pack && f.id === id));
		-1 !== index && (favoriteStickers.splice(index, 1), $$invalidate(8, favoriteStickers), 
		cleanUpSimplePackDataEntry(pack), saveToLocalStorage("magane.favorites", favoriteStickers), 
		log(`Unfavorited > ${id} of pack ${pack}`), toastInfo("Unfavorited!", {
			nolog: !0
		}));
	}, filterPacks = () => {
		const query = "string" == typeof packsSearch && packsSearch.trim().toLowerCase();
		$$invalidate(11, filteredPacks = query ? availablePacks.filter((pack => pack.name.toLowerCase().indexOf(query) >= 0 || String(pack.id).indexOf(query) >= 0)) : availablePacks);
	}, _appendPack = (id, e, opts = {}) => {
		let availLocalPacks = getFromLocalStorage("magane.available");
		Array.isArray(availLocalPacks) && availLocalPacks.length || (availLocalPacks = []);
		const foundIndex = availLocalPacks.findIndex((p => p.id === id));
		if (foundIndex >= 0) {
			if (opts.overwrite && opts.partial) e = Object.assign(availLocalPacks[foundIndex], e); else if (!opts.overwrite) throw new Error(`Pack with ID ${id} already exist.`);
		} else if (opts.overwrite) throw new Error(`Cannot overwrite missing pack with ID ${id}.`);
		if (!e.count || !e.files.length) throw new Error("Invalid stickers count.");
		"animated" in e && (e.animated = Boolean(e.animated));
		const result = {
			pack: e
		};
		if (isLocalPackID(id) && $$invalidate(14, localPacks[id] = e, localPacks), foundIndex >= 0) {
			availLocalPacks[foundIndex] = e;
			const sharedIndex = availablePacks.findIndex((p => p.id === id));
			-1 !== sharedIndex && (availablePacks[sharedIndex] = e);
		} else availLocalPacks.unshift(e), availablePacks.unshift(e);
		return saveToLocalStorage("magane.available", availLocalPacks), filterPacks(), opts.overwrite ? log(`Overwritten pack with ID ${id}`) : log(`Added a new pack with ID ${id}`), 
		result;
	}, migrateStringPackIds = async () => {
		let dirty = !1;
		const favorites = getFromLocalStorage("magane.favorites");
		Array.isArray(favorites) && favorites.length && favorites.forEach((item => {
			if ("number" == typeof item.pack || isLocalPackID(item.pack)) return;
			const result = parseInt(item.pack, 10);
			isNaN(item.pack) || (item.pack = result, dirty = !0);
		}));
		const subscribed = getFromLocalStorage("magane.subscribed");
		Array.isArray(subscribed) && subscribed.length && subscribed.forEach((item => {
			if ("number" == typeof item.id || isLocalPackID(item.id)) return;
			const result = parseInt(item.id, 10);
			isNaN(item.id) || (item.id = result, dirty = !0);
		})), dirty && (toastInfo("Found packs/stickers to migrate, migrating now...", {
			force: !0
		}), saveToLocalStorage("magane.favorites", favorites), saveToLocalStorage("magane.subscribed", subscribed), 
		await grabPacks(!0), toastSuccess("Migration successful.", {
			force: !0
		}));
	}, parseFunctionArgs = (args, argNames = [], minArgs = 0) => {
		const isFirstArgAnObj = "object" == typeof args[0];
		if (!isFirstArgAnObj && args.length < minArgs) throw new Error(`This function expects at least ${minArgs} parameter(s).`);
		const parsed = {};
		for (let i = 0; i < argNames.length; i++) parsed[argNames[i]] = isFirstArgAnObj ? args[0][argNames[i]] : args[i];
		return parsed;
	}, appendPack = (...args) => {
		let {name, firstid, count, animated, homeUrl} = parseFunctionArgs(args, [ "name", "firstid", "count", "animated", "homeUrl" ], 3);
		if (firstid = Number(firstid), isNaN(firstid) || !isFinite(firstid) || firstid < 0) throw new Error("Invalid first ID.");
		count = Math.max(Math.min(Number(count), 200), 0) || 0;
		const mid = `startswith-${firstid}`, files = [];
		for (let i = firstid; i < firstid + count; i += 1) files.push(`${i}.png`);
		return _appendPack(mid, {
			name,
			count,
			id: mid,
			animated,
			files,
			homeUrl
		});
	}, appendEmojisPack = (...args) => {
		let {name, id, count, animated, homeUrl} = parseFunctionArgs(args, [ "name", "id", "count", "animated", "homeUrl" ], 3);
		count = Math.max(Math.min(Number(count), 200), 0) || 0;
		const mid = `emojis-${id}`, files = [];
		for (let i = 0; i < count; i += 1) files.push(`${String(i + 1).padStart(3, "0")}.png`);
		return _appendPack(mid, {
			name,
			count,
			id: mid,
			animated,
			files,
			homeUrl
		});
	}, appendCustomPack = (...args) => {
		let {name, id, count, animated, template, files, thumbs, thumbsTemplate} = parseFunctionArgs(args, [ "name", "id", "count", "animated", "template", "files", "thumbs", "thumbsTemplate" ], 5);
		count = Math.max(Number(count), 0) || 0;
		const mid = `custom-${id}`;
		if (Array.isArray(files)) {
			if (!files.length) throw new Error('"files" array cannot be empty.');
		} else {
			if (!template) throw new Error('"template" must be set if not using custom "files" array.');
			files = [];
			for (let i = 1; i <= count; i += 1) files.push(i + (animated ? ".gif" : ".png"));
		}
		return _appendPack(mid, {
			name,
			count,
			id: mid,
			animated,
			files,
			thumbs,
			template,
			thumbsTemplate
		});
	}, editPack = (...args) => {
		const {id, props} = parseFunctionArgs(args, [ "id", "props" ], 2);
		if ("object" != typeof props) throw new Error('"props" must be an object.');
		return _appendPack(id, props, {
			overwrite: !0,
			partial: !0
		});
	}, deletePack = id => {
		if (!isLocalPackID(id)) throw new Error('Pack ID must start with either "startswith-", "emojis-", or "custom-".');
		const availLocalPacks = getFromLocalStorage("magane.available");
		if (!Array.isArray(availLocalPacks) || !availLocalPacks.length) throw new Error("You have not imported any remote or custom packs");
		const index = availLocalPacks.findIndex((p => p.id === id));
		if (-1 === index) throw new Error(`Unable to find pack with ID ${id}`);
		$$invalidate(8, favoriteStickers = favoriteStickers.filter((s => s.pack !== id))), 
		saveToLocalStorage("magane.favorites", favoriteStickers), stickersStats = stickersStats.filter((s => s.pack !== id)), 
		saveToLocalStorage("magane.stats", stickersStats), updateFrequentlyUsed();
		const subbedPack = subscribedPacks.find((p => p.id === id));
		subbedPack && unsubscribeToPack(subbedPack), availLocalPacks.splice(index, 1), saveToLocalStorage("magane.available", availLocalPacks);
		const sharedIndex = availablePacks.findIndex((p => p.id === id));
		return -1 !== sharedIndex && (availablePacks.splice(sharedIndex, 1), filterPacks()), 
		delete localPacks[id], log(`Removed pack with ID ${id} (old index: ${index})`), 
		!0;
	}, searchPacks = keyword => {
		if (!keyword) throw new Error("Keyword required");
		keyword = keyword.toLowerCase();
		const availLocalPacks = getFromLocalStorage("magane.available");
		if (!Array.isArray(availLocalPacks) || !availLocalPacks.length) throw new Error("You have not imported any remote or custom packs");
		return availLocalPacks.filter((p => p.name.toLowerCase().indexOf(keyword) >= 0 || p.id.indexOf(keyword) >= 0));
	}, setWindowMaganeAPIs = state => {
		state ? window.magane = {
			appendPack,
			appendEmojisPack,
			appendCustomPack,
			editPack,
			deletePack,
			searchPacks,
			Helper,
			Modules,
			hasPermission
		} : window.magane instanceof Node || delete window.magane;
	};
	onMount((async () => {
		switch (base = main.parentNode.parentNode, $$invalidate(0, mountType = document.body ? MountType.BETTERDISCORD : MountType.LEGACY), 
		$$invalidate(0, mountType = MountType.VENCORD), mountType) {
		  case MountType.BETTERDISCORD:
			log("Magane is likely mounted with MaganeBD.");
			break;

		  case MountType.VENCORD:
			log("Magane is mounted with MaganeVencord.");
			break;

		  default:
			log("Magane is mounted with other or legacy method.");
		}
		log("Magane version: v3.2.24.");
		const startTime = Date.now();
		try {
			toast("Loading Magane…", {
				timeout: 1000,
				force: !0
			}), Modules.ChannelStore = Helper.findByProps("getChannel", "getDMFromUserId"), 
			Modules.SelectedChannelStore = Helper.findByProps("getLastSelectedChannelId"), Modules.UserStore = Helper.findByProps("getCurrentUser", "getUser"), 
			Modules.PermissionsBits = Helper.find((m => "bigint" == typeof m.ADMINISTRATOR), {
				searchExports: !0
			}), Modules.Permissions = Helper.findByProps("computePermissions"), Modules.CloudUpload = Helper.find((m => m.prototype?.trackUploadFinished), {
				searchExports: !0
			}), Modules.DraftStore = Helper.findByProps("getDraft", "getState"), Modules.MessageUtils = Helper.findByProps("sendMessage"), 
			Modules.PendingReplyStore = Helper.findByProps("getPendingReply"), Modules.React = Helper.findByProps("createElement", "version"), 
			(() => {
				const iframe = document.createElement("iframe");
				document.head.append(iframe), storage = Object.getOwnPropertyDescriptor(iframe.contentWindow.frames, "localStorage").get.call(window), 
				iframe.remove();
			})(), loadSettings();
			const success = await grabPacks();
			await migrateStringPackIds(), success && toastSuccess("Magane is now ready!", {
				force: !0
			}), resizeObserver = new ResizeObserver((entries => {
				for (const entry of entries) {
					if (!entry.contentRect) return;
					resizeObserverQueuePush(entry);
				}
			})), resizeObserverWorker();
		} catch (error) {
			console.error(error), toastError("Unexpected error occurred when initializing Magane. Check your console for details.");
		}
		log(`Time taken: ${(Date.now() - startTime) / 1000}s.`), settings.disableUpdateCheck || await checkUpdate();
	})), onDestroy((() => {
		document.removeEventListener("click", maganeBlurHandler), document.removeEventListener("keyup", onKeydownEvent);
		let destroyedCount = 0;
		for (let i = 0; i < components.length; i++) try {
			components[i].$destroy(), destroyedCount++;
		} catch (_) {}
		for (const timeout of Object.values(waitForTimeouts)) clearTimeout(timeout);
		resizeObserver && resizeObserver.disconnect(), setWindowMaganeAPIs(!1), log(`${destroyedCount}/${components.length} internal component(s) cleaned up.`);
	}));
	const maganeBlurHandler = e => {
		const stickerWindow = main.querySelector(".stickerWindow");
		if (stickerWindow) {
			const {x, y, width, height} = stickerWindow.getBoundingClientRect();
			if (e.target) {
				if (activeComponent?.element.contains(e.target)) return;
				const visibleModals = document.querySelectorAll('[class*="layerContainer_"]');
				if (visibleModals.length && Array.from(visibleModals).some((m => m.contains(e.target)))) return;
			}
			e.clientX <= x + width && e.clientX >= x && e.clientY <= y + height && e.clientY >= y || toggleStickerWindow(!1);
		}
	}, toggleStickerWindow = (forceState, component) => {
		if (!document.body.contains(main)) return toastError("Oh no! Magane was unexpectedly destroyed.. Please consider updating to MaganeBD instead.", {
			timeout: 6000
		});
		component && activeComponent && component !== activeComponent && (toggleStickerWindow(!1, activeComponent), 
		activeComponent = null);
		let toggledComponent = component || activeComponent;
		if (!toggledComponent && components.length && (toggledComponent = components.find((component => document.body.contains(component.element)))), 
		!toggledComponent) return;
		const active = void 0 === forceState ? !stickerWindowActive : forceState;
		if (active && document.body.contains(toggledComponent.textArea)) {
			if (updateStickerWindowPosition(toggledComponent), !settings.ignoreViewportSize && !isWarnedAboutViewportHeight) {
				Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) <= 700 && (toastWarn("Viewport height is less than 700px, Magane window may not display properly.", {
					timeout: 6000
				}), isWarnedAboutViewportHeight = !0);
			}
			activeComponent = toggledComponent, document.addEventListener("click", maganeBlurHandler);
		} else document.removeEventListener("click", maganeBlurHandler);
		$$invalidate(4, stickerWindowActive = active), toggledComponent.active = active;
	}, toggleStickerModal = () => {
		const active = !stickerAddModalActive;
		active && null === activeTab && activateTab(0), $$invalidate(5, stickerAddModalActive = active);
	}, activateTab = value => {
		$$invalidate(7, activeTab = value), stickerAddModalTabsInit[activeTab] || $$invalidate(6, stickerAddModalTabsInit[activeTab] = !0, stickerAddModalTabsInit);
	}, scrollToStickers = id => {
		scrollTo({
			element: id.replace(/([.])/g, "\\$1"),
			container: main.querySelector(".stickers")
		});
	}, deleteLocalPack = id => {
		const name = localPacks[id].name;
		Helper.Alerts.show("Purge Local Pack", `**${name}**\n\nAre you sure you want to do this?`, {
			confirmText: "Yes, purge it!",
			cancelText: "Cancel",
			danger: !0,
			onConfirm: async () => {
				try {
					deletePack(id) && toastSuccess(`Removed pack ${name}.`, {
						nolog: !0,
						force: !0
					});
				} catch (error) {
					console.error(error), toastError(error.toString(), {
						nolog: !0
					});
				}
			}
		});
	}, processRemotePack = async (data, opts) => {
		const pack = {
			id: "",
			name: "",
			files: [],
			count: 0,
			remoteType: 0
		};
		if (opts) for (const key of Object.keys(opts)) pack[key] = opts[key];
		switch (pack.remoteType) {
		  case 1:
			pack.name = String(data.album.name), pack.thumbs = [];
			for (let i = 0; i < data.album.files.length; i++) pack.files.push(data.album.files[i].url), 
			pack.thumbs.push(data.album.files[i].thumb || null);
			break;

		  case 2:
			pack.name = String(data.name), pack.thumbs = [];
			for (let i = 0; i < data.files.length; i++) pack.files.push(data.files[i].url), 
			pack.thumbs.push(data.files[i].thumb || null);
			break;

		  default:
			if ([ "id", "name", "files" ].some((key => !data[key]))) throw new Error("Invalid config. Some required fields are missing.");
			if (pack.id = String(data.id), pack.name = String(data.name), data.files.some((file => "string" != typeof file))) throw new Error('Invalid "files" array. Some values are not string.');
			if (pack.files = data.files, Array.isArray(data.thumbs)) {
				if (data.thumbs.some((thumb => "string" != typeof thumb && null !== thumb))) throw new Error('Invalid "thumbs" array. Some values are neither string nor null.');
				pack.thumbs = data.thumbs;
			}
			pack.description = data.description ? String(data.description) : null, pack.homeUrl = data.homeUrl ? String(data.homeUrl) : null, 
			pack.template = data.template ? String(data.template) : null, pack.thumbsTemplate = data.thumbsTemplate ? String(data.thumbsTemplate) : null, 
			data.updateUrl && (pack.updateUrl = String(data.updateUrl));
		}
		return pack.count = pack.files.length, Array.isArray(pack.thumbs) && pack.thumbs.every((thumb => null === thumb)) && delete pack.thumbs, 
		pack;
	}, fetchRemotePack = async url => {
		const opts = {
			updateUrl: url
		};
		if (!url || !/^https?:\/\//.test(url)) throw new Error("URL must have HTTP(s) protocol.");
		const regExes = [ /^(.+:\/\/)(.+)\/a\/([^/\s]+)/, /^(.+:\/\/)(.+)\/api\/album\/([^/\s]+)/ ];
		let data, match = {
			index: -1
		};
		for (let i = 0; i < regExes.length; i++) {
			const _match = url.match(regExes[i]);
			_match && !_match.some((m => void 0 === m)) && (match = {
				index: i,
				result: _match
			});
		}
		if (0 === match.index || 1 === match.index) {
			1 === match.index && (url = `${match.result[1]}${match.result[2]}/a/${match.result[3]}`, 
			opts.updateUrl = url), opts.id = `${match.result[2]}-${match.result[3]}`, opts.homeUrl = url;
			const downloadUrl = `${match.result[1]}${match.result[2]}/api/album/${match.result[3]}`, chibisafeSuffix = "/view?page=1&limit=500";
			log(`Fetching chibisafe album: ${downloadUrl + chibisafeSuffix}`);
			const result = await Helper.fetchJson(downloadUrl + chibisafeSuffix, {
				cache: "no-cache"
			}), response = result.response;
			if (200 === response?.status || 304 === response?.status) data = result.data, opts.remoteType = 1; else {
				const _status = response?.status ? `${response.status} ${response.statusText}`.trim() : "N/A";
				log(`HTTP error ${_status}, re-trying with: ${downloadUrl}`);
				data = (await Helper.fetchJson(downloadUrl, {
					cache: "no-cache"
				})).data, opts.remoteType = 2;
			}
		} else {
			data = (await Helper.fetchJson(opts.updateUrl)).data, opts.remoteType = 0;
		}
		if (!data) throw new Error("Unable to parse data. Check your console for details.");
		return processRemotePack(data, opts);
	}, updateRemotePack = async (id, silent = !1) => {
		try {
			if (!localPacks[id] || !localPacks[id].updateUrl) return;
			silent || toast("Updating pack information…", {
				nolog: !0,
				timeout: 1000,
				force: !0
			});
			const pack = await fetchRemotePack(localPacks[id].updateUrl);
			pack.id = id;
			const stored = _appendPack(pack.id, pack, {
				overwrite: !0
			});
			$$invalidate(8, favoriteStickers = favoriteStickers.filter((s => s.pack !== id || -1 !== stored.pack.files.findIndex((f => f === s.id))))), 
			saveToLocalStorage("magane.favorites", favoriteStickers), stickersStats = stickersStats.filter((s => s.pack !== id || -1 !== stored.pack.files.findIndex((f => f === s.id)))), 
			saveToLocalStorage("magane.stats", stickersStats), simplePacksData[id] && $$invalidate(13, simplePacksData[id].name = stored.pack.name, simplePacksData), 
			updateFrequentlyUsed();
			const subIndex = subscribedPacks.findIndex((p => p.id === id));
			return -1 !== subIndex && ($$invalidate(9, subscribedPacks[subIndex] = stored.pack, subscribedPacks), 
			$$invalidate(10, subscribedPacksSimple[subIndex] = stored.pack.id, subscribedPacksSimple), 
			saveToLocalStorage("magane.subscribed", subscribedPacks)), silent || toastSuccess(`Updated pack ${stored.pack.name}.`, {
				nolog: !0,
				timeout: 1000,
				force: !0
			}), stored;
		} catch (error) {
			console.error(error), toastError(error.toString(), {
				nolog: !0
			});
		}
	}, showPackInfo = id => {
		if (!localPacks[id]) return;
		let remoteType = "N/A";
		"number" == typeof localPacks[id].remoteType ? remoteType = `\`${localPacks[id].remoteType}\` – ${remotePackTypes[localPacks[id].remoteType] || "N/A"}` : id.startsWith("startswith-") ? (remoteType = "LINE", 
		localPacks[id].animated && (remoteType += " – Animated")) : id.startsWith("emojis-") && (remoteType = "LINE Emojis", 
		localPacks[id].animated && (remoteType += " – Animated"));
		const contents = [ "**ID:**\n\n```\n" + id + "\n```", `**Name:**\n\n${localPacks[id].name}`, `**Count:**\n\n\`${localPacks[id].count}\`` ];
		localPacks[id].description && contents.push(`**Description:**\n\n${localPacks[id].description}`), 
		localPacks[id].homeUrl && contents.push(`**Home URL:**\n\n[${localPacks[id].homeUrl}](${localPacks[id].homeUrl})`), 
		localPacks[id].updateUrl && contents.push(`**Update URL:**\n\n[${localPacks[id].updateUrl}](${localPacks[id].updateUrl})`), 
		contents.push(`**Remote Type:**\n\n${remoteType}`), "number" == typeof localPacks[id].remoteType && (contents.push("**Files:**\n\n```\n" + localPacks[id].files.join("\n") + "\n```"), 
		localPacks[id].template && contents.push("**URL Template:**\n\n```\n" + localPacks[id].template + "\n```"), 
		Array.isArray(localPacks[id].thumbs) && localPacks[id].thumbs.length && contents.push("**Thumbnails:**\n\n```\n" + localPacks[id].thumbs.join("\n") + "\n```"), 
		localPacks[id].thumbsTemplate && contents.push("**Thumbnail URL Template:**\n\n```\n" + localPacks[id].thumbsTemplate + "\n```")), 
		Helper.Alerts.show(localPacks[id].name, contents.join("\n\n"));
	}, assertImportPacksConsent = (context, onConfirm) => {
		const content = `**Please continue only if you trust these packs.**\n\n${context}`;
		Helper.Alerts.show("Import Packs", content, {
			confirmText: "Import",
			cancelText: "Cancel",
			danger: !0,
			onConfirm
		});
	}, parseLinePack = () => {
		if (!linePackSearch) return;
		const linePackUrls = linePackSearch.split("\n").map((url => url.trim())).filter((url => url.length));
		linePackUrls.length && assertImportPacksConsent("URLs:\n\n```\n" + linePackUrls.join("\n") + "\n```", (async () => {
			toast("Importing packs…", {
				nolog: !0,
				timeout: 500,
				force: !0
			});
			let hasAnimation = !1;
			const failed = [];
			for (const url of linePackUrls) try {
				const match = url.match(/^(https?:\/\/store\.line\.me\/((sticker|emoji)shop)\/product\/)?([a-z0-9]+)/);
				if (!match) throw new Error("Unsupported LINE Store URL or ID.");
				let stored;
				if ("emoji" === match[3]) {
					const id = match[4], props = (await Helper.fetchJson(`https://magane.moe/api/proxy/emoji/${id}`)).data;
					stored = appendEmojisPack({
						name: props.title,
						id: props.id,
						count: props.len,
						animated: Boolean(props.hasAnimation),
						homeUrl: url
					});
				} else {
					const id = Number(match[4]);
					if (isNaN(id) || id < 0) return toastError("Unsupported LINE Stickers ID.");
					const props = (await Helper.fetchJson(`https://magane.moe/api/proxy/sticker/${id}`)).data;
					stored = appendPack({
						name: props.title,
						firstid: props.first,
						count: props.len,
						animated: Boolean(props.hasAnimation),
						homeUrl: url
					});
				}
				stored.pack.animated && (hasAnimation = !0), toastSuccess(`Added a new pack ${stored.pack.name}.`, {
					nolog: !0,
					timeout: 1000,
					force: !0
				});
			} catch (error) {
				console.error(error), toastError(error.toString(), {
					nolog: !0
				}), failed.push(url);
			}
			failed.length ? (toastError("Failed to add some remote packs. Their URLs have been kept in the input box."), 
			$$invalidate(15, linePackSearch = failed.join("\n"))) : $$invalidate(15, linePackSearch = ""), 
			hasAnimation && mountType !== MountType.VENCORD && toastWarn("Be advised that animated stickers/emojis from LINE Store currently cannot be animated.", {
				nolog: !0,
				timeout: 6000,
				force: !0
			});
		}));
	}, parseRemotePackUrl = () => {
		if (!remotePackUrl) return;
		const remotePackUrls = remotePackUrl.split("\n").map((url => url.trim())).filter((url => url.length));
		remotePackUrls.length && assertImportPacksConsent("URLs:\n\n```\n" + remotePackUrls.join("\n") + "\n```", (async () => {
			toast("Importing packs…", {
				nolog: !0,
				timeout: 500,
				force: !0
			});
			const failed = [];
			for (const url of remotePackUrls) try {
				const pack = await fetchRemotePack(url);
				pack.id = `custom-${pack.id}`;
				const stored = _appendPack(pack.id, pack);
				toastSuccess(`Added a new pack ${stored.pack.name}.`, {
					nolog: !0,
					timeout: 1000,
					force: !0
				});
			} catch (error) {
				console.error(error), toastError(error.toString(), {
					nolog: !0
				}), failed.push(url);
			}
			failed.length ? (toastError("Failed to add some remote packs. Their URLs have been kept in the input box."), 
			$$invalidate(16, remotePackUrl = failed.join("\n"))) : $$invalidate(16, remotePackUrl = "");
		}));
	}, loadLocalRemotePack = () => {
		document.getElementById("localRemotePackInput").click();
	}, bulkUpdateRemotePacks = () => {
		const packs = Object.values(localPacks).filter((pack => pack.updateUrl)).map((pack => pack.id));
		if (!packs.length) return toastWarn("You do not have any remote packs that can be updated.");
		const content = `**Please confirm that you want to update __${packs.length}__ remote pack${1 === packs.length ? "" : "s"}.**`;
		Helper.Alerts.show(`Update ${packs.length} remote pack${1 === packs.length ? "" : "s"}`, content, {
			confirmText: "Yes, update all!",
			cancelText: "Cancel",
			danger: !0,
			onConfirm: async () => {
				try {
					for (let i = 0; i < packs.length; i++) {
						toast(`Updating pack ${i + 1} out of ${packs.length}…`, {
							nolog: !0,
							timeout: 500,
							force: !0
						});
						if (!await updateRemotePack(packs[i], !0)) break;
					}
					toastSuccess("Updates completed.", {
						nolog: !0,
						force: !0
					});
				} catch (ex) {
					toastWarn("Updates cancelled due to unexpected errors.", {
						nolog: !0
					});
				}
			}
		});
	}, parseStickerSizeInput = () => {
		const size = parseInt(stickerSizeInput, 10);
		if (isNaN(size) || size < 32 || size > 512) return toastError("Sticker size must be ≥ 32 and ≤ 512.");
		$$invalidate(21, settings.stickerSize = size, settings), log(`settings['stickerSize'] = ${settings.stickerSize}`), 
		saveToLocalStorage("magane.settings", settings), toastSuccess("Settings saved!", {
			nolog: !0,
			force: !0
		}), $$invalidate(17, stickerSizeInput = size);
	}, updateFrequentlyUsed = () => {
		const lastPackIDs = frequentlyUsedSorted.map((v => v.pack)).filter(((v, i, a) => a.indexOf(v) === i));
		if (settings.frequentlyUsed) {
			stickersStats = stickersStats.sort(((a, b) => b.used - a.used || b.lastUsed - a.lastUsed)).slice(0, Math.ceil(1.5 * settings.frequentlyUsed));
			const sliced = stickersStats.slice(0, settings.frequentlyUsed);
			sliced.forEach((sticker => initSimplePackDataEntry(sticker.pack))), $$invalidate(12, frequentlyUsedSorted = sliced);
		} else frequentlyUsedSorted.length && $$invalidate(12, frequentlyUsedSorted = []);
		lastPackIDs.forEach(cleanUpSimplePackDataEntry);
	}, parseFrequentlyUsedInput = () => {
		const count = parseInt(frequentlyUsedInput, 10);
		if (isNaN(count) || count < 0) return toastError("Invalid number.");
		$$invalidate(21, settings.frequentlyUsed = count, settings), log(`settings['frequentlyUsed'] = ${settings.frequentlyUsed}`), 
		saveToLocalStorage("magane.settings", settings), 0 === count ? (stickersStats = [], 
		saveToLocalStorage("magane.stats", stickersStats), toastSuccess("Settings saved, and stickers usage cleared!", {
			nolog: !0,
			force: !0
		})) : toastSuccess("Settings saved!", {
			nolog: !0,
			force: !0
		}), $$invalidate(18, frequentlyUsedInput = count), updateFrequentlyUsed();
	}, onKeydownEvent = event => {
		for (const prop in hotkey) if ("key" === prop || "code" === prop) {
			if (hotkey[prop] !== event[prop].toLocaleLowerCase()) return;
		} else if (hotkey[prop] !== event[prop]) return;
		event.target?.classList.contains("supress-magane-hotkey") || components.length && (event.preventDefault(), 
		toggleStickerWindow());
	}, parseThenInitHotkey = save => {
		const keys = (hotkeyInput || "").split("+").map((key => key.trim()));
		if ($$invalidate(19, hotkeyInput = keys.join("+")), hotkeyInput && keys.length) {
			const tmp = {
				key: null,
				code: null,
				altKey: !1,
				metaKey: !1,
				shiftKey: !1,
				ctrlKey: !1
			};
			for (let i = 0; i < keys.length; i++) {
				let key = keys[i].toLocaleLowerCase();
				if (i === keys.length - 1) /^(ctrl|ctl)/.test(key) && (key = key.replace(/^(ctrl|ctl)/, "control")), 
				/(right|left)$/.test(key) ? (tmp.code = key, tmp.key = key.replace(/(right|left)$/, "")) : tmp.key = key; else if (/^alt/.test(key)) tmp.altKey = !0; else if (/^meta/.test(key)) tmp.metaKey = !0; else if (/^shift/.test(key)) tmp.shiftKey = !0; else {
					if (!/^(control|ctrl|ctl)/.test(key)) return toastError("Invalid hotkey. If used with modifier keys, only support 1 other key.", {
						timeout: 6000
					});
					tmp.ctrlKey = !0;
				}
			}
			tmp.code || delete tmp.code, hotkey = tmp, document.addEventListener("keyup", onKeydownEvent);
		} else hotkey = null, document.removeEventListener("keyup", onKeydownEvent);
		save && ($$invalidate(21, settings.hotkey = hotkeyInput, settings), log(`settings['hotkey'] = ${settings.hotkey}`), 
		saveToLocalStorage("magane.settings", settings), toastSuccess(hotkey ? "Hotkey saved." : "Hotkey cleared.", {
			nolog: !0,
			force: !0
		}));
	}, replaceDatabase = () => {
		document.getElementById("replaceDatabaseInput").click();
	}, exportDatabase = () => {
		const element = document.createElement("a");
		let hrefUrl = "";
		try {
			toast("Exporting database…", {
				timeout: 1000,
				force: !0
			});
			const database = {};
			for (const key of allowedStorageKeys) {
				const data = getFromLocalStorage(key);
				void 0 !== data && (database[key] = data);
			}
			const dbString = JSON.stringify(database), blob = new Blob([ dbString ]);
			hrefUrl = window.URL.createObjectURL(blob), element.href = hrefUrl, element.download = `magane.database.${(new Date).toISOString()}.json`, 
			element.click();
		} catch (error) {
			console.error(error), toastError("Unexpected error occurred. Check your console for details.");
		}
		element.remove(), hrefUrl && window.URL.revokeObjectURL(hrefUrl);
	};
	return [ mountType, coords, main, forceHideMagane, stickerWindowActive, stickerAddModalActive, stickerAddModalTabsInit, activeTab, favoriteStickers, subscribedPacks, subscribedPacksSimple, filteredPacks, frequentlyUsedSorted, simplePacksData, localPacks, linePackSearch, remotePackUrl, stickerSizeInput, frequentlyUsedInput, hotkeyInput, packsSearch, settings, MountType, checkUpdate, isLocalPackID, subscribeToPack, unsubscribeToPack, formatUrl, sendSticker, event => {
		event.target && (event.target.src = event.target.src);
	}, favoriteSticker, unfavoriteSticker, filterPacks, count => `<span class="counts"><span>–</span>${count} sticker${1 === count ? "" : "s"}</span>`, id => {
		let tmp = `${id}`;
		return "string" == typeof id && (id.startsWith("startswith-") ? tmp = `LINE ${id.replace("startswith-", "")}` : id.startsWith("emojis-") ? tmp = `LINE Emojis ${id.replace("emojis-", "")}` : id.startsWith("custom-") && (tmp = id.replace("custom-", ""))), 
		`<span class="appendix"><span>–</span><span title="ID: ${id}">${tmp}</span></span>`;
	}, toggleStickerModal, activateTab, scrollToStickers, event => {
		const value = event.target.value.trim();
		if (13 !== event.keyCode || !value.length) return;
		let newIndex = Number(value);
		if (isNaN(newIndex) || newIndex < 1 || newIndex > subscribedPacks.length) return toastError(`New position must be ≥ 1 and ≤ ${subscribedPacks.length}.`);
		newIndex--;
		let packId = event.target.dataset.pack;
		if (void 0 === packId) return;
		isLocalPackID(packId) || (packId = Number(packId));
		const oldIndex = subscribedPacks.findIndex((pack => pack.id === packId));
		if (oldIndex === newIndex) return;
		const packData = subscribedPacks.splice(oldIndex, 1);
		subscribedPacksSimple.splice(oldIndex, 1), subscribedPacks.splice(newIndex, 0, packData[0]), 
		subscribedPacksSimple.splice(newIndex, 0, packData[0].id), event.target.blur(), 
		event.target.value = String(oldIndex), $$invalidate(9, subscribedPacks), $$invalidate(10, subscribedPacksSimple), 
		saveToLocalStorage("magane.subscribed", subscribedPacks), toastSuccess(`Moved pack from position ${oldIndex + 1} to ${newIndex + 1}.`);
	}, deleteLocalPack, updateRemotePack, showPackInfo, parseLinePack, parseRemotePackUrl, async event => {
		const {files} = event.target;
		if (!files.length) return !1;
		const results = [];
		toast(`Reading ${files.length} file${1 === files.length ? "" : "s"}…`, {
			timeout: 500,
			force: !0
		});
		for (const file of files) await new Promise(((resolve, reject) => {
			const reader = new FileReader;
			reader.onload = e => {
				try {
					const data = JSON.parse(e.target.result);
					results.push({
						name: file.name,
						data
					}), resolve();
				} catch (error) {
					reject(error);
				}
			}, log(`Reading ${file.name}…`), reader.readAsText(file);
		})).catch((error => {
			console.error(error), toastError(`${file.name} is not a valid JSON file.`);
		}));
		if (event.target.value = "", !results.length) return !1;
		const fileNames = results.map((result => result.name));
		assertImportPacksConsent("Files:\n\n```\n" + fileNames.join("\n") + "\n```", (async () => {
			const failedResults = [];
			for (const result of results) try {
				const pack = await processRemotePack(result.data);
				pack.id = `custom-${pack.id}`;
				const stored = _appendPack(pack.id, pack);
				toastSuccess(`Added a new pack ${stored.pack.name}.`, {
					nolog: !0,
					timeout: 1000,
					force: !0
				});
			} catch (error) {
				console.error(error), toastError(error.toString(), {
					nolog: !0
				}), failedResults.push(result.name);
			}
			failedResults.length && toastError(`Failed to add: ${failedResults.join(",")}.`);
		}));
	}, loadLocalRemotePack, bulkUpdateRemotePacks, event => {
		const {name} = event.target;
		if (!name) return !1;
		log(`settings['${name}'] = ${settings[name]}`), setWindowMaganeAPIs(settings.enableWindowMagane), 
		saveToLocalStorage("magane.settings", settings), toastSuccess("Settings saved!", {
			nolog: !0
		});
	}, parseStickerSizeInput, parseFrequentlyUsedInput, parseThenInitHotkey, event => {
		const {files} = event.target;
		if (!files.length) return !1;
		const reader = new FileReader;
		reader.onload = e => {
			let result;
			event.target.value = "";
			try {
				result = JSON.parse(e.target.result);
			} catch (error) {
				console.error(error), toastError("The selected file is not a valid JSON file.");
			}
			let content = "This database contains the following data:";
			const valid = [], invalid = [];
			for (const key of allowedStorageKeys) if (void 0 === result[key] || null === result[key]) invalid.push(key); else {
				let len = null;
				if (Array.isArray(result[key])) len = result[key].length; else try {
					len = Object.keys(result[key]).length;
				} catch (ex) {}
				let append = "";
				null !== len && (append = ` has **${len}** item${1 === len ? "" : "s"}`), content += `\n**${key}**${append}`, 
				valid.push(key);
			}
			valid.length || (content = "**This is an empty database file.**"), invalid.length && (content += `\nThese missing or invalid field${1 === invalid.length ? "" : "s"} **will be removed**:`, 
			content += `\n${invalid.join("\n")}`), content += "\n**Please continue only if you trust this database file.**", 
			Helper.Alerts.show("Replace Database", content.replace(/\n/g, "\n\n"), {
				confirmText: "Go ahead!",
				cancelText: "Cancel",
				danger: !0,
				onConfirm: async () => {
					for (const key of valid) saveToLocalStorage(key, result[key]);
					for (const key of invalid) storage.removeItem(key);
					$$invalidate(3, forceHideMagane = !0), toast("Reloading Magane database…", {
						timeout: 1000,
						force: !0
					}), Object.assign(settings, defaultSettings), loadSettings(!0);
					const success = await grabPacks(!0);
					await migrateStringPackIds(), success && toastSuccess("Magane is now ready!", {
						force: !0
					}), $$invalidate(3, forceHideMagane = !1);
				}
			});
		}, log(`Reading ${files[0].name}…`), reader.readAsText(files[0]);
	}, replaceDatabase, exportDatabase, (pack, sticker, f) => f.pack === pack.id && f.id === sticker, (sticker, f) => f.pack === sticker.pack && f.id === sticker.id, (sticker, event) => sendSticker(sticker.pack, sticker.id, event), sticker => unfavoriteSticker(sticker.pack, sticker.id), (sticker, event) => sendSticker(sticker.pack, sticker.id, event), sticker => favoriteSticker(sticker.pack, sticker.id), sticker => unfavoriteSticker(sticker.pack, sticker.id), (pack, sticker, event) => sendSticker(pack.id, sticker, event), (pack, sticker) => favoriteSticker(pack.id, sticker), (pack, sticker) => unfavoriteSticker(pack.id, sticker), () => toggleStickerModal(), () => scrollToStickers("#pfavorites"), () => scrollToStickers("#pfrequentlyused"), pack => scrollToStickers(`#p${pack.id}`), () => activateTab(0), () => activateTab(1), () => activateTab(2), () => activateTab(3), pack => unsubscribeToPack(pack), pack => showPackInfo(pack.id), pack => updateRemotePack(pack.id), function input0_input_handler() {
		packsSearch = this.value, $$invalidate(20, packsSearch);
	}, pack => unsubscribeToPack(pack), pack => subscribeToPack(pack), pack => showPackInfo(pack.id), pack => updateRemotePack(pack.id), pack => deleteLocalPack(pack.id), function textarea0_input_handler() {
		linePackSearch = this.value, $$invalidate(15, linePackSearch);
	}, () => parseLinePack(), function textarea1_input_handler() {
		remotePackUrl = this.value, $$invalidate(16, remotePackUrl);
	}, () => parseRemotePackUrl(), () => loadLocalRemotePack(), () => bulkUpdateRemotePacks(), () => checkUpdate(!0), function input2_change_handler() {
		settings.disableUpdateCheck = this.checked, $$invalidate(21, settings);
	}, function input3_change_handler() {
		settings.enableWindowMagane = this.checked, $$invalidate(21, settings);
	}, function input4_change_handler() {
		settings.disableToasts = this.checked, $$invalidate(21, settings);
	}, function input5_change_handler() {
		settings.closeWindowOnSend = this.checked, $$invalidate(21, settings);
	}, function input6_change_handler() {
		settings.useLeftToolbar = this.checked, $$invalidate(21, settings);
	}, function input7_change_handler() {
		settings.showPackAppendix = this.checked, $$invalidate(21, settings);
	}, function input8_change_handler() {
		settings.disableDownscale = this.checked, $$invalidate(21, settings);
	}, function input9_change_handler() {
		settings.disableUploadObfuscation = this.checked, $$invalidate(21, settings);
	}, function input10_change_handler() {
		settings.alwaysSendAsLink = this.checked, $$invalidate(21, settings);
	}, function input11_change_handler() {
		settings.maskStickerLink = this.checked, $$invalidate(21, settings);
	}, function input12_change_handler() {
		settings.ctrlInvertSendBehavior = this.checked, $$invalidate(21, settings);
	}, function input13_change_handler() {
		settings.ignoreEmbedLinksPermission = this.checked, $$invalidate(21, settings);
	}, function input14_change_handler() {
		settings.markAsSpoiler = this.checked, $$invalidate(21, settings);
	}, function input15_change_handler() {
		settings.ignoreViewportSize = this.checked, $$invalidate(21, settings);
	}, function input16_change_handler() {
		settings.disableSendingWithChatInput = this.checked, $$invalidate(21, settings);
	}, function input17_input_handler() {
		stickerSizeInput = to_number(this.value), $$invalidate(17, stickerSizeInput);
	}, () => parseStickerSizeInput(), function input18_input_handler() {
		frequentlyUsedInput = to_number(this.value), $$invalidate(18, frequentlyUsedInput);
	}, () => parseFrequentlyUsedInput(), function input19_input_handler() {
		hotkeyInput = this.value, $$invalidate(19, hotkeyInput);
	}, () => parseThenInitHotkey(!0), () => replaceDatabase(), () => exportDatabase(), () => toggleStickerModal(), function main_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"]((() => {
			main = $$value, $$invalidate(2, main);
		}));
	} ];
}

var App$2 = function getCjsExportFromNamespace(n) {
	return n && n.default || n;
}(Object.freeze({
	__proto__: null,
	default: class App extends SvelteComponent {
		constructor(options) {
			super(), init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, null, [ -1, -1, -1, -1, -1, -1, -1 ]);
		}
	}
})), vencordMain = definePlugin({
	name: "MaganeVencord",
	authors: [ {
		id: 176200089226706944n,
		name: "Pitu"
	}, {
		id: 530445553562025984n,
		name: "Bobby"
	} ],
	description: "Bringing LINE stickers to Discord in a chaotic way. Vencord edition.",
	log: (message, type = "log") => console[type]("%c[MaganeVencord]%c", "color: #3a71c1; font-weight: 700", "", message),
	start() {
		for (const id of Object.keys(window.MAGANE_STYLES)) {
			const _id = `MaganeVencord-${id}`, style = document.createElement("style");
			style.id = _id, style.innerText = window.MAGANE_STYLES[id], document.head.appendChild(style), 
			this.log(`Injected CSS with ID "${_id}".`);
		}
		this.log("Mounting container into DOM…"), this.container = document.createElement("div"), 
		this.container.id = "maganeContainer", document.body.appendChild(this.container), 
		this.app = new App$2({
			target: this.container
		});
	},
	stop() {
		this.app && (this.app.$destroy(), this.log("Destroyed Svelte component.")), this.container && (this.container.remove(), 
		this.log("Removed container from DOM."));
		for (const id of Object.keys(window.MAGANE_STYLES)) {
			const _id = `MaganeVencord-${id}`, _style = document.querySelector(`head style#${_id}`);
			_style && (_style.remove(), this.log(`Cleared CSS with ID "${_id}".`));
		}
	}
});

module.exports = vencordMain;
