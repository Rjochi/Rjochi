# Project source review

公開情報の確認日：2026-10-07。GitHub REST APIで公開状態と全公開ブランチを確認し、各ブランチから到達可能な `author=Rjochi` のコミット数をページ末尾まで集計。マージ後の共通履歴を含むため、ブランチ固有の作業量や担当範囲を示す値ではない。同数なら既定ブランチを選択。削除済みブランチ・未紐付け著者・squash前の履歴は集計できない。

| Repository | Branch | Rjochi commits | Selection |
| --- | --- | ---: | --- |
| sobits_speech_recognition | fix/transcribe-on-cancel | 4 |  |
| sobits_speech_recognition | jazzy-devel | 4 | selected |
| sobits_tts | feature/robo_cafe_project | 56 |  |
| sobits_tts | humble-devel | 42 |  |
| sobits_tts | jazzy-devel | 56 | selected |
| intball2_common | humble-devel | 8 | selected |
| sobits_intball2_gnc | humble-devel | 140 | selected |
| sobits_intball2_gnc | noetic-devel | 4 |  |
| int-ball2_platform_works | humble-bridge | 21 | selected |
| int-ball2_platform_works | noetic | 0 |  |
| int-ball2_platform_works | rcjo2026 | 8 |  |
| esp32_display | humble-devel | 23 |  |
| esp32_display | jazzy-devel | 23 | selected |
| sobits_display | feat/display-batteries | 10 |  |
| sobits_display | feat/grid-based | 10 |  |
| sobits_display | feat/push-to-talk-button | 10 |  |
| sobits_display | fix/shrink-textbox | 10 |  |
| sobits_display | humble-devel | 10 |  |
| sobits_display | jazzy-devel | 10 | selected |

説明は選択ブランチのREADMEと本人提供の概要に基づく。GNCの大会使用・宇宙飛行士検知回避は本人提供情報。チームの1位は大会運営者の結果で確認（個人賞や単独開発とは表現しない）：https://www.saira.or.jp/robocup-space-2026.html

本人がesp32_displayを公開に変更した後、REST APIでpublic状態とREADMEを確認。humble-devel / jazzy-develともRjochiの到達可能コミットは23件のため、既定のjazzy-develを選択。まばたき・指定時間の画像表示・TTS/STT自動検知の説明はREADMEと一致。sobits_displayは別の実装で、置き換えない。

本人訂正：2026 @Space Challenge優勝時に使用した実装は `sobits_intball2_gnc/noetic-devel`。3D幾何学デモに関連する研究は `humble-devel`。主リンクは研究のhumble-develを維持し、大会使用実装はnoetic-develへの補足リンクで明示する。コミット数から大会使用ブランチを推測しない。幾何学デモは実際のGNC実装そのものではない。
