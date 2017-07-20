exports.Style = `
div#boot-modal { display: none; }
div.channel-textarea-stickers {
	position: absolute;
	top: 12px !important;
	right: 45px;
	background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');
	width: 22px;
	height: 22px;
	background-position: -176px -396px;
	background-size: 924px 704px;
	background-repeat: no-repeat;
	transition: border-bottom-color .1s ease-in-out;
	-webkit-filter: grayscale(100%);
	filter: grayscale(100%);
	cursor: pointer;
}

div.channel-textarea-stickers:hover {
	transform: scale(1.275);
	-webkit-transform: scale(1.275);
	filter: grayscale(0%);
	-webkit-filter: grayscale(0%);
}

div.sticker-selector {
	z-index: 2000;
	display: none;
	bottom: 46px;
	right: 0px;
	width: 600px;
}

div.sticker-selector.active { display: block; }
.sticker-selector .emoji-picker .scroller .row { height: 96px; }

.emoji-picker .scroller .emoji-item.sticker {
	width: 88px;
	height: 88px;
	position: relative;
}

.emoji-picker .scroller .emoji-item.sticker.favorited .sticker-fav {
	background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');
	background-position: -462px -132px;
	background-size: 924px 704px;
	position: absolute;
	right: 5px;
	bottom: 5px;
	width: 22px;
	height: 22px;
}

.diversity-selector .item.sticker-settings-btn {
	background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');
	background-position: 0px -330px;
	background-size: 924px 704px;
	padding: 0px;
	margin-top: 3px;
}

.kuro-stickers .popout .emoji-picker .scroller-wrap,
.kuro-stickers .popout .emoji-picker .scroller-wrap .scroller {
	min-height: 400px;
}

.sticker-container, .config-container {
	display: block;
}

.sticker-container.hidden, .config-container.hidden {
	display: none;
}

.pack-container {
	position: relative;
	cursor: pointer;
}

.pack-container > img {
	background: #efefef;
}

.pack-name, .pack-length {
	color: #98aab6;
	font-size: 12px;
	font-weight: 500;
	padding: 0 4px;
	text-transform: uppercase;
	position: absolute;
	left: 65px;
	top: 14px;
}

.pack-length {
	top: 27px;
}

.pack-status.active {
	background-image: url('/assets/f24711dae4f6d6b28335e866a93e9d9b.png');
	/*background-position: -484px -132px;*/
	background-position: -176px -396px;
	background-size: 924px 704px;
	position: absolute;
	right: 12px;
	top: 13px;
	width: 22px;
	height: 22px;
	margin: 3px;
}

.pack-divider {
	width: 50%;
	height: 1px;
	background: #e8e8e8;
	margin-left: 25%;
	margin-top: 10px;
	margin-bottom: 10px;
}
`;
