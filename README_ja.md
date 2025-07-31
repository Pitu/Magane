<div align="center">
	<img src="https://chibisafe.moe/88r6gPQS.png" />
</div>

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://raw.githubusercontent.com/kanadeko/Kuro/master/LICENSE)
[![Chat / Support](https://img.shields.io/badge/Chat%20%2F%20Support-discord-7289DA.svg?style=flat-square)](https://discord.gg/5g6vgwn)
[![Support me](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.herokuapp.com%2Fpitu&style=flat-square)](https://www.patreon.com/pitu)
[![Support me](https://img.shields.io/badge/Support-Buy%20me%20a%20coffee-yellow.svg?style=flat-square)](https://www.buymeacoffee.com/kana)

### これは何？

LINE や Telegram のように、ワンクリックでさまざまなリアクションを送信できる素敵なスタンプ機能がありますよね？  
これは Discord 上でまさにそれを実現するための新しいアプローチです！

[こんな感じです！](https://chibisafe.moe/owdxQF9m.mp4)

### どうやって動くの？

このスクリプトを Discord に注入することで、[chibisafe](https://chibisafe.moe) から厳選されたスタンパックを自動的に取得し、あなたの Discord クライアントに追加します。その後、メッセージバーにハートのボタンが表示され、すべてのスタンプを確認できるようになります！

### 永続的に使えるの？

もちろん可能です！

現在、この機能を有効にする最も簡単な方法は [BetterDiscord](https://github.com/rauenzi/BetterDiscordApp/releases) か [Vencord](https://vencord.dev/) を使うことです。

#### BetterDiscord の場合

- [https://magane.moe/api/dist/betterdiscord](https://magane.moe/api/dist/betterdiscord) から Magane の BetterDiscord プラグインファイルをダウンロードします。
- プラグインファイルを BetterDiscord の **plugins** ディレクトリに配置します。
- Discord の **ユーザー設定 > BetterDiscord > プラグイン** から Magane を有効にします。

#### Vencord の場合

1. [https://github.com/Pitu/Magane/tree/master/dist/maganevencord](https://github.com/Pitu/Magane/tree/master/dist/maganevencord) から Magane の Vencord プラグインディレクトリを取得します。
2. ソースから Vencord をインストールします。インストール手順は [https://docs.vencord.dev/installing/](https://docs.vencord.dev/installing/) を参照してください。
3. Vencord の git ディレクトリで `src` に移動し、`userplugins` ディレクトリを作成します（例: /path/to/vencord/src/userplugins）。
4. その中に Magane のプラグインディレクトリを配置します（例: .../userplugins/maganevencord）。`index.ts` と `native.ts` の両方が含まれている必要があります。
5. Vencord を再ビルドします（`pnpm build`）。
6. （オプション）未実施であれば、Discord に Vencord を注入する必要があります（`pnpm inject`）。  
**Vesktop** を使用している場合は、下記を参照してください。
7. Discord / Vesktop を再起動します。
8. Discord の **ユーザー設定 > Vencord > プラグイン** から Magane を有効にします。

> Vencord は CSP を強制するため、サードパーティの Chibisafe ホストからパックをインポートしたい場合は、`native.ts` ファイルにドメインを追加する必要があります。  
> 変更後は Discord / Vesktop を再起動してください。

#### Vesktop の場合

上記の手順のステップ 6 まで同様に実施します。

その後、Vesktop 内の **ユーザー設定 > Vencord > Vesktop 設定 > 開発者設定を開く > Vencord の場所を開く** に進みます。  
Vencord git のローカルコピー内の **dist** サブディレクトリを指定してください [(プレビュー)](https://chibisafe.moe/pCX4Qa82.png)。その後、Vesktop を再起動します。

これで Vesktop の **プラグイン** 設定から Magane を有効にできるようになります。

### スクリプトを追加したあとの使い方は？

とても簡単です。  
スタンプポップアップを開いたら、右上の小さなツールアイコンをクリックしてください。利用可能なスタンパックの一覧が表示されます。  
スタンパックをクリックすると、それに購読され、そのパック内のすべてのスタンプがメイン画面で使用可能になります。  
スタンプを右クリックするとお気に入りに追加できます。再度右クリックすることで削除できます。

もう一度 [プレビュー動画](https://chibisafe.moe/owdxQF9m.mp4) をご覧ください。
