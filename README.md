# Kindle Vocab Lab

Kindleで英語本を読んでいる途中に出会った単語を、復習に回すための小さなローカルWebアプリです。

## 起動

```powershell
cd kindle-vocab-lab
python -m http.server 5173 --bind 127.0.0.1
```

ブラウザで `http://127.0.0.1:5173` を開きます。

## できること

- 単語、読み方、本のタイトル、日本語メモ、英英定義、出会った文、覚え方を登録
- PC/スマホのOS標準音声入力を使って単語欄へ入力
- Free Dictionary APIから英英定義と発音記号を取得
- MyMemory Translation APIから日本語訳の候補を取得
- Merriam-Webster Learner's Dictionary APIキーを設定すると、カード生成時に優先利用
- 使い方・型、コロケーション、例文、自作文、注意点を保存
- `知らない / 微妙 / 覚えた` で次回復習日を自動更新
- 学習分析タブで、ステージ分布、弱点ランキング、今日のおすすめ、最近の学習ログを確認
- MarkdownとJSONでエクスポート

## 保存場所

単語データはブラウザのLocalStorageに保存されます。別ブラウザや別端末へ移す場合は、出力タブからJSONを書き出してください。

GitHub Pagesなど別ドメインで開いた場合、LocalStorageは別扱いになります。ローカル環境の単語データは自動では移らないため、必要に応じてエクスポートしてください。

## 学習設計

設計意図は `LEARNING_DESIGN.md` にまとめています。

## APIキー

`設定` タブにMerriam-Webster Learner's Dictionary APIキーを貼り付けて保存します。キーが保存されている場合、`カード生成` はMerriam-Websterを優先し、失敗した場合だけ無料辞書へフォールバックします。

APIキーはこのリポジトリには保存しません。各ブラウザのLocalStorageにだけ保存されます。

## GitHub Pages

GitHub Pages向けのActionsワークフローを `.github/workflows/pages.yml` に用意しています。

初回のみ、GitHubのリポジトリ設定で `Settings > Pages > Build and deployment > Source` を `GitHub Actions` にしてください。以後は `main` ブランチへpushすると自動で公開されます。

詳しい手順は `DEPLOYMENT.md` を参照してください。
