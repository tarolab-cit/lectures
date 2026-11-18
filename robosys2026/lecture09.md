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

- launchファイル
    - 複数のノードを一度に立ち上げるもの
        - 他にもいろいろ可能だがとりあえず
    - 作っておくと、ノードごとに`ros2 run`しなくてよい
- 形式
    - `setup.py`みたいにPythonでプログラムするもの（今日はこっち）
    - `package.xml`みたいにXMLで記述するもの
    - YAMLで記述するもの

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
            (os.path.join('share', package_name), glob('launch/*.launch.py')),  #追加
        ],
    ```
- `package.xml`に依存関係を記述
    ```xml
      <exec_depend>launch_ros</exec_depend>    <!-- 追加 -->
    ```

---

### launchファイルの作成（記述）

- さきほど作った`launch`ディレクトリに設置
- 名前は`talk_listen.launch.py`としましょう
    - `setup.py`に`.launch.py`で終わると書いたので、それは守る
    ```python
    import launch
    import launch.actions
    import launch.substitutions
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

- `colcon build`して実行
    ```bash
    $ ros2 launch mypkg talk_listen.launch.py
    [INFO] [launch]: All log files can be found below /home/ubuntu/.ros/log/202...
    [INFO] [launch]: Default logging verbosity is set to INFO
    [INFO] [talker-1]: process started with pid [17158]
    [INFO] [listener-2]: process started with pid [17159]
    （かなり遅れてlistener.pyの出力がまとめて表示される場合あり）
    （Ctrl+Cで終了）
    ```

---

## 2. 独自のメッセージ型の作成

- 前回の通信: ひとつ整数を送受信するだけ
- 意味のあるひとかたまりのデータをまとめて送るには？
    - 意味のあるひとかたまりのデータ: 構造体に相当するもの<br />　
- 方法
    - 既存の型を利用
        - `ros2 interface list`で一覧表示可能
    - 自分で型（と型のためのパッケージ）を作成
        - やってみましょう

---

### msgファイルの作成

- 型を定義するパッケージを作成
    ```bash
    $ cd ~/ros2_ws/src
    $ ros2 pkg create --build-type ament_cmake person_msgs
    $ cd person_msgs
    ### package.xmlを前回のように編集 ###
    $ mkdir msg
    $ cd msg
    ```
- `msg`下に、次のような`Person.msg`というファイルを設置
    ```
    string name
    uint8 age
    ```
    - このファイルから、各言語で使える構造体のようなものが生成される

---

### ビルドの準備

- パッケージのトップディレクトリにある`CMakeLists.txt`を編集
    - `find_package(ament_cmake REQUIRED)`の下あたりに、次の4行を記述
    ```cmake
    find_package(rosidl_default_generators REQUIRED)
    rosidl_generate_interfaces(${PROJECT_NAME}
      "msg/Person.msg"
    )
    ```
- `package.xml`も編集
    - `buildtool_depend`の下あたりに、次の3行を追加
    ```xml
    <build_depend>rosidl_default_generators</build_depend>
    <exec_depend>rosidl_default_runtime</exec_depend>
    <member_of_group>rosidl_interface_packages</member_of_group>
    ```

---

### ビルド

- ビルドして環境に反映
    ```bash
    $ cd ~/ros2_ws
    $ colcon build
    （略）
    Finished <<< mypkg [0.57s]
    Finished <<< person_msgs [2.32s]

    Summary: 2 packages finished [2.51s]
      1 package had stderr output: mypkg
    ```
- `source`して、型が利用できるようになっているか確認
    ```bash
    $ source ~/.bashrc
    $ ros2 interface show person_msgs/msg/Person
    string name
    uint8 age
    ```

---

### Person型の利用（publish）

- `talker.py`からPerson型のメッセージを送信
    ```python
    import rclpy
    from rclpy.node import Node
    from person_msgs.msg import Person   #変更

    rclpy.init()
    node = Node("talker")
    pub = node.create_publisher(Person, "person", 10)   #変更
    n = 0


    def cb():
        global n
        msg = Person()          #送信するデータの型を変更
        msg.name = "上田隆一"    #msgファイルに書いた「name」
        msg.age = n             #msgファイルに書いた「age」
        pub.publish(msg)
        n += 1
    ```
    （次ページに続く）

---

### Person型の利用（publish、続き）

```python
def main():
    node.create_timer(0.5, cb)
    rclpy.spin(node)
```
- ビルドして実行し、`ros2 topic echo /person`で確認のこと

---

### Person型の利用（subscribe）

- `listener.py`でPerson型のメッセージを受信、表示
    ```python
    import rclpy
    from rclpy.node import Node
    from person_msgs.msg import Person

    rclpy.init()
    node = Node("listener")


    def cb(msg):
        node.get_logger().info("Listen: %s" % msg)


    def main():
        sub = node.create_subscription(Person, "person", cb, 10)
        rclpy.spin(node)
    ```
    - `ros2 launch`で動作確認を

---

## 3. サービスの実装

