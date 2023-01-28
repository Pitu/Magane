/**
 * @name MaganeBD
 * @displayName MaganeBD
 * @description Bringing LINE stickers to Discord in a chaotic way. BetterDiscord-plugin edition.
 * @author Kana, Bobby
 * @authorId 176200089226706944
 * @authorLink https://github.com/Pitu
 * @license MIT - https://opensource.org/licenses/MIT
 * @version 3.2.10
 * @invite 5g6vgwn
 * @source https://github.com/Pitu/Magane
 * @updateUrl https://raw.githubusercontent.com/Pitu/Magane/master/dist/magane.plugin.js
 * @website https://magane.moe
 * @donate https://github.com/sponsors/Pitu
 * @patreon https://patreon.com/pitu
 */

"use strict";

var commonjsGlobal = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {};

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

function stop_propagation(fn) {
	return function(event) {
		return event.stopPropagation(), fn.call(this, event);
	};
}

function attr(node, attribute, value) {
	null == value ? node.removeAttribute(attribute) : node.getAttribute(attribute) !== value && node.setAttribute(attribute, value);
}

function set_data(text, data) {
	data = "" + data, text.wholeText !== data && (text.data = data);
}

function set_input_value(input, value) {
	input.value = null == value ? "" : value;
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
			return callbacks.slice().forEach(fn => {
				fn.call(component, event);
			}), !event.defaultPrevented;
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
	if ($$.ctx = instance ? instance(component, options.props || {}, (i, ret, ...rest) => {
		const value = rest.length ? rest[0] : ret;
		return $$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value) && (!$$.skip_bound && $$.bound[i] && $$.bound[i](value), 
		ready && make_dirty(component, i)), ret;
	}) : [], $$.update(), ready = !0, run_all($$.before_update), $$.fragment = !!create_fragment && create_fragment($$.ctx), 
	options.target) {
		if (options.hydrate) {
			const nodes = function children(element) {
				return Array.from(element.childNodes);
			}(options.target);
			$$.fragment && $$.fragment.l(nodes), nodes.forEach(detach);
		} else $$.fragment && $$.fragment.c();
		options.intro && transition_in(component.$$.fragment), function mount_component(component, target, anchor, customElement) {
			const {fragment, on_mount, on_destroy, after_update} = component.$$;
			fragment && fragment.m(target, anchor), customElement || add_render_callback(() => {
				const new_on_destroy = on_mount.map(run).filter(is_function);
				on_destroy ? on_destroy.push(...new_on_destroy) : run_all(new_on_destroy), component.$$.on_mount = [];
			}), after_update.forEach(add_render_callback);
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
			toggle_class(div, "active", ctx[1]);
		},
		m(target, anchor) {
			var fn;
			insert(target, div, anchor), ctx[5](div), mounted || (dispose = [ listen(div, "click", ctx[6]), listen(div, "contextmenu", stop_propagation((fn = ctx[7], 
			function(event) {
				return event.preventDefault(), fn.call(this, event);
			}))) ], mounted = !0);
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
	onMount(() => log("Mounted.")), onDestroy(() => log("Destroyed."));
	return $$self.$$set = $$props => {
		"element" in $$props && $$invalidate(0, element = $$props.element), "active" in $$props && $$invalidate(1, active = $$props.active), 
		"textArea" in $$props && $$invalidate(3, textArea = $$props.textArea), "lastTextAreaSize" in $$props && $$invalidate(4, lastTextAreaSize = $$props.lastTextAreaSize);
	}, [ element, active, dispatch, textArea, lastTextAreaSize, function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			element = $$value, $$invalidate(0, element);
		});
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
	tasks.forEach(task => {
		task.c(now) || (tasks.delete(task), task.f());
	}), 0 !== tasks.size && raf(run_tasks);
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
			promise: new Promise(fulfill => {
				tasks.add(task = {
					c: callback,
					f: fulfill
				});
			}),
			abort() {
				tasks.delete(task);
			}
		};
	}(now => {
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
	}), start(delay), tick(0), stop;
}, scrollTo = options => _scrollTo((options => {
	let opts = _.extend({}, defaultOptions, options);
	return opts.container = _.$(opts.container), opts.element = _.$(opts.element), opts;
})(options));

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[162] = list[i], child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[162] = list[i], child_ctx[166] = i, child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[162] = list[i], child_ctx[166] = i, child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[162] = list[i], child_ctx[166] = i, child_ctx;
}

function get_each_context_4(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[169] = list[i], child_ctx[166] = i, child_ctx;
}

function get_each_context_5(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[169] = list[i], child_ctx[166] = i, child_ctx;
}

function get_each_context_6(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[169] = list[i], child_ctx[166] = i, child_ctx;
}

