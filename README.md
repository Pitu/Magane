<div align="center">
	<img src="https://chibisafe.moe/88r6gPQS.png" />
</div>

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://raw.githubusercontent.com/kanadeko/Kuro/master/LICENSE)
[![Chat / Support](https://img.shields.io/badge/Chat%20%2F%20Support-discord-7289DA.svg?style=flat-square)](https://discord.gg/5g6vgwn)
[![Support me](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.herokuapp.com%2Fpitu&style=flat-square)](https://www.patreon.com/pitu)
[![Support me](https://img.shields.io/badge/Support-Buy%20me%20a%20coffee-yellow.svg?style=flat-square)](https://www.buymeacoffee.com/kana)

### What does this do?

You know how LINE and Telegram have this beautiful sticker system where you can send different reactions with just one click? This is a new approach at doing exactly that but on Discord!

[It looks like this!](https://chibisafe.moe/owdxQF9m.mp4)

### How even?

By injecting the script into Discord it will automatically pull a curated list of sticker packs from [chibisafe](https://chibisafe.moe) and add them to your Discord client. After that a heart button will appear in your message bar where you'll be able to see all the stickers!


### Can I make this permanent?

You can!

Currently the best way to get this up and running is by using [BetterDiscord](https://github.com/rauenzi/BetterDiscordApp/releases), but we also have experimental support for [Vencord](https://vencord.dev/).

#### BetterDiscord

- Grab Magane's BetterDiscord plugin file from [https://magane.moe/api/dist/betterdiscord](https://magane.moe/api/dist/betterdiscord).
- Place the plugin file into your BetterDiscord's **plugins** directory.
- Activate Magane from Discord's **User Settings > BetterDiscord > Plugins**.

#### Vencord

> This is for the more advanced users.  
> Be advised that Magane's **update checker is not available** on Vencord.  
> You must manually consult this repo to check for updates! Or just check back whenever it breaks due to Discord's updates...

1. Grab Magane's Vencord plugin file from [https://magane.moe/api/dist/vencord](https://magane.moe/api/dist/vencord).
2. Install Vencord from source. Follow its installation guide at [https://docs.vencord.dev/installing/](https://docs.vencord.dev/installing/).
3. In Vencord git directory, navigate to `src`, then create `userplugins` directory (e.g. `/path/to/vencord/src/userplugins`).
4. Place Magane's plugin file into it.
5. Rebuild Vencord (`pnpm build`).
6. (optional) If you had not done it before, you must inject Vencord into your Discord installation (`pnpm inject`).  
For those that use **Vesktop**, please see below.
7. Restart your Discord/Vesktop.
8. Activate Magane from Discord's **User Settings > Vencord > Plugins**.

#### Vesktop

Follow the same steps as above, until step 6.

Then in your Vesktop, navigate to Discord's **User Settings > Vencord > Vesktop Settings > Open Developer Settings > Vencord Location**. Change its directory to the **dist** sub-directory of your local copy of Vencord git [(preview)](https://chibisafe.moe/pCX4Qa82.png). Then restart Vesktop.

You should now be able to activate Magane from Vesktop's **Plugins** settings.

### So how exactly do I use it after adding the script?

It's very easy.
After opening the sticker popup click on the little tool icon and you'll see a list of available sticker packs. Clicking on a sticker pack will subscribe you to it, making every sticker on that pack available on the main window. You can also right click any sticker in the list and add them to your favorites for easy access! To remove one, right click on it again.

Or watch [the preview](https://chibisafe.moe/owdxQF9m.mp4) again.
