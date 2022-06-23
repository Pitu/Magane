/**
 * @name MaganeBD
 * @displayName MaganeBD
 * @description Bringing LINE stickers to Discord in a chaotic way. BetterDiscord-plugin edition.
 * @author Kana, Bobby
 * @authorId 176200089226706944
 * @authorLink https://github.com/Pitu
 * @license MIT - https://opensource.org/licenses/MIT
 * @version 3.2.0
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
	return child_ctx[116] = list[i], child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[116] = list[i], child_ctx[120] = i, child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[116] = list[i], child_ctx[120] = i, child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[116] = list[i], child_ctx[120] = i, child_ctx;
}

function get_each_context_4(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[123] = list[i], child_ctx[120] = i, child_ctx;
}

function get_each_context_5(ctx, list, i) {
	const child_ctx = ctx.slice();
	return child_ctx[123] = list[i], child_ctx[120] = i, child_ctx;
}

function create_if_block_10(ctx) {
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

function create_if_block_9(ctx) {
	let div, span, t0, html_tag, t1, raw_value = ctx[25](ctx[7].length) + "", each_value_5 = ctx[7], each_blocks = [];
	for (let i = 0; i < each_value_5.length; i += 1) each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
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
			if (128 & dirty[0] && raw_value !== (raw_value = ctx[25](ctx[7].length) + "") && html_tag.p(raw_value), 
			11534720 & dirty[0]) {
				let i;
				for (each_value_5 = ctx[7], i = 0; i < each_value_5.length; i += 1) {
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

function create_each_block_5(ctx) {
	let div1, img, img_src_value, img_alt_value, img_title_value, t0, div0, t1, mounted, dispose;
	function click_handler_1() {
		return ctx[46](ctx[123]);
	}
	function click_handler_2() {
		return ctx[47](ctx[123]);
	}
	return {
		c() {
			div1 = element("div"), img = element("img"), t0 = space(), div0 = element("div"), 
			div0.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></svg>', 
			t1 = space(), attr(img, "class", "image"), src_url_equal(img.src, img_src_value = "" + ctx[20](ctx[123].pack, ctx[123].id)) || attr(img, "src", img_src_value), 
			attr(img, "alt", img_alt_value = ctx[123].pack + " - " + ctx[123].id), attr(img, "title", img_title_value = (ctx[8][ctx[123].pack] ? ctx[8][ctx[123].pack].name : "N/A") + ("string" == typeof ctx[123].pack && ctx[123].pack.startsWith("custom-") ? " – " + ctx[123].id : "")), 
			attr(div0, "class", "deleteFavorite"), attr(div0, "title", "Unfavorite"), attr(div1, "class", "sticker");
		},
		m(target, anchor) {
			insert(target, div1, anchor), append(div1, img), append(div1, t0), append(div1, div0), 
			append(div1, t1), mounted || (dispose = [ listen(img, "click", click_handler_1), listen(div0, "click", click_handler_2) ], 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 128 & dirty[0] && !src_url_equal(img.src, img_src_value = "" + ctx[20](ctx[123].pack, ctx[123].id)) && attr(img, "src", img_src_value), 
			128 & dirty[0] && img_alt_value !== (img_alt_value = ctx[123].pack + " - " + ctx[123].id) && attr(img, "alt", img_alt_value), 
			384 & dirty[0] && img_title_value !== (img_title_value = (ctx[8][ctx[123].pack] ? ctx[8][ctx[123].pack].name : "N/A") + ("string" == typeof ctx[123].pack && ctx[123].pack.startsWith("custom-") ? " – " + ctx[123].id : "")) && attr(img, "title", img_title_value);
		},
		d(detaching) {
			detaching && detach(div1), mounted = !1, run_all(dispose);
		}
	};
}

function create_else_block_1(ctx) {
	let div, mounted, dispose;
	function click_handler_5() {
		return ctx[50](ctx[116], ctx[123]);
	}
	return {
		c() {
			div = element("div"), div.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></svg>', 
			attr(div, "class", "deleteFavorite"), attr(div, "title", "Unfavorite");
		},
		m(target, anchor) {
			insert(target, div, anchor), mounted || (dispose = listen(div, "click", click_handler_5), 
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

function create_if_block_8(ctx) {
	let div, mounted, dispose;
	function click_handler_4() {
		return ctx[49](ctx[116], ctx[123]);
	}
	return {
		c() {
			div = element("div"), div.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="grey" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></svg>', 
			attr(div, "class", "addFavorite"), attr(div, "title", "Favorite");
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

function create_each_block_4(ctx) {
	let div, img, img_src_value, img_alt_value, img_title_value, t, show_if, mounted, dispose;
	function func(...args) {
		return ctx[43](ctx[116], ctx[123], ...args);
	}
	function click_handler_3() {
		return ctx[48](ctx[116], ctx[123]);
	}
	function select_block_type(ctx, dirty) {
		return 640 & dirty[0] && (show_if = null), null == show_if && (show_if = !(-1 !== ctx[7].findIndex(func))), 
		show_if ? create_if_block_8 : create_else_block_1;
	}
	let current_block_type = select_block_type(ctx, [ -1, -1, -1, -1, -1 ]), if_block = current_block_type(ctx);
	return {
		c() {
			div = element("div"), img = element("img"), t = space(), if_block.c(), attr(img, "class", "image"), 
			src_url_equal(img.src, img_src_value = "" + ctx[20](ctx[116].id, ctx[123], !1, ctx[120])) || attr(img, "src", img_src_value), 
			attr(img, "alt", img_alt_value = ctx[116].id + " - " + ctx[123]), attr(img, "title", img_title_value = "string" == typeof ctx[116].id && ctx[116].id.startsWith("custom-") ? ctx[123] : ""), 
			attr(div, "class", "sticker");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, img), append(div, t), if_block.m(div, null), 
			mounted || (dispose = listen(img, "click", click_handler_3), mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 512 & dirty[0] && !src_url_equal(img.src, img_src_value = "" + ctx[20](ctx[116].id, ctx[123], !1, ctx[120])) && attr(img, "src", img_src_value), 
			512 & dirty[0] && img_alt_value !== (img_alt_value = ctx[116].id + " - " + ctx[123]) && attr(img, "alt", img_alt_value), 
			512 & dirty[0] && img_title_value !== (img_title_value = "string" == typeof ctx[116].id && ctx[116].id.startsWith("custom-") ? ctx[123] : "") && attr(img, "title", img_title_value), 
			current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block ? if_block.p(ctx, dirty) : (if_block.d(1), 
			if_block = current_block_type(ctx), if_block && (if_block.c(), if_block.m(div, null)));
		},
		d(detaching) {
			detaching && detach(div), if_block.d(), mounted = !1, dispose();
		}
	};
}

function create_each_block_3(ctx) {
	let div, span, t0, html_tag, span_id_value, t1, t2, t0_value = ctx[116].name + "", raw_value = ctx[25](ctx[116].files.length) + "", each_value_4 = ctx[116].files, each_blocks = [];
	for (let i = 0; i < each_value_4.length; i += 1) each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
	return {
		c() {
			div = element("div"), span = element("span"), t0 = text(t0_value), html_tag = new HtmlTag(!1), 
			t1 = space();
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
			t2 = space(), html_tag.a = null, attr(span, "id", span_id_value = "p" + ctx[116].id), 
			attr(div, "class", "pack");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, span), append(span, t0), html_tag.m(raw_value, span), 
			append(div, t1);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div, null);
			append(div, t2);
		},
		p(ctx, dirty) {
			if (512 & dirty[0] && t0_value !== (t0_value = ctx[116].name + "") && set_data(t0, t0_value), 
			512 & dirty[0] && raw_value !== (raw_value = ctx[25](ctx[116].files.length) + "") && html_tag.p(raw_value), 
			512 & dirty[0] && span_id_value !== (span_id_value = "p" + ctx[116].id) && attr(span, "id", span_id_value), 
			15729280 & dirty[0]) {
				let i;
				for (each_value_4 = ctx[116].files, i = 0; i < each_value_4.length; i += 1) {
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

function create_each_block_2(ctx) {
	let div, div_title_value, mounted, dispose;
	function click_handler_8() {
		return ctx[53](ctx[116]);
	}
	return {
		c() {
			div = element("div"), attr(div, "class", "pack"), attr(div, "title", div_title_value = ctx[116].name), 
			set_style(div, "background-image", `url(${ctx[20](ctx[116].id, ctx[116].files[0], !1, 0)})`);
		},
		m(target, anchor) {
			insert(target, div, anchor), mounted || (dispose = listen(div, "click", click_handler_8), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx, 512 & dirty[0] && div_title_value !== (div_title_value = ctx[116].name) && attr(div, "title", div_title_value), 
			512 & dirty[0] && set_style(div, "background-image", `url(${ctx[20](ctx[116].id, ctx[116].files[0], !1, 0)})`);
		},
		d(detaching) {
			detaching && detach(div), mounted = !1, dispose();
		}
	};
}

function create_if_block_4(ctx) {
	let div, div_style_value, each_blocks = [], each_1_lookup = new Map, each_value_1 = ctx[9];
	const get_key = ctx => ctx[116].id;
	for (let i = 0; i < each_value_1.length; i += 1) {
		let child_ctx = get_each_context_1(ctx, each_value_1, i), key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
	}
	return {
		c() {
			div = element("div");
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
			attr(div, "class", "tab-content has-scroll-y"), attr(div, "style", div_style_value = 0 === ctx[6] ? "" : "display: none;");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div, null);
		},
		p(ctx, dirty) {
			68751872 & dirty[0] | 5 & dirty[1] && (each_value_1 = ctx[9], each_blocks = function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
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
			64 & dirty[0] && div_style_value !== (div_style_value = 0 === ctx[6] ? "" : "display: none;") && attr(div, "style", div_style_value);
		},
		d(detaching) {
			detaching && detach(div);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].d();
		}
	};
}

function create_if_block_6(ctx) {
	let div, input, input_data_pack_value, input_value_value, mounted, dispose;
	return {
		c() {
			div = element("div"), input = element("input"), attr(input, "class", "inputPackIndex"), 
			attr(input, "type", "text"), attr(input, "data-pack", input_data_pack_value = ctx[116].id), 
			input.value = input_value_value = ctx[120] + 1, attr(div, "class", "index");
		},
		m(target, anchor) {
			insert(target, div, anchor), append(div, input), mounted || (dispose = [ listen(input, "click", click_handler_14), listen(input, "keypress", ctx[31]) ], 
			mounted = !0);
		},
		p(ctx, dirty) {
			512 & dirty[0] && input_data_pack_value !== (input_data_pack_value = ctx[116].id) && attr(input, "data-pack", input_data_pack_value), 
			512 & dirty[0] && input_value_value !== (input_value_value = ctx[120] + 1) && input.value !== input_value_value && (input.value = input_value_value);
		},
		d(detaching) {
			detaching && detach(div), mounted = !1, run_all(dispose);
		}
	};
}

function create_if_block_5(ctx) {
	let button, mounted, dispose;
	function click_handler_16() {
		return ctx[60](ctx[116]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "Up", attr(button, "class", "button update-pack"), 
			attr(button, "title", "Update");
		},
		m(target, anchor) {
			insert(target, button, anchor), mounted || (dispose = listen(button, "click", click_handler_16), 
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
	let div3, t0, div0, t1, div1, span0, t2, span0_title_value, t3, span1, t4, t5, html_tag, t6, div2, button, t8, div2_class_value, t9, mounted, dispose, t2_value = ctx[116].name + "", t4_value = ctx[116].count + "", raw_value = (ctx[16].hidePackAppendix ? "" : ctx[26](ctx[116].id)) + "", if_block0 = ctx[9].length > 1 && create_if_block_6(ctx);
	function click_handler_15() {
		return ctx[59](ctx[116]);
	}
	let if_block1 = ctx[12][ctx[116].id] && ctx[12][ctx[116].id].updateUrl && create_if_block_5(ctx);
	return {
		key: key_1,
		first: null,
		c() {
			div3 = element("div"), if_block0 && if_block0.c(), t0 = space(), div0 = element("div"), 
			t1 = space(), div1 = element("div"), span0 = element("span"), t2 = text(t2_value), 
			t3 = space(), span1 = element("span"), t4 = text(t4_value), t5 = text(" stickers"), 
			html_tag = new HtmlTag(!1), t6 = space(), div2 = element("div"), button = element("button"), 
			button.textContent = "Del", t8 = space(), if_block1 && if_block1.c(), t9 = space(), 
			attr(div0, "class", "preview"), set_style(div0, "background-image", `url(${ctx[20](ctx[116].id, ctx[116].files[0], !1, 0)})`), 
			attr(span0, "title", span0_title_value = ctx[16].hidePackAppendix ? "ID: " + ctx[116].id : ""), 
			html_tag.a = null, attr(div1, "class", "info"), attr(button, "class", "button is-danger"), 
			attr(button, "title", "Unsubscribe"), attr(div2, "class", div2_class_value = "action" + (ctx[12][ctx[116].id] && ctx[12][ctx[116].id].updateUrl ? " is-tight" : "")), 
			attr(div3, "class", "pack"), this.first = div3;
		},
		m(target, anchor) {
			insert(target, div3, anchor), if_block0 && if_block0.m(div3, null), append(div3, t0), 
			append(div3, div0), append(div3, t1), append(div3, div1), append(div1, span0), append(span0, t2), 
			append(div1, t3), append(div1, span1), append(span1, t4), append(span1, t5), html_tag.m(raw_value, span1), 
			append(div3, t6), append(div3, div2), append(div2, button), append(div2, t8), if_block1 && if_block1.m(div2, null), 
			append(div3, t9), mounted || (dispose = listen(button, "click", click_handler_15), 
			mounted = !0);
		},
		p(new_ctx, dirty) {
			(ctx = new_ctx)[9].length > 1 ? if_block0 ? if_block0.p(ctx, dirty) : (if_block0 = create_if_block_6(ctx), 
			if_block0.c(), if_block0.m(div3, t0)) : if_block0 && (if_block0.d(1), if_block0 = null), 
			512 & dirty[0] && set_style(div0, "background-image", `url(${ctx[20](ctx[116].id, ctx[116].files[0], !1, 0)})`), 
			512 & dirty[0] && t2_value !== (t2_value = ctx[116].name + "") && set_data(t2, t2_value), 
			66048 & dirty[0] && span0_title_value !== (span0_title_value = ctx[16].hidePackAppendix ? "ID: " + ctx[116].id : "") && attr(span0, "title", span0_title_value), 
			512 & dirty[0] && t4_value !== (t4_value = ctx[116].count + "") && set_data(t4, t4_value), 
			66048 & dirty[0] && raw_value !== (raw_value = (ctx[16].hidePackAppendix ? "" : ctx[26](ctx[116].id)) + "") && html_tag.p(raw_value), 
			ctx[12][ctx[116].id] && ctx[12][ctx[116].id].updateUrl ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_5(ctx), 
			if_block1.c(), if_block1.m(div2, null)) : if_block1 && (if_block1.d(1), if_block1 = null), 
			4608 & dirty[0] && div2_class_value !== (div2_class_value = "action" + (ctx[12][ctx[116].id] && ctx[12][ctx[116].id].updateUrl ? " is-tight" : "")) && attr(div2, "class", div2_class_value);
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
			if (69016576 & dirty[0] | 6 & dirty[1]) {
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
	function click_handler_18() {
		return ctx[63](ctx[116]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "Add", attr(button, "class", "button is-primary"), 
			attr(button, "title", "Subscribe");
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

function create_if_block_3(ctx) {
	let button, mounted, dispose;
	function click_handler_17() {
		return ctx[62](ctx[116]);
	}
	return {
		c() {
			button = element("button"), button.textContent = "Del", attr(button, "class", "button is-danger"), 
			attr(button, "title", "Unsubscribe");
		},
		m(target, anchor) {
			insert(target, button, anchor), mounted || (dispose = listen(button, "click", click_handler_17), 
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
	let t, button, mounted, dispose, if_block = ctx[12][ctx[116].id].updateUrl && create_if_block_2(ctx);
	function click_handler_20() {
		return ctx[65](ctx[116]);
	}
	return {
		c() {
			if_block && if_block.c(), t = space(), button = element("button"), attr(button, "class", "button delete-pack"), 
			attr(button, "title", "Purge");
		},
		m(target, anchor) {
			if_block && if_block.m(target, anchor), insert(target, t, anchor), insert(target, button, anchor), 
			mounted || (dispose = listen(button, "click", click_handler_20), mounted = !0);
		},
		p(new_ctx, dirty) {
			(ctx = new_ctx)[12][ctx[116].id].updateUrl ? if_block ? if_block.p(ctx, dirty) : (if_block = create_if_block_2(ctx), 
			if_block.c(), if_block.m(t.parentNode, t)) : if_block && (if_block.d(1), if_block = null);
		},
		d(detaching) {
			if_block && if_block.d(detaching), detaching && detach(t), detaching && detach(button), 
			mounted = !1, dispose();
		}
	};
}

function create_if_block_2(ctx) {
	let button, mounted, dispose;
	function click_handler_19() {
		return ctx[64](ctx[116]);
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

function create_each_block(ctx) {
	let div3, div0, t0, div1, span0, t1, span0_title_value, t2, span1, t3, t4, html_tag, t5, div2, show_if, t6, div2_class_value, t7, t1_value = ctx[116].name + "", t3_value = ctx[116].count + "", raw_value = (ctx[16].hidePackAppendix ? "" : ctx[26](ctx[116].id)) + "";
	function select_block_type_1(ctx, dirty) {
		return 3072 & dirty[0] && (show_if = null), null == show_if && (show_if = !!ctx[10].includes(ctx[116].id)), 
		show_if ? create_if_block_3 : create_else_block;
	}
	let current_block_type = select_block_type_1(ctx, [ -1, -1, -1, -1, -1 ]), if_block0 = current_block_type(ctx), if_block1 = ctx[12][ctx[116].id] && create_if_block_1(ctx);
	return {
		c() {
			div3 = element("div"), div0 = element("div"), t0 = space(), div1 = element("div"), 
			span0 = element("span"), t1 = text(t1_value), t2 = space(), span1 = element("span"), 
			t3 = text(t3_value), t4 = text(" stickers"), html_tag = new HtmlTag(!1), t5 = space(), 
			div2 = element("div"), if_block0.c(), t6 = space(), if_block1 && if_block1.c(), 
			t7 = space(), attr(div0, "class", "preview"), set_style(div0, "background-image", `url(${ctx[20](ctx[116].id, ctx[116].files[0], !1, 0)})`), 
			attr(span0, "title", span0_title_value = ctx[16].hidePackAppendix ? "ID: " + ctx[116].id : ""), 
			html_tag.a = null, attr(div1, "class", "info"), attr(div2, "class", div2_class_value = "action" + (ctx[12][ctx[116].id] ? " is-tight" : "")), 
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
			2048 & dirty[0] && set_style(div0, "background-image", `url(${ctx[20](ctx[116].id, ctx[116].files[0], !1, 0)})`), 
			2048 & dirty[0] && t1_value !== (t1_value = ctx[116].name + "") && set_data(t1, t1_value), 
			67584 & dirty[0] && span0_title_value !== (span0_title_value = ctx[16].hidePackAppendix ? "ID: " + ctx[116].id : "") && attr(span0, "title", span0_title_value), 
			2048 & dirty[0] && t3_value !== (t3_value = ctx[116].count + "") && set_data(t3, t3_value), 
			67584 & dirty[0] && raw_value !== (raw_value = (ctx[16].hidePackAppendix ? "" : ctx[26](ctx[116].id)) + "") && html_tag.p(raw_value), 
			current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block0 ? if_block0.p(ctx, dirty) : (if_block0.d(1), 
			if_block0 = current_block_type(ctx), if_block0 && (if_block0.c(), if_block0.m(div2, t6))), 
			ctx[12][ctx[116].id] ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_1(ctx), 
			if_block1.c(), if_block1.m(div2, null)) : if_block1 && (if_block1.d(1), if_block1 = null), 
			6144 & dirty[0] && div2_class_value !== (div2_class_value = "action" + (ctx[12][ctx[116].id] ? " is-tight" : "")) && attr(div2, "class", div2_class_value);
		},
		d(detaching) {
			detaching && detach(div3), if_block0.d(), if_block1 && if_block1.d();
		}
	};
}

function create_fragment(ctx) {
	let main_1, div26, div0, t0, div25, div1, t1, t2, div1_class_value, t3, div8, div5, div4, div3, t4, t5, div7, div6, div8_class_value, t6, div24, div9, t7, div23, div22, div14, div10, t9, div11, t11, div12, t13, div13, t15, t16, div15, input0, t17, div15_style_value, t18, div18, div16, p0, t20, p1, t24, p2, t26, p3, input1, t27, button0, t29, div17, p4, t31, p5, t36, p6, t39, p7, input2, t40, button1, t42, p8, input3, t43, button2, t45, p9, button3, div18_style_value, t47, div21, div19, p10, t49, p11, label0, input4, t50, t51, p12, label1, input5, t52, t53, p13, label2, input6, t54, t55, p14, label3, input7, t56, t57, p15, label4, input8, t58, t59, p16, label5, input9, t60, t61, p17, label6, input10, t62, t63, div20, p18, t65, p19, input11, t66, button4, t68, p20, button5, div21_style_value, div24_style_value, div25_style_value, mounted, dispose, if_block0 = !ctx[7] && !ctx[9] && create_if_block_10(), if_block1 = ctx[7] && ctx[7].length && create_if_block_9(ctx), each_value_3 = ctx[9], each_blocks_1 = [];
	for (let i = 0; i < each_value_3.length; i += 1) each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	let if_block2 = ctx[22] && ctx[22].length && function create_if_block_7(ctx) {
		let div1, mounted, dispose;
		return {
			c() {
				div1 = element("div"), div1.innerHTML = '<div class="icon-favorite"></div>', attr(div1, "class", "pack"), 
				attr(div1, "title", "Favorites");
			},
			m(target, anchor) {
				insert(target, div1, anchor), mounted || (dispose = listen(div1, "click", ctx[52]), 
				mounted = !0);
			},
			p: noop,
			d(detaching) {
				detaching && detach(div1), mounted = !1, dispose();
			}
		};
	}(ctx), each_value_2 = ctx[9], each_blocks = [];
	for (let i = 0; i < each_value_2.length; i += 1) each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	let if_block3 = ctx[5][0] && create_if_block_4(ctx), if_block4 = ctx[5][1] && create_if_block(ctx);
	return {
		c() {
			main_1 = element("main"), div26 = element("div"), div0 = element("div"), div0.innerHTML = '<img class="channel-textarea-stickers-content" src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20width%3D%2224%22%20height%3D%2224%22%20preserveAspectRatio%3D%22xMidYMid%20meet%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M18.5%2011c-4.136%200-7.5%203.364-7.5%207.5c0%20.871.157%201.704.432%202.482l9.551-9.551A7.462%207.462%200%200%200%2018.5%2011z%22%20fill%3D%22%23b9bbbe%22%2F%3E%3Cpath%20d%3D%22M12%202C6.486%202%202%206.486%202%2012c0%204.583%203.158%208.585%207.563%209.69A9.431%209.431%200%200%201%209%2018.5C9%2013.262%2013.262%209%2018.5%209c1.12%200%202.191.205%203.19.563C20.585%205.158%2016.583%202%2012%202z%22%20fill%3D%22%23b9bbbe%22%2F%3E%3C%2Fsvg%3E" alt="Magane menu button"/>', 
			t0 = space(), div25 = element("div"), div1 = element("div"), if_block0 && if_block0.c(), 
			t1 = space(), if_block1 && if_block1.c(), t2 = space();
			for (let i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].c();
			t3 = space(), div8 = element("div"), div5 = element("div"), div4 = element("div"), 
			div3 = element("div"), div3.innerHTML = '<div class="icon-plus"></div>', t4 = space(), 
			if_block2 && if_block2.c(), t5 = space(), div7 = element("div"), div6 = element("div");
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].c();
			t6 = space(), div24 = element("div"), div9 = element("div"), t7 = space(), div23 = element("div"), 
			div22 = element("div"), div14 = element("div"), div10 = element("div"), div10.textContent = "Installed", 
			t9 = space(), div11 = element("div"), div11.textContent = "Packs", t11 = space(), 
			div12 = element("div"), div12.textContent = "Import", t13 = space(), div13 = element("div"), 
			div13.textContent = "Misc", t15 = space(), if_block3 && if_block3.c(), t16 = space(), 
			div15 = element("div"), input0 = element("input"), t17 = space(), if_block4 && if_block4.c(), 
			t18 = space(), div18 = element("div"), div16 = element("div"), p0 = element("p"), 
			p0.textContent = "LINE Store Proxy", t20 = space(), p1 = element("p"), p1.innerHTML = 'If you are looking for a sticker pack that is not provided by Magane, you can go to the <a href="https://store.line.me/" target="_blank">LINE Store</a> and pick whatever pack you want and paste the full URL in the box below.', 
			t24 = space(), p2 = element("p"), p2.textContent = "e.g. https://store.line.me/stickershop/product/17573/ja", 
			t26 = space(), p3 = element("p"), input1 = element("input"), t27 = space(), button0 = element("button"), 
			button0.textContent = "Add", t29 = space(), div17 = element("div"), p4 = element("p"), 
			p4.textContent = "Remote Packs", t31 = space(), p5 = element("p"), p5.innerHTML = 'You can paste URL to a JSON config file of a remote pack in here.<br/>\n\t\t\t\t\t\t\t\t\tThis also supports public album links of any file hosting websites running <a href="https://github.com/WeebDev/chibisafe" target="_blank">Chibisafe</a>.', 
			t36 = space(), p6 = element("p"), p6.innerHTML = "e.g. https://example.com/packs/my_custom_pack.json<br/>\n\t\t\t\t\t\t\t\t\thttps://chibisafe.moe/a/my_album", 
			t39 = space(), p7 = element("p"), input2 = element("input"), t40 = space(), button1 = element("button"), 
			button1.textContent = "Add", t42 = space(), p8 = element("p"), input3 = element("input"), 
			t43 = space(), button2 = element("button"), button2.textContent = "Load local JSON", 
			t45 = space(), p9 = element("p"), button3 = element("button"), button3.textContent = "Update all remote packs", 
			t47 = space(), div21 = element("div"), div19 = element("div"), p10 = element("p"), 
			p10.textContent = "Settings", t49 = space(), p11 = element("p"), label0 = element("label"), 
			input4 = element("input"), t50 = text("\n\t\t\t\t\t\t\t\t\t\tDisable Toasts"), t51 = space(), 
			p12 = element("p"), label1 = element("label"), input5 = element("input"), t52 = text("\n\t\t\t\t\t\t\t\t\t\tClose window when sending a sticker"), 
			t53 = space(), p13 = element("p"), label2 = element("label"), input6 = element("input"), 
			t54 = text("\n\t\t\t\t\t\t\t\t\t\tUse left toolbar instead of bottom toolbar on main window"), 
			t55 = space(), p14 = element("p"), label3 = element("label"), input7 = element("input"), 
			t56 = text("\n\t\t\t\t\t\t\t\t\t\tHide pack's appendix in packs list (e.g. its numerical ID)"), 
			t57 = space(), p15 = element("p"), label4 = element("label"), input8 = element("input"), 
			t58 = text("\n\t\t\t\t\t\t\t\t\t\tDisable downscaling of manually imported LINE Store packs"), 
			t59 = space(), p16 = element("p"), label5 = element("label"), input9 = element("input"), 
			t60 = text("\n\t\t\t\t\t\t\t\t\t\tDisable obfuscation of files names for imported custom packs"), 
			t61 = space(), p17 = element("p"), label6 = element("label"), input10 = element("input"), 
			t62 = text("\n\t\t\t\t\t\t\t\t\t\tMark stickers as spoilers when sending"), t63 = space(), 
			div20 = element("div"), p18 = element("p"), p18.textContent = "Database", t65 = space(), 
			p19 = element("p"), input11 = element("input"), t66 = space(), button4 = element("button"), 
			button4.textContent = "Replace Database", t68 = space(), p20 = element("p"), button5 = element("button"), 
			button5.textContent = "Export Database", attr(div0, "class", "magane-button channel-textarea-emoji channel-textarea-stickers"), 
			toggle_class(div0, "active", ctx[3]), attr(div1, "class", div1_class_value = "stickers has-scroll-y " + (ctx[16].useLeftToolbar ? "has-left-toolbar" : "")), 
			attr(div1, "style", ""), attr(div3, "class", "pack"), attr(div3, "title", "Manage subscribed packs"), 
			attr(div4, "class", "packs-wrapper"), attr(div5, "class", "packs packs-controls"), 
			attr(div6, "class", "packs-wrapper"), attr(div7, "class", "packs"), attr(div7, "style", ""), 
			attr(div8, "class", div8_class_value = "packs-toolbar " + (ctx[16].useLeftToolbar ? "has-scroll-y" : "has-scroll-x")), 
			attr(div9, "class", "modal-close"), attr(div10, "class", "tab"), toggle_class(div10, "is-active", 0 === ctx[6]), 
			attr(div11, "class", "tab"), toggle_class(div11, "is-active", 1 === ctx[6]), attr(div12, "class", "tab"), 
			toggle_class(div12, "is-active", 2 === ctx[6]), attr(div13, "class", "tab"), toggle_class(div13, "is-active", 3 === ctx[6]), 
			attr(div14, "class", "tabs"), attr(input0, "class", "inputQuery"), attr(input0, "type", "text"), 
			attr(input0, "placeholder", "Search"), attr(div15, "class", "tab-content avail-packs"), 
			attr(div15, "style", div15_style_value = 1 === ctx[6] ? "" : "display: none;"), 
			attr(p0, "class", "section-title"), attr(input1, "class", "inputQuery"), attr(input1, "type", "text"), 
			attr(input1, "placeholder", "LINE Sticker Pack URL"), attr(button0, "class", "button is-primary"), 
			attr(p3, "class", "input-grouped"), attr(div16, "class", "section line-proxy"), 
			attr(p4, "class", "section-title"), attr(input2, "class", "inputQuery"), attr(input2, "type", "text"), 
			attr(input2, "placeholder", "Remote Pack JSON or Chibisafe Album URL"), attr(button1, "class", "button is-primary"), 
			attr(p7, "class", "input-grouped"), attr(input3, "id", "localRemotePackInput"), 
			attr(input3, "type", "file"), set_style(input3, "display", "none"), attr(input3, "accept", "application/JSON"), 
			attr(button2, "class", "button has-width-full"), attr(button3, "class", "button is-primary has-width-full"), 
			attr(div17, "class", "section remote-packs"), attr(div18, "class", "tab-content has-scroll-y import"), 
			attr(div18, "style", div18_style_value = 2 === ctx[6] ? "" : "display: none;"), 
			attr(p10, "class", "section-title"), attr(input4, "name", "disableToasts"), attr(input4, "type", "checkbox"), 
			attr(input5, "name", "closeWindowOnSend"), attr(input5, "type", "checkbox"), attr(input6, "name", "useLeftToolbar"), 
			attr(input6, "type", "checkbox"), attr(input7, "name", "hidePackAppendix"), attr(input7, "type", "checkbox"), 
			attr(input8, "name", "disableDownscale"), attr(input8, "type", "checkbox"), attr(input9, "name", "disableImportedObfuscation"), 
			attr(input9, "type", "checkbox"), attr(input10, "name", "markAsSpoiler"), attr(input10, "type", "checkbox"), 
			attr(div19, "class", "section settings"), attr(p18, "class", "section-title"), attr(input11, "id", "replaceDatabaseInput"), 
			attr(input11, "type", "file"), set_style(input11, "display", "none"), attr(input11, "accept", "application/JSON"), 
			attr(button4, "class", "button is-danger has-width-full"), attr(button5, "class", "button is-primary has-width-full"), 
			attr(div20, "class", "section database"), attr(div21, "class", "tab-content has-scroll-y misc"), 
			attr(div21, "style", div21_style_value = 3 === ctx[6] ? "" : "display: none;"), 
			attr(div22, "class", "stickersConfig"), attr(div23, "class", "modal-content"), attr(div24, "class", "stickersModal"), 
			attr(div24, "style", div24_style_value = ctx[4] ? "" : "display: none;"), attr(div25, "class", "stickerWindow"), 
			attr(div25, "style", div25_style_value = "bottom: " + ctx[0].wbottom + "px; right: " + ctx[0].wright + "px; " + (ctx[3] ? "" : "display: none;")), 
			attr(div26, "id", "magane"), set_style(div26, "top", ctx[0].top + "px"), set_style(div26, "left", ctx[0].left + "px"), 
			set_style(div26, "display", ctx[2] ? "flex" : "none");
		},
		m(target, anchor) {
			insert(target, main_1, anchor), append(main_1, div26), append(div26, div0), append(div26, t0), 
			append(div26, div25), append(div25, div1), if_block0 && if_block0.m(div1, null), 
			append(div1, t1), if_block1 && if_block1.m(div1, null), append(div1, t2);
			for (let i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].m(div1, null);
			append(div25, t3), append(div25, div8), append(div8, div5), append(div5, div4), 
			append(div4, div3), append(div4, t4), if_block2 && if_block2.m(div4, null), append(div8, t5), 
			append(div8, div7), append(div7, div6);
			for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].m(div6, null);
			var fn;
			append(div25, t6), append(div25, div24), append(div24, div9), append(div24, t7), 
			append(div24, div23), append(div23, div22), append(div22, div14), append(div14, div10), 
			append(div14, t9), append(div14, div11), append(div14, t11), append(div14, div12), 
			append(div14, t13), append(div14, div13), append(div22, t15), if_block3 && if_block3.m(div22, null), 
			append(div22, t16), append(div22, div15), append(div15, input0), set_input_value(input0, ctx[15]), 
			append(div15, t17), if_block4 && if_block4.m(div15, null), append(div22, t18), append(div22, div18), 
			append(div18, div16), append(div16, p0), append(div16, t20), append(div16, p1), 
			append(div16, t24), append(div16, p2), append(div16, t26), append(div16, p3), append(p3, input1), 
			set_input_value(input1, ctx[13]), append(p3, t27), append(p3, button0), append(div18, t29), 
			append(div18, div17), append(div17, p4), append(div17, t31), append(div17, p5), 
			append(div17, t36), append(div17, p6), append(div17, t39), append(div17, p7), append(p7, input2), 
			set_input_value(input2, ctx[14]), append(p7, t40), append(p7, button1), append(div17, t42), 
			append(div17, p8), append(p8, input3), append(p8, t43), append(p8, button2), append(div17, t45), 
			append(div17, p9), append(p9, button3), append(div22, t47), append(div22, div21), 
			append(div21, div19), append(div19, p10), append(div19, t49), append(div19, p11), 
			append(p11, label0), append(label0, input4), input4.checked = ctx[16].disableToasts, 
			append(label0, t50), append(div19, t51), append(div19, p12), append(p12, label1), 
			append(label1, input5), input5.checked = ctx[16].closeWindowOnSend, append(label1, t52), 
			append(div19, t53), append(div19, p13), append(p13, label2), append(label2, input6), 
			input6.checked = ctx[16].useLeftToolbar, append(label2, t54), append(div19, t55), 
			append(div19, p14), append(p14, label3), append(label3, input7), input7.checked = ctx[16].hidePackAppendix, 
			append(label3, t56), append(div19, t57), append(div19, p15), append(p15, label4), 
			append(label4, input8), input8.checked = ctx[16].disableDownscale, append(label4, t58), 
			append(div19, t59), append(div19, p16), append(p16, label5), append(label5, input9), 
			input9.checked = ctx[16].disableImportedObfuscation, append(label5, t60), append(div19, t61), 
			append(div19, p17), append(p17, label6), append(label6, input10), input10.checked = ctx[16].markAsSpoiler, 
			append(label6, t62), append(div21, t63), append(div21, div20), append(div20, p18), 
			append(div20, t65), append(div20, p19), append(p19, input11), append(p19, t66), 
			append(p19, button4), append(div20, t68), append(div20, p20), append(p20, button5), 
			ctx[81](main_1), mounted || (dispose = [ listen(div0, "click", ctx[44]), listen(div0, "contextmenu", stop_propagation((fn = ctx[45], 
			function(event) {
				return event.preventDefault(), fn.call(this, event);
			}))), listen(div3, "click", ctx[51]), listen(div9, "click", ctx[54]), listen(div10, "click", ctx[55]), listen(div11, "click", ctx[56]), listen(div12, "click", ctx[57]), listen(div13, "click", ctx[58]), listen(input0, "keyup", ctx[24]), listen(input0, "input", ctx[61]), listen(input1, "input", ctx[66]), listen(button0, "click", ctx[67]), listen(input2, "input", ctx[68]), listen(button1, "click", ctx[69]), listen(input3, "click", click_handler_23), listen(input3, "change", ctx[36]), listen(button2, "click", ctx[70]), listen(button3, "click", ctx[71]), listen(input4, "change", ctx[72]), listen(input5, "change", ctx[73]), listen(input6, "change", ctx[74]), listen(input7, "change", ctx[75]), listen(input8, "change", ctx[76]), listen(input9, "change", ctx[77]), listen(input10, "change", ctx[78]), listen(div19, "change", ctx[39]), listen(input11, "click", click_handler_26), listen(input11, "change", ctx[40]), listen(button4, "click", ctx[79]), listen(button5, "click", ctx[80]) ], 
			mounted = !0);
		},
		p(ctx, dirty) {
			if (8 & dirty[0] && toggle_class(div0, "active", ctx[3]), ctx[7] || ctx[9] ? if_block0 && (if_block0.d(1), 
			if_block0 = null) : if_block0 || (if_block0 = create_if_block_10(), if_block0.c(), 
			if_block0.m(div1, t1)), ctx[7] && ctx[7].length ? if_block1 ? if_block1.p(ctx, dirty) : (if_block1 = create_if_block_9(ctx), 
			if_block1.c(), if_block1.m(div1, t2)) : if_block1 && (if_block1.d(1), if_block1 = null), 
			49283712 & dirty[0]) {
				let i;
				for (each_value_3 = ctx[9], i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);
					each_blocks_1[i] ? each_blocks_1[i].p(child_ctx, dirty) : (each_blocks_1[i] = create_each_block_3(child_ctx), 
					each_blocks_1[i].c(), each_blocks_1[i].m(div1, null));
				}
				for (;i < each_blocks_1.length; i += 1) each_blocks_1[i].d(1);
				each_blocks_1.length = each_value_3.length;
			}
			if (65536 & dirty[0] && div1_class_value !== (div1_class_value = "stickers has-scroll-y " + (ctx[16].useLeftToolbar ? "has-left-toolbar" : "")) && attr(div1, "class", div1_class_value), 
			ctx[22] && ctx[22].length && if_block2.p(ctx, dirty), 1074790912 & dirty[0]) {
				let i;
				for (each_value_2 = ctx[9], i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);
					each_blocks[i] ? each_blocks[i].p(child_ctx, dirty) : (each_blocks[i] = create_each_block_2(child_ctx), 
					each_blocks[i].c(), each_blocks[i].m(div6, null));
				}
				for (;i < each_blocks.length; i += 1) each_blocks[i].d(1);
				each_blocks.length = each_value_2.length;
			}
			65536 & dirty[0] && div8_class_value !== (div8_class_value = "packs-toolbar " + (ctx[16].useLeftToolbar ? "has-scroll-y" : "has-scroll-x")) && attr(div8, "class", div8_class_value), 
			64 & dirty[0] && toggle_class(div10, "is-active", 0 === ctx[6]), 64 & dirty[0] && toggle_class(div11, "is-active", 1 === ctx[6]), 
			64 & dirty[0] && toggle_class(div12, "is-active", 2 === ctx[6]), 64 & dirty[0] && toggle_class(div13, "is-active", 3 === ctx[6]), 
			ctx[5][0] ? if_block3 ? if_block3.p(ctx, dirty) : (if_block3 = create_if_block_4(ctx), 
			if_block3.c(), if_block3.m(div22, t16)) : if_block3 && (if_block3.d(1), if_block3 = null), 
			32768 & dirty[0] && input0.value !== ctx[15] && set_input_value(input0, ctx[15]), 
			ctx[5][1] ? if_block4 ? if_block4.p(ctx, dirty) : (if_block4 = create_if_block(ctx), 
			if_block4.c(), if_block4.m(div15, null)) : if_block4 && (if_block4.d(1), if_block4 = null), 
			64 & dirty[0] && div15_style_value !== (div15_style_value = 1 === ctx[6] ? "" : "display: none;") && attr(div15, "style", div15_style_value), 
			8192 & dirty[0] && input1.value !== ctx[13] && set_input_value(input1, ctx[13]), 
			16384 & dirty[0] && input2.value !== ctx[14] && set_input_value(input2, ctx[14]), 
			64 & dirty[0] && div18_style_value !== (div18_style_value = 2 === ctx[6] ? "" : "display: none;") && attr(div18, "style", div18_style_value), 
			65536 & dirty[0] && (input4.checked = ctx[16].disableToasts), 65536 & dirty[0] && (input5.checked = ctx[16].closeWindowOnSend), 
			65536 & dirty[0] && (input6.checked = ctx[16].useLeftToolbar), 65536 & dirty[0] && (input7.checked = ctx[16].hidePackAppendix), 
			65536 & dirty[0] && (input8.checked = ctx[16].disableDownscale), 65536 & dirty[0] && (input9.checked = ctx[16].disableImportedObfuscation), 
			65536 & dirty[0] && (input10.checked = ctx[16].markAsSpoiler), 64 & dirty[0] && div21_style_value !== (div21_style_value = 3 === ctx[6] ? "" : "display: none;") && attr(div21, "style", div21_style_value), 
			16 & dirty[0] && div24_style_value !== (div24_style_value = ctx[4] ? "" : "display: none;") && attr(div24, "style", div24_style_value), 
			9 & dirty[0] && div25_style_value !== (div25_style_value = "bottom: " + ctx[0].wbottom + "px; right: " + ctx[0].wright + "px; " + (ctx[3] ? "" : "display: none;")) && attr(div25, "style", div25_style_value), 
			1 & dirty[0] && set_style(div26, "top", ctx[0].top + "px"), 1 & dirty[0] && set_style(div26, "left", ctx[0].left + "px"), 
			4 & dirty[0] && set_style(div26, "display", ctx[2] ? "flex" : "none");
		},
		i: noop,
		o: noop,
		d(detaching) {
			detaching && detach(main_1), if_block0 && if_block0.d(), if_block1 && if_block1.d(), 
			destroy_each(each_blocks_1, detaching), if_block2 && if_block2.d(), destroy_each(each_blocks, detaching), 
			if_block3 && if_block3.d(), if_block4 && if_block4.d(), ctx[81](null), mounted = !1, 
			run_all(dispose);
		}
	};
}

"object" != typeof global.MAGANE_STYLES && (global.MAGANE_STYLES = {}), global.MAGANE_STYLES.main_scss = '/** Magane: main.scss **/\ndiv#magane {\n  display: flex;\n  flex-direction: row;\n  height: 44px;\n  position: absolute;\n  z-index: 99;\n}\ndiv#magane button, div#magane input, div#magane select, div#magane label, div#magane span, div#magane p, div#magane a, div#magane li, div#magane ul, div#magane div {\n  font-family: BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Helvetica", "Arial", sans-serif;\n  color: var(--header-secondary);\n  font-weight: 400;\n  line-height: 1.5;\n  font-size: 16px;\n  text-rendering: optimizeLegibility;\n  -webkit-text-size-adjust: 100%;\n\t -moz-text-size-adjust: 100%;\n\t\t  text-size-adjust: 100%;\n}\ndiv#magane div.channel-textarea-stickers {\n  display: flex;\n  align-items: center;\n  cursor: pointer;\n}\ndiv#magane div.channel-textarea-stickers:hover, div#magane div.channel-textarea-stickers.active {\n  filter: brightness(1.35);\n}\ndiv#magane img.channel-textarea-stickers-content {\n  width: 24px;\n  height: 24px;\n  padding: 4px;\n  margin-left: 2px;\n  margin-right: 2px;\n}\ndiv#magane div.stickerWindow {\n  z-index: 2000;\n  width: 600px;\n  min-height: 200px;\n  position: fixed;\n  background: var(--background-secondary);\n  max-height: 600px;\n  transition: all 0.2s ease;\n  border-radius: 4px;\n  box-shadow: var(--elevation-stroke), var(--elevation-high);\n}\ndiv#magane div.stickerWindow div.stickers {\n  height: 550px !important;\n  margin-bottom: 100px;\n  position: relative;\n}\ndiv#magane div.stickerWindow div.stickers.has-left-toolbar {\n  height: 600px !important;\n  margin-left: 50px;\n}\ndiv#magane div.stickerWindow div.stickers h3.getStarted {\n  text-align: center;\n  padding-top: 40%;\n  pointer-events: none;\n}\ndiv#magane div.stickerWindow div.stickers div.pack {\n  float: left;\n  display: flex;\n  flex-flow: wrap;\n  justify-content: center;\n  padding: 25px;\n  width: 100%;\n  box-sizing: border-box;\n}\ndiv#magane div.stickerWindow div.stickers div.pack span {\n  color: var(--header-secondary);\n  width: 100%;\n  cursor: auto;\n  padding-left: 10px;\n  margin: 10px 0px;\n}\ndiv#magane div.stickerWindow div.stickers div.pack span .counts {\n  padding-left: 0;\n}\ndiv#magane div.stickerWindow div.stickers div.pack span .counts span {\n  padding: 0 0.5em;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100px;\n  height: 100px;\n  float: left;\n  position: relative;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker .image {\n  cursor: pointer;\n  max-height: 100%;\n  max-width: 100%;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite, div#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite {\n  width: 20px;\n  height: 20px;\n  position: absolute;\n  right: 0;\n  transition: all 0.2s ease;\n  display: none;\n  z-index: 2;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite:hover, div#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite:hover {\n  transform: scale(1.25);\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite:hover svg path, div#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite:hover svg path {\n  transition: all 0.2s ease;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite {\n  bottom: 0;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.addFavorite:hover svg path {\n  fill: #2ECC71;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite {\n  top: 0px;\n  transform: rotateZ(45deg);\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite:hover {\n  transform: scale(1.25) rotateZ(45deg);\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker div.deleteFavorite:hover svg path {\n  fill: #F04747;\n}\ndiv#magane div.stickerWindow div.stickers div.pack div.sticker:hover div.addFavorite, div#magane div.stickerWindow div.stickers div.pack div.sticker:hover div.deleteFavorite {\n  display: block;\n  cursor: pointer;\n}\ndiv#magane div.stickerWindow div.packs-toolbar {\n  position: absolute;\n  bottom: 0;\n  background: var(--background-tertiary);\n  display: flex;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-x {\n  width: 100%;\n  height: 50px;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-x div.packs {\n  flex: 1 0 auto;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-x div.packs.packs-controls {\n  flex: 0 0 auto;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-x div.packs div.packs-wrapper {\n  white-space: nowrap;\n  float: left;\n  width: 100%;\n  font-size: 0; /* quick hax to clear whitespace */\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-y {\n  width: 50px;\n  height: 100%;\n  flex-direction: column;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-y div.packs {\n  flex: 1 1 auto;\n  height: 100%;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-y div.packs.packs-controls {\n  flex: 0 0 auto;\n  height: auto;\n}\ndiv#magane div.stickerWindow div.packs-toolbar.has-scroll-y div.packs div.packs-wrapper {\n  font-size: 0; /* quick hax to clear whitespace */\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack {\n  display: inline-block;\n  height: 40px;\n  width: 40px;\n  margin: 5px;\n  cursor: pointer;\n  background-position: center;\n  background-size: contain;\n  background-repeat: no-repeat;\n  transition: all 0.2s ease;\n  filter: grayscale(100%);\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack:hover,\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack div.pack.active {\n  transform: scale(1.25);\n  filter: grayscale(0%);\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack > div {\n  background-image: url("/assets/f24711dae4f6d6b28335e866a93e9d9b.png");\n  width: 22px;\n  height: 22px;\n  background-size: 924px 704px;\n  background-repeat: no-repeat;\n  margin-top: 8px;\n  margin-left: 9px;\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack div.icon-favorite {\n  background-position: -462px -132px;\n}\ndiv#magane div.stickerWindow div.packs-toolbar div.packs div.pack div.icon-plus {\n  background-position: -374px -484px;\n  /* make it greenish */\n  filter: hue-rotate(260deg) brightness(3) contrast(4.5);\n}\ndiv#magane .stickersModal {\n  z-index: 2001;\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n  align-items: center;\n  justify-content: center;\n}\ndiv#magane .stickersModal.is-active {\n  display: flex;\n}\ndiv#magane .stickersModal .inputQuery {\n  width: calc(100% - 30px);\n  height: 36px;\n  box-sizing: border-box;\n  margin: 0 15px 10px;\n  padding: 5px 12px;\n  border-radius: 3px;\n  border: 1px solid var(--background-secondary);\n  background: var(--background-secondary);\n  color: var(--header-secondary);\n}\ndiv#magane .stickersModal .inputPackIndex {\n  width: 55px;\n  height: 36px;\n  box-sizing: border-box;\n  padding: 5px 12px;\n  border-radius: 3px;\n  border: 1px solid var(--background-secondary);\n  background: var(--background-secondary);\n  color: var(--header-secondary);\n  text-align: center;\n}\ndiv#magane .stickersModal .modal-background {\n  bottom: 0;\n  left: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n  width: 100%;\n  height: 100%;\n  background-color: rgba(10, 10, 10, 0.86);\n}\ndiv#magane .stickersModal .modal-content,\ndiv#magane .stickersModal .modal-card {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  left: 0;\n  top: 0;\n  background: var(--background-tertiary);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig {\n  height: 100%;\n  width: 100%;\n  display: flex;\n  flex-direction: column;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig .tabs {\n  width: 100%;\n  text-align: center;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig .tabs .tab {\n  color: var(--header-secondary);\n  display: inline-block;\n  border: none;\n  border-top: 0px transparent;\n  border-left: 0px transparent;\n  border-right: 0px transparent;\n  border-width: 1px;\n  border-style: solid;\n  border-bottom-color: var(--header-secondary);\n  padding: 20px;\n  cursor: pointer;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig .tabs .tab:hover, div#magane .stickersModal .modal-content .stickersConfig .tabs .tab.is-active {\n  border-bottom-color: var(--interactive-active);\n  color: var(--interactive-active);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content {\n  height: calc(100% - 66px); /* .tabs height */\n  width: 100%;\n  padding: 10px 0;\n  box-sizing: border-box;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.avail-packs {\n  display: flex;\n  flex-direction: column;\n  padding-bottom: 0;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.avail-packs .packs {\n  height: 100%;\n  width: 100%;\n  padding-bottom: 10px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc {\n  -webkit-user-select: text;\n\t -moz-user-select: text;\n\t\t  user-select: text;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section {\n  padding: 0 24px 14px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section .section-title, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section .section-title {\n  font-weight: 800;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section > p:last-of-type, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section > p:last-of-type {\n  margin-bottom: 0;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section a, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section a {\n  /* inherit Discord\'s link color */\n  color: var(--text-link);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .section a:hover, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .section a:hover {\n  text-decoration: underline;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .input-grouped, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .input-grouped {\n  display: flex;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .input-grouped input, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .input-grouped input {\n  margin: 0;\n  width: auto;\n  flex-grow: 1;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.tab-content.import .input-grouped button, div#magane .stickersModal .modal-content .stickersConfig div.tab-content.misc .input-grouped button {\n  margin-left: 4px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack {\n  height: 75px;\n  width: 100%;\n  float: left;\n  display: flex;\n  padding: 0 20px;\n  box-sizing: border-box;\n  margin-bottom: 5px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack:last-of-type {\n  margin-bottom: 0;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.index,\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.handle,\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.preview {\n  flex: 0 0 auto;\n  min-width: 75px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action {\n  flex: 1 0 auto;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action.is-tight button {\n  width: auto;\n  padding-right: 0.5em;\n  padding-left: 0.5em;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack {\n  width: 36px;\n  height: 36px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack:before, div#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack:after {\n  background-color: var(--header-secondary);\n  content: "";\n  display: block;\n  left: 50%;\n  position: absolute;\n  top: 50%;\n  transform: translateX(-50%) translateY(-50%) rotate(45deg);\n  transform-origin: center center;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack:before {\n  height: 2px;\n  width: 50%;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action button.delete-pack:after {\n  height: 50%;\n  width: 2px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.index {\n  padding-top: 20px;\n  text-align: left;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.preview {\n  height: 75px;\n  background-position: center;\n  background-size: contain;\n  background-repeat: no-repeat;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.handle {\n  padding: 20px;\n  cursor: move;\n  padding-top: 30px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.handle span {\n  background: #555;\n  height: 2px;\n  width: 100%;\n  display: block;\n  margin-bottom: 6px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.action {\n  padding-top: 20px;\n  text-align: right;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info {\n  flex: 1 1 auto;\n  padding: 14px;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info > span {\n  display: block;\n  width: 100%;\n  color: var(--header-secondary);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info > span:nth-of-type(1) {\n  font-weight: bold;\n  color: var(--header-secondary);\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info > span .appendix span:nth-of-type(1) {\n  padding: 0 0.5em;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.info > span .appendix span:nth-of-type(2) {\n  -webkit-user-select: text;\n\t -moz-user-select: text;\n\t\t  user-select: text;\n}\ndiv#magane .stickersModal .modal-content .stickersConfig div.pack div.preview img {\n  height: 100%;\n  width: 100%;\n}\ndiv#magane .stickersModal .modal-close {\n  -webkit-user-select: none;\n\t -moz-user-select: none;\n\t\t  user-select: none;\n  background-color: rgba(10, 10, 10, 0.2);\n  border: none;\n  border-radius: 290486px;\n  cursor: pointer;\n  display: inline-block;\n  flex-grow: 0;\n  flex-shrink: 0;\n  font-size: 0;\n  outline: none;\n  vertical-align: top;\n  background: none;\n  position: absolute;\n  right: 20px;\n  top: 20px;\n  height: 32px;\n  max-height: 32px;\n  max-width: 32px;\n  min-height: 32px;\n  min-width: 32px;\n  width: 32px;\n  z-index: 1;\n}\ndiv#magane .stickersModal .modal-close:before, div#magane .stickersModal .modal-close:after {\n  background-color: var(--header-secondary);\n  content: "";\n  display: block;\n  left: 50%;\n  position: absolute;\n  top: 50%;\n  transform: translateX(-50%) translateY(-50%) rotate(45deg);\n  transform-origin: center center;\n}\ndiv#magane .stickersModal .modal-close:before {\n  height: 2px;\n  width: 50%;\n}\ndiv#magane .stickersModal .modal-close:after {\n  height: 50%;\n  width: 2px;\n}\ndiv#magane .stickersModal .modal-close:hover, div#magane .stickersModal .modal-close:focus {\n  background-color: rgba(10, 10, 10, 0.3);\n}\ndiv#magane .button {\n  align-items: center;\n  border: 1px solid transparent;\n  border-radius: 3px;\n  box-shadow: none;\n  display: inline-flex;\n  font-size: 1rem;\n  padding: calc(0.375em - 1px) 0.75em;\n  position: relative;\n  vertical-align: top;\n  -webkit-user-select: none;\n\t -moz-user-select: none;\n\t\t  user-select: none;\n  cursor: pointer;\n  justify-content: center;\n  text-align: center;\n  white-space: nowrap;\n  border-color: transparent;\n  color: var(--header-secondary);\n  background-color: var(--background-secondary);\n  width: 62px; /* consistent width */\n}\ndiv#magane .button.is-danger {\n  color: #ffffff;\n  border-color: rgba(240, 71, 71, 0.3);\n  background: #f04747;\n}\ndiv#magane .button:hover, div#magane .button.is-primary:hover {\n  transform: scale3d(1.1, 1.1, 1.1);\n}\ndiv#magane .button.has-width-full {\n  width: 100%;\n}\ndiv#magane .button.has-width-full:hover {\n  /* TODO: Figure out how to do a more consistent scaling,\n\tregardless of the button\'s dynamic size. */\n  transform: scale3d(1.04, 1.04, 1.04);\n}\ndiv#magane .has-scroll-x {\n  overflow-x: overlay;\n}\ndiv#magane .has-scroll-y {\n  overflow-y: overlay;\n}\ndiv#magane ::-webkit-scrollbar {\n  /* Let\'s make the scrollbars pretty */\n  width: 6px;\n  height: 6px;\n}\ndiv#magane ::-webkit-scrollbar-track {\n  margin: 0;\n  background: transparent;\n  border-radius: 5px;\n}\ndiv#magane ::-webkit-scrollbar-track-piece {\n  border: 0 solid transparent;\n  background: transparent;\n  margin: 0;\n}\ndiv#magane ::-webkit-scrollbar-thumb {\n  background: rgba(105, 96, 128, 0.5);\n  border: 0 solid transparent;\n  border-radius: 5px;\n}\ndiv#magane ::-webkit-scrollbar-thumb:hover {\n  background: rgba(105, 96, 128, 0.75);\n}\ndiv#magane ::-webkit-scrollbar-thumb:active {\n  background: #696080;\n}';

