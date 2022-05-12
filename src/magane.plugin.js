/**
* @name Magane
* @displayName Magane
* @description Bringing LINE stickers to Discord in a chaotic way.
* @author Kana
* @authorId 176200089226706944
* @authorLink https://github.com/Pitu
* @license MIT - https://opensource.org/licenses/MIT
* @version 4.0.0
* @invite 5g6vgwn
* @source https://github.com/Pitu/Magane
* @updateUrl https://raw.githubusercontent.com/Pitu/Magane/master/dist/magane.min.js
* @website https://magane.moe
* @donate https://github.com/sponsors/Pitu
* @patreon https://patreon.com/pitu
*/

module.exports = (() => {
    const config = {
        info: {
            name: 'Magane',
            authors: [
                {
                    name: 'Kana',
                    discord_id: '176200089226706944',
                    github_username: 'Pitu'
                },
                {
                    name: 'Bobby',
                    discord_id: '530445553562025984',
                    github_username: 'BobbyWibowo'
                }
            ],
            version: '4.0.0',
            description: 'Bringing LINE stickers to Discord in a chaotic way.',
            github: 'https://github.com/Pitu/Magane',
            github_raw: 'https://raw.githubusercontent.com/Pitu/Magane/master/dist/magane.min.js'
        },
        changelog: [
            // { title: 'Bug Fixes', types: 'fixed', items: ['Fixed something.'] }
        ],
        defaultConfig: [
            {
                type: 'switch',
                id: 'disableToasts',
                name: 'Disable toasts',
                value: false
            },
            {
                type: 'switch',
                id: 'closeWhenSending',
                name: 'Automatically close window after sending a sticker',
                value: false
            },
            {
                type: 'switch',
                id: 'leftToolbar',
                name: 'Use left toolbar instead of bottom toolbar on main window',
                value: false
            },
            {
                type: 'switch',
                id: 'hideAppendix',
                name: 'Hide pack\'s appendix in packs list (e.g. its numerical ID)',
                value: false
            },
            {
                type: 'switch',
                id: 'disableDownscaling',
                name: 'Disable downscaling of manually imported LINE Store packs',
                value: false
            },
            {
                type: 'switch',
                id: 'disableObfuscation',
                name: 'Disable obfuscation of files names for imported custom packs',
                value: false
            },
            {
                type: 'switch',
                id: 'stickerSpoilers',
                name: 'Mark stickers as spoilers when sending',
                value: false
            }
        ]
    };
    // eslint-disable-next-line no-negated-condition
    return !global.ZeresPluginLibrary ? class {
        constructor() { this._config = config; }
        load() {
            BdApi.showConfirmationModal('Library plugin is needed',
                [`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`], {
                confirmText: 'Download',
                cancelText: 'Cancel',
                onConfirm: () => {
                    require('request').get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', async (error, response, body) => {
                        if (error) return require('electron').shell.openExternal('https://betterdiscord.app/Download?id=9');
                        await new Promise(r => require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, r));
                        window.location.reload();
                    });
                }
            });
        }

        start() {}
        stop() {}
    }
        : (([Plugin, Api]) => {
            const plugin = (Plugin, Api) => {
                const {
                    Patcher,
                    WebpackModules,
                    Logger,
                    DOMTools,
                    Toasts
                } = Api;

                const maganeIcon = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M18.5 11c-4.136 0-7.5 3.364-7.5 7.5c0 .871.157 1.704.432 2.482l9.551-9.551A7.462 7.462 0 0 0 18.5 11z" fill="#b9bbbe"/><path d="M12 2C6.486 2 2 6.486 2 12c0 4.583 3.158 8.585 7.563 9.69A9.431 9.431 0 0 1 9 18.5C9 13.262 13.262 9 18.5 9c1.12 0 2.191.205 3.19.563C20.585 5.158 16.583 2 12 2z" fill="#b9bbbe"/></svg>';
                const channelTextAreaContainer = WebpackModules.find(m => m?.type?.render?.displayName === "ChannelTextAreaContainer")?.type;
                const buttonClasses = WebpackModules.getByProps("emojiButton", "stickerButton");
                const channelTextAreaSelector = new DOMTools.Selector(buttonClasses.channelTextArea);
                

                return class Magane extends Plugin {
                    patch() {
                        Patcher.before(channelTextAreaContainer, "render", (_, [props]) => {
                            // Add button to channel text area
                        });
                    }
    
                    cleanup() {
                        Patcher.unpatchAll();
                    }

                    onStart() {
                        try{
                            this.patch();
                        } catch(e) {
                            Toasts.warn(`${config.info.name}: An error occured during startup.`);
                            Logger.error(`Error while patching: ${e}`);
                            console.error(e);
                            Patcher.unpatchAll();
                        }
                    }

                    onStop() {
                        this.cleanup();
                    }

                    getSettingsPanel() { return this.buildSettingsPanel().getElement(); }
                };
            };
            return plugin(Plugin, Api);
        })(global.ZeresPluginLibrary.buildPlugin(config));
})();