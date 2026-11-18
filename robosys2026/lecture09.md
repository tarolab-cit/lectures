---
marp: true
---
<!--
style: |
  section {
    line-height: 1.15;
  }
-->

<!-- footer: "ロボットシステム学第9回" -->

# ロボットシステム学

## 第9回: ROS 2の通信と型

鈴木 太郎（千葉工業大学）

<span style="font-size:70%">オリジナル: 上田 隆一（千葉工業大学）[ロボットシステム学 2025](https://github.com/ryuichiueda/slides_marp/tree/master/robosys2025) を改変</span>

<br />

<span style="font-size:70%">This work is licensed under a </span>[<span style="font-size:70%">Creative Commons Attribution-ShareAlike 4.0 International License</span>](https://creativecommons.org/licenses/by-sa/4.0/).
![](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)

---

<!-- paginate: true -->

## 今日やること

1. launchファイル
2. 独自のメッセージ型の作成
3. サービスの実装
4. パラメータ、アクション
5. まとめ<br />　
- 注意
    - こまめにGitHubにpushしながら進めましょう

---

## 1. launchファイル

- 前回: 端末をふたつ開いて、ノードごとに`ros2 run`
    ```bash
    端末1$ ros2 run mypkg talker
    端末2$ ros2 run mypkg listener
    ```
    - 実際のロボットではノードが数十個 $\rightarrow$ 毎回手で立ち上げるのは無理<br />　
- <span style="color:red">launchファイル</span>: 複数のノードを一度に立ち上げるもの
    ```bash
    $ ros2 launch mypkg talk_listen.launch.py    #これだけで両方立ち上がる
    ```
    - 立ち上げ方がファイルに残る $\rightarrow$ 誰でも同じ手順で動かせる
    - Ctrl+C一回で全部のノードが止まる<br />　
- 形式: Python（今日はこっち）、XML、YAMLの3種類

---

### launchファイルの作成（準備）

- パッケージのディレクトリに`launch`ディレクトリを作成
    ```bash
    $ cd ~/ros2_ws/src/mypkg/
    $ mkdir launch
    ```
- `setup.py`にlaunchファイルの場所を記述
    ```python
    import os                  #追加。OSの機能のパッケージ
    from glob import glob      #追加。グロブ（ワイルドカード）を扱う関数
    ・・・
        data_files=[
            ・・・
            (os.path.join('share', package_name, 'launch'), glob('launch/*.launch.py')),  #追加
        ],
    ```
    - `*`はワイルドカード（何にでも一致）$\rightarrow$ `.launch.py`で終わる全ファイル
- `package.xml`に依存関係を記述
    ```xml
      <exec_depend>launch_ros</exec_depend>    <!-- 追加 -->
    ```

---

### launchファイルの作成（記述）

- `launch`ディレクトリに`talk_listen.launch.py`を作成
    - 名前の最後は必ず`.launch.py`（`setup.py`に書いた`*.launch.py`に合わせる）
    ```python
    import launch
    import launch_ros.actions


    def generate_launch_description():
        talker = launch_ros.actions.Node(
            package='mypkg',      #パッケージの名前を指定
            executable='talker',  #実行するファイルの指定
            )
        listener = launch_ros.actions.Node(
            package='mypkg',
            executable='listener',
            output='screen'       #ログを端末に出すための設定
            )
        return launch.LaunchDescription([talker, listener])
    ```

---

### launchファイルの作成（実行）

- ビルド、`source`して実行（ビルドを忘れると`ros2 launch`で見つからない）
    ```bash
    $ cd ~/ros2_ws        #必ず~/ros2_wsで
    $ colcon build
    $ source ~/.bashrc
    $ ros2 launch mypkg talk_listen.launch.py
    ・・・
    [INFO] [talker-1]: process started with pid [17158]
    [INFO] [listener-2]: process started with pid [17159]
    （かなり遅れてlistener.pyの出力がまとめて表示される場合あり。Ctrl+Cで終了）
    ```
- 動いたらコミットしてpush
    ```bash
    $ cd ~/ros2_ws/src/mypkg
    $ git add -A
    $ git commit -m "Add launch file"
    $ git push
    ```

---

## 2. 独自のメッセージ型の作成

- 前回の通信: 整数をひとつ送受信するだけ（`Int16`）
- ロボットでは、複数の値をひとまとめにして送りたい
    - 例: 位置（x、y、向き）、センサの値と計測した時刻
    - 別々のトピックで送ると、どれとどれが組なのか分からなくなる<br />　
- 方法
    - 既存の型を利用（`ros2 interface list`で一覧表示）
        - 合うものがあればこちら。他の人のノードとそのままつながる
    - 自分で型（と型のためのパッケージ）を作成
        - 合う型がないときに。値に名前が付くので受け手が意味を間違えない
        - やってみましょう

---

### msgファイルの作成

- 作るもの: 名前（`name`）と年齢（`age`）をまとめた`Person`型
    - `Person.msg`というファイルに書き、型専用のパッケージ`person_msgs`に置く
- パッケージを作成
    ```bash
    $ cd ~/ros2_ws/src
    $ ros2 pkg create --build-type ament_cmake person_msgs
    $ cd person_msgs
    $ mkdir msg
    ```
- `package.xml`の説明、メンテナ、ライセンスを埋める（前回の`mypkg`と同じ）
    - 依存関係の追加は次ページ
- `msg`ディレクトリに`Person.msg`を作成
    ```
    string name
    uint8 age
    ```
    - このファイルから、各言語で使える構造体のようなものが生成される

---

### ビルドの準備

- パッケージのトップディレクトリにある`CMakeLists.txt`を編集
    - ビルドのときに`Person.msg`から型のコードを生成させるための設定
    - `find_package(ament_cmake REQUIRED)`の下あたりに、次の4行を記述
    ```cmake
    find_package(rosidl_default_generators REQUIRED)
    rosidl_generate_interfaces(${PROJECT_NAME}
      "msg/Person.msg"
    )
    ```
- `package.xml`も編集
    - 型の生成と利用に必要なパッケージを書いておく（依存関係）
    - `buildtool_depend`の下あたりに、次の3行を追加
    ```xml
    <buildtool_depend>rosidl_default_generators</buildtool_depend>
    <exec_depend>rosidl_default_runtime</exec_depend>
    <member_of_group>rosidl_interface_packages</member_of_group>
    ```

---

### ビルド

- ビルドして環境に反映
    ```bash
    $ cd ~/ros2_ws        #必ず~/ros2_wsで
    $ colcon build
    （略）
    Finished <<< mypkg [0.57s]
    Finished <<< person_msgs [2.32s]

    Summary: 2 packages finished [2.51s]
      1 package had stderr output: mypkg    #警告。エラーでなければ気にしない
    ```
- `source`して、型が利用できるようになっているか確認
    ```bash
    $ source ~/.bashrc
    $ ros2 interface show person_msgs/msg/Person
    string name
    uint8 age
    ```

---

### `person_msgs`をGitHubにアップ

- `mypkg`とは別のパッケージ $\rightarrow$ <span style="color:red">別のリポジトリ</span>にする
- GitHubで`person_msgs`という名前の空のリポジトリを作る
- 手元の`person_msgs`で次のように作業（前回の宿題と同じ手順）
    ```bash
    $ cd ~/ros2_ws/src/person_msgs
    $ git init                  #.gitができてローカルリポジトリになる
    $ git add -A
    $ git commit -m "Initial commit"
    $ git branch -M main        #ブランチ名をmainに
    $ git remote add origin git@github.com:<ユーザ名>/person_msgs.git  #結びつけ
    $ git push -u origin main
    ### ブラウザでアップロードできていることを確認を ###
    ```
- 2回目以降は`git add -A`、`git commit -m "・・・"`、`git push`だけでよい

---

### Person型の利用（publish）

- `mypkg`に戻る: `~/ros2_ws/src/mypkg/mypkg/talker.py`を編集（`main`は変更なし）
    ```python
    import rclpy
    from rclpy.node import Node
    from person_msgs.msg import Person   #変更: 作ったPerson型を使う

    rclpy.init()
    node = Node("talker")
    pub = node.create_publisher(Person, "person", 10)   #変更: 型とトピック名
    n = 0


    def cb():
        global n
        msg = Person()          #変更: Person型のメッセージを作る
        msg.name = "鈴木太郎"    #変更: msgファイルに書いた「name」
        msg.age = n % 256       #変更: msgファイルに書いた「age」（0〜255まで）
        pub.publish(msg)
        n += 1
    ```

---

### Person型の利用（publishの確認）

- `mypkg`の`package.xml`に依存関係を追加
    ```xml
      <exec_depend>person_msgs</exec_depend>    <!-- 追加: 作った型のパッケージ -->
    ```
- ビルドして、`ros2 run`で`talker`だけを実行
    ```bash
    $ cd ~/ros2_ws        #必ず~/ros2_wsで
    $ colcon build
    $ source ~/.bashrc
    $ ros2 run mypkg talker
    ```
- 別の端末で、名前と年齢が送られていることを確認（`age`が1ずつ増える）
    ```bash
    $ ros2 topic echo /person
    name: 鈴木太郎
    age: 13
    ---
    name: 鈴木太郎
    age: 14
    ```

---

### Person型の利用（subscribe）

- `talker.py`と同じディレクトリの`listener.py`を編集（Person型を受信して表示）
    ```python
    import rclpy
    from rclpy.node import Node
    from person_msgs.msg import Person   #変更: 作ったPerson型を使う

    rclpy.init()
    node = Node("listener")


    def cb(msg):
        node.get_logger().info("Listen: %s" % msg)   #変更: メッセージ全体を文字列で表示


    def main():
        sub = node.create_subscription(Person, "person", cb, 10)   #変更: 型とトピック名
        rclpy.spin(node)
    ```
- ビルドして`ros2 launch`で確認: `Listen: ...Person(name='鈴木太郎', age=13)`

---

## 3. サービスの実装

- トピック: 送る側が一方的に流し続ける（誰が受け取ったかは知らない）
    - センサの値のように、流しっぱなしにするデータ向き
- 「これをやって」と頼んで、結果を受け取りたいときは？
    - 例: 地図を保存して、アームを最初の姿勢に戻して
    - トピックでも可能だが、依頼用と返事用のふたつが必要
        - どの返事がどの依頼のものか、自分で管理することになる<br />　
- <span style="color:red">サービス</span>: あるノードが別のノードに仕事を依頼し、返事を受け取る仕組み
    - 依頼（リクエスト）と返事（レスポンス）が1対1で対応
    - 関数の呼び出しに近い（引数を渡して、戻り値を受け取る）

---

### 実装するサービス

- さきほど（トピック）: `talker`が名前と年齢を流し続け、`listener`が受け取る
    - 一方向に送るだけ $\rightarrow$ 決めるデータは`Person.msg`の1種類

<center>
<svg width="760" height="80" viewBox="0 0 760 80" font-family="sans-serif" font-size="22">
<defs>
<marker id="ah" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#333"/></marker>
</defs>
<rect x="5" y="10" width="150" height="60" rx="8" fill="#eef" stroke="#333"/>
<text x="80" y="48" text-anchor="middle">talker</text>
<rect x="605" y="10" width="150" height="60" rx="8" fill="#eef" stroke="#333"/>
<text x="680" y="48" text-anchor="middle">listener</text>
<line x1="155" y1="40" x2="603" y2="40" stroke="#333" stroke-width="2" marker-end="url(#ah)"/>
<text x="380" y="30" text-anchor="middle">Person（name、age）を流し続ける</text>
</svg>
</center>

- <span style="color:red">今から（サービス）</span>: 人の名前を送ったら、その人の年齢を返す
    - `listener`: 依頼する側（クライアント）、`talker`: 依頼を受ける側（サーバ）
    - 依頼と返事がある $\rightarrow$ 決めるデータは2種類

<center>
<svg width="760" height="120" viewBox="0 0 760 120" font-family="sans-serif" font-size="22">
<defs>
<marker id="ahr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="red"/></marker>
</defs>
<rect x="5" y="20" width="150" height="80" rx="8" fill="#eef" stroke="#333"/>
<text x="80" y="68" text-anchor="middle">talker</text>
<rect x="605" y="20" width="150" height="80" rx="8" fill="#eef" stroke="#333"/>
<text x="680" y="68" text-anchor="middle">listener</text>
<line x1="605" y1="42" x2="157" y2="42" stroke="red" stroke-width="2" marker-end="url(#ahr)"/>
<text x="380" y="32" text-anchor="middle" fill="red">1. 依頼: name（この人は何歳？）</text>
<line x1="155" y1="78" x2="603" y2="78" stroke="red" stroke-width="2" marker-end="url(#ahr)"/>
<text x="380" y="108" text-anchor="middle" fill="red">2. 返事: age</text>
</svg>
</center>

---

### srvファイルの作成

- `person_msgs`に`srv`ディレクトリを作成（`msg`と同じ階層）
    ```bash
    $ cd ~/ros2_ws/src/person_msgs
    $ mkdir srv
    ```
- `srv`ディレクトリに`Query.srv`を作成
    ```
    string name
    ---
    uint8 age
    ```
    - `---`の上: 依頼（リクエスト）。呼び出し側が渡すデータ
    - `---`の下: 返事（レスポンス）。呼び出し側が受け取るデータ
    - `Person.msg`との違い: `---`で区切って2種類のデータを書く

---

### ビルド

- `CMakeLists.txt`に`Query.srv`を追加
    ```cmake
    rosidl_generate_interfaces(${PROJECT_NAME}
      "msg/Person.msg"
      "srv/Query.srv"   #追加
    )
    ```
- ビルド、`source`して確認（`Query.srv`に書いた内容が表示されればOK）
    ```bash
    $ cd ~/ros2_ws        #必ず~/ros2_wsで
    $ colcon build
    （略）
    $ source ~/.bashrc
    $ ros2 interface show person_msgs/srv/Query
    string name
    ---
    uint8 age
    ```

---

### サービスのためのコールバック関数の実装

<style scoped>pre { font-size: 85%; }</style>

- `~/ros2_ws/src/mypkg/mypkg/talker.py`を編集（`pub`、`n`、タイマーは消す）
    ```python
    import rclpy
    from rclpy.node import Node
    from person_msgs.srv import Query   #変更: 作ったQuery型を使う

    rclpy.init()
    node = Node("talker")


    def cb(request, response):          #変更: 依頼が来るたびに呼ばれる
        if request.name == "鈴木太郎":   #変更: 依頼（request）のnameを見る
            response.age = 41           #変更: 返事（response）のageに年齢を入れる
        else:
            response.age = 255          #変更: 知らない人なら255
        return response                 #変更: 返事を返す


    def main():
        srv = node.create_service(Query, "query", cb)   #変更: サービスを作成（型、名前、関数）
        rclpy.spin(node)
    ```

---

### `ros2 service`で動作確認

- ビルドして`talker`を立ち上げる
    ```bash
    $ cd ~/ros2_ws        #必ず~/ros2_wsで
    $ colcon build
    $ source ~/.bashrc
    $ ros2 run mypkg talker
    ```
- 別の端末で、サービスがあることを確認して呼び出してみる
    ```bash
    $ ros2 service list
    /query                  #表示されるか確認（ほかにも表示される）
    $ ros2 service call /query person_msgs/srv/Query "name: 鈴木太郎"
    （略）
    person_msgs.srv.Query_Response(age=41)     #年齢が返ってくる
    $ ros2 service call /query person_msgs/srv/Query "name: しらない人"
    （略）
    person_msgs.srv.Query_Response(age=255)    #知らない人は255
    ```

---

### ノードからのサービス呼び出し（前半）

<style scoped>pre { font-size: 85%; }</style>

- `talker.py`と同じディレクトリの`listener.py`を編集（依頼する側。`cb`は消す）
    ```python
    import rclpy
    from rclpy.node import Node
    from person_msgs.srv import Query   #変更: 作ったQuery型を使う

    rclpy.init()
    node = Node("listener")


    def main():
        client = node.create_client(Query, 'query')   #変更: 依頼する側（クライアント）を作成
        while not client.wait_for_service(timeout_sec=1.0):   #変更: talkerが立ち上がるまで待つ
            node.get_logger().info('待機中')

        req = Query.Request()             #変更: 依頼（リクエスト）を作る
        req.name = "鈴木太郎"              #変更: 依頼に名前を入れる
        future = client.call_async(req)   #変更: 依頼を送る（返事は待たずに次へ進む）
    ```
    （次ページに続く）

---

### ノードからのサービス呼び出し（後半）

```python
    #ここから下はすべて追加（mainの続き）
    while rclpy.ok():
        rclpy.spin_once(node)   #通信の処理を1回だけ行う
        if future.done():       #返事が届いていたら
            try:
                response = future.result()   #返事を取り出す
            except:
                node.get_logger().info('呼び出し失敗')
            else:   #exceptにならなかったとき（成功したとき）
                node.get_logger().info("age: {}".format(response.age))   #年齢を表示

            break   #whileを出る

    node.destroy_node()   #ノードの後始末
    rclpy.shutdown()      #通信の後始末
```
- 後始末は無限ループでないので書いた
    - 本来は無限ループの場合でも書いたほうがよい

---

### 動作確認

- `listener.py`を書き換えたので、`~/ros2_ws`でもう一度`colcon build`
- 端末をふたつ使い、順番を変えて立ち上げてみましょう
    - `talker`を先、`listener`を後: すぐに年齢が受け取れる
    ```bash
    $ ros2 run mypkg listener
    [INFO] [1664865501.806117977] [listener]: age: 41
    ```
    - `listener`を先、`talker`を後: 「待機中」が出たあと年齢が受け取れる
    ```bash
    $ ros2 run mypkg listener
    [INFO] [1664865500.552181002] [listener]: 待機中
    [INFO] [1664865501.554913737] [listener]: 待機中
    [INFO] [1664865501.806117977] [listener]: age: 41
    ```
- 動いたら<span style="color:red">`mypkg`と`person_msgs`の両方</span>をコミットしてpush

---

## 4.1. パラメータ

- <span style="color:red">パラメータ</span>: ノードの設定値を、ノードの外から読み書きする仕組み
    - コードを書き換えずに値を変えられる（ビルドし直さなくてよい）
    - 例: センサの周波数、ロボットの最高速度、使うデバイスの名前
    - launchファイルに書いておけば、立ち上げるときにまとめて渡せる<br />　
- 今の状態で確認できるパラメータ
    ```bash
    $ ros2 param list
    /talker:
      use_sim_time
      ・・・
    $ ros2 param get /talker use_sim_time
    Boolean value is: False
    ```
    - `use_sim_time`: シミュレータの時刻を使うかどうか（どのノードにも付く）

---

## 4.2. アクション

ここでは、とりあえず「アクションというものがある」というだけお伝え

- アクション
    - サービスの長時間版
        - 呼び出し側が、途中の経過の観察やキャンセルをできる
    - 使用例
        - ナビゲーション（目的地を指定して終わるまで待つ）
        - マニピュレータの姿勢変更（最終的な姿勢を指定して終わるまで待つ）
    - トピックやサービスを組み合わせて実装される

---

## 5. まとめ

- やったこと
    - launchファイル: 複数のノードを一度に立ち上げ
    - 独自の型: `person_msgs`に`Person.msg`と`Query.srv`を作成
    - トピック（流し続ける）とサービス（依頼と返事）の使い分け
    - パラメータ、アクション（紹介のみ）<br />　
- 確認: 次のふたつのパッケージがGitHubにpushされていること
    - `mypkg`: launchファイル、サービスを使う`talker.py`と`listener.py`
    - `person_msgs`: `Person.msg`、`Query.srv`
    - どちらもコミットの履歴が残っていること
