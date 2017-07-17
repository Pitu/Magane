<div align="center">
	<img src="https://lolisafe.moe/88r6gPQS.png" />
</div>

### What does this do?
You know how LINE and Telegram have this beautiful sticker system where you can send different reactions with just one click? This is a new approach at doing exactly that but on Discord!

[This is how it looks like](https://lolisafe.moe/OXI6AEeH.mp4)

### How even?
By injecting the script into Discord it will automatically pull a curated list of sticker packs from [lolisafe](https://lolisafe.moe) and add them to your Discord client. After doing that a little heart button will appear next to the emoji one where you'll be able to see all the stickers!

### Do I have to inject this on each restart?
Unless you use something like [mydiscord](https://github.com/justinoboyle/mydiscord) then yeah, everytime you start Discord you need to paste the script. I highly recommend using mydiscord and adding the minified script to the plugins array!

### So how exactly do I use it after adding the script?
It's very easy.
After opening the sticker popup click on the little tool icon and you'll see a list of available sticker packs. Clicking on a sticker pack will subscribe you to it making every sticker on that pack available on the main window. You can also right click any sticker on the list and add them to favorites for easy access! To remove one, right click on it again.

### Give me the code, I want to run this right now!
Press `CTRL + Shift + i` or `CMD + Shift + i` to open DevTools and paste the following code inside:
```js
document.head.appendChild(document.createElement('script')).setAttribute("src", "https://cdn.rawgit.com/Pitu/Magane/fd13b928/dist/stickers.min.js")
```
If you are using mydiscord, make sure to add the following script to the plugins array:
```
https://raw.githubusercontent.com/Pitu/Magane/master/dist/stickers.min.js
```

> Injecting random code into your Discord client could be harmful, that's why I provide the full source code so you can check out exactly what the script does. This plugin makes use of your personal token to make a request to the Discord api each time you click a sticker and never leaves nor does it do anything else with it. The script found in `/dist` is generated, webpacked and babeled from the source by running `npm run webpack`.
