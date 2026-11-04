---
marp: true
---
<!--
style: |
  section {
    line-height: 1.15;
  }
-->

<!-- footer: "ロボットシステム学第7回" -->

# ロボットシステム学

## 第7回: GitHubでのテスト

鈴木 太郎（千葉工業大学）

<span style="font-size:70%">オリジナル: 上田 隆一（千葉工業大学）[ロボットシステム学 2025](https://github.com/ryuichiueda/slides_marp/tree/master/robosys2025) を改変</span>

<br />

<span style="font-size:70%">This work is licensed under a </span>[<span style="font-size:70%">Creative Commons Attribution-ShareAlike 4.0 International License</span>](https://creativecommons.org/licenses/by-sa/4.0/).
![](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)

---

<!-- paginate: true -->

## 今日やること

- GitHub Actions
- READMEの整備

---

## 1. GitHub Actions

---

### ソフトウェアのテスト

- 前回: `test.bash`を書いて手元で実行（終了ステータスで判定）
  - 自分で使うソフトウェアならこれくらいで十分<br />　
- 仕事や人の使うソフトウェアの場合は？
  - 様々な環境に対応する必要性
    - Pythonのバージョン
    - Linuxだけじゃなく、他のOSは？
    - 自分の使っている環境（いろんなものが既にインストール済み）以外
  - 常に動作しているものが存在
    - 止めないでどうやって開発したものをマージするのか
  - ちゃんとテストしていると示したい

---

### テストが（も）できるウェブサービス

- そういうものが存在
  - [GitHub Actions](https://github.com/features/actions)（この講義で利用）
  - [CircleCI](https://circleci.com/ja/)<br />　
- 基本的な動作
  1. GitHub等にpushされたコードをテスト
    - GitHub等のページに結果が表示されるように手配
  2. テストが通ったら次のアクションに
    - リリースしてユーザーが利用可能に
    - あるいは<span style="color:red">動いている本番のシステムに反映</span>


---

### 改めてテストの役割

- 抜け目のないテストにより
  - デバッグやリリースの際の手間の削減が可能
  - 「動いているシステムは怖くていじれない」からの脱却
    - 「継続的インテグレーション（CI）」「継続的デリバリー（CD）」「継続的デプロイ」
    - 前ページのサービス（<span style="color:red">CI/CDサービス</span>）のテスト機能: CIやCDを実現するためのもの　
- <span style="color:red">「自動」でテストできることがキモ</span>
  - 自動化の仕組み: テストの終了ステータスが0$\rightarrow$自動化のプログラムを起動
  - 前回`exit $res`で終了ステータスを返したのはこのため

---

### GitHub Actions

- GitHubのCI/CDサービス
  - GitHubと一体になっていて使いやすいのでこの講義で利用
  - テストをするときの使い方
    - リポジトリに`.github/workflows`というディレクトリを作成
    - その中に$\circ\circ$`.yml`というファイル（ワークフローファイル）を作成
      - とりあえず`test.yml`で
    - テストの手続きを記述（次ページ）
 ```bash
$ mkdir .github    #robosys2026のリポジトリのトップディレクトリで
$ cd .github/      #.githubディレクトリは隠れディレクトリになるので注意（lsでは出ず、ls -aで出る）
$ mkdir workflows
$ cd workflows/
$ touch test.yml   #「./robosys2026/.github/workflows/test.yml」ができているとOK
 ```

---

### テストの手続きの記述

- 下の例のように記述
  - YAML（YAML Ain't a Markup Language）形式
    - データをテキストファイルに記述するときに使われる形式のひとつ
      - ROSでも随所に利用される
    - インデントは半角空白2つが基本
      - 「キー: 値」でデータを作る。インデントされているものは全体が値
      - 「`-`」は配列の要素

```yaml
name: test        #name: ワークフローの名前
on: push          #on: いつこのワークフローを走らせるか
jobs:             #走らせたい処理（ジョブ）のリスト
  test:           #testというジョブを作る
    runs-on: ubuntu-latest   #どの環境で動かすか
    steps:                   #手続きの記述
    - uses: actions/checkout@v5  #https://github.com/actions/checkoutのバージョン5を使用
    - name: All test             #このジョブの名前
      run: bash -xv ./test.bash  #テストのシェルスクリプトを走らせる
```

---

### push$\rightarrow$ワークフローの自動実行

- リポジトリのページに小さな記号
  - <span style="color:orange">$\bullet$</span>: 実行中、<span style="color:green">$\checkmark$</span>: テスト成功、<span style="color:red">$\times$</span>: テスト失敗
<img src="./figs/github_actions_running.png" width="60%" />
- 記号を左クリックすると小窓が出現$\rightarrow$「Details」を押してみましょう
<img src="./figs/github_actions_ok.png" width="65%" />

---

### ワークフローのログ確認

- Detailsを押すと行われた処理のシェルの出力が閲覧可能
  - 「All test」をクリックすると`test.bash`のログ
<img src="./figs/testlog.png" width="70%" />
- 全項目の終了ステータスが0なら<span style="color:green">$\checkmark$</span>の表示

---

### 複数バージョンのPythonを試す

<style scoped>pre { font-size: 85%; }</style>

- 準備: `plus`のシバンを<span style="color:red">`#!/usr/bin/env python3`</span>に変更してコミット
  - `PATH`から`python3`を探して実行（手元では今までと同じ動作）
- ジョブに`strategy/matrix/python-version`を追加
  ```yaml
  name: test
  on: push
  jobs:
    test:
      runs-on: ubuntu-latest
      strategy:
        matrix:
          python-version: ["3.10", "3.11", "3.12", "3.13", "3.14"]
      steps:
      - uses: actions/checkout@v5
      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v6
        with:
          python-version: ${{ matrix.python-version }}
      - name: All test
        run: bash -xv ./test.bash
  ```
  - 実行してみると、全バージョンに対してテストが走る

---

## 2. READMEの整備

- README: このソフトを使ってもらうときに最初に読んでもらうドキュメント
  - 練習リポジトリの中にある`README.md`
  ```markdown
  # robosys2026
  ロボットシステム学の練習リポジトリ
  ```
    - Markdownという形式で記述
  - GitHubだとこのように表示される<img src="./figs/readme_md.png" width="70%" />
    - 今のところ不親切


---

### READMEに書くこと

- 全て書く必要はないが、ユーザーが困らないように（[例](https://github.com/shellgei/rusty_bash)）
  - 何をするためのソフトか
  - 使い方
    - ダウンロード、インストール、起動する手順、簡単な使い方
  - どんな環境で使えるか
    - OS/Pythonのバージョン/他に必要なソフトウェアやライブラリ
  - テストの結果（後述）
  - 権利関係・謝辞
    - 著作権、ライセンス（利用しているソフトウェアについても）
    - 手伝ってくれた人のリストと手伝いの中身
  - その他必要なこと

---

### テスト結果やテストに対する記述


- README.mdの例（鵜呑みにしないこと。コピーしても正解になりません）
  ```md
  # plusコマンド
  ![test](https://github.com/<ユーザ名>/robosys2026/actions/workflows/test.yml/badge.svg)
  ↑ テスト結果を反映したバッジの画像が埋め込まれる（<ユーザ名>は各自変更を）

  標準入力から読み込んだ数字を足す。

  （ここに前ページの項目をいろいろ書く）

  ## 必要なソフトウェア
  - Python
    - テスト済みバージョン: 3.10〜3.14

  ## テスト環境
  - Ubuntu 24.04 LTS

  ## ライセンス
  - このソフトウェアパッケージは、3条項BSDライセンスの下、再頒布および使用が許可されます。
  - © 2026 Taro Suzuki
  ```

---

### GitHub上での表示

<img src="./figs/readme_with_badge.png" width="70%" />
（注意: 細かいところは前のページの記述と違いがあります）


---

## まとめ

- CI/CDサービスのひとつを利用
  - pushしたときに自動でテスト$\rightarrow$結果を表示
    - ユーザーに状況を伝達
  - 終了ステータスを利用
    - 最新のサービスでも基本的な仕組みに依存　
- READMEの整備
  - リポジトリのソフトを安心して広く使ってもらうために必須
  - ある程度フォーマットは決まっているものの、ユーザーへの気配り重視で記述しましょう


---

## 課題1（詳細はmanabaで）

- 誰かの役に立つlinuxコマンドを作成する
    - コマンドなので・・・
        - 何らかの文字を入力（引数、オプション）し、加工して標準出力に出力
    - robosys2026のリポジトリでも新たに作成したリポジトリでもOK
- リポジトリを充実させる
    - 少しづつ開発、コミットした履歴がある
    - READMEをちゃんと書く
    - GitHub Actionsでいろんなテストを実行
    - 著作権、ライセンスの問題を解決する
- plusコマンドでないものを作りましょう
- 標準入出力はパイプでつなぐことを想定（余計なメッセージを出さない）
  - エラーは標準エラー出力から
- 人と偶然似てしまっても同じものが多いと減点対象になります