function create_if_block_16(ctx) {
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

function create_if_block_15(ctx) {
	let div, span, t0, html_tag, t1, raw_value = ctx[28](ctx[8].length) + "", each_value_6 = ctx[8], each_blocks = [];
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
			if (256 & dirty[0] && raw_value !== (raw_value = ctx[28](ctx[8].length) + "") && html_tag.p(raw_value), 
			92283136 & dirty[0]) {
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
	function click_handler() {
		return ctx[50](ctx[169]);
	}
	function click_handler_1() {
		return ctx[51](ctx[169]);
	}
	return {
		c() {
			div1 = element("div"), img = element("img"), t0 = space(), div0 = element("div"), 
			div0.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></svg>', 
			t1 = space(), attr(img, "class", "image"), src_url_equal(img.src, img_src_value = "" + ctx[23](ctx[169].pack, ctx[169].id)) || attr(img, "src", img_src_value), 
			attr(img, "alt", img_alt_value = ctx[169].pack + " - " + ctx[169].id), attr(img, "title", img_title_value = ctx[13][ctx[169].pack] ? ctx[13][ctx[169].pack].name : ""), 
			attr(div0, "class", "deleteFavorite"), attr(div0, "title", "Unfavorite"), attr(div1, "class", "sticker");
		},
		m(target, anchor) {
			insert(target, div1, anchor), append(div1, img), append(div1, t0), append(div1, div0), 
			append(div1, t1), mounted || (dispose = [ listen(img, "click", click_handler), listen(div0, "click", click_handler_1) ], 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 256 & dirty[0] && !src_url_equal(img.src, img_src_value = "" + ctx[23](ctx[169].pack, ctx[169].id)) && attr(img, "src", img_src_value), 
			256 & dirty[0] && img_alt_value !== (img_alt_value = ctx[169].pack + " - " + ctx[169].id) && attr(img, "alt", img_alt_value), 
			8448 & dirty[0] && img_title_value !== (img_title_value = ctx[13][ctx[169].pack] ? ctx[13][ctx[169].pack].name : "") && attr(img, "title", img_title_value);
		},
		d(detaching) {
			detaching && detach(div1), mounted = !1, run_all(dispose);
		}
	};
}

function create_if_block_13(ctx) {
	let div, span, t0, html_tag, t1, raw_value = ctx[28](ctx[12].length) + "", each_value_5 = ctx[12], each_blocks = [];
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
			if (4096 & dirty[0] && raw_value !== (raw_value = ctx[28](ctx[12].length) + "") && html_tag.p(raw_value), 
			125841664 & dirty[0]) {
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
		return ctx[54](ctx[169]);
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

function create_if_block_14(ctx) {
	let div, mounted, dispose;
	function click_handler_3() {
		return ctx[53](ctx[169]);
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
		return ctx[49](ctx[169], ...args);
	}
	function click_handler_2() {
		return ctx[52](ctx[169]);
	}
	function select_block_type(ctx, dirty) {
		return 4352 & dirty[0] && (show_if = null), null == show_if && (show_if = !(-1 !== ctx[8].findIndex(func_1))), 
		show_if ? create_if_block_14 : create_else_block_2;
	}
	let current_block_type = select_block_type(ctx, [ -1, -1, -1, -1, -1, -1 ]), if_block = current_block_type(ctx);
	return {
		c() {
			div = element("div"), img = element("img"), t0 = space(), if_block.c(), t1 = space(), 
			attr(img, "class", "image"), src_url_equal(img.src, img_src_value = "" + ctx[23](ctx[169].pack, ctx[169].id)) || attr(img, "src", img_src_value), 
			attr(img, "alt", img_alt_value = ctx[169].pack + " - " + ctx[169].id), attr(img, "title", img_title_value = (ctx[13][ctx[169].pack] ? ctx[13][ctx[169].pack].name + " – " : "") + "Used: " + ctx[169].used), 
			attr(div, "class", "sticker");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, img), append(div, t0), if_block.m(div, null), 
			append(div, t1), mounted || (dispose = listen(img, "click", click_handler_2), mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 4096 & dirty[0] && !src_url_equal(img.src, img_src_value = "" + ctx[23](ctx[169].pack, ctx[169].id)) && attr(img, "src", img_src_value), 
			4096 & dirty[0] && img_alt_value !== (img_alt_value = ctx[169].pack + " - " + ctx[169].id) && attr(img, "alt", img_alt_value), 
			12288 & dirty[0] && img_title_value !== (img_title_value = (ctx[13][ctx[169].pack] ? ctx[13][ctx[169].pack].name + " – " : "") + "Used: " + ctx[169].used) && attr(img, "title", img_title_value), 
			current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block ? if_block.p(ctx, dirty) : (if_block.d(1), 
			if_block = current_block_type(ctx), if_block && (if_block.c(), if_block.m(div, t1)));
		},
		d(detaching) {
			detaching && detach(div), if_block.d(), mounted = !1, dispose();
		}
	};
}

function create_else_block_1(ctx) {
	let div, mounted, dispose;
	function click_handler_7() {
		return ctx[57](ctx[162], ctx[169]);
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

function create_if_block_12(ctx) {
	let div, mounted, dispose;
	function click_handler_6() {
		return ctx[56](ctx[162], ctx[169]);
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
		return ctx[48](ctx[162], ctx[169], ...args);
	}
	function click_handler_5() {
		return ctx[55](ctx[162], ctx[169]);
	}
	function select_block_type_1(ctx, dirty) {
		return 768 & dirty[0] && (show_if = null), null == show_if && (show_if = !(-1 !== ctx[8].findIndex(func))), 
		show_if ? create_if_block_12 : create_else_block_1;
	}
	let current_block_type = select_block_type_1(ctx, [ -1, -1, -1, -1, -1, -1 ]), if_block = current_block_type(ctx);
	return {
		c() {
			div = element("div"), img = element("img"), t = space(), if_block.c(), attr(img, "class", "image"), 
			src_url_equal(img.src, img_src_value = "" + ctx[23](ctx[162].id, ctx[169], !1, ctx[166])) || attr(img, "src", img_src_value), 
			attr(img, "alt", img_alt_value = ctx[162].id + " - " + ctx[169]), attr(div, "class", "sticker");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, img), append(div, t), if_block.m(div, null), 
			mounted || (dispose = listen(img, "click", click_handler_5), mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 512 & dirty[0] && !src_url_equal(img.src, img_src_value = "" + ctx[23](ctx[162].id, ctx[169], !1, ctx[166])) && attr(img, "src", img_src_value), 
			512 & dirty[0] && img_alt_value !== (img_alt_value = ctx[162].id + " - " + ctx[169]) && attr(img, "alt", img_alt_value), 
			current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block ? if_block.p(ctx, dirty) : (if_block.d(1), 
			if_block = current_block_type(ctx), if_block && (if_block.c(), if_block.m(div, null)));
		},
		d(detaching) {
			detaching && detach(div), if_block.d(), mounted = !1, dispose();
		}
	};
}

function create_each_block_3(ctx) {
	let div, span, t0, html_tag, span_id_value, t1, t2, t0_value = ctx[162].name + "", raw_value = ctx[28](ctx[162].files.length) + "", each_value_4 = ctx[162].files, each_blocks = [];
	for (let i = 0; i < each_value_4.length; i += 1) each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
	return {
		c() {
			div = element("div"), span = element("span"), t0 = text(t0_value), html_tag = new HtmlTag(!1), 
			t1 = space();
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
			t2 = space(), html_tag.a = null, attr(span, "id", span_id_value = "p" + ctx[162].id), 
			attr(div, "class", "pack");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, span), append(span, t0), html_tag.m(raw_value, span), 
			append(div, t1);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div, null);
			append(div, t2);
		},
		p(ctx, dirty) {
			if (512 & dirty[0] && t0_value !== (t0_value = ctx[162].name + "") && set_data(t0, t0_value), 
			512 & dirty[0] && raw_value !== (raw_value = ctx[28](ctx[162].files.length) + "") && html_tag.p(raw_value), 
			512 & dirty[0] && span_id_value !== (span_id_value = "p" + ctx[162].id) && attr(span, "id", span_id_value), 
			125829888 & dirty[0]) {
				let i;
				for (each_value_4 = ctx[162].files, i = 0; i < each_value_4.length; i += 1) {
					const child_ctx = get_each_context_4(ctx, each_value_4, i);
					each_blocks[i] ? each_blocks[i].p(child_ctx, dirty) : (each_blocks[i] = create_each_block_4(child_ctx), 
					each_blocks[i].c(), each_blocks[i].m(div, t2));
				}
				for (;i < each_blocks.length; i += 1) each_blocks[i].d(1);
				each_blocks.length = each_value_4.length;
			}
		},
		d(detaching) {
			detaching && detach(div), destroy_each(each_blocks, detaching);
		}
	};
}

function create_if_block_10(ctx) {
	let div1, mounted, dispose;
	return {
		c() {
			div1 = element("div"), div1.innerHTML = '<div class="icon-frequently-used"></div>', 
			attr(div1, "class", "pack"), attr(div1, "title", "Frequently Used");
		},
		m(target, anchor) {
			insert(target, div1, anchor), mounted || (dispose = listen(div1, "click", ctx[60]), 
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
		return ctx[61](ctx[162]);
	}
	return {
		c() {
			div = element("div"), attr(div, "class", "pack"), attr(div, "title", div_title_value = ctx[162].name), 
			set_style(div, "background-image", `url(${ctx[23](ctx[162].id, ctx[162].files[0], !1, 0)})`);
		},
		m(target, anchor) {
			insert(target, div, anchor), mounted || (dispose = listen(div, "click", click_handler_11), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 512 & dirty[0] && div_title_value !== (div_title_value = ctx[162].name) && attr(div, "title", div_title_value), 
			512 & dirty[0] && set_style(div, "background-image", `url(${ctx[23](ctx[162].id, ctx[162].files[0], !1, 0)})`);
		},
		d(detaching) {
			detaching && detach(div), mounted = !1, dispose();
		}
	};
}

function create_if_block_5(ctx) {
	let div, div_style_value, each_blocks = [], each_1_lookup = new Map, each_value_1 = ctx[9];
	const get_key = ctx => ctx[162].id;
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
			550519296 & dirty[0] | 52 & dirty[1] && (each_value_1 = ctx[9], each_blocks = function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
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

function create_if_block_9(ctx) {
	let div, input, input_data_pack_value, input_value_value, mounted, dispose;
	return {
		c() {
			div = element("div"), input = element("input"), attr(input, "class", "inputPackIndex"), 
			attr(input, "type", "text"), attr(input, "data-pack", input_data_pack_value = ctx[162].id), 
			input.value = input_value_value = ctx[166] + 1, attr(div, "class", "index");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, input), mounted || (dispose = [ listen(input, "click", click_handler_17), listen(input, "keypress", ctx[33]) ], 
			mounted = !0);
		},
		p(ctx, dirty) {
			512 & dirty[0] && input_data_pack_value !== (input_data_pack_value = ctx[162].id) && attr(input, "data-pack", input_data_pack_value), 
			512 & dirty[0] && input_value_value !== (input_value_value = ctx[166] + 1) && input.value !== input_value_value && (input.value = input_value_value);
		},
		d(detaching) {
			detaching && detach(div), mounted = !1, run_all(dispose);
		}
	};
}

function create_if_block_6(ctx) {
	let t, if_block1_anchor, show_if = ctx[162].id.startsWith("custom-"), if_block0 = show_if && create_if_block_8(ctx), if_block1 = ctx[14][ctx[162].id].updateUrl && create_if_block_7(ctx);
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
			512 & dirty[0] && (show_if = ctx[162].id.startsWith("custom-")), show_if ? if_block0 ? if_block0.p(ctx, dirty) : (if_block0 = create_if_block_8(ctx), 
			if_block0.c(), if_block0.m(t.parentNode, t)) : if_block0 && (if_block0.d(1), if_block0 = null), 
			ctx[14][ctx[162].id].updateUrl ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_7(ctx), 
			if_block1.c(), if_block1.m(if_block1_anchor.parentNode, if_block1_anchor)) : if_block1 && (if_block1.d(1), 
			if_block1 = null);
		},
		d(detaching) {
			if_block0 && if_block0.d(detaching), detaching && detach(t), if_block1 && if_block1.d(detaching), 
			detaching && detach(if_block1_anchor);
		}
	};
}

function create_if_block_8(ctx) {
	let button, mounted, dispose;
	function click_handler_19() {
		return ctx[68](ctx[162]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "i", attr(button, "class", "button pack-info"), 
			attr(button, "title", "Info");
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

function create_if_block_7(ctx) {
	let button, mounted, dispose;
	function click_handler_20() {
		return ctx[69](ctx[162]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "Up", attr(button, "class", "button update-pack"), 
			attr(button, "title", "Update");
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

function create_each_block_1(key_1, ctx) {
	let div3, t0, div0, t1, div1, span0, t2, span0_title_value, t3, span1, t4, t5, html_tag, t6, div2, button, t8, div2_class_value, t9, mounted, dispose, t2_value = ctx[162].name + "", t4_value = ctx[162].count + "", raw_value = (ctx[20].hidePackAppendix ? "" : ctx[29](ctx[162].id)) + "", if_block0 = ctx[9].length > 1 && create_if_block_9(ctx);
	function click_handler_18() {
		return ctx[67](ctx[162]);
	}
	let if_block1 = ctx[14][ctx[162].id] && create_if_block_6(ctx);
	return {
		key: key_1,
		first: null,
		c() {
			div3 = element("div"), if_block0 && if_block0.c(), t0 = space(), div0 = element("div"), 
			t1 = space(), div1 = element("div"), span0 = element("span"), t2 = text(t2_value), 
			t3 = space(), span1 = element("span"), t4 = text(t4_value), t5 = text(" stickers"), 
			html_tag = new HtmlTag(!1), t6 = space(), div2 = element("div"), button = element("button"), 
			button.textContent = "Del", t8 = space(), if_block1 && if_block1.c(), t9 = space(), 
			attr(div0, "class", "preview"), set_style(div0, "background-image", `url(${ctx[23](ctx[162].id, ctx[162].files[0], !1, 0)})`), 
			attr(span0, "title", span0_title_value = ctx[20].hidePackAppendix ? "ID: " + ctx[162].id : ""), 
			html_tag.a = null, attr(div1, "class", "info"), attr(button, "class", "button is-danger"), 
			attr(button, "title", "Unsubscribe"), attr(div2, "class", div2_class_value = "action" + (ctx[14][ctx[162].id] && (ctx[162].id.startsWith("custom-") || ctx[14][ctx[162].id].updateUrl) ? " is-tight" : "")), 
			attr(div3, "class", "pack"), this.first = div3;
		},
		m(target, anchor) {
			insert(target, div3, anchor), if_block0 && if_block0.m(div3, null), append(div3, t0), 
			append(div3, div0), append(div3, t1), append(div3, div1), append(div1, span0), append(span0, t2), 
			append(div1, t3), append(div1, span1), append(span1, t4), append(span1, t5), html_tag.m(raw_value, span1), 
			append(div3, t6), append(div3, div2), append(div2, button), append(div2, t8), if_block1 && if_block1.m(div2, null), 
			append(div3, t9), mounted || (dispose = listen(button, "click", click_handler_18), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			(ctx = new_ctx)[9].length > 1 ? if_block0 ? if_block0.p(ctx, dirty) : (if_block0 = create_if_block_9(ctx), 
			if_block0.c(), if_block0.m(div3, t0)) : if_block0 && (if_block0.d(1), if_block0 = null), 
			512 & dirty[0] && set_style(div0, "background-image", `url(${ctx[23](ctx[162].id, ctx[162].files[0], !1, 0)})`), 
			512 & dirty[0] && t2_value !== (t2_value = ctx[162].name + "") && set_data(t2, t2_value), 
			1049088 & dirty[0] && span0_title_value !== (span0_title_value = ctx[20].hidePackAppendix ? "ID: " + ctx[162].id : "") && attr(span0, "title", span0_title_value), 
			512 & dirty[0] && t4_value !== (t4_value = ctx[162].count + "") && set_data(t4, t4_value), 
			1049088 & dirty[0] && raw_value !== (raw_value = (ctx[20].hidePackAppendix ? "" : ctx[29](ctx[162].id)) + "") && html_tag.p(raw_value), 
			ctx[14][ctx[162].id] ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_6(ctx), 
			if_block1.c(), if_block1.m(div2, null)) : if_block1 && (if_block1.d(1), if_block1 = null), 
			16896 & dirty[0] && div2_class_value !== (div2_class_value = "action" + (ctx[14][ctx[162].id] && (ctx[162].id.startsWith("custom-") || ctx[14][ctx[162].id].updateUrl) ? " is-tight" : "")) && attr(div2, "class", div2_class_value);
		},
		d(detaching) {
			detaching && detach(div3), if_block0 && if_block0.d(), if_block1 && if_block1.d(), 
			mounted = !1, dispose();
		}
	};
}

function create_if_block(ctx) {
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
			if (552619008 & dirty[0] | 56 & dirty[1]) {
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
	function click_handler_22() {
		return ctx[72](ctx[162]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "Add", attr(button, "class", "button is-primary"), 
			attr(button, "title", "Subscribe");
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

function create_if_block_4(ctx) {
	let button, mounted, dispose;
	function click_handler_21() {
		return ctx[71](ctx[162]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "Del", attr(button, "class", "button is-danger"), 
			attr(button, "title", "Unsubscribe");
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

function create_if_block_1(ctx) {
	let t0, t1, button, mounted, dispose, show_if = ctx[162].id.startsWith("custom-"), if_block0 = show_if && create_if_block_3(ctx), if_block1 = ctx[14][ctx[162].id].updateUrl && create_if_block_2(ctx);
	function click_handler_25() {
		return ctx[75](ctx[162]);
	}
	return {
		c() {
			if_block0 && if_block0.c(), t0 = space(), if_block1 && if_block1.c(), t1 = space(), 
			button = element("button"), attr(button, "class", "button delete-pack"), attr(button, "title", "Purge");
		},
		m(target, anchor) {
			if_block0 && if_block0.m(target, anchor), insert(target, t0, anchor), if_block1 && if_block1.m(target, anchor), 
			insert(target, t1, anchor), insert(target, button, anchor), mounted || (dispose = listen(button, "click", click_handler_25), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 2048 & dirty[0] && (show_if = ctx[162].id.startsWith("custom-")), 
			show_if ? if_block0 ? if_block0.p(ctx, dirty) : (if_block0 = create_if_block_3(ctx), 
			if_block0.c(), if_block0.m(t0.parentNode, t0)) : if_block0 && (if_block0.d(1), if_block0 = null), 
			ctx[14][ctx[162].id].updateUrl ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_2(ctx), 
			if_block1.c(), if_block1.m(t1.parentNode, t1)) : if_block1 && (if_block1.d(1), if_block1 = null);
		},
		d(detaching) {
			if_block0 && if_block0.d(detaching), detaching && detach(t0), if_block1 && if_block1.d(detaching), 
			detaching && detach(t1), detaching && detach(button), mounted = !1, dispose();
		}
	};
}

function create_if_block_3(ctx) {
	let button, mounted, dispose;
	function click_handler_23() {
		return ctx[73](ctx[162]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "i", attr(button, "class", "button pack-info"), 
			attr(button, "title", "Info");
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

function create_if_block_2(ctx) {
	let button, mounted, dispose;
	function click_handler_24() {
		return ctx[74](ctx[162]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "Up", attr(button, "class", "button update-pack"), 
			attr(button, "title", "Update");
		},
		m(target, anchor) {
			insert(target, button, anchor), mounted || (dispose = listen(button, "click", click_handler_24), 
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
	let div3, div0, t0, div1, span0, t1, span0_title_value, t2, span1, t3, t4, html_tag, t5, div2, show_if, t6, div2_class_value, t7, t1_value = ctx[162].name + "", t3_value = ctx[162].count + "", raw_value = (ctx[20].hidePackAppendix ? "" : ctx[29](ctx[162].id)) + "";
	function select_block_type_2(ctx, dirty) {
		return 3072 & dirty[0] && (show_if = null), null == show_if && (show_if = !!ctx[10].includes(ctx[162].id)), 
		show_if ? create_if_block_4 : create_else_block;
	}
	let current_block_type = select_block_type_2(ctx, [ -1, -1, -1, -1, -1, -1 ]), if_block0 = current_block_type(ctx), if_block1 = ctx[14][ctx[162].id] && create_if_block_1(ctx);
	return {
		c() {
			div3 = element("div"), div0 = element("div"), t0 = space(), div1 = element("div"), 
			span0 = element("span"), t1 = text(t1_value), t2 = space(), span1 = element("span"), 
			t3 = text(t3_value), t4 = text(" stickers"), html_tag = new HtmlTag(!1), t5 = space(), 
			div2 = element("div"), if_block0.c(), t6 = space(), if_block1 && if_block1.c(), 
			t7 = space(), attr(div0, "class", "preview"), set_style(div0, "background-image", `url(${ctx[23](ctx[162].id, ctx[162].files[0], !1, 0)})`), 
			attr(span0, "title", span0_title_value = ctx[20].hidePackAppendix ? "ID: " + ctx[162].id : ""), 
			html_tag.a = null, attr(div1, "class", "info"), attr(div2, "class", div2_class_value = "action" + (ctx[14][ctx[162].id] ? " is-tight" : "")), 
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
			2048 & dirty[0] && set_style(div0, "background-image", `url(${ctx[23](ctx[162].id, ctx[162].files[0], !1, 0)})`), 
			2048 & dirty[0] && t1_value !== (t1_value = ctx[162].name + "") && set_data(t1, t1_value), 
			1050624 & dirty[0] && span0_title_value !== (span0_title_value = ctx[20].hidePackAppendix ? "ID: " + ctx[162].id : "") && attr(span0, "title", span0_title_value), 
			2048 & dirty[0] && t3_value !== (t3_value = ctx[162].count + "") && set_data(t3, t3_value), 
			1050624 & dirty[0] && raw_value !== (raw_value = (ctx[20].hidePackAppendix ? "" : ctx[29](ctx[162].id)) + "") && html_tag.p(raw_value), 
			current_block_type === (current_block_type = select_block_type_2(ctx, dirty)) && if_block0 ? if_block0.p(ctx, dirty) : (if_block0.d(1), 
			if_block0 = current_block_type(ctx), if_block0 && (if_block0.c(), if_block0.m(div2, t6))), 
			ctx[14][ctx[162].id] ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_1(ctx), 
			if_block1.c(), if_block1.m(div2, null)) : if_block1 && (if_block1.d(1), if_block1 = null), 
			18432 & dirty[0] && div2_class_value !== (div2_class_value = "action" + (ctx[14][ctx[162].id] ? " is-tight" : "")) && attr(div2, "class", div2_class_value);
		},
		d(detaching) {
			detaching && detach(div3), if_block0.d(), if_block1 && if_block1.d();
		}
	};
}

function create_fragment$1(ctx) {
	let main_1, div27, div26, div0, t0, t1, t2, div0_class_value, t3, div7, div4, div3, div2, t4, t5, t6, div6, div5, div7_class_value, t7, div25, div8, t8, div24, div23, div13, div9, t10, div10, t12, div11, t14, div12, t16, t17, div14, input0, t18, div14_style_value, t19, div17, div15, p0, t21, p1, t25, p2, t27, p3, input1, t28, button0, t30, div16, p4, t32, p5, t37, p6, t40, p7, input2, t41, button1, t43, p8, input3, t44, button2, t46, p9, button3, div17_style_value, t48, div22, div18, p10, t50, p11, label0, input4, t51, code0, t53, t54, p12, label1, input5, t55, t56, p13, label2, input6, t57, t58, p14, label3, input7, t59, t60, p15, label4, input8, t61, t62, p16, label5, input9, t63, t64, p17, label6, input10, t65, t66, p18, label7, input11, t67, t68, p19, label8, input12, t69, t70, p20, label9, input13, t71, t72, p21, label10, input14, t73, t74, p22, label11, input15, t75, t76, div19, p23, t78, p24, t80, p25, t84, p26, input16, t85, button4, t87, div20, p27, t89, p28, t91, p29, t97, p30, t104, p31, input17, t105, button5, t107, div21, p32, t109, p33, input18, t110, button6, t112, p34, button7, div22_style_value, div25_style_value, div26_style_value, div27_style_value, mounted, dispose, if_block0 = !ctx[8].length && !ctx[9].length && create_if_block_16(), if_block1 = ctx[8].length && create_if_block_15(ctx), if_block2 = ctx[12].length && create_if_block_13(ctx), each_value_3 = ctx[9], each_blocks_1 = [];
	for (let i = 0; i < each_value_3.length; i += 1) each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	let if_block3 = ctx[25].length && function create_if_block_11(ctx) {
		let div1, mounted, dispose;
		return {
			c() {
				div1 = element("div"), div1.innerHTML = '<div class="icon-favorite"></div>', attr(div1, "class", "pack"), 
				attr(div1, "title", "Favorites");
			},
			m(target, anchor) {
				insert(target, div1, anchor), mounted || (dispose = listen(div1, "click", ctx[59]), 
				mounted = !0);
			},
			p: noop,
			d(detaching) {
				detaching && detach(div1), mounted = !1, dispose();
			}
		};
	}(ctx), if_block4 = ctx[12].length && create_if_block_10(ctx), each_value_2 = ctx[9], each_blocks = [];
	for (let i = 0; i < each_value_2.length; i += 1) each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	let if_block5 = ctx[6][0] && create_if_block_5(ctx), if_block6 = ctx[6][1] && create_if_block(ctx);
	return {
		c() {
			main_1 = element("main"), div27 = element("div"), div26 = element("div"), div0 = element("div"), 
			if_block0 && if_block0.c(), t0 = space(), if_block1 && if_block1.c(), t1 = space(), 
			if_block2 && if_block2.c(), t2 = space();
			for (let i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].c();
			t3 = space(), div7 = element("div"), div4 = element("div"), div3 = element("div"), 
			div2 = element("div"), div2.innerHTML = '<div class="icon-plus"></div>', t4 = space(), 
			if_block3 && if_block3.c(), t5 = space(), if_block4 && if_block4.c(), t6 = space(), 
			div6 = element("div"), div5 = element("div");
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
			t7 = space(), div25 = element("div"), div8 = element("div"), t8 = space(), div24 = element("div"), 
			div23 = element("div"), div13 = element("div"), div9 = element("div"), div9.textContent = "Installed", 
			t10 = space(), div10 = element("div"), div10.textContent = "Packs", t12 = space(), 
			div11 = element("div"), div11.textContent = "Import", t14 = space(), div12 = element("div"), 
			div12.textContent = "Misc", t16 = space(), if_block5 && if_block5.c(), t17 = space(), 
			div14 = element("div"), input0 = element("input"), t18 = space(), if_block6 && if_block6.c(), 
			t19 = space(), div17 = element("div"), div15 = element("div"), p0 = element("p"), 
			p0.textContent = "LINE Store Proxy", t21 = space(), p1 = element("p"), p1.innerHTML = 'If you are looking for a sticker pack that is not provided by Magane, you can go to the <a href="https://store.line.me/" target="_blank">LINE Store</a> and pick whatever pack you want and paste the full URL in the box below.', 
			t25 = space(), p2 = element("p"), p2.textContent = "e.g. https://store.line.me/stickershop/product/17573/ja", 
			t27 = space(), p3 = element("p"), input1 = element("input"), t28 = space(), button0 = element("button"), 
			button0.textContent = "Add", t30 = space(), div16 = element("div"), p4 = element("p"), 
			p4.textContent = "Remote Packs", t32 = space(), p5 = element("p"), p5.innerHTML = 'You can paste URL to a JSON config file of a remote pack in here.<br/>\n\t\t\t\t\t\t\t\t\tThis also supports public album links of any file hosting websites running <a href="https://github.com/WeebDev/chibisafe" target="_blank">Chibisafe</a>.', 
			t37 = space(), p6 = element("p"), p6.innerHTML = "e.g. https://example.com/packs/my_custom_pack.json<br/>\n\t\t\t\t\t\t\t\t\thttps://chibisafe.moe/a/my_album", 
			t40 = space(), p7 = element("p"), input2 = element("input"), t41 = space(), button1 = element("button"), 
			button1.textContent = "Add", t43 = space(), p8 = element("p"), input3 = element("input"), 
			t44 = space(), button2 = element("button"), button2.textContent = "Load local JSON", 
			t46 = space(), p9 = element("p"), button3 = element("button"), button3.textContent = "Update all remote packs", 
			t48 = space(), div22 = element("div"), div18 = element("div"), p10 = element("p"), 
			p10.textContent = "Settings", t50 = space(), p11 = element("p"), label0 = element("label"), 
			input4 = element("input"), t51 = text("\n\t\t\t\t\t\t\t\t\t\tEnable "), code0 = element("code"), 
			code0.textContent = "window.magane", t53 = text(" development utility"), t54 = space(), 
			p12 = element("p"), label1 = element("label"), input5 = element("input"), t55 = text("\n\t\t\t\t\t\t\t\t\t\tDisable Toasts"), 
			t56 = space(), p13 = element("p"), label2 = element("label"), input6 = element("input"), 
			t57 = text("\n\t\t\t\t\t\t\t\t\t\tClose window when sending a sticker"), t58 = space(), 
			p14 = element("p"), label3 = element("label"), input7 = element("input"), t59 = text("\n\t\t\t\t\t\t\t\t\t\tUse left toolbar instead of bottom toolbar on main window"), 
			t60 = space(), p15 = element("p"), label4 = element("label"), input8 = element("input"), 
			t61 = text("\n\t\t\t\t\t\t\t\t\t\tHide pack's appendix in packs list (e.g. its numerical ID)"), 
			t62 = space(), p16 = element("p"), label5 = element("label"), input9 = element("input"), 
			t63 = text("\n\t\t\t\t\t\t\t\t\t\tDisable downscaling of manually imported LINE Store packs"), 
			t64 = space(), p17 = element("p"), label6 = element("label"), input10 = element("input"), 
			t65 = text("\n\t\t\t\t\t\t\t\t\t\tDisable obfuscation of files names for imported custom packs (obfuscation happens only for uploads)"), 
			t66 = space(), p18 = element("p"), label7 = element("label"), input11 = element("input"), 
			t67 = text("\n\t\t\t\t\t\t\t\t\t\tAlways send stickers as links instead of uploads"), 
			t68 = space(), p19 = element("p"), label8 = element("label"), input12 = element("input"), 
			t69 = text("\n\t\t\t\t\t\t\t\t\t\tIgnore missing embed links permission"), t70 = space(), 
			p20 = element("p"), label9 = element("label"), input13 = element("input"), t71 = text("\n\t\t\t\t\t\t\t\t\t\tMark stickers as spoilers when sending"), 
			t72 = space(), p21 = element("p"), label10 = element("label"), input14 = element("input"), 
			t73 = text("\n\t\t\t\t\t\t\t\t\t\tDo not warn if viewport height is insufficient"), 
			t74 = space(), p22 = element("p"), label11 = element("label"), input15 = element("input"), 
			t75 = text("\n\t\t\t\t\t\t\t\t\t\tDo not send text chat input alongside sticker"), 
			t76 = space(), div19 = element("div"), p23 = element("p"), p23.textContent = "Frequently Used", 
			t78 = space(), p24 = element("p"), p24.textContent = "Maximum amount of the most frequently used stickers to list on Frequently Used section.", 
			t80 = space(), p25 = element("p"), p25.innerHTML = "Set to <code>0</code> to completely disable the section and stickers usage counter.", 
			t84 = space(), p26 = element("p"), input16 = element("input"), t85 = space(), button4 = element("button"), 
			button4.textContent = "Set", t87 = space(), div20 = element("div"), p27 = element("p"), 
			p27.textContent = "Hotkey", t89 = space(), p28 = element("p"), p28.innerHTML = '<a href="https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values" target="_blank">See a full list of key values.</a>', 
			t91 = space(), p29 = element("p"), p29.innerHTML = "Ignore notes that will not affect Chromium. Additionally, this may not have full support for everything in the documentation above, but this does support some degree of combinations of modifier keys (<code>Ctrl</code>, <code>Alt</code>, etc.) + other keys.", 
			t97 = space(), p30 = element("p"), p30.innerHTML = "e.g. <code>M</code>, <code>Ctrl+Q</code>, <code>Alt+Shift+Y</code>", 
			t104 = space(), p31 = element("p"), input17 = element("input"), t105 = space(), 
			button5 = element("button"), button5.textContent = "Set", t107 = space(), div21 = element("div"), 
			p32 = element("p"), p32.textContent = "Database", t109 = space(), p33 = element("p"), 
			input18 = element("input"), t110 = space(), button6 = element("button"), button6.textContent = "Replace Database", 
			t112 = space(), p34 = element("p"), button7 = element("button"), button7.textContent = "Export Database", 
			attr(div0, "class", div0_class_value = "stickers has-scroll-y " + (ctx[20].useLeftToolbar ? "has-left-toolbar" : "")), 
			attr(div0, "style", ""), attr(div2, "class", "pack"), attr(div2, "title", "Manage subscribed packs"), 
			attr(div3, "class", "packs-wrapper"), attr(div4, "class", "packs packs-controls"), 
			attr(div5, "class", "packs-wrapper"), attr(div6, "class", "packs"), attr(div6, "style", ""), 
			attr(div7, "class", div7_class_value = "packs-toolbar " + (ctx[20].useLeftToolbar ? "has-scroll-y" : "has-scroll-x")), 
			attr(div8, "class", "modal-close"), attr(div9, "class", "tab"), toggle_class(div9, "is-active", 0 === ctx[7]), 
			attr(div10, "class", "tab"), toggle_class(div10, "is-active", 1 === ctx[7]), attr(div11, "class", "tab"), 
			toggle_class(div11, "is-active", 2 === ctx[7]), attr(div12, "class", "tab"), toggle_class(div12, "is-active", 3 === ctx[7]), 
			attr(div13, "class", "tabs"), attr(input0, "class", "inputQuery"), attr(input0, "type", "text"), 
			attr(input0, "placeholder", "Search"), attr(div14, "class", "tab-content avail-packs"), 
			attr(div14, "style", div14_style_value = 1 === ctx[7] ? "" : "display: none;"), 
			attr(p0, "class", "section-title"), attr(input1, "class", "inputQuery"), attr(input1, "type", "text"), 
			attr(input1, "placeholder", "LINE Sticker Pack URL"), attr(button0, "class", "button is-primary"), 
			attr(p3, "class", "input-grouped"), attr(div15, "class", "section line-proxy"), 
			attr(p4, "class", "section-title"), attr(input2, "class", "inputQuery"), attr(input2, "type", "text"), 
			attr(input2, "placeholder", "Remote Pack JSON or Chibisafe Album URL"), attr(button1, "class", "button is-primary"), 
			attr(p7, "class", "input-grouped"), attr(input3, "id", "localRemotePackInput"), 
			attr(input3, "type", "file"), set_style(input3, "display", "none"), attr(input3, "accept", "application/JSON"), 
			attr(button2, "class", "button has-width-full"), attr(button3, "class", "button is-primary has-width-full"), 
			attr(div16, "class", "section remote-packs"), attr(div17, "class", "tab-content has-scroll-y import"), 
			attr(div17, "style", div17_style_value = 2 === ctx[7] ? "" : "display: none;"), 
			attr(p10, "class", "section-title"), attr(input4, "name", "enableWindowMagane"), 
			attr(input4, "type", "checkbox"), attr(input5, "name", "disableToasts"), attr(input5, "type", "checkbox"), 
			attr(input6, "name", "closeWindowOnSend"), attr(input6, "type", "checkbox"), attr(input7, "name", "useLeftToolbar"), 
			attr(input7, "type", "checkbox"), attr(input8, "name", "hidePackAppendix"), attr(input8, "type", "checkbox"), 
			attr(input9, "name", "disableDownscale"), attr(input9, "type", "checkbox"), attr(input10, "name", "disableImportedObfuscation"), 
			attr(input10, "type", "checkbox"), attr(input11, "name", "alwaysSendAsLink"), attr(input11, "type", "checkbox"), 
			attr(input12, "name", "ignoreEmbedLinksPermission"), attr(input12, "type", "checkbox"), 
			attr(input13, "name", "markAsSpoiler"), attr(input13, "type", "checkbox"), attr(input14, "name", "ignoreViewportSize"), 
			attr(input14, "type", "checkbox"), attr(input15, "name", "disableSendingWithChatInput"), 
			attr(input15, "type", "checkbox"), attr(div18, "class", "section settings"), attr(p23, "class", "section-title"), 
			attr(input16, "class", "inputQuery supress-magane-hotkey"), attr(input16, "type", "text"), 
			attr(button4, "class", "button is-primary"), attr(p26, "class", "input-grouped"), 
			attr(div19, "class", "section frequently-used"), attr(p27, "class", "section-title"), 
			attr(input17, "class", "inputQuery supress-magane-hotkey"), attr(input17, "type", "text"), 
			attr(button5, "class", "button is-primary"), attr(p31, "class", "input-grouped"), 
			attr(div20, "class", "section hotkey"), attr(p32, "class", "section-title"), attr(input18, "id", "replaceDatabaseInput"), 
			attr(input18, "type", "file"), set_style(input18, "display", "none"), attr(input18, "accept", "application/JSON"), 
			attr(button6, "class", "button is-danger has-width-full"), attr(button7, "class", "button is-primary has-width-full"), 
			attr(div21, "class", "section database"), attr(div22, "class", "tab-content has-scroll-y misc"), 
			attr(div22, "style", div22_style_value = 3 === ctx[7] ? "" : "display: none;"), 
			attr(div23, "class", "stickersConfig"), attr(div24, "class", "modal-content"), attr(div25, "class", "stickersModal"), 
			attr(div25, "style", div25_style_value = ctx[5] ? "" : "display: none;"), attr(div26, "class", "stickerWindow"), 
			attr(div26, "style", div26_style_value = "bottom: " + ctx[0].wbottom + "px; right: " + ctx[0].wright + "px; " + (ctx[4] ? "" : "display: none;")), 
			attr(div27, "id", "magane"), attr(div27, "style", div27_style_value = (ctx[2] ? "" : `top: ${ctx[0].top}px; left: ${ctx[0].left}px;`) + " " + (ctx[3] ? "display: none;" : ""));
		},
		m(target, anchor) {
			insert(target, main_1, anchor), append(main_1, div27), append(div27, div26), append(div26, div0), 
			if_block0 && if_block0.m(div0, null), append(div0, t0), if_block1 && if_block1.m(div0, null), 
			append(div0, t1), if_block2 && if_block2.m(div0, null), append(div0, t2);
			for (let i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].m(div0, null);
			append(div26, t3), append(div26, div7), append(div7, div4), append(div4, div3), 
			append(div3, div2), append(div3, t4), if_block3 && if_block3.m(div3, null), append(div3, t5), 
			if_block4 && if_block4.m(div3, null), append(div7, t6), append(div7, div6), append(div6, div5);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div5, null);
			append(div26, t7), append(div26, div25), append(div25, div8), append(div25, t8), 
			append(div25, div24), append(div24, div23), append(div23, div13), append(div13, div9), 
			append(div13, t10), append(div13, div10), append(div13, t12), append(div13, div11), 
			append(div13, t14), append(div13, div12), append(div23, t16), if_block5 && if_block5.m(div23, null), 
			append(div23, t17), append(div23, div14), append(div14, input0), set_input_value(input0, ctx[19]), 
			append(div14, t18), if_block6 && if_block6.m(div14, null), append(div23, t19), append(div23, div17), 
			append(div17, div15), append(div15, p0), append(div15, t21), append(div15, p1), 
			append(div15, t25), append(div15, p2), append(div15, t27), append(div15, p3), append(p3, input1), 
			set_input_value(input1, ctx[15]), append(p3, t28), append(p3, button0), append(div17, t30), 
			append(div17, div16), append(div16, p4), append(div16, t32), append(div16, p5), 
			append(div16, t37), append(div16, p6), append(div16, t40), append(div16, p7), append(p7, input2), 
			set_input_value(input2, ctx[16]), append(p7, t41), append(p7, button1), append(div16, t43), 
			append(div16, p8), append(p8, input3), append(p8, t44), append(p8, button2), append(div16, t46), 
			append(div16, p9), append(p9, button3), append(div23, t48), append(div23, div22), 
			append(div22, div18), append(div18, p10), append(div18, t50), append(div18, p11), 
			append(p11, label0), append(label0, input4), input4.checked = ctx[20].enableWindowMagane, 
			append(label0, t51), append(label0, code0), append(label0, t53), append(div18, t54), 
			append(div18, p12), append(p12, label1), append(label1, input5), input5.checked = ctx[20].disableToasts, 
			append(label1, t55), append(div18, t56), append(div18, p13), append(p13, label2), 
			append(label2, input6), input6.checked = ctx[20].closeWindowOnSend, append(label2, t57), 
			append(div18, t58), append(div18, p14), append(p14, label3), append(label3, input7), 
			input7.checked = ctx[20].useLeftToolbar, append(label3, t59), append(div18, t60), 
			append(div18, p15), append(p15, label4), append(label4, input8), input8.checked = ctx[20].hidePackAppendix, 
			append(label4, t61), append(div18, t62), append(div18, p16), append(p16, label5), 
			append(label5, input9), input9.checked = ctx[20].disableDownscale, append(label5, t63), 
			append(div18, t64), append(div18, p17), append(p17, label6), append(label6, input10), 
			input10.checked = ctx[20].disableImportedObfuscation, append(label6, t65), append(div18, t66), 
			append(div18, p18), append(p18, label7), append(label7, input11), input11.checked = ctx[20].alwaysSendAsLink, 
			append(label7, t67), append(div18, t68), append(div18, p19), append(p19, label8), 
			append(label8, input12), input12.checked = ctx[20].ignoreEmbedLinksPermission, append(label8, t69), 
			append(div18, t70), append(div18, p20), append(p20, label9), append(label9, input13), 
			input13.checked = ctx[20].markAsSpoiler, append(label9, t71), append(div18, t72), 
			append(div18, p21), append(p21, label10), append(label10, input14), input14.checked = ctx[20].ignoreViewportSize, 
			append(label10, t73), append(div18, t74), append(div18, p22), append(p22, label11), 
			append(label11, input15), input15.checked = ctx[20].disableSendingWithChatInput, 
			append(label11, t75), append(div22, t76), append(div22, div19), append(div19, p23), 
			append(div19, t78), append(div19, p24), append(div19, t80), append(div19, p25), 
			append(div19, t84), append(div19, p26), append(p26, input16), set_input_value(input16, ctx[17]), 
			append(p26, t85), append(p26, button4), append(div22, t87), append(div22, div20), 
			append(div20, p27), append(div20, t89), append(div20, p28), append(div20, t91), 
			append(div20, p29), append(div20, t97), append(div20, p30), append(div20, t104), 
			append(div20, p31), append(p31, input17), set_input_value(input17, ctx[18]), append(p31, t105), 
			append(p31, button5), append(div22, t107), append(div22, div21), append(div21, p32), 
			append(div21, t109), append(div21, p33), append(p33, input18), append(p33, t110), 
			append(p33, button6), append(div21, t112), append(div21, p34), append(p34, button7), 
			ctx[100](main_1), mounted || (dispose = [ listen(div2, "click", ctx[58]), listen(div8, "click", ctx[62]), listen(div9, "click", ctx[63]), listen(div10, "click", ctx[64]), listen(div11, "click", ctx[65]), listen(div12, "click", ctx[66]), listen(input0, "keyup", ctx[27]), listen(input0, "input", ctx[70]), listen(input1, "input", ctx[76]), listen(button0, "click", ctx[77]), listen(input2, "input", ctx[78]), listen(button1, "click", ctx[79]), listen(input3, "click", click_handler_28), listen(input3, "change", ctx[39]), listen(button2, "click", ctx[80]), listen(button3, "click", ctx[81]), listen(input4, "change", ctx[82]), listen(input5, "change", ctx[83]), listen(input6, "change", ctx[84]), listen(input7, "change", ctx[85]), listen(input8, "change", ctx[86]), listen(input9, "change", ctx[87]), listen(input10, "change", ctx[88]), listen(input11, "change", ctx[89]), listen(input12, "change", ctx[90]), listen(input13, "change", ctx[91]), listen(input14, "change", ctx[92]), listen(input15, "change", ctx[93]), listen(div18, "change", ctx[42]), listen(input16, "input", ctx[94]), listen(button4, "click", ctx[95]), listen(input17, "input", ctx[96]), listen(button5, "click", ctx[97]), listen(input18, "click", click_handler_33), listen(input18, "change", ctx[45]), listen(button6, "click", ctx[98]), listen(button7, "click", ctx[99]) ], 
			mounted = !0);
		},
		p(ctx, dirty) {
			if (ctx[8].length || ctx[9].length ? if_block0 && (if_block0.d(1), if_block0 = null) : if_block0 || (if_block0 = create_if_block_16(), 
			if_block0.c(), if_block0.m(div0, t0)), ctx[8].length ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_15(ctx), 
			if_block1.c(), if_block1.m(div0, t1)) : if_block1 && (if_block1.d(1), if_block1 = null), 
			ctx[12].length ? if_block2 ? if_block2.p(ctx, dirty) : (if_block2 = create_if_block_13(ctx), 
			if_block2.c(), if_block2.m(div0, t2)) : if_block2 && (if_block2.d(1), if_block2 = null), 
			394265344 & dirty[0]) {
				let i;
				for (each_value_3 = ctx[9], i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);
					each_blocks_1[i] ? each_blocks_1[i].p(child_ctx, dirty) : (each_blocks_1[i] = create_each_block_3(child_ctx), 
					each_blocks_1[i].c(), each_blocks_1[i].m(div0, null));
				}
				for (;i < each_blocks_1.length; i += 1) each_blocks_1[i].d(1);
				each_blocks_1.length = each_value_3.length;
			}
			if (1048576 & dirty[0] && div0_class_value !== (div0_class_value = "stickers has-scroll-y " + (ctx[20].useLeftToolbar ? "has-left-toolbar" : "")) && attr(div0, "class", div0_class_value), 
			ctx[25].length && if_block3.p(ctx, dirty), ctx[12].length ? if_block4 ? if_block4.p(ctx, dirty) : (if_block4 = create_if_block_10(ctx), 
			if_block4.c(), if_block4.m(div3, null)) : if_block4 && (if_block4.d(1), if_block4 = null), 
			8389120 & dirty[0] | 2 & dirty[1]) {
				let i;
				for (each_value_2 = ctx[9], i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);
					each_blocks[i] ? each_blocks[i].p(child_ctx, dirty) : (each_blocks[i] = create_each_block_2(child_ctx), 
					each_blocks[i].c(), each_blocks[i].m(div5, null));
				}
				for (;i < each_blocks.length; i += 1) each_blocks[i].d(1);
				each_blocks.length = each_value_2.length;
			}
			1048576 & dirty[0] && div7_class_value !== (div7_class_value = "packs-toolbar " + (ctx[20].useLeftToolbar ? "has-scroll-y" : "has-scroll-x")) && attr(div7, "class", div7_class_value), 
			128 & dirty[0] && toggle_class(div9, "is-active", 0 === ctx[7]), 128 & dirty[0] && toggle_class(div10, "is-active", 1 === ctx[7]), 
			128 & dirty[0] && toggle_class(div11, "is-active", 2 === ctx[7]), 128 & dirty[0] && toggle_class(div12, "is-active", 3 === ctx[7]), 
			ctx[6][0] ? if_block5 ? if_block5.p(ctx, dirty) : (if_block5 = create_if_block_5(ctx), 
			if_block5.c(), if_block5.m(div23, t17)) : if_block5 && (if_block5.d(1), if_block5 = null), 
			524288 & dirty[0] && input0.value !== ctx[19] && set_input_value(input0, ctx[19]), 
			ctx[6][1] ? if_block6 ? if_block6.p(ctx, dirty) : (if_block6 = create_if_block(ctx), 
			if_block6.c(), if_block6.m(div14, null)) : if_block6 && (if_block6.d(1), if_block6 = null), 
			128 & dirty[0] && div14_style_value !== (div14_style_value = 1 === ctx[7] ? "" : "display: none;") && attr(div14, "style", div14_style_value), 
			32768 & dirty[0] && input1.value !== ctx[15] && set_input_value(input1, ctx[15]), 
			65536 & dirty[0] && input2.value !== ctx[16] && set_input_value(input2, ctx[16]), 
			128 & dirty[0] && div17_style_value !== (div17_style_value = 2 === ctx[7] ? "" : "display: none;") && attr(div17, "style", div17_style_value), 
			1048576 & dirty[0] && (input4.checked = ctx[20].enableWindowMagane), 1048576 & dirty[0] && (input5.checked = ctx[20].disableToasts), 
			1048576 & dirty[0] && (input6.checked = ctx[20].closeWindowOnSend), 1048576 & dirty[0] && (input7.checked = ctx[20].useLeftToolbar), 
			1048576 & dirty[0] && (input8.checked = ctx[20].hidePackAppendix), 1048576 & dirty[0] && (input9.checked = ctx[20].disableDownscale), 
			1048576 & dirty[0] && (input10.checked = ctx[20].disableImportedObfuscation), 1048576 & dirty[0] && (input11.checked = ctx[20].alwaysSendAsLink), 
			1048576 & dirty[0] && (input12.checked = ctx[20].ignoreEmbedLinksPermission), 1048576 & dirty[0] && (input13.checked = ctx[20].markAsSpoiler), 
			1048576 & dirty[0] && (input14.checked = ctx[20].ignoreViewportSize), 1048576 & dirty[0] && (input15.checked = ctx[20].disableSendingWithChatInput), 
			131072 & dirty[0] && input16.value !== ctx[17] && set_input_value(input16, ctx[17]), 
			262144 & dirty[0] && input17.value !== ctx[18] && set_input_value(input17, ctx[18]), 
			128 & dirty[0] && div22_style_value !== (div22_style_value = 3 === ctx[7] ? "" : "display: none;") && attr(div22, "style", div22_style_value), 
			32 & dirty[0] && div25_style_value !== (div25_style_value = ctx[5] ? "" : "display: none;") && attr(div25, "style", div25_style_value), 
			17 & dirty[0] && div26_style_value !== (div26_style_value = "bottom: " + ctx[0].wbottom + "px; right: " + ctx[0].wright + "px; " + (ctx[4] ? "" : "display: none;")) && attr(div26, "style", div26_style_value), 
			13 & dirty[0] && div27_style_value !== (div27_style_value = (ctx[2] ? "" : `top: ${ctx[0].top}px; left: ${ctx[0].left}px;`) + " " + (ctx[3] ? "display: none;" : "")) && attr(div27, "style", div27_style_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			detaching && detach(main_1), if_block0 && if_block0.d(), if_block1 && if_block1.d(), 
			if_block2 && if_block2.d(), destroy_each(each_blocks_1, detaching), if_block3 && if_block3.d(), 
			if_block4 && if_block4.d(), destroy_each(each_blocks, detaching), if_block5 && if_block5.d(), 
			if_block6 && if_block6.d(), ctx[100](null), mounted = !1, run_all(dispose);
		}
	};
}

"object" != typeof global.MAGANE_STYLES && (global.MAGANE_STYLES = {}), global.MAGANE_STYLES.main_scss = '/** Magane: main.scss **/\ndiv#magane {\n  display: flex;\n  flex-direction: row;\n  height: 44px;\n  position: absolute;\n  z-index: 99;\n}\ndiv#magane button, div#magane input, div#magane select, div#magane label, div#magane span, div#magane p, div#magane a, div#magane li, div#magane ul, div#magane div {\n  font-family: BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;\n  color: var(--header-secondary);\n  font-weight: 400;\n  line-height: 1.5;\n  font-size: 16px;\n  text-rendering: optimizeLegibility;\n  -webkit-text-size-adjust: 100%;\n\t -moz-text-size-adjust: 100%;\n\t\t  text-size-adjust: 100%;\n}\ndiv#magane div.stickerWindow {\n  z-index: 2000;\n  width: 600px;\n  min-height: 200px;\n  position: fixed;\n  background: var(--background-secondary);\n  max-height: 600px;\n  transition: all 0.2s ease;\n  border-radius: 4px;\n  box-shadow: var(--elevation-stroke), var(--elevation-high);\n}\ndiv#magane div.stickerWindow div.stickers {\n  height: 550px !important;\n  margin-bottom: 100px;\n  position: relative;\n}\ndiv#magane div.stickerWindow div.stickers.has-left-toolbar {\n  height: 600px !important;\n  margin-left: 50px;\n}\ndiv#magane div.stickerWindow div.stickers h3.getStarted {\n  text-align: center;\n  padding-top: 40%;\n  pointer-events: none;\n}\ndiv#magane div.stickerWindow div.stickers div.pack {\n  float: left;\n  display: flex;\n  flex-flow: wrap;\n  justify-content: center;\n  padding: 25px;\n  width: 100%;\n  box-sizing: border-box;\n}\ndiv#magane div.stickerWindow div.stickers div.pack span {\n  color: var(--header-secondary);\n  width: 100%;\n  cursor: auto;\n  padding-left: 10px;\n  margin: 10px 0px;\n}\ndiv#magane div.stickerWindow div.stickers div.pack span .counts {\n  padding-left: 0;\n}\ndiv#magane div.stickerWindow div.stickers div.pack span .counts span {\n  padding: 0 0.5em;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100px;\n  height: 100px;\n  float: left;\n  position: relative;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker .image {\n  cursor: pointer;\n  max-height: 100%;\n  max-width: 100%;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite, div#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite {\n  width: 20px;\n  height: 20px;\n  position: absolute;\n  right: 0;\n  transition: all 0.2s ease;\n  display: none;\n  z-index: 2;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite:hover, div#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite:hover {\n  transform: scale(1.25);\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite:hover svg path, div#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite:hover svg path {\n  transition: all 0.2s ease;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite {\n  bottom: 0;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite:hover svg path {\n  fill: #2ECC71;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite {\n  top: 0px;\n  transform: rotateZ(45deg);\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite:hover {\n  transform: scale(1.25) rotateZ(45deg);\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite:hover svg path {\n  fill: #F04747;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker:hover div.addFavorite, div#magane div.stickerWindow div.stickers div.pack div.sticker:hover div.deleteFavorite {\n  display: block;\n  cursor: pointer;\n}\ndiv#magane div.stickerWindow div.packs-toolbar {\n  position: absolute;\n  bottom: 0;\n  background: var(--background-tertiary);\n  display: flex;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-x {\n  width: 100%;\n  height: 50px;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-x div.packs {\n  flex: 1 0 auto;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-x div.packs.packs-controls {\n  flex: 0 0 auto;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-x div.packs div.packs-wrapper {\n  white-space: nowrap;\n  float: left;\n  width: 100%;\n  font-size: 0; /* quick hax to clear whitespace */\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-y {\n  width: 50px;\n  height: 100%;\n  flex-direction: column;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-y div.packs {\n  flex: 1 1 auto;\n  height: 100%;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-y div.packs.packs-controls {\n  flex: 0 0 auto;\n  height: auto;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-y div.packs div.packs-wrapper {\n  font-size: 0; /* quick hax to clear whitespace */\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack {\n  display: inline-block;\n  height: 40px;\n  width: 40px;\n  margin: 5px;\n  cursor: pointer;\n  background-position: center;\n  background-size: contain;\n  background-repeat: no-repeat;\n  transition: all 0.2s ease;\n  filter: grayscale(100%);\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack:hover,\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack div.pack.active {\n  transform: scale(1.25);\n  filter: grayscale(0%);\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack > div {\n  background-image: url("/assets/62ed7720accb1adfe95565b114e843c6.png");\n  width: 32px;\n  height: 32px;\n  background-size: 1344px 1216px;\n  background-repeat: no-repeat;\n  margin-top: 4px;\n  margin-left: 4px;\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack div.icon-favorite {\n  background-position: -1056px -288px;\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack div.icon-plus {\n  background-position: -384px -896px;\n  /* make it greenish */\n  /* thanks to the magic of https://codepen.io/sosuke/pen/Pjoqqp */\n  filter: invert(63%) sepia(25%) saturate(813%) hue-rotate(55deg) brightness(98%) contrast(82%);\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack div.icon-frequently-used {\n  background-position: -160px -960px;\n}\ndiv#magane .stickersModal {\n  z-index: 2001;\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n  align-items: center;\n  justify-content: center;\n}\ndiv#magane .stickersModal.is-active {\n  display: flex;\n}\ndiv#magane .stickersModal .inputQuery {\n  width: calc(100% - 30px);\n  height: 36px;\n  box-sizing: border-box;\n  margin: 0 15px 10px;\n  padding: 5px 12px;\n  border-radius: 3px;\n  border: 1px solid var(--background-secondary);\n  background: var(--background-secondary);\n  color: var(--header-secondary);\n}\ndiv#magane .stickersModal .inputPackIndex {\n  width: 55px;\n  height: 36px;\n  box-sizing: border-box;\n  padding: 5px 12px;\n  border-radius: 3px;\n  border: 1px solid var(--background-secondary);\n  background: var(--background-secondary);\n  color: var(--header-secondary);\n  text-align: center;\n}\ndiv#magane .stickersModal .modal-background {\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n  width: 100%;\n  height: 100%;\n  background-color: rgba(10, 10, 10, 0.86);\n}\ndiv#magane .stickersModal .modal-content,\ndiv#magane .stickersModal .modal-card {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  left: 0;\n  top: 0;\n  background: var(--background-tertiary);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig {\n  height: 100%;\n  width: 100%;\n  display: flex;\n  flex-direction: column;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig .tabs {\n  width: 100%;\n  text-align: center;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig .tabs .tab {\n  color: var(--header-secondary);\n  display: inline-block;\n  border: none;\n  border-top: 0px transparent;\n  border-left: 0px transparent;\n  border-right: 0px transparent;\n  border-width: 1px;\n  border-style: solid;\n  border-bottom-color: var(--header-secondary);\n  padding: 20px;\n  cursor: pointer;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig .tabs .tab:hover, div#magane .stickersModal .modal-content .stickersConfig .tabs .tab.is-active {\n  border-bottom-color: var(--interactive-active);\n  color: var(--interactive-active);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content {\n  height: calc(100% - 66px); /* .tabs height */\n  width: 100%;\n  padding: 10px 0;\n  box-sizing: border-box;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.avail-packs {\n  display: flex;\n  flex-direction: column;\n  padding-bottom: 0;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.avail-packs .packs {\n  height: 100%;\n  width: 100%;\n  padding-bottom: 10px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc {\n  -webkit-user-select: text;\n\t -moz-user-select: text;\n\t\t  user-select: text;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section {\n  padding: 0 24px 14px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section .section-title, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section .section-title {\n  font-weight: 800;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section > p:last-of-type, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section > p:last-of-type {\n  margin-bottom: 0;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section a, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section a {\n  /* inherit Discord\'s link color */\n  color: var(--text-link);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section a:hover, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section a:hover {\n  text-decoration: underline;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .input-grouped, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .input-grouped {\n  display: flex;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .input-grouped input, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .input-grouped input {\n  margin: 0;\n  width: auto;\n  flex-grow: 1;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .input-grouped button, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .input-grouped button {\n  margin-left: 4px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack {\n  height: 75px;\n  width: 100%;\n  float: left;\n  display: flex;\n  padding: 0 20px;\n  box-sizing: border-box;\n  margin-bottom: 5px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack:last-of-type {\n  margin-bottom: 0;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.index,\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.handle,\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.preview {\n  flex: 0 0 auto;\n  min-width: 75px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action {\n  flex: 1 0 auto;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action.is-tight button {\n  width: auto;\n  padding-right: 0.5em;\n  padding-left: 0.5em;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack {\n  width: 36px;\n  height: 36px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack:before, div#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack:after {\n  background-color: var(--header-secondary);\n  content: "";\n  display: block;\n  left: 50%;\n  position: absolute;\n  top: 50%;\n  transform: translateX(-50%) translateY(-50%) rotate(45deg);\n  transform-origin: center center;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack:before {\n  height: 2px;\n  width: 50%;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack:after {\n  height: 50%;\n  width: 2px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.index {\n  padding-top: 20px;\n  text-align: left;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.preview {\n  height: 75px;\n  background-position: center;\n  background-size: contain;\n  background-repeat: no-repeat;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.handle {\n  padding: 20px;\n  cursor: move;\n  padding-top: 30px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.handle span {\n  background: #555;\n  height: 2px;\n  width: 100%;\n  display: block;\n  margin-bottom: 6px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action {\n  padding-top: 20px;\n  text-align: right;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info {\n  flex: 1 1 auto;\n  padding: 14px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info > span {\n  display: block;\n  width: 100%;\n  color: var(--header-secondary);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info > span:nth-of-type(1) {\n  font-weight: bold;\n  color: var(--header-secondary);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info > span .appendix span:nth-of-type(1) {\n  padding: 0 0.5em;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info > span .appendix span:nth-of-type(2) {\n  -webkit-user-select: text;\n\t -moz-user-select: text;\n\t\t  user-select: text;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.preview img {\n  height: 100%;\n  width: 100%;\n}\ndiv#magane .stickersModal .modal-close {\n  -webkit-user-select: none;\n\t -moz-user-select: none;\n\t\t  user-select: none;\n  background-color: rgba(10, 10, 10, 0.2);\n  border: none;\n  border-radius: 290486px;\n  cursor: pointer;\n  display: inline-block;\n  flex-grow: 0;\n  flex-shrink: 0;\n  font-size: 0;\n  outline: none;\n  vertical-align: top;\n  background: none;\n  position: absolute;\n  right: 20px;\n  top: 20px;\n  height: 32px;\n  max-height: 32px;\n  max-width: 32px;\n  min-height: 32px;\n  min-width: 32px;\n  width: 32px;\n  z-index: 1;\n}\ndiv#magane .stickersModal .modal-close:before, div#magane .stickersModal .modal-close:after {\n  background-color: var(--header-secondary);\n  content: "";\n  display: block;\n  left: 50%;\n  position: absolute;\n  top: 50%;\n  transform: translateX(-50%) translateY(-50%) rotate(45deg);\n  transform-origin: center center;\n}\ndiv#magane .stickersModal .modal-close:before {\n  height: 2px;\n  width: 50%;\n}\ndiv#magane .stickersModal .modal-close:after {\n  height: 50%;\n  width: 2px;\n}\ndiv#magane .stickersModal .modal-close:hover, div#magane .stickersModal .modal-close:focus {\n  background-color: rgba(10, 10, 10, 0.3);\n}\ndiv#magane .button {\n  align-items: center;\n  border: 1px solid transparent;\n  border-radius: 3px;\n  box-shadow: none;\n  display: inline-flex;\n  font-size: 1rem;\n  padding: calc(0.375em - 1px) 0.75em;\n  position: relative;\n  vertical-align: top;\n  -webkit-user-select: none;\n\t -moz-user-select: none;\n\t\t  user-select: none;\n  cursor: pointer;\n  justify-content: center;\n  text-align: center;\n  white-space: nowrap;\n  border-color: transparent;\n  color: var(--header-secondary);\n  background-color: var(--background-secondary);\n  width: 62px; /* consistent width */\n}\ndiv#magane .button.is-danger {\n  color: #ffffff;\n  border-color: rgba(240, 71, 71, 0.3);\n  background: #f04747;\n}\ndiv#magane .button:hover, div#magane .button.is-primary:hover {\n  transform: scale3d(1.1, 1.1, 1.1);\n}\ndiv#magane .button.has-width-full {\n  width: 100%;\n}\ndiv#magane .button.has-width-full:hover {\n  /* TODO: Figure out how to do a more consistent scaling,\n\tregardless of the button\'s dynamic size. */\n  transform: scale3d(1.04, 1.04, 1.04);\n}\ndiv#magane .has-scroll-x {\n  overflow-x: overlay;\n}\ndiv#magane .has-scroll-y {\n  overflow-y: overlay;\n}\ndiv#magane ::-webkit-scrollbar {\n  /* Let\'s make the scrollbars pretty */\n  width: 6px;\n  height: 6px;\n}\ndiv#magane ::-webkit-scrollbar-track {\n  margin: 0;\n  background: transparent;\n  border-radius: 5px;\n}\ndiv#magane ::-webkit-scrollbar-track-piece {\n  border: 0 solid transparent;\n  background: transparent;\n  margin: 0;\n}\ndiv#magane ::-webkit-scrollbar-thumb {\n  background: rgba(105, 96, 128, 0.5);\n  border: 0 solid transparent;\n  border-radius: 5px;\n}\ndiv#magane ::-webkit-scrollbar-thumb:hover {\n  background: rgba(105, 96, 128, 0.75);\n}\ndiv#magane ::-webkit-scrollbar-thumb:active {\n  background: #696080;\n}\ndiv#magane code {\n  box-sizing: border-box;\n  padding: 2px 6px;\n  border-radius: 3px;\n  border: 1px solid var(--background-secondary);\n  background: var(--background-secondary);\n  color: var(--header-secondary);\n}\n\ndiv#maganeButton.channel-textarea-stickers {\n  display: flex;\n  align-items: center;\n  cursor: pointer;\n}\ndiv#maganeButton.channel-textarea-stickers:hover, div#maganeButton.channel-textarea-stickers.active {\n  filter: brightness(1.35);\n}\ndiv#maganeButton img.channel-textarea-stickers-content {\n  width: 24px;\n  height: 24px;\n  padding: 4px;\n  margin-left: 2px;\n  margin-right: 2px;\n}';

const click_handler_17 = event => event.target.select(), click_handler_28 = event => event.stopPropagation(), click_handler_33 = event => event.stopPropagation();

function instance$1($$self, $$props, $$invalidate) {
	const Modules = {}, coords = {
		top: 0,
		left: 0
	};
	let main = null, base = null, isMaganeBD = null, forceHideMagane = !1, components = [], activeComponent = null, baseURL = "", stickerWindowActive = !1, stickerAddModalActive = !1;
	const stickerAddModalTabsInit = {};
	let activeTab = null, favoriteStickers = [], availablePacks = [], subscribedPacks = [], subscribedPacksSimple = [], filteredPacks = [], stickersStats = [], frequentlyUsedSorted = [], simplePacksData = {};
	const localPacks = {};
	let linePackSearch = null, remotePackUrl = null, frequentlyUsedInput = 10, hotkeyInput = null, hotkey = {}, onCooldown = !1, storage = null, packsSearch = null, resizeObserver = null;
	const resizeObserverQueue = [];
	let resizeObserverQueueWorking = !1, isWarnedAboutViewportHeight = !1;
	const waitForTimeouts = {}, settings = {
		enableWindowMagane: !1,
		disableToasts: !1,
		closeWindowOnSend: !1,
		useLeftToolbar: !1,
		hidePackAppendix: !1,
		disableDownscale: !1,
		disableImportedObfuscation: !1,
		alwaysSendAsLink: !1,
		ignoreEmbedLinksPermission: !1,
		markAsSpoiler: !1,
		ignoreViewportSize: !1,
		disableSendingWithChatInput: !1,
		frequentlyUsed: frequentlyUsedInput,
		hotkey: null
	}, defaultSettings = Object.freeze(Object.assign({}, settings)), allowedStorageKeys = [ "magane.available", "magane.subscribed", "magane.favorites", "magane.settings", "magane.stats" ], log = (message, type = "log") => (type = [ "log", "info", "warn", "error" ].includes(type) ? type : "log", 
	console[type]("%c[Magane]%c", "color: #3a71c1; font-weight: 700", "", message)), toast = (message, options = {}) => {
		options.nolog && !settings.disableToasts || log(message, options.type), settings.disableToasts || BdApi.showToast(message, options);
	}, toastInfo = (message, options = {}) => (options.type = "info", toast(message, options)), toastSuccess = (message, options = {}) => (options.type = "success", 
	toast(message, options)), toastError = (message, options = {}) => (options.type = "error", 
	toast(message, options)), toastWarn = (message, options = {}) => (options.type = "warn", 
	toast(message, options)), destroyButtonComponents = () => {
		activeComponent = null;
		for (let i = 0; i < components.length; i++) components[i].$destroy();
		components = [];
	}, resizeObserverWorker = async entry => {
		if (entry && 0 !== entry.contentRect.width && 0 !== entry.contentRect.height) for (const component of components) if (component.textArea === entry.target) {
			if (component.lastTextAreaSize.width === entry.contentRect.width) return;
			break;
		}
		resizeObserver.disconnect(), components.forEach(component => toggleStickerWindow(!1, component)), 
		destroyButtonComponents();
		(await ((selector, options = {}) => {
			let poll;
			return options.logname && log(`Waiting for ${options.logname}…`), new Promise(resolve => {
				(poll = () => {
					const found = [], elements = document.querySelectorAll(selector);
					for (let i = 0; i < elements.length && (("function" != typeof options.assert || options.assert(elements[i])) && found.push(elements[i]), 
					!found.length || options.multiple); i++) ;
					if (found.length) return delete waitForTimeouts[selector], resolve(found);
					waitForTimeouts[selector] = setTimeout(poll, 500);
				})();
			});
		})('[class^="channelTextArea-"]:not([class*="channelTextAreaDisabled-"])', {
			logname: "textarea",
			assert: element => {
				const voiceChatWrapper = document.querySelector('[class^="channelChatWrapper-"]');
				return !voiceChatWrapper || voiceChatWrapper.contains(element);
			},
			multiple: !0
		})).forEach(textArea => {
			resizeObserver.observe(textArea), (textArea => {
				const buttonsContainer = textArea.querySelector('[class^="buttons"]');
				if (!buttonsContainer) return;
				const component = new Button({
					target: buttonsContainer,
					anchor: buttonsContainer.firstElementChild
				});
				components.push(component), component.$on("click", () => toggleStickerWindow(void 0, component)), 
				component.$on("grabPacks", () => grabPacks(!0)), component.textArea = textArea, 
				component.lastTextAreaSize = {
					width: textArea.clientWidth,
					height: textArea.clientHeight
				};
			})(textArea);
		});
	}, resizeObserverQueuePush = entry => new Promise((resolve, reject) => {
		resizeObserverQueue.push({
			entry,
			resolve,
			reject
		}), resizeObserverQueueShift();
	}), resizeObserverQueueShift = () => {
		if (resizeObserverQueueWorking) return !1;
		const item = resizeObserverQueue.shift();
		if (!item) return !1;
		try {
			resizeObserverQueueWorking = !0, resizeObserverWorker(item.entry).then(value => {
				resizeObserverQueueWorking = !1, item.resolve(value), resizeObserverQueueShift();
			}).catch(err => {
				resizeObserverQueueWorking = !1, item.reject(err), resizeObserverQueueShift();
			});
		} catch (err) {
			resizeObserverQueueWorking = !1, item.reject(err), resizeObserverQueueShift();
		}
		return !0;
	}, initButton = async () => {
		base = main.parentNode.parentNode, $$invalidate(2, isMaganeBD = base === document.body), 
		log(isMaganeBD ? "Magane is mounted with MaganeBD." : "Magane is mounted with legacy method."), 
		resizeObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				if (!entry.contentRect) return;
				resizeObserverQueuePush({
					target: entry.target,
					contentRect: entry.contentRect
				});
			}
		}), resizeObserverWorker();
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
		for (const key of Object.keys(defaultSettings)) void 'undefined' === data[key] ? $$invalidate(20, settings[key] = defaultSettings[key], settings) : $$invalidate(20, settings[key] = data[key], settings);
		setWindowMaganeAPIs(settings.enableWindowMagane), $$invalidate(17, frequentlyUsedInput = settings.frequentlyUsed), 
		$$invalidate(18, hotkeyInput = settings.hotkey), parseThenInitHotkey();
	}, loadSettings = (reset = !1) => {
		reset && applySettings(defaultSettings);
		const storedSettings = getFromLocalStorage("magane.settings");
		storedSettings && applySettings(storedSettings);
	}, isLocalPackID = id => "string" == typeof id && (id.startsWith("startswith-") || id.startsWith("emojis-") || id.startsWith("custom-")), initSimplePackDataEntry = (pack, source) => {
		if (simplePacksData[pack]) return;
		const target = source || availablePacks, index = target.findIndex(p => p.id === pack);
		-1 !== index && $$invalidate(13, simplePacksData[pack] = {
			name: target[index].name
		}, simplePacksData);
	}, cleanUpSimplePackDataEntry = pack => {
		favoriteStickers.some(s => s.pack === pack) || frequentlyUsedSorted.some(s => s.pack === pack) || delete simplePacksData[pack];
	}, grabPacks = async (reset = !1) => {
		let packs;
		try {
			const response = await fetch("https://magane.moe/api/packs");
			packs = await response.json(), baseURL = packs.baseURL;
		} catch (error) {
			toastError("Unable to fetch Magane's API. Magane will load as-is, but built-in remote packs will temporarily be unavailable.", {
				timeout: 10000
			}), console.error(error);
		}
		reset && (availablePacks = [], $$invalidate(11, filteredPacks = []), $$invalidate(9, subscribedPacks = []), 
		$$invalidate(10, subscribedPacksSimple = []), $$invalidate(8, favoriteStickers = []), 
		stickersStats = [], $$invalidate(12, frequentlyUsedSorted = []), $$invalidate(13, simplePacksData = {}));
		const availLocalPacks = getFromLocalStorage("magane.available");
		if (Array.isArray(availLocalPacks) && availLocalPacks.length) {
			const filteredLocalPacks = availLocalPacks.filter(pack => "object" == typeof pack && void 'undefined' !== pack.id && isLocalPackID(pack.id));
			availLocalPacks.length !== filteredLocalPacks.length && (log(`magane.available mismatch: ${availLocalPacks.length} !== ${filteredLocalPacks.length}`), 
			saveToLocalStorage("magane.available", filteredLocalPacks)), filteredLocalPacks.forEach(pack => {
				$$invalidate(14, localPacks[pack.id] = pack, localPacks);
			}), availablePacks.push(...filteredLocalPacks);
		}
		packs && availablePacks.push(...packs.packs), availablePacks = availablePacks, $$invalidate(11, filteredPacks = availablePacks);
		const subscribed = getFromLocalStorage("magane.subscribed");
		Array.isArray(subscribed) && subscribed.length && ($$invalidate(9, subscribedPacks = subscribed.filter(pack => !(isLocalPackID(pack.id) && !localPacks[pack.id]) && (subscribedPacksSimple.push(pack.id), 
		!0))), subscribed.length !== subscribedPacks.length && (log(`magane.subscribed mismatch: ${subscribed.length} !== ${subscribedPacks.length}`), 
		saveToLocalStorage("magane.subscribed", subscribedPacks)));
		const favorites = getFromLocalStorage("magane.favorites");
		Array.isArray(favorites) && favorites.length && ($$invalidate(8, favoriteStickers = favorites.filter(sticker => !(isLocalPackID(sticker.pack) && !localPacks[sticker.pack]) && (initSimplePackDataEntry(sticker.pack), 
		!0))), favorites.length !== favoriteStickers.length && (log(`magane.favorites mismatch: ${favorites.length} !== ${favoriteStickers.length}`), 
		saveToLocalStorage("magane.favorites", favoriteStickers)));
		const stats = getFromLocalStorage("magane.stats");
		Array.isArray(stats) && stats.length && (stickersStats = stats.filter(sticker => !isLocalPackID(sticker.pack) || localPacks[sticker.pack]), 
		stats.length !== stickersStats.length && (log(`magane.stats mismatch: ${stats.length} !== ${stickersStats.length}`), 
		saveToLocalStorage("magane.stats", stickersStats)), updateFrequentlyUsed());
	}, subscribeToPack = pack => {
		-1 === subscribedPacks.findIndex(p => p.id === pack.id) && ($$invalidate(9, subscribedPacks = [ ...subscribedPacks, pack ]), 
		$$invalidate(10, subscribedPacksSimple = [ ...subscribedPacksSimple, pack.id ]), 
		saveToLocalStorage("magane.subscribed", subscribedPacks), log("Subscribed > " + pack.name));
	}, unsubscribeToPack = pack => {
		for (let i = 0; i < subscribedPacks.length; i++) if (subscribedPacks[i].id === pack.id) return subscribedPacks.splice(i, 1), 
		subscribedPacksSimple.splice(i, 1), $$invalidate(9, subscribedPacks), $$invalidate(10, subscribedPacksSimple), 
		log("Unsubscribed > " + pack.name), void saveToLocalStorage("magane.subscribed", subscribedPacks);
	}, formatUrl = (pack, id, sending, thumbIndex) => {
		let url;
		if ("number" == typeof pack) if (baseURL) url = `${baseURL || ""}${pack}/${id}`, 
		sending || (url = url.replace(/\.(gif|png)$/i, "_key.$1")); else {
			if (sending) throw new Error("Magane's API was unavailable. Please reload Magane if the API is already back online.");
			url = "/assets/8becd37ab9d13cdfe37c08c496a9def3.svg";
		} else if (pack.startsWith("startswith-")) {
			url = "https://stickershop.line-scdn.net/stickershop/v1/sticker/%id%/android/sticker.png;compress=true".replace(/%id%/g, id.split(".")[0]);
			let append = sending ? "&h=180p" : "&h=100p";
			localPacks[pack].animated && (url = url.replace(/sticker(@2x)?\.png/, "sticker_animation$1.png"), 
			append += "&output=gif"), settings.disableDownscale || (url = `https://images.weserv.nl/?url=${encodeURIComponent(url)}${append}`);
		} else if (pack.startsWith("emojis-")) {
			url = "https://stickershop.line-scdn.net/sticonshop/v1/sticon/%pack%/android/%id%.png".replace(/%pack%/g, pack.split("-")[1]).replace(/%id%/g, id.split(".")[0]);
			let append = sending ? "" : "&h=100p";
			localPacks[pack].animated && (url = url.replace(/\.png/, "_animation.png"), append += "&output=gif"), 
			settings.disableDownscale || (url = `https://images.weserv.nl/?url=${encodeURIComponent(url)}${append}`);
		} else if (pack.startsWith("custom-")) {
			if (!sending && Array.isArray(localPacks[pack].thumbs)) {
				if (localPacks[pack].thumbs.length && ("number" != typeof thumbIndex && (thumbIndex = localPacks[pack].files.findIndex(file => file === id)), 
				url = thumbIndex >= 0 ? localPacks[pack].thumbs[thumbIndex] : null), !url) return "/assets/eedd4bd948a0da6d75bf5304bff4e17f.svg";
			} else url = id;
			"string" == typeof localPacks[pack].template && (url = localPacks[pack].template.replace(/%pack%/g, pack.replace("custom-", "")).replace(/%id%/g, url));
		}
		return url;
	}, hasPermission = (permission, channelId) => {
		if (!(Modules.DiscordPermissions && Modules.Permissions && Modules.UserStore && Modules.ChannelStore)) return !0;
		const user = Modules.UserStore.getCurrentUser(), context = Modules.ChannelStore.getChannel(channelId);
		return !!user && (!permission || !context.guild_id || Modules.Permissions.can({
			permission: Modules.DiscordPermissions[permission],
			user,
			context
		}));
	}, sendSticker = async (pack, id) => {
		if (onCooldown) return toastWarn("Sending sticker is still on cooldown…", {
			timeout: 1500
		});
		if (!activeComponent) return toastWarn("Selected text area is not found, please re-open Magane window.");
		onCooldown = !0;
		try {
			let channelId;
			const textAreaInstance = (textArea => {
				let cursor = textArea[Object.keys(textArea).find(key => key.startsWith("__reactFiber") || key.startsWith("__reactInternalInstance"))];
				for (let i = 0; i < 10 && cursor; i++) {
					if (cursor.stateNode && cursor.stateNode.handleTextareaChange) return cursor;
					cursor = cursor.return;
				}
			})(activeComponent.textArea);
			if (textAreaInstance ? channelId = textAreaInstance.stateNode.props.channel.id : Modules.SelectedChannelStore && (channelId = Modules.SelectedChannelStore.getChannelId()), 
			!channelId) return onCooldown = !1, toastError("Unable to determine channel ID. Is this a pending Thread creation?");
			if (!hasPermission("SEND_MESSAGES", channelId)) return onCooldown = !1, toastError("You do not have permission to send message in this channel.");
			toast("Sending…", {
				nolog: !0
			}), settings.closeWindowOnSend && toggleStickerWindow(!1, activeComponent);
			const url = formatUrl(pack, id, !0);
			let messageOptions, messageContent = "";
			if (!settings.disableSendingWithChatInput && Modules.DraftStore && (messageContent = Modules.DraftStore.getDraft(channelId, 0)), 
			Modules.PendingReplyStore) {
				const pendingReply = Modules.PendingReplyStore.getPendingReply(channelId);
				pendingReply && (messageOptions = Modules.MessageUtils.getSendMessageOptionsForReply(pendingReply));
			}
			if (!settings.alwaysSendAsLink && hasPermission("ATTACH_FILES", channelId)) {
				log("Fetching sticker from remote: " + url);
				const response = await fetch(url, {
					cache: "force-cache"
				}), blob = await response.blob();
				let filename = id;
				if ("string" == typeof pack) if (localPacks[pack].animated && (pack.startsWith("startswith-") || pack.startsWith("emojis-"))) filename = filename.replace(/\.png$/i, ".gif"), 
				toastWarn("Animated stickers/emojis from LINE Store currently cannot be animated."); else if (pack.startsWith("custom-")) if (settings.disableImportedObfuscation) filename = id; else {
					const ext = id.match(/(\.\w+)$/);
					filename = `${Date.now().toString()}${ext ? ext[1] : ""}`;
				}
				settings.markAsSpoiler && (filename = "SPOILER_" + filename);
				const file = new File([ blob ], filename);
				log(`Sending sticker as ${filename}…`), Modules.MessageUpload.uploadFiles({
					channelId,
					draftType: 0,
					hasSpoiler: !1,
					options: messageOptions || {},
					parsedMessage: {
						content: messageContent
					},
					uploads: [ new Modules.UploadObject({
						file,
						platform: 1
					}, channelId, !1, 0) ]
				});
			} else if (settings.ignoreEmbedLinksPermission || hasPermission("EMBED_LINKS", channelId)) {
				settings.alwaysSendAsLink || toastWarn("You do not have permission to attach files, sending sticker as link…");
				let append = url;
				settings.markAsSpoiler && (append = `||${append}||`), Modules.MessageUtils._sendMessage(channelId, {
					content: `${messageContent} ${append}`.trim()
				}, messageOptions || {});
			} else toastError("You do not have permissions to attach files nor embed links.");
			if (0 !== settings.frequentlyUsed) {
				const last = stickersStats.findIndex(sticker => sticker.pack === pack && sticker.id === id);
				-1 === last ? stickersStats.push({
					pack,
					id,
					used: 1,
					lastUsed: Date.now()
				}) : (stickersStats[last].used++, stickersStats[last].lastUsed = Date.now()), saveToLocalStorage("magane.stats", stickersStats), 
				updateFrequentlyUsed();
			}
			!settings.disableSendingWithChatInput && textAreaInstance && (log("Clearing chat input…"), 
			textAreaInstance.stateNode.setState({
				textValue: "",
				richValue: [ {
					type: "line",
					children: [ {
						text: ""
					} ]
				} ]
			}));
		} catch (error) {
			console.error(error), toastError(error.toString(), {
				nolog: !0,
				timeout: 5000
			});
		}
		onCooldown = !1;
	}, favoriteSticker = (pack, id) => {
		if (-1 !== favoriteStickers.findIndex(f => f.pack === pack && f.id === id)) return;
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
		const index = favoriteStickers.findIndex(f => f.pack === pack && f.id === id);
		-1 !== index && (favoriteStickers.splice(index, 1), $$invalidate(8, favoriteStickers), 
		cleanUpSimplePackDataEntry(pack), saveToLocalStorage("magane.favorites", favoriteStickers), 
		log(`Unfavorited > ${id} of pack ${pack}`), toastInfo("Unfavorited!", {
			nolog: !0
		}));
	}, filterPacks = () => {
		const query = "string" == typeof packsSearch && packsSearch.trim().toLowerCase();
		$$invalidate(11, filteredPacks = query ? availablePacks.filter(pack => pack.name.toLowerCase().indexOf(query) >= 0 || String(pack.id).indexOf(query) >= 0) : availablePacks);
	}, _appendPack = (id, e, opts = {}) => {
		let availLocalPacks = getFromLocalStorage("magane.available");
		Array.isArray(availLocalPacks) && availLocalPacks.length || (availLocalPacks = []);
		const foundIndex = availLocalPacks.findIndex(p => p.id === id);
		if (foundIndex >= 0) {
			if (opts.overwrite && opts.partial) e = Object.assign(availLocalPacks[foundIndex], e); else if (!opts.overwrite) throw new Error(`Pack with ID ${id} already exist.`);
		} else if (opts.overwrite) throw new Error(`Cannot overwrite missing pack with ID ${id}.`);
		if (!e.count || !e.files.length) throw new Error("Invalid stickers count.");
		const result = {
			pack: e
		};
		if (isLocalPackID(id) && $$invalidate(14, localPacks[id] = e, localPacks), foundIndex >= 0) {
			availLocalPacks[foundIndex] = e;
			const sharedIndex = availablePacks.findIndex(p => p.id === id);
			-1 !== sharedIndex && (availablePacks[sharedIndex] = e);
		} else availLocalPacks.unshift(e), availablePacks.unshift(e), availablePacks = availablePacks;
		return saveToLocalStorage("magane.available", availLocalPacks), filterPacks(), opts.overwrite ? log("Overwritten pack with ID " + id) : log("Added a new pack with ID " + id), 
		result;
	}, migrateStringPackIds = async () => {
		let dirty = !1;
		const favorites = getFromLocalStorage("magane.favorites");
		Array.isArray(favorites) && favorites.length && favorites.forEach(item => {
			if ("number" == typeof item.pack || isLocalPackID(item.pack)) return;
			const result = parseInt(item.pack, 10);
			isNaN(item.pack) || (item.pack = result, dirty = !0);
		});
		const subscribed = getFromLocalStorage("magane.subscribed");
		Array.isArray(subscribed) && subscribed.length && subscribed.forEach(item => {
			if ("number" == typeof item.id || isLocalPackID(item.id)) return;
			const result = parseInt(item.id, 10);
			isNaN(item.id) || (item.id = result, dirty = !0);
		}), dirty && (toastInfo("Found packs/stickers to migrate, migrating now..."), saveToLocalStorage("magane.favorites", favorites), 
		saveToLocalStorage("magane.subscribed", subscribed), await grabPacks(!0), toastSuccess("Migration successful."));
	}, parseFunctionArgs = (args, argNames = [], minArgs = 0) => {
		const isFirstArgAnObj = "object" == typeof args[0];
		if (!isFirstArgAnObj && args.length < minArgs) throw new Error(`This function expects at least ${minArgs} parameter(s).`);
		const parsed = {};
		for (let i = 0; i < argNames.length; i++) parsed[argNames[i]] = isFirstArgAnObj ? args[0][argNames[i]] : args[i];
		return parsed;
	}, appendPack = (...args) => {
		let {name, firstid, count, animated} = parseFunctionArgs(args, [ "name", "firstid", "count", "animated" ], 3);
		if (firstid = Number(firstid), isNaN(firstid) || !isFinite(firstid) || firstid < 0) throw new Error("Invalid first ID.");
		count = Math.max(Math.min(Number(count), 200), 0) || 0;
		const mid = "startswith-" + firstid, files = [];
		for (let i = firstid; i < firstid + count; i += 1) files.push(i + ".png");
		return _appendPack(mid, {
			name,
			count,
			id: mid,
			animated: animated ? 1 : null,
			files
		});
	}, appendEmojisPack = (...args) => {
		let {name, id, count, animated} = parseFunctionArgs(args, [ "name", "id", "count", "animated" ], 3);
		count = Math.max(Math.min(Number(count), 200), 0) || 0;
		const mid = "emojis-" + id, files = [];
		for (let i = 0; i < count; i += 1) files.push(String(i + 1).padStart(3, "0") + ".png");
		return _appendPack(mid, {
			name,
			count,
			id: mid,
			animated: animated ? 1 : null,
			files
		});
	}, appendCustomPack = (...args) => {
		let {name, id, count, animated, template, files, thumbs} = parseFunctionArgs(args, [ "name", "id", "count", "animated", "template", "files", "thumbs" ], 5);
		count = Math.max(Number(count), 0) || 0;
		const mid = "custom-" + id;
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
			animated: animated ? 1 : null,
			files,
			thumbs,
			template
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
		const index = availLocalPacks.findIndex(p => p.id === id);
		if (-1 === index) throw new Error("Unable to find pack with ID " + id);
		$$invalidate(8, favoriteStickers = favoriteStickers.filter(s => s.pack !== id)), 
		saveToLocalStorage("magane.favorites", favoriteStickers), stickersStats = stickersStats.filter(s => s.pack !== id), 
		saveToLocalStorage("magane.stats", stickersStats), updateFrequentlyUsed();
		const subbedPack = subscribedPacks.find(p => p.id === id);
		subbedPack && unsubscribeToPack(subbedPack), availLocalPacks.splice(index, 1), saveToLocalStorage("magane.available", availLocalPacks);
		const sharedIndex = availablePacks.findIndex(p => p.id === id);
		return -1 !== sharedIndex && (availablePacks.splice(sharedIndex, 1), availablePacks = availablePacks, 
		filterPacks()), delete localPacks[id], log(`Removed pack with ID ${id} (old index: ${index})`), 
		!0;
	}, searchPacks = keyword => {
		if (!keyword) throw new Error("Keyword required");
		keyword = keyword.toLowerCase();
		const availLocalPacks = getFromLocalStorage("magane.available");
		if (!Array.isArray(availLocalPacks) || !availLocalPacks.length) throw new Error("You have not imported any remote or custom packs");
		return availLocalPacks.filter(p => p.name.toLowerCase().indexOf(keyword) >= 0 || p.id.indexOf(keyword) >= 0);
	}, setWindowMaganeAPIs = state => {
		state ? window.magane = {
			appendPack,
			appendEmojisPack,
			appendCustomPack,
			editPack,
			deletePack,
			searchPacks,
			Modules,
			hasPermission
		} : window.magane instanceof Node || delete window.magane;
	};
	onMount(async () => {
		const startTime = Date.now();
		try {
			toast("Loading Magane…"), Modules.ChannelStore = BdApi.findModuleByProps("getChannel", "getDMFromUserId"), 
			Modules.SelectedChannelStore = BdApi.findModuleByProps("getLastSelectedChannelId"), 
			Modules.DiscordConstants = BdApi.findModuleByProps("Permissions", "ActivityTypes", "StatusTypes"), 
			Modules.DiscordPermissions = BdApi.Webpack.getModule(m => m.ADD_REACTIONS, {
				searchExports: !0
			}), Modules.Permissions = BdApi.findModuleByProps("computePermissions"), Modules.UserStore = BdApi.findModuleByProps("getCurrentUser", "getUser"), 
			Modules.DraftStore = BdApi.findModuleByProps("getDraft", "getState"), Modules.MessageUpload = BdApi.findModuleByProps("instantBatchUpload"), 
			Modules.MessageUtils = BdApi.findModuleByProps("sendMessage"), Modules.PendingReplyStore = BdApi.findModuleByProps("getPendingReply"), 
			Modules.UploadObject = BdApi.Webpack.getModule(m => m.prototype && m.prototype.upload && m.prototype.getSize, {
				searchExports: !0
			}), (() => {
				const iframe = document.createElement("iframe");
				document.head.append(iframe), storage = Object.getOwnPropertyDescriptor(iframe.contentWindow.frames, "localStorage").get.call(window), 
				iframe.remove();
			})(), loadSettings(), await grabPacks(), await migrateStringPackIds(), toastSuccess("Magane is now ready!"), 
			initButton();
		} catch (error) {
			console.error(error), toastError("Unexpected error occurred when initializing Magane. Check your console for details.");
		}
		log(`Time taken: ${(Date.now() - startTime) / 1000}s.`);
	}), onDestroy(() => {
		document.removeEventListener("click", maganeBlurHandler), document.removeEventListener("keyup", onKeydownEvent), 
		destroyButtonComponents();
		for (const timeout of Object.values(waitForTimeouts)) clearTimeout(timeout);
		resizeObserver && resizeObserver.disconnect(), setWindowMaganeAPIs(!1), log("Internal components cleaned up.");
	});
	const maganeBlurHandler = e => {
		const stickerWindow = main.querySelector(".stickerWindow");
		if (stickerWindow) {
			const {x, y, width, height} = stickerWindow.getBoundingClientRect();
			if (e.target) {
				if (activeComponent && activeComponent.element.contains(e.target)) return;
				const visibleModals = document.querySelectorAll('[class^="layerContainer-"]');
				if (visibleModals.length && Array.from(visibleModals).some(m => m.contains(e.target))) return;
			}
			e.clientX <= x + width && e.clientX >= x && e.clientY <= y + height && e.clientY >= y || toggleStickerWindow(!1);
		}
	}, toggleStickerWindow = (forceState, component) => {
		if (!document.body.contains(main)) return toastError("Oh no! Magane was unexpectedly destroyed.. Please consider updating to MaganeBD instead.", {
			timeout: 6000
		});
		component || activeComponent || (activeComponent = components.find(component => document.body.contains(component.element)));
		const toggledComponent = component || activeComponent, active = void 'undefined' === forceState ? !stickerWindowActive : forceState;
		if (active) {
			if ((textArea => {
				const buttonsContainer = textArea.querySelector('[class^="buttons"]');
				if (!buttonsContainer) return;
				const props = buttonsContainer.getBoundingClientRect();
				if (log("Updating window's position…"), $$invalidate(0, coords.wbottom = base.clientHeight - props.top + 8, coords), 
				$$invalidate(0, coords.wright = base.clientWidth - props.right - 6, coords), !isMaganeBD) {
					const baseProps = base.getBoundingClientRect();
					$$invalidate(0, coords.wbottom += baseProps.top, coords), $$invalidate(0, coords.wright += baseProps.left, coords);
				}
			})(toggledComponent.textArea), !settings.ignoreViewportSize && !isWarnedAboutViewportHeight) {
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
		try {
			const _name = localPacks[id].name;
			deletePack(id) && toastSuccess(`Removed pack ${_name}.`, {
				nolog: !0,
				timeout: 6000
			});
		} catch (error) {
			console.error(error), toastError(error.toString(), {
				nolog: !0
			});
		}
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
			pack.name = String(data.name), pack.thumbs = [];
			for (let i = 0; i < data.files.length; i++) pack.files.push(data.files[i].url), 
			pack.thumbs.push(data.files[i].thumb || null);
			break;

		  case 0:
		  default:
			if ([ "id", "name", "files" ].some(key => !data[key])) throw new Error("Invalid config. Some required fields are missing.");
			if (pack.id = String(data.id), pack.name = String(data.name), data.files.some(file => "string" != typeof file)) throw new Error('Invalid "files" array. Some values are not string.');
			if (pack.files = data.files, Array.isArray(data.thumbs)) {
				if (data.thumbs.some(thumb => "string" != typeof thumb && null !== thumb)) throw new Error('Invalid "thumbs" array. Some values are neither string nor null.');
				pack.thumbs = data.thumbs;
			}
			pack.description = data.description ? String(data.description) : null, pack.homeUrl = data.homeUrl ? String(data.homeUrl) : null, 
			pack.template = data.template ? String(data.template) : null, data.updateUrl && (pack.updateUrl = String(data.updateUrl));
		}
		return pack.count = pack.files.length, Array.isArray(pack.thumbs) && pack.thumbs.every(thumb => null === thumb) && (pack.thumbs = []), 
		pack;
	}, fetchRemotePack = async (url, bypassCheck = !1, remoteType) => {
		const opts = {
			updateUrl: url
		};
		if (bypassCheck) opts.remoteType = remoteType; else {
			if (!url || !/^https?:\/\//.test(url)) throw new Error("URL must have HTTP(s) protocol.");
			const regExes = [ /^(.+:\/\/)(.+)\/a\/([^/\s]+)/ ];
			let match = {
				index: -1
			};
			for (let i = 0; i < regExes.length; i++) {
				const _match = url.match(regExes[i]);
				_match && !_match.some(m => void 0 === m) && (match = {
					index: i,
					result: _match
				});
			}
			switch (match.index) {
			  case 0:
				opts.id = `${match.result[2]}-${match.result[3]}`, opts.homeUrl = url, opts.updateUrl = `${match.result[1]}${match.result[2]}/api/album/${match.result[3]}`, 
				opts.remoteType = 1;
			}
		}
		const response = await fetch(opts.updateUrl, {
			cache: "no-cache"
		}), data = await response.json();
		if (!data) throw new Error("Unable to parse data. Check your console for details.");
		return processRemotePack(data, opts);
	}, updateRemotePack = async (id, silent = !1) => {
		try {
			if (!localPacks[id] || !localPacks[id].updateUrl) return;
			silent || toast("Updating pack information…", {
				nolog: !0
			});
			const pack = await fetchRemotePack(localPacks[id].updateUrl, "number" == typeof localPacks[id].remoteType, localPacks[id].remoteType);
			pack.id = id;
			const stored = _appendPack(pack.id, pack, {
				overwrite: !0
			});
			$$invalidate(8, favoriteStickers = favoriteStickers.filter(s => s.pack !== id || -1 !== stored.pack.files.findIndex(f => f === s.id))), 
			saveToLocalStorage("magane.favorites", favoriteStickers), stickersStats = stickersStats.filter(s => s.pack !== id || -1 !== stored.pack.files.findIndex(f => f === s.id)), 
			saveToLocalStorage("magane.stats", stickersStats), simplePacksData[id] && $$invalidate(13, simplePacksData[id].name = stored.pack.name, simplePacksData), 
			updateFrequentlyUsed();
			const subIndex = subscribedPacks.findIndex(p => p.id === id);
			return -1 !== subIndex && ($$invalidate(9, subscribedPacks[subIndex] = stored.pack, subscribedPacks), 
			$$invalidate(10, subscribedPacksSimple[subIndex] = stored.pack.id, subscribedPacksSimple), 
			saveToLocalStorage("magane.subscribed", subscribedPacks)), silent || toastSuccess(`Updated pack ${stored.pack.name}.`, {
				nolog: !0,
				timeout: 6000
			}), stored;
		} catch (error) {
			console.error(error), toastError(error.toString(), {
				nolog: !0
			});
		}
	}, showPackInfo = id => {
		if (!localPacks[id]) return;
		const content = `**ID:** \`${id}\`\n\n**Name:**\n\n` + localPacks[id].name + "\n\n**Count:**\n\n" + localPacks[id].count + "\n\n**Description:**\n\n" + (localPacks[id].description || "N/A") + "\n\n**Home URL:**\n\n" + (localPacks[id].homeUrl || "N/A") + "\n\n**Update URL:**\n\n" + localPacks[id].updateUrl || "N/A";
		BdApi.showConfirmationModal(localPacks[id].name, content);
	}, parseLinePack = async () => {
		if (linePackSearch) try {
			const match = linePackSearch.match(/^(https?:\/\/store\.line\.me\/((sticker|emoji)shop)\/product\/)?([a-z0-9]+)/);
			if (!match) return toastError("Unsupported LINE Store URL or ID.");
			let stored;
			if (toast("Loading pack information…", {
				nolog: !0
			}), "emoji" === match[3]) {
				const id = match[4], response = await fetch("https://magane.moe/api/proxy/emoji/" + id), props = await response.json();
				stored = appendEmojisPack({
					name: props.title,
					id: props.id,
					count: props.len,
					animated: props.hasAnimation || null
				});
			} else {
				const id = Number(match[4]);
				if (isNaN(id) || id < 0) return toastError("Unsupported LINE Stickers ID.");
				const response = await fetch("https://magane.moe/api/proxy/sticker/" + id), props = await response.json();
				stored = appendPack({
					name: props.title,
					firstid: props.first,
					count: props.len,
					animated: props.hasAnimation
				});
			}
			toastSuccess(`Added a new pack ${stored.pack.name}. You can now subscribe to it from Packs tab.`, {
				nolog: !0,
				timeout: 6000
			}), $$invalidate(15, linePackSearch = null);
		} catch (error) {
			console.error(error), toastError(error.toString(), {
				nolog: !0
			});
		}
	}, assertRemotePackConsent = (context, onConfirm) => {
		const content = context + "\n\n**Please continue only if you trust this remote pack.**";
		BdApi.showConfirmationModal("Import Remote Pack", content, {
			confirmText: "Import",
			cancelText: "Cancel",
			danger: !0,
			onConfirm
		});
	}, parseRemotePackUrl = () => {
		remotePackUrl && assertRemotePackConsent("URL:\n\n" + remotePackUrl, async () => {
			try {
				toast("Loading pack information…", {
					nolog: !0
				});
				const pack = await fetchRemotePack(remotePackUrl);
				pack.id = "custom-" + pack.id;
				const stored = _appendPack(pack.id, pack);
				toastSuccess(`Added a new pack ${stored.pack.name}.`, {
					nolog: !0,
					timeout: 6000
				}), $$invalidate(16, remotePackUrl = null);
			} catch (error) {
				console.error(error), toastError(error.toString(), {
					nolog: !0
				});
			}
		});
	}, loadLocalRemotePack = () => {
		document.getElementById("localRemotePackInput").click();
	}, bulkUpdateRemotePacks = () => {
		const packs = Object.values(localPacks).filter(pack => pack.updateUrl).map(pack => pack.id);
		if (!packs.length) return toastWarn("You do not have any remote packs that can be updated.");
		const content = `**Please confirm that you want to update __${packs.length}__ remote pack${1 === packs.length ? "" : "s"}.**`;
		BdApi.showConfirmationModal(`Update ${packs.length} remote pack${1 === packs.length ? "" : "s"}`, content, {
			confirmText: "Import",
			cancelText: "Cancel",
			danger: !0,
			onConfirm: async () => {
				try {
					for (let i = 0; i < packs.length; i++) {
						toast(`Updating pack ${i + 1} out of ${packs.length}…`, {
							nolog: !0,
							timeout: 1000
						});
						if (!await updateRemotePack(packs[i], !0)) break;
					}
					toastSuccess("Updates completed.", {
						nolog: !0
					});
				} catch (ex) {
					toastWarn("Updates cancelled due to unexpected errors.", {
						nolog: !0
					});
				}
			}
		});
	}, updateFrequentlyUsed = () => {
		const lastPackIDs = frequentlyUsedSorted.map(v => v.pack).filter((v, i, a) => a.indexOf(v) === i);
		if (settings.frequentlyUsed) {
			stickersStats = stickersStats.sort((a, b) => b.used - a.used || b.lastUsed - a.lastUsed).slice(0, Math.ceil(1.5 * settings.frequentlyUsed));
			const sliced = stickersStats.slice(0, settings.frequentlyUsed);
			sliced.forEach(sticker => initSimplePackDataEntry(sticker.pack)), $$invalidate(12, frequentlyUsedSorted = sliced);
		} else frequentlyUsedSorted.length && $$invalidate(12, frequentlyUsedSorted = []);
		lastPackIDs.forEach(cleanUpSimplePackDataEntry);
	}, parseFrequentlyUsedInput = () => {
		const count = parseInt(frequentlyUsedInput, 10);
		if (isNaN(count) || count < 0) return toastError("Invalid number.");
		$$invalidate(20, settings.frequentlyUsed = count, settings), log("settings['frequentlyUsed'] = " + settings.frequentlyUsed), 
		saveToLocalStorage("magane.settings", settings), 0 === count ? (stickersStats = [], 
		saveToLocalStorage("magane.stats", stickersStats), toastSuccess("Settings saved, and stickers usage cleared!", {
			nolog: !0
		})) : toastSuccess("Settings saved!", {
			nolog: !0
		}), updateFrequentlyUsed();
	}, onKeydownEvent = event => {
		for (const prop in hotkey) if ("key" === prop || "code" === prop) {
			if (hotkey[prop] !== event[prop].toLocaleLowerCase()) return;
		} else if (hotkey[prop] !== event[prop]) return;
		event.target && event.target.classList.contains("supress-magane-hotkey") || components.length && (event.preventDefault(), 
		toggleStickerWindow());
	}, parseThenInitHotkey = save => {
		const keys = (hotkeyInput || "").split("+").map(key => key.trim());
		if ($$invalidate(18, hotkeyInput = keys.join("+")), hotkeyInput && keys.length) {
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
		save && ($$invalidate(20, settings.hotkey = hotkeyInput, settings), log("settings['hotkey'] = " + settings.hotkey), 
		saveToLocalStorage("magane.settings", settings), toastSuccess(hotkey ? "Hotkey saved." : "Hotkey cleared.", {
			nolog: !0
		}));
	}, replaceDatabase = () => {
		document.getElementById("replaceDatabaseInput").click();
	}, exportDatabase = () => {
		const element = document.createElement("a");
		let hrefUrl = "";
		try {
			toast("Exporting database…");
			const database = {};
			for (const key of allowedStorageKeys) {
				const data = getFromLocalStorage(key);
				void 'undefined' !== data && (database[key] = data);
			}
			const dbString = JSON.stringify(database), blob = new Blob([ dbString ]);
			hrefUrl = window.URL.createObjectURL(blob), element.href = hrefUrl, element.download = `magane.database.${(new Date).toISOString()}.json`, 
			element.click();
		} catch (error) {
			console.error(error), toastError("Unexpected error occurred. Check your console for details.");
		}
		element.remove(), hrefUrl && window.URL.revokeObjectURL(hrefUrl);
	};
	return [ coords, main, isMaganeBD, forceHideMagane, stickerWindowActive, stickerAddModalActive, stickerAddModalTabsInit, activeTab, favoriteStickers, subscribedPacks, subscribedPacksSimple, filteredPacks, frequentlyUsedSorted, simplePacksData, localPacks, linePackSearch, remotePackUrl, frequentlyUsedInput, hotkeyInput, packsSearch, settings, subscribeToPack, unsubscribeToPack, formatUrl, sendSticker, favoriteSticker, unfavoriteSticker, filterPacks, count => `<span class="counts"><span>–</span>${count} sticker${1 === count ? "" : "s"}</span>`, id => {
		let tmp = "" + id;
		return "string" == typeof id && (id.startsWith("startswith-") ? tmp = "LINE " + id.replace("startswith-", "") : id.startsWith("emojis-") ? tmp = "LINE Emojis " + id.replace("emojis-", "") : id.startsWith("custom-") && (tmp = id.replace("custom-", ""))), 
		`<span class="appendix"><span>–</span><span title="ID: ${id}">${tmp}</span></span>`;
	}, toggleStickerModal, activateTab, scrollToStickers, event => {
		const value = event.target.value.trim();
		if (13 !== event.keyCode || !value.length) return;
		let newIndex = Number(value);
		if (isNaN(newIndex) || newIndex < 1 || newIndex > subscribedPacks.length) return toastError(`New position must be ≥ 1 and ≤ ${subscribedPacks.length}.`);
		newIndex--;
		let packId = event.target.dataset.pack;
		if (void 'undefined' === packId) return;
		isLocalPackID(packId) || (packId = Number(packId));
		const oldIndex = subscribedPacks.findIndex(pack => pack.id === packId);
		if (oldIndex === newIndex) return;
		const packData = subscribedPacks.splice(oldIndex, 1);
		subscribedPacksSimple.splice(oldIndex, 1), subscribedPacks.splice(newIndex, 0, packData[0]), 
		subscribedPacksSimple.splice(newIndex, 0, packData[0].id), event.target.blur(), 
		event.target.value = String(oldIndex), $$invalidate(9, subscribedPacks), $$invalidate(10, subscribedPacksSimple), 
		saveToLocalStorage("magane.subscribed", subscribedPacks), toastSuccess(`Moved pack from position ${oldIndex + 1} to ${newIndex + 1}.`);
	}, deleteLocalPack, updateRemotePack, showPackInfo, parseLinePack, parseRemotePackUrl, event => {
		const {files} = event.target;
		if (!files.length) return !1;
		const file = files[0], reader = new FileReader;
		reader.onload = e => {
			let result;
			event.target.value = "";
			try {
				result = JSON.parse(e.target.result);
			} catch (error) {
				console.error(error), toastError("The selected file is not a valid JSON file.");
			}
			assertRemotePackConsent("File:\n\n" + file.name, async () => {
				try {
					const pack = await processRemotePack(result);
					pack.id = "custom-" + pack.id;
					const stored = _appendPack(pack.id, pack);
					toastSuccess(`Added a new pack ${stored.pack.name}.`, {
						nolog: !0,
						timeout: 6000
					});
				} catch (error) {
					console.error(error), toastError(error.toString(), {
						nolog: !0
					});
				}
			});
		}, log(`Reading ${file.name}…`), reader.readAsText(file);
	}, loadLocalRemotePack, bulkUpdateRemotePacks, event => {
		const {name} = event.target;
		if (!name) return !1;
		log(`settings['${name}'] = ${settings[name]}`), setWindowMaganeAPIs(settings.enableWindowMagane), 
		saveToLocalStorage("magane.settings", settings), toastSuccess("Settings saved!", {
			nolog: !0
		});
	}, parseFrequentlyUsedInput, parseThenInitHotkey, event => {
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
			for (const key of allowedStorageKeys) if (void 'undefined' === result[key] || null === result[key]) invalid.push(key); else {
				let len = null;
				if (Array.isArray(result[key])) len = result[key].length; else try {
					len = Object.keys(result[key]).length;
				} catch (ex) {}
				let append = "";
				null !== len && (append = ` has **${len}** item${1 === len ? "" : "s"}`), content += `\n**${key}**${append}`, 
				valid.push(key);
			}
			valid.length || (content = "**This is an empty database file.**"), invalid.length && (content += `\nThese missing or invalid field${1 === invalid.length ? "" : "s"} **will be removed**:`, 
			content += "\n" + invalid.join("\n")), content += "\n**Please continue only if you trust this database file.**", 
			BdApi.showConfirmationModal("Replace Database", content.replace(/\n/g, "\n\n"), {
				confirmText: "Replace",
				cancelText: "Cancel",
				danger: !0,
				onConfirm: async () => {
					for (const key of valid) saveToLocalStorage(key, result[key]);
					for (const key of invalid) storage.removeItem(key);
					$$invalidate(3, forceHideMagane = !0), toast("Reloading Magane database…"), Object.assign(settings, defaultSettings), 
					loadSettings(!0), await grabPacks(!0), await migrateStringPackIds(), toastSuccess("Magane is now ready!"), 
					$$invalidate(3, forceHideMagane = !1);
				}
			});
		}, log(`Reading ${files[0].name}…`), reader.readAsText(files[0]);
	}, replaceDatabase, exportDatabase, (pack, sticker, f) => f.pack === pack.id && f.id === sticker, (sticker, f) => f.pack === sticker.pack && f.id === sticker.id, sticker => sendSticker(sticker.pack, sticker.id), sticker => unfavoriteSticker(sticker.pack, sticker.id), sticker => sendSticker(sticker.pack, sticker.id), sticker => favoriteSticker(sticker.pack, sticker.id), sticker => unfavoriteSticker(sticker.pack, sticker.id), (pack, sticker) => sendSticker(pack.id, sticker), (pack, sticker) => favoriteSticker(pack.id, sticker), (pack, sticker) => unfavoriteSticker(pack.id, sticker), () => toggleStickerModal(), () => scrollToStickers("#pfavorites"), () => scrollToStickers("#pfrequentlyused"), pack => scrollToStickers("#p" + pack.id), () => toggleStickerModal(), () => activateTab(0), () => activateTab(1), () => activateTab(2), () => activateTab(3), pack => unsubscribeToPack(pack), pack => showPackInfo(pack.id), pack => updateRemotePack(pack.id), function input0_input_handler() {
		packsSearch = this.value, $$invalidate(19, packsSearch);
	}, pack => unsubscribeToPack(pack), pack => subscribeToPack(pack), pack => showPackInfo(pack.id), pack => updateRemotePack(pack.id), pack => deleteLocalPack(pack.id), function input1_input_handler() {
		linePackSearch = this.value, $$invalidate(15, linePackSearch);
	}, () => parseLinePack(), function input2_input_handler() {
		remotePackUrl = this.value, $$invalidate(16, remotePackUrl);
	}, () => parseRemotePackUrl(), () => loadLocalRemotePack(), () => bulkUpdateRemotePacks(), function input4_change_handler() {
		settings.enableWindowMagane = this.checked, $$invalidate(20, settings);
	}, function input5_change_handler() {
		settings.disableToasts = this.checked, $$invalidate(20, settings);
	}, function input6_change_handler() {
		settings.closeWindowOnSend = this.checked, $$invalidate(20, settings);
	}, function input7_change_handler() {
		settings.useLeftToolbar = this.checked, $$invalidate(20, settings);
	}, function input8_change_handler() {
		settings.hidePackAppendix = this.checked, $$invalidate(20, settings);
	}, function input9_change_handler() {
		settings.disableDownscale = this.checked, $$invalidate(20, settings);
	}, function input10_change_handler() {
		settings.disableImportedObfuscation = this.checked, $$invalidate(20, settings);
	}, function input11_change_handler() {
		settings.alwaysSendAsLink = this.checked, $$invalidate(20, settings);
	}, function input12_change_handler() {
		settings.ignoreEmbedLinksPermission = this.checked, $$invalidate(20, settings);
	}, function input13_change_handler() {
		settings.markAsSpoiler = this.checked, $$invalidate(20, settings);
	}, function input14_change_handler() {
		settings.ignoreViewportSize = this.checked, $$invalidate(20, settings);
	}, function input15_change_handler() {
		settings.disableSendingWithChatInput = this.checked, $$invalidate(20, settings);
	}, function input16_input_handler() {
		frequentlyUsedInput = this.value, $$invalidate(17, frequentlyUsedInput);
	}, () => parseFrequentlyUsedInput(), function input17_input_handler() {
		hotkeyInput = this.value, $$invalidate(18, hotkeyInput);
	}, () => parseThenInitHotkey(!0), () => replaceDatabase(), () => exportDatabase(), function main_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			main = $$value, $$invalidate(1, main);
		});
	} ];
}

var App$2 = function getCjsExportFromNamespace(n) {
	return n && n.default || n;
}(Object.freeze({
	__proto__: null,
	default: class App extends SvelteComponent {
		constructor(options) {
			super(), init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, null, [ -1, -1, -1, -1, -1, -1 ]);
		}
	}
}));

module.exports = class MaganeBD {
	log(message, type = "log") {
		return console[type]("%c[MaganeBD]%c", "color: #3a71c1; font-weight: 700", "", message);
	}
	load() {}
	start() {
		for (const id of Object.keys(commonjsGlobal.MAGANE_STYLES)) BdApi.injectCSS(`${this.constructor.name}-${id}`, commonjsGlobal.MAGANE_STYLES[id]);
		this.log("Mounting container into DOM…"), this.container = document.createElement("div"), 
		this.container.id = "maganeContainer", document.body.appendChild(this.container), 
		this.app = new App$2({
			target: this.container
		});
	}
	stop() {
		this.app && (this.log("Destroying Svelte component…"), this.app.$destroy()), this.container && (this.log("Removing container from DOM…"), 
		this.container.remove());
		for (const id of Object.keys(commonjsGlobal.MAGANE_STYLES)) BdApi.clearCSS(`${this.constructor.name}-${id}`);
	}
};
