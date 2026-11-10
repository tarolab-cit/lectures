---
marp: true
---
<!--
style: |
  section {
    line-height: 1.15;
  }
-->

<!-- footer: "ロボットシステム学第8回" -->

# ロボットシステム学

## 第8回: Robot Operating System (ROS 2)

鈴木 太郎（千葉工業大学）

<span style="font-size:70%">オリジナル: 上田 隆一（千葉工業大学）[ロボットシステム学 2025](https://github.com/ryuichiueda/slides_marp/tree/master/robosys2025) を改変</span>

<br />

<span style="font-size:70%">This work is licensed under a </span>[<span style="font-size:70%">Creative Commons Attribution-ShareAlike 4.0 International License</span>](https://creativecommons.org/licenses/by-sa/4.0/).
![](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)

---

<!-- paginate: true -->

## 今日やること

1. ROSの概要
2. ROS 2の準備
3. ROSのノードと通信の基礎
4. ROS 2プログラミング
5. まとめ<br />　
- 参考
    - 近藤 豊: [改訂新版 ROS 2ではじめよう 次世代ロボットプログラミング](https://amzn.asia/d/0fuPz98w), 技術評論社, 2024.
    - [ROS 2公式ドキュメント](https://docs.ros.org/en/jazzy/)（英語）

---

## 1. ROSの概要

---

### ROSとは？

- [Robot Operating System](https://www.ros.org/)の略。ただしOSではない
    - Linux上で動く、ロボット用ソフトウェア（部品）の集まり（ミドルウェア）
    - 2007年に誕生。オープンソース（ROS 2はApache 2.0ライセンス）<br />　
- 機能ごとに小さなプログラム（ノード）を作り、通信でつなぐ
    - 例: カメラ画像の取得 $\rightarrow$ 物体の認識 $\rightarrow$ 移動の判断 $\rightarrow$ モータの制御
    - ノードはPython or C++で記述し、他人が作ったノードと組み合わせられる<br />　
- すでにある部品が豊富
    - センサ・モータのドライバ、地図作成、ナビゲーション、アームの動作計画
    - シミュレータ、可視化ツール、記録・再生ツール、ビルドの仕組み

---

### なぜROSを使うのか？

- 使われている例
    - 自動運転、倉庫の搬送ロボット、[ドローン](https://www.taroz.net/video/uav_gnss-lidar.mp4)、ロボットアーム
    - 研究・教育用ロボット（TurtleBotなど）、[ロボット競技会](https://www.taroz.net/video/tc2024.mp4)、宇宙・海洋探査<br />　
- 使う理由
    - [みんなが使っている](https://www.docswell.com/s/ystk_hara/Z22VL9-tsukuba-challenge-2024-survey): 既存の部品を組み合わせてロボットを動かせる
    - 分担しやすい: 部品ごとに別の人・別の言語で開発し、通信でつなぐ
    - 共通の基盤: 誰でも同じようにロボットを動かすことができる<br />　
- 必要な周辺知識（第1〜7回で学習済み）
    - Linuxとコマンドライン、Pythonなどのプログラミング、プロセス間通信
    - Git/GitHubでの共同開発、ソフトウェアテスト、ライセンス

---

### ROS化されている重要なソフトウェア

- 移動ロボットの制御ソフトウェア
    - [Cartographer](https://github.com/cartographer-project/cartographer_ros)、[Nav2](https://docs.nav2.org/)（ナビゲーション）
        - 地図生成（次のページにデモ）、位置推定、経路生成<br />　
- マニピュレータのソフトウェア
    - [MoveIt](https://moveit.ai/)
        - 腕の動作計画: 腕先の位置を入力 $\rightarrow$ 関節角を計算（逆運動学）<br />　
- 各種センサのインタフェース（ドライバ）
    - カメラ、LiDAR、IMU、GNSS受信機などがすぐ使える
    - 以前はセンサごとに自分でシリアル通信のプログラムを書く苦労があった

---

### ROSを使った移動ロボットの制御

- コントローラで移動経路を教えると、そのあとロボットが自律で経路を移動
    - 地図と経路を計算するCartographerを利用

<iframe width="560" height="315" src="https://www.youtube.com/embed/eVHkHOCsHns" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

- ポイント: Cartographerの部分は一切手を入れていない

---

### ROSのバージョン

- ROS 1（もともとROSと呼ばれていたもの）
    - 主に研究のフレームワークとして発達。まだ使われている
    - 2025年5月でサポート終了（最終版: Noetic）<br />　
- ROS 2（本講義で扱うもの）
    - ROSが普及して、当初想定していなかった利用場面が増加
        - セキュリティ、製品化、シビアな通信環境、・・・
    - アーキテクチャから作り直し。ROS 1とは基本的に互換性なし<br />　
- ROS 2のバージョン（ディストリビューション）
    - 本講義: <span style="color:red">Jazzy Jalisco</span>（Ubuntu 24.04用、2029年5月までサポート）

---

## 2. ROS 2の準備

---

### ROS 2のインストール

- 手順は補足資料に
    - [WSL2へのROS 2のインストール](https://github.com/tarolab-cit/lectures/blob/main/robosys2026/ros2_install.md)（README.mdからもリンク）
    - 所要時間は30分〜1時間。<span style="color:red">授業前に済ませておくこと</span><br />　
- 確認: 3つのことを順に確かめる
    ```bash
    $ ls /opt/ros/jazzy/      #(1) ROS 2本体がインストールされているか
    bin  include  lib  local_setup.bash  setup.bash  share  ・・・
    $ echo $ROS_DISTRO        #(2) 設定(setup.bash)が~/.bashrcから読み込まれているか
    jazzy
    $ ros2                    #(3) ros2コマンドが使えるか
    usage: ros2 [-h] [--use-python-default-buffering]
                Call `ros2 <command> -h` for more detailed usage. ...
    （以下略）
    ```
    - (2)で何も出ない、(3)で`command not found`: 補足資料の「5. 環境設定」を確認

---

### 通信範囲の設定

- ROS 2は同じネットワーク内のPCと自動で通信する
    - 教室だと他の人のノードとつながってしまう $\rightarrow$ 自分のPC内に限定する
    - `~/.bashrc`の末尾に1行追加して読み直す
    ```bash
    $ echo "export ROS_AUTOMATIC_DISCOVERY_RANGE=LOCALHOST" >> ~/.bashrc
    $ source ~/.bashrc
    $ echo $ROS_AUTOMATIC_DISCOVERY_RANGE   #確認
    LOCALHOST
    ```

---

### 動作確認

- 端末をふたつ開く（スタートメニューからUbuntu-24.04をもう一度起動）
- 端末1でプログラムをひとつ立ち上げ
    ```bash
    端末1$ ros2 run demo_nodes_py talker
    [INFO] [talker]: Publishing: "Hello World: 61"
    [INFO] [talker]: Publishing: "Hello World: 62"
    ```
    - 「"Hello World: 数字"を発行」と言っている
- 端末2でもうひとつ立ち上げ
    ```bash
    端末2$ ros2 run demo_nodes_py listener
    [INFO] [listener]: I heard: [Hello World: 61]
    [INFO] [listener]: I heard: [Hello World: 62]
    ```
    - 「"Hello World: 数字"を聞いた」と言っている

<center><span style="color:red">で、これは何をしているのか？</span></center>

---

## 3. ROSのノードと通信の基礎

---

### ROSのノードの基本

- 基本1: プログラムのことを「<span style="color:red">ノード</span>」と呼ぶ
- 基本2: ノードは互いに通信でデータをやりとり
    - <span style="color:red">データはC言語の構造体のような型を持つ</span><br />　
- これで何ができるか？
    - ロボットの各機能を別のプログラムとして実装できる
        - 例1: 画像処理のプログラムとナビゲーションのプログラムの連携
            - 画像処理のプログラムは独立したソフトウェアとして公開可能
        - 例2: LiDARをA社製からB社製に交換
            - A社とB社が同じ型を出力するノードを作っていると、交換が容易
    - 型があるのでデバッグしやすい

---

### ROSの通信の基本

- GUIツールで構造を確認
    ```bash
    端末1$ ros2 run demo_nodes_py talker
    端末2$ ros2 run demo_nodes_py listener
    端末3$ ros2 run rqt_graph rqt_graph
    ```
    <img src="./figs/rqt_graph_s.png" width="50%" />
- ノード（楕円）がデータの流路（矢印）で連結
    - `/chatter`: 流路の名前で「<span style="color:red">トピック</span>」と呼ばれる
        - 流れるデータは「<span style="color:red">メッセージ</span>」
    - ノードから出る矢印: 「<span style="color:red">パブリッシャ</span>」（発行する側）
    - ノードに入る矢印: 「<span style="color:red">サブスクライバ</span>」（購読する側）
- ノードは複数のパブリッシャとサブスクライバを持てる

---

### パブリッシュとサブスクライブ

- <span style="color:red">トピック</span>: 名前と型を持つメッセージの通り道
    - 例: 名前`/chatter`、型`std_msgs/msg/String`（文字列ひとつ）<br />　
- <span style="color:red">パブリッシュ</span>: ノードがトピックにメッセージを送ること
    - 送り先のノードは指定しない。「`/chatter`に出す」とだけ決める
- <span style="color:red">サブスクライブ</span>: ノードがトピックからメッセージを受け取ること
    - 「`/chatter`に来たら関数`cb`を呼んで」と登録 $\rightarrow$ 届くたびに`cb`が呼ばれる
    - この`cb`のような関数を<span style="color:red">コールバック関数</span>と呼ぶ<br />　
- ポイント: 送る側と受け取る側は<span style="color:red">互いを知らない</span>
    - 名前と型が一致すればつながる。相手がいなくてもエラーにならない
    - ひとつのトピックに複数のパブリッシャ・サブスクライバがいてもよい

---

### ros2コマンドで観察する

- 端末1でtalkerだけを動かし、端末2から`ros2`コマンドで覗く
    ```bash
    端末1$ ros2 run demo_nodes_py talker
    端末2$ ros2 node list             #動いているノード
    /talker
    端末2$ ros2 topic list            #トピックの一覧
    /chatter
    /parameter_events
    /rosout
    端末2$ ros2 topic info /chatter   #トピックの型と、つながっている数
    Type: std_msgs/msg/String
    Publisher count: 1
    Subscription count: 0            #受け取る側がいなくてもtalkerは動いている
    端末2$ ros2 topic echo /chatter   #ros2コマンド自身がサブスクライブして表示
    data: Hello World: 10
    ---
    ```
- 端末3でlistenerを起動 $\rightarrow$ `Subscription count: 1`になる（確認してみよう）

---

### よく使うros2コマンド

| コマンド | 何をするか |
|---|---|
| `ros2 run <パッケージ> <ノード>` | ノードを起動 |
| `ros2 node list` | 動いているノードの一覧 |
| `ros2 pkg list` | インストール済みパッケージの一覧 |
| `ros2 topic list` | トピックの一覧（`-t`で型も表示） |
| `ros2 topic echo <トピック>` | 流れているメッセージを表示 |
| `ros2 topic info <トピック>` | 型と、パブリッシャ・サブスクライバの数 |
| `ros2 topic hz <トピック>` | メッセージの頻度（1秒に何回か） |
| `ros2 topic pub <トピック> <型> <値>` | 端末からメッセージを送る |
| `ros2 interface show <型>` | 型の中身（例: `std_msgs/msg/Int16`） |
| `ros2 run rqt_graph rqt_graph` | ノードとトピックを図示 |

---

## 4. ROS 2プログラミング

- 先ほど動かしたtalker、listenerに相当するノードを作成
    - 言語: Python
    - [参考: 公式チュートリアル](https://docs.ros.org/en/jazzy/Tutorials/Beginner-Client-Libraries/Writing-A-Simple-Py-Publisher-And-Subscriber.html)<br />　
- いろいろ作法が細かいので、コードを書く以外のことの意図も確認
    - 誰が作ったパッケージも同じような構造にするため

---

### ワークスペースの作成

- ワークスペース: ROSのパッケージを置いて開発する作業場
    - `src`の下にパッケージを置き、ワークスペースの一番上でビルドする
- とりあえずディレクトリを作るだけ
    - ついでに、ディレクトリ構造を木で表示する`tree`コマンドを入れておく

```bash
$ sudo apt install tree
$ mkdir -p ~/ros2_ws/src
$ tree ~/ros2_ws/
/home/taro/ros2_ws/
└── src

2 directories, 0 files
```

---

### パッケージとは

- パッケージ: ROSのプログラム（ノード）のまとまり。<span style="color:red">配布と再利用の単位</span>
    - さっき使った`demo_nodes_py`もパッケージ
        - `ros2 run demo_nodes_py talker` = その中の`talker`ノードを起動
    - GitHubのリポジトリ1つ、`apt`で入るもの1つ、にほぼ対応<br />　
- 中身: ノードのプログラム + 説明書き（`package.xml`、`setup.py`）
    - 名前、作者、ライセンス、必要な他のパッケージ、どのノードがあるか
    - どのパッケージも同じ構造 $\rightarrow$ 他人のパッケージも同じ手順で使える<br />　
- 作る理由
    - `ros2 run`で名前で呼べる。`colcon`でまとめてビルドできる
    - GitHubで公開 $\rightarrow$ 他人が`git clone`してビルドするだけで使える（課題2も）

---

### 初期状態のパッケージを作る

- `ros2 pkg create`で雛形を作る
    - `--build-type ament_python`: Pythonのパッケージ（C++なら`ament_cmake`）
    ```bash
    $ cd ~/ros2_ws/src/
    $ ros2 pkg create mypkg --build-type ament_python
    （ライセンスについての警告が出るが、次のページで書くので気にしない）
    $ tree mypkg/
    mypkg/
    ├── mypkg              #ここにノードのプログラム（.py）を置く
    │   └── __init__.py
    ├── package.xml        #パッケージの説明書き（次ページ）
    ├── resource
    │   └── mypkg
    ├── setup.cfg
    ├── setup.py           #Pythonのインストールスクリプト（次々ページ）
    └── test
        ・・・
    ```

---

### パッケージ情報の記述1

- `package.xml`: パッケージの説明書き（パッケージマニフェスト）
    - 説明（description）、メンテナ（maintainer）、ライセンスの`TODO`を埋める
    - ライセンスは第5回を思い出して<span style="color:red">自分で選ぶ</span>（BSD-3-Clause、MITなど）

```xml
<?xml version="1.0"?>
<?xml-model href="http://download.ros.org/..."?>
<package format="3">
  <name>mypkg</name>
  <version>0.0.0</version>
  <description>a package for practice</description>
  <maintainer email="taro@example.com">Taro Suzuki</maintainer>   <!-- 自分の名前に -->
  <license>BSD-3-Clause</license>                                   <!-- 自分で選ぶ -->

  <test_depend>ament_copyright</test_depend>
・・・
```

---

### パッケージ情報の記述2

- `setup.py`: Pythonのモジュールで使われるインストールスクリプト
    - `package.xml`と同じ箇所を書き換える

```python
from setuptools import setup

package_name = 'mypkg'

setup(
    name=package_name,
    version='0.0.0',
    ・・・
    maintainer='Taro Suzuki',               #自分の名前に
    maintainer_email='taro@example.com',
    description='a package for practice',
    license='BSD-3-Clause',                 #package.xmlと同じものを
・・・
```

---

### パッケージをビルド

- <span style="color:red">`colcon`</span>: ROS 2のビルドツール（`ros-dev-tools`に含まれ、インストール済み）
    - ワークスペース内の全パッケージをビルドし、`install/`に配置する
    ```bash
    $ cd ~/ros2_ws/    #注意！！必ずワークスペースの一番上でやること
    $ colcon build
    Starting >>> mypkg
    Finished <<< mypkg [1.5s]
    Summary: 1 package finished [2.0s]    #警告が出てもエラーでなければ気にしない
    $ ls
    build  install  log  src              #build、install、logができる
    ```
- `install/`下のパッケージを使えるようにする設定（最初の1回だけ）
    ```bash
    $ echo "source ~/ros2_ws/install/setup.bash" >> ~/.bashrc
    $ source ~/.bashrc
    $ ros2 pkg list | grep mypkg   #確認
    mypkg
    ```

---

### パブリッシャを持つノードの作成

- 機能: 数字をカウントしてトピック`/countup`を通じて送信
    - メッセージの型は16ビット符号つき整数（`std_msgs/msg/Int16`）
    - 参考にしたページ
        - [パブリッシャの書き方](https://docs.ros.org/en/jazzy/Tutorials/Beginner-Client-Libraries/Writing-A-Simple-Py-Publisher-And-Subscriber.html)
        - [クラスなしで記述する方法](https://qiita.com/l1sum/items/b7393c34fb0127826f74)<br />　
- `~/ros2_ws/src/mypkg/mypkg`に`talker.py`を書く
    - 次ページ、次々ページ

---

### コードの前半

```python
import rclpy                     #ROS 2のクライアントのためのライブラリ
from rclpy.node import Node      #ノードを実装するためのNodeクラス（クラスは第10回で）
from std_msgs.msg import Int16   #通信の型（16ビットの符号付き整数）

rclpy.init()                     #rclpyの初期化（最初に1回）
node = Node("talker")            #ノード作成（nodeという「オブジェクト」を作成）
pub = node.create_publisher(Int16, "countup", 10)   #パブリッシャ作成（型、トピック名、キュー長）
n = 0                            #カウント用変数
```
- オブジェクト: 今のところは様々な機能を持つ変数と考えて良い
    - うしろに関数みたいなもの（<span style="color:red">メソッド</span>）をつけて機能を呼び出せる
    - `node.create_publisher(...)`: 「`node`の持つ`create_publisher`を呼ぶ」

（次ページに続く）

---

### コードの後半

```python
def cb():               #タイマーで定期的に呼ばれるコールバック関数
    global n            #関数を抜けてもnがリセットされないようにしている
    msg = Int16()       #メッセージの「オブジェクト」
    msg.data = n        #msgの持つdataにnを入れる
    pub.publish(msg)    #pubの持つpublishでメッセージ送信（パブリッシュ）
    n += 1


def main():
    node.create_timer(0.5, cb)  #0.5秒ごとにcbを呼ぶタイマー
    rclpy.spin(node)            #実行（無限ループ。タイマーや送受信を処理し続ける）
```
- `main`はこの後`setup.py`に登録する（`ros2 run`で呼ばれる関数）

---

### 依存するパッケージの登録

- `talker.py`は`rclpy`と`std_msgs`を使う $\rightarrow$ `package.xml`に書いておく
    ```xml
      <license>BSD-3-Clause</license>
      <exec_depend>rclpy</exec_depend>       <!-- 追加: 実行時に必要なパッケージ -->
      <exec_depend>std_msgs</exec_depend>    <!-- 追加 -->
    ```
- なぜ書くのか: 「動かすには何が必要か」を機械が読める形で残すため
    - 他人が使うとき、<span style="color:red">`rosdep`</span>がこれを読んで足りないものを`apt`で入れる
    ```bash
    $ cd ~/ros2_ws
    $ rosdep install -i --from-path src --rosdistro jazzy -y   #src下の全パッケージの依存を確認
    #All required rosdeps installed successfully   ←今回はどちらも入っているので何もしない
    ```
    - 課題2で人のパッケージを`git clone`したときも、ビルドの前にまずこれ

---

### エントリポイントの登録

- `ros2 run mypkg talker`と打ったとき<span style="color:red">何を実行するか</span>の対応表
    - `setup.py`の`entry_points`に「コマンド名 = モジュール:関数」を書く
    - ビルドで`talker`という実行ファイルができ、`talker.py`の`main()`を呼ぶ
    - 書かないと`ros2 run`がノードを見つけられない（`No executable found`）
    ```python
        entry_points={
            'console_scripts': [
                'talker = mypkg.talker:main',      #talker.pyのmain関数をtalkerという名前で
                #'listener = mypkg.listener:main', #後で使うので書いておいてコメントアウト
            ],
        },
    ```
- まとめ: `package.xml`は「何が必要か」、`setup.py`は「何を実行するか」

---

### ビルドと実行

- `colcon build`して、その後`source`で設定を読み直し
    ```bash
    $ cd ~/ros2_ws        #注意！！必ず~/ros2_wsでやること
    $ colcon build
    $ source ~/.bashrc    #新しくできた実行ファイルを認識させる
    $ ros2 run mypkg talker
    （なにも表示されない）
    ```
- 別の端末で`ros2`コマンドを使ってトピックを観察
    ```bash
    $ ros2 topic list
    /countup
    ・・・
    $ ros2 topic echo /countup
    data: 13
    ---
    data: 14
    ---
    ```

---

### サブスクライバを持つノードの記述

- 機能: `/countup`からメッセージをもらって表示
    - `talker.py`と同じディレクトリに`listener.py`という名前で
    ```python
    import rclpy
    from rclpy.node import Node
    from std_msgs.msg import Int16

    rclpy.init()
    node = Node("listener")


    def cb(msg):                                           #メッセージが届くたびに呼ばれる
        node.get_logger().info("Listen: %d" % msg.data)    #msgの中身をログとして表示


    def main():
        sub = node.create_subscription(Int16, "countup", cb, 10)  #型、トピック名、コールバック、キュー長
        rclpy.spin(node)
    ```

---

### talkerとlistenerの実行

- `setup.py`のエントリポイントに`listener`を追加
    - さきほどコメントアウトした行の`#`を消す
- `colcon build`と`source ~/.bashrc`を済ませておく（必ず`~/ros2_ws`で）
```bash
端末1$ ros2 run mypkg talker
端末2$ ros2 run mypkg listener
[INFO] [listener]: Listen: 142
[INFO] [listener]: Listen: 143
・・・
```
- 端末3で`ros2 topic info /countup`や`rqt_graph`も見てみよう

---

## 5. まとめ

- ROS（ROS 2）
    - 独立したプログラム（プロセス、ノード）を通信で連携
    - トピック、メッセージ、パブリッシャ、サブスクライバ、コールバック関数<br />　
- パッケージを作り、ふたつのノードを記述
    - `package.xml`: 何が必要か、`setup.py`: 何を実行するか、`colcon build`: ビルド
    - 単にプログラムを走らせるだけでなく、様々な手続き
        - 最初は煩わしいが、人に使ってもらうモジュールを作りやすい

---

## 宿題: `mypkg`をGitHubにアップする

- そのままこれが課題2のリポジトリになります
    - 注意: `mypkg`の下のファイルがリポジトリの一番上の階層に来るように
- GitHubで`mypkg`という名前の空のリポジトリを作る（READMEは<span style="color:red">作らない</span>）
- 手元の`mypkg`で次のように作業（第4回の付録と同じ手順）
    ```bash
    $ cd ~/ros2_ws/src/mypkg
    $ git init                  #.gitができてローカルリポジトリになる
    $ git add -A
    $ git commit -m "Initial commit"
    $ git branch -M main        #ブランチ名をmainに
    $ git remote add origin git@github.com:<ユーザ名>/mypkg.git  #結びつけ
    $ git push -u origin main
    ### ブラウザでアップロードできていることを確認を ###
    ```
