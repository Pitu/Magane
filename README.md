<div align="center">
	<img src="https://chibisafe.moe/88r6gPQS.png" />
</div>

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://raw.githubusercontent.com/kanadeko/Kuro/master/LICENSE)
[![Chat / Support](https://img.shields.io/badge/Chat%20%2F%20Support-discord-7289DA.svg?style=flat-square)](https://discord.gg/5g6vgwn)
[![Support me](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.herokuapp.com%2Fpitu&style=flat-square)](https://www.patreon.com/pitu)
[![Support me](https://img.shields.io/badge/Support-Buy%20me%20a%20coffee-yellow.svg?style=flat-square)](https://www.buymeacoffee.com/kana)

### What does this do?

You know how LINE and Telegram have this beautiful sticker system where you can send different reactions with just one click? This is a new approach at doing exactly that but on Discord!

[It looks like this](https://chibisafe.moe/owdxQF9m.mp4)

### How even?

By injecting the script into Discord it will automatically pull a curated list of sticker packs from [chibisafe](https://chibisafe.moe) and add them to your Discord client. After that a heart button will appear in your message bar where you'll be able to see all the stickers!


### Can I make this permanent?

You can!

Currently the best way to get this up and running is by using [BetterDiscord](https://github.com/rauenzi/BetterDiscordApp/releases), but we also have experimental support for [Vencord](https://vencord.dev/).

#### BetterDiscord

- Grab the pre-built plugin file from [https://magane.moe/api/dist/betterdiscord](https://magane.moe/api/dist/.etterdiscord).
- Place the plugin file into your BetterDiscord's **plugins** directory.
- Activate Magane from Discord's **User Settings > BetterDiscord > Plugins**.

#### Vencord

> This is for the more advanced users.  
> Be advised that Magane's update checker is not available on Vencord.

- Grab the pre-built plugin file, `magane.vencord.js`, from this repo's dist directory, [https://github.com/Pitu/Magane/tree/master/dist](https://github.com/Pitu/Magane/tree/master/dist).
- Download Vencord git from `https://github.com/Vendicated/Vencord`.
- Follow its advanced user's installation guide at `https://github.com/Vendicated/Vencord/blob/main/docs/1_INSTALLING.md`.
- In Vencord git directory, navigate to `src`, then create `userplugins` directory (e.g. `/path/to/vencord/src/userplugins`).
- Drop Magane plugin into it.
- Rebuild Vencord (`pnpm build`), then restart your Discord.
- Optionally, if you had not done it before, you must inject Vencord into your Discord installation (`pnpm inject`).
- Activate Magane from Discord's **User Settings > Vencord > Plugins**.

### So how exactly do I use it after adding the script?

It's very easy.
After opening the sticker popup click on the little tool icon and you'll see a list of available sticker packs. Clicking on a sticker pack will subscribe you to it, making every sticker on that pack available on the main window. You can also right click any sticker in the list and add them to your favorites for easy access! To remove one, right click on it again.

Or just watch [the preview](https://chibisafe.moe/owdxQF9m.mp4) again.