const localPackIdRegex = /^(startswith|emojis|custom)-/, click_handler_14 = event => event.target.select(), click_handler_23 = event => event.stopPropagation(), click_handler_26 = event => event.stopPropagation();

function instance($$self, $$props, $$invalidate) {
	window.magane = {};
	const modules = {}, coords = {
		top: 0,
		left: 0
	};
	let main = null, base = null, textArea = null, showIcon = !1, isThereTopBar = null, baseURL = "", stickerWindowActive = !1, stickerAddModalActive = !1;
	const stickerAddModalTabsInit = {};
	let activeTab = null, favoriteStickers = [];
	const favoriteStickersData = {};
	let availablePacks = [], subscribedPacks = [], subscribedPacksSimple = [], filteredPacks = [];
	const localPacks = {};
	let linePackSearch = null, remotePackUrl = null, onCooldown = !1, storage = null, packsSearch = null, resizeObserver = null;
	const waitForTimeouts = {}, settings = {
		disableToasts: !1,
		closeWindowOnSend: !1,
		disableDownscale: !1,
		useLeftToolbar: !1,
		disableImportedObfuscation: !1,
		markAsSpoiler: !1,
		hidePackAppendix: !1
	}, allowedStorageKeys = [ "magane.available", "magane.subscribed", "magane.favorites", "magane.settings" ], log = (message, type = "log") => console[type]("%c[Magane]%c", "color: #3a71c1; font-weight: 700", "", message), toast = (message, options = {}) => {
		if (!options.nolog || settings.disableToasts) {
			const type = [ "log", "info", "warn", "error" ].includes(options.type) ? options.type : "log";
			log(message, type);
		}
		settings.disableToasts || BdApi.showToast(message, options);
	}, toastInfo = (message, options = {}) => (options.type = "info", toast(message, options)), toastSuccess = (message, options = {}) => (options.type = "success", 
	toast(message, options)), toastError = (message, options = {}) => (options.type = "error", 
	toast(message, options)), toastWarn = (message, options = {}) => (options.type = "warn", 
	toast(message, options)), waitFor = (selector, logname) => {
		let poll;
		return logname && log(`Waiting for ${logname}…`), new Promise(resolve => {
			(poll = () => {
				const element = document.querySelector(selector);
				if (element) return delete waitForTimeouts[selector], resolve(element);
				waitForTimeouts[selector] = setTimeout(poll, 500);
			})();
		});
	}, updateButtonPosition = async () => {
		if (waitForTimeouts['[class*="baseLayer"]:is([style=""], :not([style]))']) return;
		$$invalidate(2, showIcon = !1), await waitFor('[class*="baseLayer"]:is([style=""], :not([style]))'), 
		log("Updating button's position…");
		const buttonsContainer = textArea.querySelector('[class^="buttons"]');
		if (!buttonsContainer) return;
		$$invalidate(2, showIcon = !0);
		const props = buttonsContainer.getBoundingClientRect();
		base === document.body ? ($$invalidate(0, coords.top = props.top, coords), $$invalidate(0, coords.left = props.left - 36, coords)) : ($$invalidate(0, coords.top = isThereTopBar ? props.top - 22 : props.top, coords), 
		$$invalidate(0, coords.left = props.left - 72 - 36, coords)), $$invalidate(0, coords.wbottom = base.clientHeight - coords.top + 8, coords), 
		$$invalidate(0, coords.wright = base.clientWidth - coords.left - (props.width + 36) - 6, coords);
	}, initResizeObserver = async firstrun => {
		resizeObserver ? resizeObserver.disconnect() : resizeObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				if (!entry.contentRect) return;
				entry.contentRect.width || entry.contentRect.height ? updateButtonPosition() : ($$invalidate(2, showIcon = !1), 
				initResizeObserver());
			}
		}), textArea = await waitFor('[class^="channelTextArea-"]:not([class*="channelTextAreaDisabled"])', "textarea"), 
		firstrun && updateButtonPosition(), resizeObserver.observe(textArea);
	}, saveToLocalStorage = (key, payload) => {
		storage.setItem(key, JSON.stringify(payload));
	}, grabPacks = async () => {
		const response = await fetch("https://magane.moe/api/packs"), packs = await response.json();
		baseURL = packs.baseURL;
		const storedLocalPacks = storage.getItem("magane.available");
		if (storedLocalPacks) try {
			const availLocalPacks = JSON.parse(storedLocalPacks), filteredLocalPacks = availLocalPacks.filter(pack => "object" == typeof pack && void 'undefined' !== pack.id && localPackIdRegex.test(pack.id));
			availLocalPacks.length !== filteredLocalPacks.length && saveToLocalStorage("magane.available", filteredLocalPacks), 
			filteredLocalPacks.forEach(pack => {
				$$invalidate(12, localPacks[pack.id] = pack, localPacks);
			}), availablePacks.push(...filteredLocalPacks);
		} catch (ex) {
			console.error(ex);
		}
		availablePacks.push(...packs.packs), availablePacks = availablePacks, $$invalidate(11, filteredPacks = availablePacks);
		const subbedPacks = storage.getItem("magane.subscribed");
		if (subbedPacks) try {
			$$invalidate(9, subscribedPacks = JSON.parse(subbedPacks));
			for (const subbedPacks of subscribedPacks) subscribedPacksSimple.push(subbedPacks.id);
			subscribedPacks.forEach(pack => {
				localPackIdRegex.test(pack.id) && $$invalidate(12, localPacks[pack.id] = pack, localPacks);
			});
		} catch (ex) {
			console.error(ex);
		}
		const favStickers = storage.getItem("magane.favorites");
		if (favStickers) try {
			$$invalidate(7, favoriteStickers = JSON.parse(favStickers).filter(sticker => {
				if (favoriteStickersData[sticker.pack]) return !0;
				const index = availablePacks.findIndex(pack => pack.id === sticker.pack);
				return -1 !== index ? ($$invalidate(8, favoriteStickersData[sticker.pack] = {
					name: availablePacks[index].name
				}, favoriteStickersData), !0) : void 0;
			}));
		} catch (ex) {
			console.error(ex);
		}
	}, subscribeToPack = pack => {
		-1 === subscribedPacks.findIndex(p => p.id === pack.id) && ($$invalidate(9, subscribedPacks = [ ...subscribedPacks, pack ]), 
		$$invalidate(10, subscribedPacksSimple = [ ...subscribedPacksSimple, pack.id ]), 
		saveToLocalStorage("magane.subscribed", subscribedPacks), log("Subscribed to pack > " + pack.name));
	}, unsubscribeToPack = pack => {
		for (let i = 0; i < subscribedPacks.length; i++) if (subscribedPacks[i].id === pack.id) return subscribedPacks.splice(i, 1), 
		subscribedPacksSimple.splice(i, 1), $$invalidate(9, subscribedPacks), $$invalidate(10, subscribedPacksSimple), 
		log("Unsubscribed from pack > " + pack.name), void saveToLocalStorage("magane.subscribed", subscribedPacks);
	}, formatUrl = (pack, id, sending, thumbIndex) => {
		let url;
		if ("number" == typeof pack) url = `${baseURL}${pack}/${id}`, sending || (url = url.replace(/\.(gif|png)$/i, "_key.$1")); else if (pack.startsWith("startswith-")) {
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
	}, sendSticker = async (pack, id) => {
		if (onCooldown) return toastWarn("Sending sticker is still on cooldown…", {
			timeout: 1000
		});
		onCooldown = !0;
		try {
			const userId = modules.userStore.getCurrentUser().id, channelId = modules.selectedChannelStore.getChannelId(), channel = modules.channelStore.getChannel(channelId);
			if (!((permissions, user, context) => {
				if (!user) return !1;
				if (!permissions || !context.guild_id) return !0;
				permissions = Array.isArray(permissions) ? permissions : [ permissions ];
				for (const permission of permissions) if (!modules.permissionRoleUtils.can({
					permission,
					user,
					context
				}) && !modules.computePermissions.can(permission, user, context)) return !1;
				return !0;
			})([ modules.discordPermissions.ATTACH_FILES, modules.discordPermissions.SEND_MESSAGES ], userId, channel)) return onCooldown = !1, 
			toastError("You do not have permission to attach files in this channel.");
			toast("Sending…", {
				nolog: !0
			}), settings.closeWindowOnSend && toggleStickerWindow(!1);
			const url = formatUrl(pack, id, !0);
			log("Fetching sticker from remote: " + url);
			const response = await fetch(url, {
				cache: "force-cache"
			}), myBlob = await response.arrayBuffer();
			let filename = id;
			if ("string" == typeof pack) if (localPacks[pack].animated && (pack.startsWith("startswith-") || pack.startsWith("emojis-"))) filename = filename.replace(/\.png$/i, ".gif"), 
			toastWarn("Animated stickers/emojis from LINE Store currently cannot be animated."); else if (pack.startsWith("custom-")) if (settings.disableImportedObfuscation) filename = id; else {
				const ext = id.match(/(\.\w+)$/);
				filename = `${Date.now().toString()}${ext ? ext[1] : ""}`;
			}
			settings.markAsSpoiler && (filename = "SPOILER_" + filename);
			const file = new File([ Buffer.from(myBlob) ], filename);
			log(`Sending sticker as ${filename}…`);
			let messageContent = "";
			const textAreaInstance = (() => {
				let cursor = textArea[Object.keys(textArea).find(key => key.startsWith("__reactInternalInstance") || key.startsWith("__reactFiber"))];
				if (!cursor) return null;
				for (;!cursor.stateNode || !cursor.stateNode.constructor || "ChannelTextAreaForm" !== cursor.stateNode.constructor.displayName; ) cursor = cursor.return;
				return cursor;
			})();
			if (textAreaInstance) messageContent = textAreaInstance.stateNode.state.textValue; else if (textArea) {
				log("Unable to fetch text area of chat input, attempting workaround…", "warn");
				let element = textArea.querySelector("span");
				element || (element = textArea), messageContent = element.innerText;
			} else log("Unable to fetch text area of chat input, workaround unavailable…", "warn");
			modules.messageUpload.upload({
				channelId,
				file,
				message: {
					content: messageContent
				}
			}), textAreaInstance && textAreaInstance.stateNode.setState({
				textValue: "",
				richValue: modules.richUtils.toRichValue("")
			});
		} catch (error) {
			console.error(error), toastError("Unexpected error occurred when sending sticker. Check your console for details.");
		}
		onCooldown = !1;
	}, favoriteSticker = (pack, id) => {
		if (-1 !== favoriteStickers.findIndex(f => f.pack === pack && f.id === id)) return;
		if (!favoriteStickersData[pack]) {
			const data = subscribedPacks.find(p => p.id === pack);
			data && $$invalidate(8, favoriteStickersData[pack] = {
				name: data.name
			}, favoriteStickersData);
		}
		const favorite = {
			pack,
			id
		};
		$$invalidate(7, favoriteStickers = [ ...favoriteStickers, favorite ]), saveToLocalStorage("magane.favorites", favoriteStickers), 
		log(`Favorited sticker > ${id} of pack ${pack}`), toastSuccess("Favorited!", {
			nolog: !0
		});
	}, unfavoriteSticker = (pack, id) => {
		const index = favoriteStickers.findIndex(f => f.pack === pack && f.id === id);
		-1 !== index && (favoriteStickers.splice(index, 1), $$invalidate(7, favoriteStickers), 
		favoriteStickers.some(s => s.pack === pack) || delete favoriteStickersData[pack], 
		saveToLocalStorage("magane.favorites", favoriteStickers), log(`Unfavorited sticker > ${id} of pack ${pack}`), 
		toastInfo("Unfavorited!", {
			nolog: !0
		}));
	}, filterPacks = () => {
		const query = "string" == typeof packsSearch && packsSearch.trim().toLowerCase();
		$$invalidate(11, filteredPacks = query ? availablePacks.filter(pack => pack.name.toLowerCase().indexOf(query) >= 0 || String(pack.id).indexOf(query) >= 0) : availablePacks);
	}, _appendPack = (id, e, opts = {}) => {
		let foundIndex, availLocalPacks = [];
		const storedLocalPacks = storage.getItem("magane.available");
		if (storedLocalPacks && (availLocalPacks = JSON.parse(storedLocalPacks), availLocalPacks)) if (foundIndex = availLocalPacks.findIndex(p => p.id === id), 
		foundIndex >= 0) {
			if (opts.overwrite && opts.partial) e = Object.assign(availLocalPacks[foundIndex], e); else if (!opts.overwrite) throw new Error(`Pack with ID ${id} already exist.`);
		} else if (opts.overwrite) throw new Error(`Cannot overwrite missing pack with ID ${id}.`);
		if (!e.count || !e.files.length) throw new Error("Invalid stickers count.");
		const result = {
			pack: e
		};
		if (localPackIdRegex.test(id) && $$invalidate(12, localPacks[id] = e, localPacks), 
		foundIndex >= 0) {
			availLocalPacks[foundIndex] = e;
			const sharedIndex = availablePacks.findIndex(p => p.id === id);
			-1 !== sharedIndex && (availablePacks[sharedIndex] = e);
		} else availLocalPacks.unshift(e), availablePacks.unshift(e), availablePacks = availablePacks;
		return saveToLocalStorage("magane.available", availLocalPacks), filterPacks(), opts.overwrite ? log("Overwritten pack with ID " + id) : log("Added a new pack with ID " + id), 
		result;
	}, parseFunctionArgs = (args, argNames, minArgs) => {
		const isFirstArgAnObj = "object" == typeof args[0];
		if (!isFirstArgAnObj && "number" == typeof minArgs && args.length < minArgs) throw new Error(`This function expects at least ${minArgs} parameter(s).`);
		const parsed = {};
		for (let i = 0; i < argNames.length; i++) parsed[argNames[i]] = isFirstArgAnObj ? args[0][argNames[i]] : args[i];
		return parsed;
	};
	window.magane.appendPack = (...args) => {
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
	}, window.magane.appendEmojisPack = (...args) => {
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
	}, window.magane.appendCustomPack = (...args) => {
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
	}, window.magane.editPack = (...args) => {
		const {id, props} = parseFunctionArgs(args, [ "id", "props" ], 2);
		if ("object" != typeof props) throw new Error('"props" must be an object.');
		return _appendPack(id, props, {
			overwrite: !0,
			partial: !0
		});
	}, window.magane.deletePack = id => {
		if (!id && !localPackIdRegex.test(id)) throw new Error('Pack ID must start with either "startswith-", "emojis-", or "custom-".');
		const storedLocalPacks = storage.getItem("magane.available");
		if (storedLocalPacks) try {
			const availLocalPacks = JSON.parse(storedLocalPacks), index = availLocalPacks.findIndex(p => p.id === id);
			if (-1 === index) throw new Error("Unable to find pack with ID " + id);
			$$invalidate(7, favoriteStickers = favoriteStickers.filter(s => s.pack !== id)), 
			delete favoriteStickersData[id], saveToLocalStorage("magane.favorites", favoriteStickers);
			const subbedPack = subscribedPacks.find(p => p.id === id);
			subbedPack && unsubscribeToPack(subbedPack), availLocalPacks.splice(index, 1), saveToLocalStorage("magane.available", availLocalPacks);
			const sharedIndex = availablePacks.findIndex(p => p.id === id);
			return -1 !== sharedIndex && (availablePacks.splice(sharedIndex, 1), availablePacks = availablePacks, 
			filterPacks()), delete localPacks[id], log(`Removed pack with ID ${id} (old index: ${index})`), 
			!0;
		} catch (ex) {
			throw ex;
		}
	}, window.magane.searchPacks = keyword => {
		if (!keyword) throw new Error("Keyword required");
		keyword = keyword.toLowerCase();
		const storedLocalPacks = storage.getItem("magane.available");
		if (storedLocalPacks) try {
			return JSON.parse(storedLocalPacks).filter(p => p.name.toLowerCase().indexOf(keyword) >= 0 || p.id.indexOf(keyword) >= 0);
		} catch (ex) {
			throw ex;
		}
	};
	!function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}(async () => {
		try {
			toast("Loading Magane…"), modules.channelStore = BdApi.findModuleByProps("getChannel", "getDMFromUserId"), 
			modules.selectedChannelStore = BdApi.findModuleByProps("getLastSelectedChannelId"), 
			modules.userStore = BdApi.findModuleByProps("getCurrentUser", "getUser"), modules.discordConstants = BdApi.findModuleByProps("Permissions", "ActivityTypes", "StatusTypes"), 
			modules.discordPermissions = modules.discordConstants.Permissions, modules.permissionRoleUtils = BdApi.findModuleByProps("can", "ALLOW", "DENY"), 
			modules.computePermissions = BdApi.findModuleByProps("computePermissions"), modules.messageUpload = BdApi.findModuleByProps("upload", "instantBatchUpload"), 
			modules.richUtils = BdApi.findModuleByProps("toRichValue", "createEmptyState"), 
			(() => {
				const iframe = document.createElement("iframe");
				document.head.append(iframe), storage = Object.getOwnPropertyDescriptor(iframe.contentWindow.frames, "localStorage").get.call(window), 
				iframe.remove();
			})(), (() => {
				const storedSettings = storage.getItem("magane.settings");
				if (storedSettings) try {
					const parsed = JSON.parse(storedSettings);
					for (const key of Object.keys(settings)) void 'undefined' !== parsed[key] && null !== parsed[key] && $$invalidate(16, settings[key] = parsed[key], settings);
				} catch (ex) {
					console.error(ex);
				}
			})(), await grabPacks(), await (async () => {
				let dirty = !1;
				const favorites = JSON.parse(storage.getItem("magane.favorites")), subscribed = JSON.parse(storage.getItem("magane.subscribed"));
				favorites && favorites.forEach(item => {
					if ("number" == typeof item.pack) return;
					const result = parseInt(item.pack, 10);
					isNaN(item.pack) || (item.pack = result, dirty = !0);
				}), subscribed && subscribed.forEach(item => {
					if ("number" == typeof item.id) return;
					const result = parseInt(item.id, 10);
					isNaN(item.id) || (item.id = result, dirty = !0);
				}), dirty && (toastInfo("Found packs/stickers to migrate, migrating now..."), storage.setItem("magane.favorites", JSON.stringify(favorites)), 
				storage.setItem("magane.subscribed", JSON.stringify(subscribed)), await grabPacks(), 
				toastSuccess("Migration successful."));
			})(), toastSuccess("Magane is now ready!"), (async () => {
				base = main.parentNode.parentNode, base === document.body ? log("Magane is mounted with MaganeBD.") : (log("Magane is mounted with legacy BD plugin."), 
				isThereTopBar = Boolean(document.querySelector('[class*="titleBar-"]'))), initResizeObserver(!0);
			})();
		} catch (error) {
			console.error(error), toastError("Unexpected error occurred when initializing Magane. Check your console for details.");
		}
	}), function onDestroy(fn) {
		get_current_component().$$.on_destroy.push(fn);
	}(() => {
		for (const timeout of Object.values(waitForTimeouts)) clearTimeout(timeout);
		resizeObserver && resizeObserver.disconnect(), delete window.magane, log("Internal components cleaned up.");
	});
	const maganeBlurHandler = e => {
		const stickerWindow = main.querySelector(".stickerWindow");
		if (stickerWindow) {
			const {x, y, width, height} = stickerWindow.getBoundingClientRect();
			if (e.target) {
				if (main.querySelector(".magane-button").contains(e.target)) return;
				const visibleModals = document.querySelectorAll('[class^="layerContainer-"]');
				if (visibleModals.length && Array.from(visibleModals).some(m => m.contains(e.target))) return;
			}
			e.clientX <= x + width && e.clientX >= x && e.clientY <= y + height && e.clientY >= y || toggleStickerWindow();
		}
	}, toggleStickerWindow = forceState => {
		const active = void 'undefined' === forceState ? !stickerWindowActive : forceState;
		active ? document.addEventListener("click", maganeBlurHandler) : document.removeEventListener("click", maganeBlurHandler), 
		$$invalidate(3, stickerWindowActive = active);
	}, toggleStickerModal = () => {
		const active = !stickerAddModalActive;
		active && null === activeTab && activateTab(0), $$invalidate(4, stickerAddModalActive = active);
	}, activateTab = value => {
		$$invalidate(6, activeTab = value), stickerAddModalTabsInit[activeTab] || $$invalidate(5, stickerAddModalTabsInit[activeTab] = !0, stickerAddModalTabsInit);
	}, scrollToStickers = id => {
		scrollTo({
			element: id.replace(/([.])/g, "\\$1"),
			container: main.querySelector(".stickers")
		});
	}, deleteLocalPack = id => {
		try {
			const _name = localPacks[id].name;
			window.magane.deletePack(id) && toastSuccess(`Removed pack ${_name}.`, {
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
			$$invalidate(7, favoriteStickers = favoriteStickers.filter(s => s.pack !== id || -1 !== stored.pack.files.findIndex(f => f === s.id))), 
			favoriteStickers.some(s => s.pack === id) ? $$invalidate(8, favoriteStickersData[id].name = stored.pack.name, favoriteStickersData) : delete favoriteStickersData[id], 
			saveToLocalStorage("magane.favorites", favoriteStickers);
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
	}, parseLinePack = async () => {
		if (linePackSearch) try {
			const match = linePackSearch.match(/^(https?:\/\/store\.line\.me\/((sticker|emoji)shop)\/product\/)?([a-z0-9]+)/);
			if (!match) return toastError("Unsupported LINE Store URL or ID.");
			let stored;
			if (toast("Loading pack information…", {
				nolog: !0
			}), "emoji" === match[3]) {
				const id = match[4], response = await fetch("https://magane.moe/api/proxy/emoji/" + id), props = await response.json();
				stored = window.magane.appendEmojisPack({
					name: props.title,
					id: props.id,
					count: props.len,
					animated: props.hasAnimation || null
				});
			} else {
				const id = Number(match[4]);
				if (isNaN(id) || id < 0) return toastError("Unsupported LINE Stickers ID.");
				const response = await fetch("https://magane.moe/api/proxy/sticker/" + id), props = await response.json();
				stored = window.magane.appendPack({
					name: props.title,
					firstid: props.first,
					count: props.len,
					animated: props.hasAnimation
				});
			}
			toastSuccess(`Added a new pack ${stored.pack.name}.`, {
				nolog: !0,
				timeout: 6000
			}), $$invalidate(13, linePackSearch = null);
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
		remotePackUrl && assertRemotePackConsent("URL: " + remotePackUrl, async () => {
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
				}), $$invalidate(14, remotePackUrl = null);
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
	}, replaceDatabase = () => {
		document.getElementById("replaceDatabaseInput").click();
	}, exportDatabase = () => {
		const element = document.createElement("a");
		let hrefUrl = "";
		try {
			toast("Exporting database…");
			const database = {};
			for (const key of allowedStorageKeys) {
				const data = storage.getItem(key);
				null !== data && (database[key] = JSON.parse(data));
			}
			const dbString = JSON.stringify(database), blob = new Blob([ dbString ]);
			hrefUrl = window.URL.createObjectURL(blob), element.href = hrefUrl, element.download = `magane.database.${(new Date).toISOString()}.json`, 
			element.click();
		} catch (error) {
			console.error(error), toastError("Unexpected error occurred. Check your console for details.");
		}
		element.remove(), hrefUrl && window.URL.revokeObjectURL(hrefUrl);
	};
	return [ coords, main, showIcon, stickerWindowActive, stickerAddModalActive, stickerAddModalTabsInit, activeTab, favoriteStickers, favoriteStickersData, subscribedPacks, subscribedPacksSimple, filteredPacks, localPacks, linePackSearch, remotePackUrl, packsSearch, settings, grabPacks, subscribeToPack, unsubscribeToPack, formatUrl, sendSticker, favoriteSticker, unfavoriteSticker, filterPacks, count => `<span class="counts"><span>–</span>${count} sticker${1 === count ? "" : "s"}</span>`, id => {
		let tmp = "" + id;
		return "string" == typeof id && (id.startsWith("startswith-") ? tmp = "LINE " + id.replace("startswith-", "") : id.startsWith("emojis-") ? tmp = "LINE Emojis " + id.replace("emojis-", "") : id.startsWith("custom-") && (tmp = id.replace("custom-", ""))), 
		`<span class="appendix"><span>–</span><span title="ID: ${id}">${tmp}</span></span>`;
	}, toggleStickerWindow, toggleStickerModal, activateTab, scrollToStickers, event => {
		const value = event.target.value.trim();
		if (13 !== event.keyCode || !value.length) return;
		let newIndex = Number(value);
		if (isNaN(newIndex) || newIndex < 1 || newIndex > subscribedPacks.length) return toastError(`New position must be ≥ 1 and ≤ ${subscribedPacks.length}.`);
		newIndex--;
		let packId = event.target.dataset.pack;
		if (void 'undefined' === packId) return;
		localPackIdRegex.test(packId) || (packId = Number(packId));
		const oldIndex = subscribedPacks.findIndex(pack => pack.id === packId);
		if (oldIndex === newIndex) return;
		const packData = subscribedPacks.splice(oldIndex, 1);
		subscribedPacksSimple.splice(oldIndex, 1), subscribedPacks.splice(newIndex, 0, packData[0]), 
		subscribedPacksSimple.splice(newIndex, 0, packData[0].id), event.target.blur(), 
		event.target.value = String(oldIndex), $$invalidate(9, subscribedPacks), $$invalidate(10, subscribedPacksSimple), 
		saveToLocalStorage("magane.subscribed", subscribedPacks), toastSuccess(`Moved pack from position ${oldIndex + 1} to ${newIndex + 1}.`);
	}, deleteLocalPack, updateRemotePack, parseLinePack, parseRemotePackUrl, event => {
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
			assertRemotePackConsent("File: " + file.name, async () => {
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
		log(`settings['${name}'] = ${settings[name]}`), saveToLocalStorage("magane.settings", settings), 
		toastSuccess("Settings saved!", {
			nolog: !0
		});
	}, event => {
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
				onConfirm: () => {
					for (const key of valid) saveToLocalStorage(key, result[key]);
					for (const key of invalid) storage.removeItem(key);
					BdApi.showConfirmationModal("Reload Now", "Please reload Discord immediately (Ctrl + R) to complete Magane database replacement.", {
						cancelText: "Later",
						onConfirm: () => window.location.reload()
					});
				}
			});
		}, log(`Reading ${files[0].name}…`), reader.readAsText(files[0]);
	}, replaceDatabase, exportDatabase, (pack, sticker, f) => f.pack === pack.id && f.id === sticker, () => toggleStickerWindow(), () => grabPacks(), sticker => sendSticker(sticker.pack, sticker.id), sticker => unfavoriteSticker(sticker.pack, sticker.id), (pack, sticker) => sendSticker(pack.id, sticker), (pack, sticker) => favoriteSticker(pack.id, sticker), (pack, sticker) => unfavoriteSticker(pack.id, sticker), () => toggleStickerModal(), () => scrollToStickers("#pfavorites"), pack => scrollToStickers("#p" + pack.id), () => toggleStickerModal(), () => activateTab(0), () => activateTab(1), () => activateTab(2), () => activateTab(3), pack => unsubscribeToPack(pack), pack => updateRemotePack(pack.id), function input0_input_handler() {
		packsSearch = this.value, $$invalidate(15, packsSearch);
	}, pack => unsubscribeToPack(pack), pack => subscribeToPack(pack), pack => updateRemotePack(pack.id), pack => deleteLocalPack(pack.id), function input1_input_handler() {
		linePackSearch = this.value, $$invalidate(13, linePackSearch);
	}, () => parseLinePack(), function input2_input_handler() {
		remotePackUrl = this.value, $$invalidate(14, remotePackUrl);
	}, () => parseRemotePackUrl(), () => loadLocalRemotePack(), () => bulkUpdateRemotePacks(), function input4_change_handler() {
		settings.disableToasts = this.checked, $$invalidate(16, settings);
	}, function input5_change_handler() {
		settings.closeWindowOnSend = this.checked, $$invalidate(16, settings);
	}, function input6_change_handler() {
		settings.useLeftToolbar = this.checked, $$invalidate(16, settings);
	}, function input7_change_handler() {
		settings.hidePackAppendix = this.checked, $$invalidate(16, settings);
	}, function input8_change_handler() {
		settings.disableDownscale = this.checked, $$invalidate(16, settings);
	}, function input9_change_handler() {
		settings.disableImportedObfuscation = this.checked, $$invalidate(16, settings);
	}, function input10_change_handler() {
		settings.markAsSpoiler = this.checked, $$invalidate(16, settings);
	}, () => replaceDatabase(), () => exportDatabase(), function main_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			main = $$value, $$invalidate(1, main);
		});
	} ];
}

var App$2 = function getCjsExportFromNamespace(n) {
	return n && n.default || n;
}(Object.freeze({
	__proto__: null,
	default: class App extends class SvelteComponent {
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
	} {
		constructor(options) {
			super(), init(this, options, instance, create_fragment, safe_not_equal, {}, null, [ -1, -1, -1, -1, -1 ]);
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