- 疑問: ノード同士が直接、仕事の依頼やデータをやりとりしたいときにトピックは使える？
    - 使えるけど仕事の終わりの確認がめんどくさい
- <span style="color:red">サービス</span>を使うほうがよい
    - サービス: あるノードが別のノードに仕事を依頼する仕組み

<center>実装してみましょう</center>

---

### 実装するサービス

- 人の名前を送ったら、その人の年齢を返すサービス
    - `listener`が依頼する側
    - `talker`が依頼を受ける側

---

### srvファイルの作成

- 準備: `person_msgs`に`srv`というディレクトリを作成
    - `msg`と同じところに
    - 中に、次のような`Query.srv`を置く
    ```
    string name
    ---
    uint8 age
    ```
    - `---`の上: サービスを呼び出すときに呼び出し側が渡すデータ
    - `---`の下: サービスの実行後に呼び出し側が受け取るデータ

---

### ビルド

- `CMakeLists.txt`に`Query.srv`を追加
    ```cmake
    rosidl_generate_interfaces(${PROJECT_NAME}
      "msg/Person.msg"
      "srv/Query.srv"   #追加
    )
    ```
- ビルド、`source`、確認
    ```bash
    $ cd ~/ros2_ws/
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

- `talker`側に、サービスが呼び出されたときの処理を書く
    - `talker.py`
    ```python
    import rclpy
    from rclpy.node import Node
    from person_msgs.srv import Query   #使う型を変更

    rclpy.init()
    node = Node("talker")


    def cb(request, response):
        if request.name == "上田隆一":
            response.age = 46
        else:
            response.age = 255

        return response


    def main():
        srv = node.create_service(Query, "query", cb)   #サービスの作成
        rclpy.spin(node)
    ```

---

### `ros2 service`で動作確認

- `talker`を立ち上げてからサービスの存在を確認し、呼び出してみる
    ```bash
    ### 確認 ###
    $ ros2 service list
    /query                  #表示されるか確認
    （以下略）
    ### 実行 ###
    $ ros2 service call /query person_msgs/srv/Query "name: 上田隆一"
    requester: making request: person_msgs.srv.Query_Request(name='上田隆一')

    response:
    person_msgs.srv.Query_Response(age=46)

    $ ros2 service call /query person_msgs/srv/Query "name: しらない人"
    （略）
    response:
    person_msgs.srv.Query_Response(age=255)
    ```

---

### ノードからのサービス呼び出し（前半）

- `listener.py`を次のように書き換え
    ```python
    import rclpy
    from rclpy.node import Node
    from person_msgs.srv import Query

    rclpy.init()
    node = Node("listener")


    def main():
        client = node.create_client(Query, 'query')   #サービスのクライアントの作成
        while not client.wait_for_service(timeout_sec=1.0):   #サービスの待ち
            node.get_logger().info('待機中')

        req = Query.Request()
        req.name = "上田隆一"
        future = client.call_async(req)   #非同期でサービスを呼び出し
    ```
    （次ページに続く）

---

### ノードからのサービス呼び出し（後半）

```python
    while rclpy.ok():
        rclpy.spin_once(node)   #1回だけ処理を回す
        if future.done():       #終わっていたら
            try:
                response = future.result()   #結果を受け取り
            except:
                node.get_logger().info('呼び出し失敗')
            else:   #このelseは「exceptじゃなかったら」という意味のelse
                node.get_logger().info("age: {}".format(response.age))

            break   #whileを出る

    node.destroy_node()   #ノードの後始末
    rclpy.shutdown()      #通信の後始末
```
- 後始末は無限ループでないので書いた
    - 本来は無限ループの場合でも書いたほうがよい

---

### 動作確認

- 順番を変えて立ち上げてみましょう
    - `talker`を先、`listener`を後: すぐに年齢が受け取れる
    ```bash
    $ ros2 run mypkg listener
    [INFO] [1664865501.806117977] [listener]: age: 46
    ```
    - `listener`を先、`talker`を後: 「待機中」が出たあと年齢が受け取れる
    ```bash
    $ ros2 run mypkg listener
    [INFO] [1664865500.552181002] [listener]: 待機中
    [INFO] [1664865501.554913737] [listener]: 待機中
    [INFO] [1664865501.806117977] [listener]: age: 46
    ```

---

## 4.1. パラメータ

- システムやノードのパラメータを管理する仕組み
    - 各ノードがアクセスして値を使用
    - 用途
        - センサの周波数などの設定（や変更）
        - プログラムの初期設定値の記録やノードへの伝達
    - 今の状態で確認できるパラメータ
    ```bash
    $ ros2 param list
    /talker:
      use_sim_time
    $ ros2 param get /talker use_sim_time
    Boolean value is: False
    ```

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
    - launchファイルを作成
    - 独自のメッセージの型、サービスを実装
    - パラメータ、アクションの把握（紹介のみ）
- 確認
    - 本日扱ったふたつのパッケージがGitHubにpushされていること
        - コミットの履歴も残っていること
