<p align="left">
  <a href="https://github.com/Rjochi">
    <img height="20" src="https://komarev.com/ghpvc/?username=Rjochi" />
  </a>
  <a href="https://github.com/Rjochi">
    <img height="20" src="https://img.shields.io/github/followers/Rjochi?label=follow&logo=github&style=flat" />
  </a>
</p>

# Ryo Jochi

創価大学理工学研究科情報システム工学専攻の大学院生。Team SOBITS所属。関心分野はロボティクスと自律システム。

所属チーム: [Team SOBITS](https://github.com/TeamSOBITS)

![障害物を避ける経路探索・曲線化・移動の3Dデモ](./assets/generated/profile-demo.gif)

[詳しくはこちら](https://rjochi.github.io/Rjochi/)

経路探索・曲線化・移動の流れを示す幾何学デモです。推力や機体特性を考慮した軌道生成・制御は再現していません。

## 代表的な取り組み

- **[微重力空間での自律移動](https://github.com/TeamSOBITS/sobits_intball2_gnc/tree/humble-devel)** — JAXAのInt-Ball2シミュレータを対象に、微重力空間での三次元自律移動と宇宙飛行士の検知・回避に取り組むパッケージ。 [大会で使用した実装（noetic-devel）](https://github.com/TeamSOBITS/sobits_intball2_gnc/tree/noetic-devel)
- **[宇宙ロボットの制御インターフェース](https://github.com/TeamSOBITS/intball2_common/tree/humble-devel)** — JAXAのInt-Ball2シミュレータ上のロボットを、外部のROS 2プログラムから制御するための共通パッケージ。
- **[ROS 1 / ROS 2をつなぐ開発環境](https://github.com/TeamSOBITS/int-ball2_platform_works/tree/humble-bridge)** — ROS 1で動作するInt-Ball2シミュレータとROS 2のユーザープログラムをつなぐDocker環境。
- **[ローカル音声認識のROS 2統合](https://github.com/TeamSOBITS/sobits_speech_recognition/tree/jazzy-devel)** — ローカルPCで動作する音声認識モデルを、ROS 2のActionインターフェースで利用するためのパッケージ。
- **[ローカル音声合成のROS 2統合](https://github.com/TeamSOBITS/sobits_tts/tree/jazzy-devel)** — ローカルPCで動作する音声合成モデルを、ROS 2のActionインターフェースで利用するためのパッケージ。
- **[ロボットの頭部ディスプレイ制御](https://github.com/TeamSOBITS/esp32_display/tree/jazzy-devel)** — ESP32を介して頭部ディスプレイを制御。
