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

1. テストするコードをGitHubから取り出す
    - 第9回でlaunchファイルを作った時点のコード
2. `listener`、`talker`の動作を確認するテストを書く
    - シェルスクリプトで（標準的な方法ではないかもしれない）
3. GitHub Actionsでテストを動かす
4. まとめ

---

## 1. テストするコードの取り出し

- テストするのは第9回の`Add launch file`のコミット
    - このあと`Person`型やサービスに変更したので、最新のコードではない
- 過去のコミットを探して、そこから新しいブランチを作る
    ```bash
    $ cd ~/ros2_ws/src/mypkg
    $ git log --oneline                 #コミットの一覧を1行ずつ表示
    （中略）
    a906a47 Add launch file             #これ（ハッシュは人によって違う）
    3291472 Initial commit
    $ git switch -c lesson10 a906a47    #このコミットからブランチを作成
    Switched to a new branch 'lesson10'
    ```
- ビルドして`ros2 launch mypkg talk_listen.launch.py`で動作確認を
    - `Listen: 数字`と表示されればOK

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
    - `~/.bashrc`ではなくROSの設定を直接読み込む（スクリプトからだと`.bashrc`は途中で終わるため）
    ```bash
    #!/bin/bash

    dir=~
    [ "$1" != "" ] && dir="$1"   #引数があったらそこをros2_wsのある場所にする

    cd $dir/ros2_ws
    source /opt/ros/jazzy/setup.bash
    colcon build
    source install/setup.bash
    timeout 10 ros2 launch mypkg talk_listen.launch.py > /tmp/mypkg.log

    cat /tmp/mypkg.log |
    grep 'Listen: 10'
    ```
- 書いたら`bash test.bash`で動作確認を
    - `grep`の行を変えて終了ステータスを観察する、`mypkg.log`を確認するなど

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

- 今回は「ソフトウェア一式を箱に閉じ込めたもの」という理解で十分<br />　
- テストに利用するコンテナ: `ros:jazzy`
    - ROS 2の公式イメージ（[Docker Hub](https://hub.docker.com/_/ros)）
    - Ubuntu 24.04にROS 2 Jazzyとビルド用のツール（`colcon`など）がインストール済み
    - これをGitHub Actionsでダウンロードして使う

---

### ワークフローファイルの準備

- `mypkg`リポジトリに`.github/workflows/test.yml`を作成（第7回と同じ）
    ```bash
    $ cd ~/ros2_ws/src/mypkg
    $ mkdir -p .github/workflows    #-p: 途中のディレクトリもまとめて作る
    $ vi .github/workflows/test.yml
    ```
    ```yaml
    name: test
    on: push
    jobs:
      test:
        runs-on: ubuntu-latest
        container: ros:jazzy           #ROS 2 Jazzyの公式コンテナを使う
        steps:
          - uses: actions/checkout@v4
            with:
              path: ros2_ws/src/mypkg  #ワークスペースの形でリポジトリを配置
          - name: build and test
            run: bash -xv ./ros2_ws/src/mypkg/test/test.bash $GITHUB_WORKSPACE
    ```
    - `$GITHUB_WORKSPACE`: リポジトリが置かれる場所（ここに`ros2_ws`ができる）

---

### pushして結果を確認

- コミットしてpush
    ```bash
    $ cd ~/ros2_ws/src/mypkg
    $ git add -A
    $ git commit -m "Add test"
    $ git push -u origin lesson10    #新しいブランチなので初回は-u origin lesson10
    ```
- GitHubの「Actions」タブで結果を確認
    - <span style="color:green">$\checkmark$</span>: テスト成功、<span style="color:red">$\times$</span>: テスト失敗
    - 失敗したらログを見て、どこで止まったかを確認
- ディレクトリ構成を間違えると何時間も解決しないことがあるので、すぐ質問を

---

## 4. まとめ

- ROS 2のパッケージをテストした
    - 今回はいろいろ応用が利くようにシェルスクリプトで
        - 補足: もっと便利なやり方があるはずなので、興味があれば調べてみること<br />　
- ROS 2のパッケージをGitHub Actionsでテストした
    - 公式のコンテナを使えば、ROSのインストールを書かなくてよい
    - 環境を整えるワークフローを書くのは結構面倒だが、一度完成させればあとは簡単
