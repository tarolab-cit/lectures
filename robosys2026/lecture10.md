---
marp: true
---
<!--
style: |
  section {
    line-height: 1.15;
  }
-->

<!-- footer: "ロボットシステム学第10回" -->

# ロボットシステム学

## 第10回: ROSシステムのテスト

鈴木 太郎（千葉工業大学）

<span style="font-size:70%">オリジナル: 上田 隆一（千葉工業大学）[ロボットシステム学 2025](https://github.com/ryuichiueda/slides_marp/tree/master/robosys2025) を改変</span>

<br />

<span style="font-size:70%">This work is licensed under a </span>[<span style="font-size:70%">Creative Commons Attribution-ShareAlike 4.0 International License</span>](https://creativecommons.org/licenses/by-sa/4.0/).
![](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)

---

<!-- paginate: true -->

## 今日やること

1. 第8回のコードをGitHubから取り出す
    - 第9回ではないので注意
2. 第8回の`listener`、`talker`の動作を確認するテストを書く
    - シェルスクリプトで（標準的な方法ではないかもしれない）
3. GitHub Actionsでテストを動かす
4. まとめ

---

## 1. 第8回のコードの取り出し

- GitHubでブランチを分けていましたか？ またはコミットしていましたか？
    - ブランチを分けていない場合（過去のコミットから取り出す）
        ```bash
        $ git log
        （中略）
        commit 3291472c08ad9407217b8ebf54b971ea4eefe7d6
        Author: Ryuichi Ueda <ryuichiueda@gmail.com>
        Date:   Tue Oct 4 11:18:56 2022 +0900

            Change for using Person

        commit a906a47eda6962306edc91f3e72175940d2a7505    #これっぽい
        Author: Ryuichi Ueda <ryuichiueda@gmail.com>
        Date:   Tue Oct 4 11:01:22 2022 +0900

            Update
        （中略）
        $ git checkout a906a47                 #コミットをチェックアウト
        $ git switch -c lesson10               #新たにブランチを作成
        Switched to a new branch 'lesson10'    #このあと動作確認を
        ```

---

## 2. テストの記述

- ノードを立ち上げ、`listener`の出力を検査
    - 標準的な方法ではないがシェルスクリプトで
    - `test`ディレクトリにシェルスクリプトを置く
        ```bash
        $ cd ~/ros2_ws/src/mypkg   #パッケージのトップディレクトリへ
        $ cd test                  #testディレクトリに移動
        $ vi test.bash             #記述（次ページ）
        ```
    - `test`ディレクトリには他のテストがすでにあるので、あとで見ておくこと

---

### `test.bash`の内容

- 10秒間ノードを実行して、`listener`が出力するはずの行を探す
    - 出力されるはずの行: `[listener-2] ...: Listen: 10`
    - 書いたら動作確認を
        - `grep`の行を変えて終了ステータスを観察する、`mypkg.log`を確認するなど
        ```bash
        #!/bin/bash

        dir=~
        [ "$1" != "" ] && dir="$1"   #引数があったらそちらをホームに変える

        cd $dir/ros2_ws
        colcon build
        source $dir/.bashrc
        timeout 10 ros2 launch mypkg talk_listen.launch.py > /tmp/mypkg.log

        cat /tmp/mypkg.log |
        grep 'Listen: 10'
        ```

---

## 3. GitHubでテストを動かす

- ROSのようなミドルウェア上で動くソフトのテスト
    - 環境を整えないとソフトが動かないので面倒<br />　
- CIサービスでの方法
    - その1: 毎回インストールする
    - その2: インストール済みのものを持ってくる
        - 今回はこっち
        - 「コンテナ」を利用

---

### コンテナ

- 今回は「ソフトウェア一式を箱に閉じ込めたもの」という理解で十分
    - 詳しくは2021年度までの講義資料で
    - https://youtu.be/Utvf4YmMJpk <br />　
- テストに利用するコンテナ
    - https://hub.docker.com/repository/docker/ryuichiueda/ubuntu22.04-ros2
        - 上田先生がUbuntu 22.04 LTSにROS 2をセットアップしたもの
        - ワークスペース: コンテナ内の`/root/ros2_ws/`
    - これをGitHub Actionsでダウンロードして使う

---

### ワークフローファイルの準備

- `test.yml`という名前で作成
    - どこに置くか分からない場合は第7回を復習
    - ディレクトリ構成がややこしく、間違えると何時間も解決しないことがあるので、すぐ質問を
        ```yaml
        name: test
        on: push
        jobs:
          test:
            runs-on: ubuntu-22.04
            container: ryuichiueda/ubuntu22.04-ros2:latest #前ページのコンテナを使うという宣言
            steps:
              - uses: actions/checkout@v2    #コンテナのカレントディレクトリにリポジトリを配置
              - name: build and test
                run: |
                  rsync -av ./ /root/ros2_ws/src/mypkg/    #リポジトリの中身をros2_ws下にコピー
                  cd /root/ros2_ws    #追加のパッケージが必要ならここでrosdep
                  bash -xv ./src/mypkg/test/test.bash /root    #実行
        ```
        - [実行例](https://github.com/ryuichiueda/mypkg/actions/runs/12026268478/job/33524904278)

---

## 4. まとめ

- ROS 2のパッケージをテストした
    - 今回はいろいろ応用が利くようにシェルスクリプトで
        - 補足: もっと便利なやり方があるはずなので、興味があれば調べてみること<br />　
- ROS 2のパッケージをGitHub Actionsでテストした
    - 環境を整えるワークフローを書くのは結構面倒だが、一度完成させればあとは簡単
    - GUIつきのROSパッケージでもテスト可能
        - ROS 1の例: [ryuichiueda/emcl2](https://github.com/ryuichiueda/emcl2)
