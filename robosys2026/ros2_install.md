# WSL2へのROS 2のインストール

WSL2にUbuntu 24.04がインストールされていることが前提です（[第1回](https://tarolab-cit.github.io/lectures/robosys2026/lecture01.html)の資料を参照）。

- インストールするもの: ROS 2 Jazzy Jalisco（Ubuntu 24.04に対応するLTS版）
- 必要なもの: インターネット接続、ディスクの空き容量 10GB程度
- 所要時間: 30分〜1時間程度（ほとんどがダウンロードの待ち時間）

手順は[ROS 2の公式ドキュメント](https://docs.ros.org/en/jazzy/Installation/Ubuntu-Install-Debs.html)にもとづいています。

スタートメニューからUbuntu-24.04を起動し、以降はすべてUbuntu（WSL）の端末で実行します。

## 1. パッケージの更新

```
sudo apt update
sudo apt upgrade -y
```

パスワードを聞かれたら、WSLのインストール時に設定したパスワードを入力します。

## 2. ROS 2のリポジトリの追加

ROS 2のパッケージの入手先（リポジトリ）をaptに登録します。下のブロックをまとめてコピーして貼り付けてください。

```
sudo apt install -y software-properties-common curl
sudo add-apt-repository -y universe
export ROS_APT_SOURCE_VERSION=$(curl -s https://api.github.com/repos/ros-infrastructure/ros-apt-source/releases/latest | grep -F "tag_name" | awk -F'"' '{print $4}')
curl -L -o /tmp/ros2-apt-source.deb "https://github.com/ros-infrastructure/ros-apt-source/releases/download/${ROS_APT_SOURCE_VERSION}/ros2-apt-source_${ROS_APT_SOURCE_VERSION}.$(. /etc/os-release && echo ${UBUNTU_CODENAME:-${VERSION_CODENAME}})_all.deb"
sudo dpkg -i /tmp/ros2-apt-source.deb
```

## 3. ROS 2のインストール

ROS 2本体（デスクトップ版）と開発用ツールをインストールします。ここが一番時間がかかります。

```
sudo apt update
sudo apt install -y ros-jazzy-desktop ros-dev-tools
```

## 4. rosdepの初期化

rosdepはROSのパッケージが必要とするソフトウェアを自動でインストールするツールです。後の授業で使うので初期化しておきます。

```
sudo rosdep init
rosdep update
```

## 5. 環境設定

ROS 2のコマンドを使うには、端末ごとに設定ファイルを読み込む（`source`する）必要があります。端末の起動時に自動で読み込まれるようにします。

```
echo "source /opt/ros/jazzy/setup.bash" >> ~/.bashrc
source ~/.bashrc
```

## うまくいかないとき

- **`Unable to locate package ros-jazzy-desktop`と表示される**
  - 手順2のリポジトリの追加ができていません。時間をおいて手順2からやり直してください。
- **`Could not get lock /var/lib/dpkg/lock-frontend`と表示される**
  - 別のaptが動いています。数分待ってから再度実行してください。
- **インストールの途中で止まった、エラーで中断した**
  - 次を実行してから、手順3をもう一度実行してください。
    ```
    sudo dpkg --configure -a
    sudo apt install -f
    ```
- **`sudo rosdep init`で`default sources list file already exists`と表示される**
  - 初期化は済んでいます。`rosdep update`に進んでください。

