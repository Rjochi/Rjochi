# Content Editing

Edit source data only. Do not edit generated README or SVG files directly.

| Content | File |
| --- | --- |
| Name, username, summary, site settings | `data/profile.yaml` |
| Team name and link | `profile.team.name` and `profile.team.url` in `data/profile.yaml` |
| Selected projects | `data/projects.yaml` |
| Current focus | `data/focus.yaml` |
| Public repository snapshot | `data/public-snapshot.json` |
| Scene and clearance presets | `data/scenes/signature.yaml` |

Keep `reviewed_by_owner: false` until the owner has approved the exact public wording and scope. Do not add private repository data, credentials, or unsupported claims.

After editing, run `npm run test`, `npm run typecheck`, `npm run build`, and `npm run profile:render`. Review `build/profile/README.md` before applying it to the public README.

## Applying generated output

`npm run profile:apply` is a dry run by default. It changes nothing until the generated README has been reviewed and the command is explicitly run with `PROFILE_APPLY=1`.

## Project entries

`data/projects.yaml` の `title.ja`、`description.ja`、`repository`、`branch`、`url` を編集します。`url` は選択ブランチへのリンクです。並び順はYAMLの記載順です。大会結果などの補足リンクは `reference` で指定します。ブランチ選定の根拠は `docs/project-source-review.md` に記録しています。

`publish: true` の取り組みはドラフトでプレビューできます。`reviewed_by_owner: false` のまま公開用ビルドは通りません。

## 日本語ページの文章を変える

画面共通の文章は `data/page.ja.yaml` にまとまっています。AstroやTypeScriptを編集する必要はありません。

| 変更したい文章 | 編集場所 |
| --- | --- |
| 「障害物を避ける道を探し…」 | `data/page.ja.yaml` → `demo.description` |
| デモの見出し・注意書き | 同ファイル → `demo.title` / `demo.note` |
| 「デモのしくみ」の見出し・説明 | 同ファイル → `explanation.title` / `explanation.steps` |
| 再生・一時停止などのボタン | 同ファイル → `demo.controls` |
| 再生中・完了・静止表示のメッセージ | 同ファイル → `demo.status` |
| ナビゲーション・見出し・プレビュー表記 | 同ファイル → `navigation` / `work` / `focus` / `footer` |
| 名前・自己紹介・所属チーム | `data/profile.yaml` |
| 各取り組みのタイトル・説明・リンク | `data/projects.yaml` |
| 現在の関心の本文 | `data/focus.yaml` |

例：

```yaml
demo:
  description: "ここに表示したい説明を書きます。"
```

実際には既存の `demo.description` の行だけを書き換えてください。`demo` 全体を置き換える必要はありません。長い文章には `>-` を使えます。

```yaml
  description: >-
    ここに説明の前半を書きます。
    続きを次の行に書いても、画面では一つの文章になります。
```

`explanation.steps` は `title` と `body` の組を追加・並べ替えできます。キー名は保持してください。必須の文言が欠けていたり、空になっている場合は、ビルド時に該当する編集場所を表示します。文章はHTMLとして実行せず、文字として表示します。

`npm run dev -- --host 0.0.0.0` で起動したプレビューは保存後に更新されます。公開用ファイルや `npm run preview` の内容に反映するには `npm run build` を実行してください。英語版の共通文言は今後の英語版同期時に対応します。

## 日本語README

GitHubプロフィールのREADMEは `templates/readme.md` と既存のプロフィール・取り組みデータから生成します。取り組みの本文は `description.ja` の最初の一文を使い、選択ブランチと補足リンクはPagesと共通です。`focus.ja` が空の場合、「現在の関心」の欄は表示しません。

READMEの3Dデモは `assets/generated/profile-demo.gif` です。Three.jsの実際の描画と同じシーン・経路を使った無限ループGIFで、README上では操作できません。GIFの直下に「詳しくはこちら」でPagesへのリンクを表示します。リンク先は `data/profile.yaml` の `site.origin` と `site.base_path` です。生成結果は `build/profile/README.md` で確認してください。

GIFの再生成：Astroの開発サーバーを起動した状態で `npm run profile:animate` を実行します。PlaywrightのChromiumと、Python 3のPillowが必要です。別のポートの場合は `ANIMATION_BASE_URL` を指定します。GIFは `build/profile/assets/generated/profile-demo.gif` に生成されます。GIFの生成後、README生成・確認・適用を行ってください。
