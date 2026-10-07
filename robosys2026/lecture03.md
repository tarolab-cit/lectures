---
marp: true
---
<!--
style: |
  section {
    line-height: 1.15;
  }
-->

<!-- footer: "ロボットシステム学第3回" -->

# ロボットシステム学

## 第3回: Linux環境でのPythonプログラミング II

鈴木 太郎（千葉工業大学）

<span style="font-size:70%">オリジナル: 上田 隆一（千葉工業大学）[ロボットシステム学 2025](https://github.com/ryuichiueda/slides_marp/tree/master/robosys2025) を改変</span>

<br />

<span style="font-size:70%">This work is licensed under a </span>[<span style="font-size:70%">Creative Commons Attribution-ShareAlike 4.0 International License</span>](https://creativecommons.org/licenses/by-sa/4.0/).
![](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)

---

<!-- paginate: true -->

## 今日やること

- 前半: Python入門
    - Pythonで引数を操作
    - if文<br />　
- 後半: 標準入出力の操作と理解

---

## 前半: <span style="text-transform:none">Python</span>入門

---

## 引数とは？
- 前回の授業ではPythonで引数のないコマンド（`hello`）を作成
    - 何度実行しても同じ結果しか返せない<br />　
- <span style="color:red">引数</span>: コマンド名の後ろに空白区切りで渡す文字列
    - 例: `ls -l`、`chmod +x hello.py`、`echo 1 2 3`
    - コマンドは引数の内容で動作を変える
        - `echo 1 2 3`と`echo abc`では出力が変わる<br />　
- 今日の前半: 引数を受け取って動作を変えるコマンドを作る
    - 例: `./plus 1 2 3` $\rightarrow$ `6.0`（足し算コマンド）

---

## モジュールの読み込み

- <span style="color:red">モジュール</span>: 様々な関数や定数をまとめたファイル
    - 必要なものを<span style="color:red">`import`</span>で読み込んで使う
    - 読み込んだ機能は「`モジュール名.機能名`」で呼び出す<br />　
- 例: 数学の機能をまとめた<span style="color:red">`math`</span>モジュール
    ```python
    $ python3                #対話モードに入る（1行ずつ実行して結果を確認できる）
    >>> import math          #mathモジュールを読み込み
    >>> math.sqrt(2)         #mathの「下の」sqrt関数（平方根）
    1.4142135623730951
    >>> exit()               #対話モードから出る（Ctrl+Dでも可）
    ```
- 今日使うのは、システムのことを扱う<span style="color:red">`sys`</span>モジュール

---

## <span style="text-transform:none">Python</span>での引数の処理

- 要点
    - 引数は`sys`モジュールの「下の」<span style="color:red">`sys.argv`</span>に入っている
    - 中身は<span style="color:red">リスト</span>（前回のfor文やスライスが使える）
    - 先頭の要素（`sys.argv[0]`）はコマンド名自身
- 例（`args`）
    ```python
    #!/usr/bin/python3
    import sys             #sysモジュールを読み込み

    print(sys.argv)        #sys.argvをprintしてみる
    ```
- 実行（「`args`」という名前でコードを保存して実行）
    ```bash
    $ ./args 引数1 引数2 引数3
    ['./args', '引数1', '引数2', '引数3']    #端末に打った通りにリストに入る
    ```
    
---

## 引数を使ったコマンドの作成1

- 引数で与えた数を足し合わせる`plus`というコマンドを作ってみましょう
    - とりあえず2つの引数を足す計算のコードを作る
    - 例（`plus_a`）
        ```python
        #!/usr/bin/python3
        import sys
        
        print( float(sys.argv[1]) + float(sys.argv[2]) )
        ```
        - <span style="color:red">`float`関数</span>: 文字列を浮動小数点数に変換
            - `sys.argv`の中身は文字列。`float`なしだと`"1" + "2"`で`12`になる
    - 実行
        ```bash
        $ ./plus_a 1 2
        3.0
        ```

---

## 引数を使ったコマンドの作成2

- 今度は引数をすべて足すコマンドを作成
    - 例（`plus_b`）
        ```python
        #!/usr/bin/python3
        import sys

        x = 0.0                    #合計を入れる変数を0で初期化
        for n in sys.argv[1:]:     #[1:]でコマンド名（0番）を除く
            x += float(n)          #x = x + float(n) と同じ

        print(x)
        ```
        - 一気に書かず、まず`for`の中を`print(n)`にして引数が読めているか確認
    - 実行
        ```bash
        $ ./plus_b 1 2 3 4 5 6 7 8 9 10
        55.0
        ```

---

## 引数を使ったコマンドの作成3

- Pythonの「<span style="color:red">リスト内包表記</span>」を利用
    - 発展的な内容なのでPython初心者の人はやらないでよいです
    - 書き方: `[ 式 for 変数 in リスト ]` $\rightarrow$ 各要素に式を適用した新しいリスト
        - 後ろに`if 条件`を付けると条件に合う要素だけ残せる（`if`は次ページ）<br />　
    - 例（`plus_c`）
        ```python
        #!/usr/bin/python3
        import sys

        nums = [ float(e) for e in sys.argv[1:] ]   #引数を浮動小数点数に変換してリスト作成
        print(sum(nums))                            #リストの和を返すsum関数を利用
        ```
        - 実行例は省略（`plus_b`と同じ結果になる）

---

## if文を使う

- 次のように書く
    ```python
    if 条件1:   #条件1が成り立つと下の処理が実行される（elif以下はスキップ）
        処理    #処理はインデントのレベルをひとつ上げて記述
        ・・・
    elif 条件2: #条件1に合わない場合は条件2が調べられる
        処理    #（elifのブロックは省略や複数の記述が可能）
        ・・・
    else:       #ifやelifの条件に合わない場合に下の処理が実行される
        処理
        ・・・
    ```
- C言語との違い（エラーが出たらログを読んで該当箇所を確認）
    - 条件を囲む`( )`は不要。代わりに行末に<span style="color:red">`:`</span>が必要（忘れると`SyntaxError`）
    - `{ }`ではなく<span style="color:red">インデント</span>でブロックを表す（ずれると`IndentationError`）
    - `else if`は`elif`と書く

---

## 練習: if文

- if文を使い、次のコードを書きましょう（`plus_b`をコピーして改造）
    1. 引数で与えた数のうち、負の数の個数を`print`
    1. 負、ゼロ、正の個数をそれぞれ`print`（1のコードに`elif`と`else`を追加）
- 条件の書き方は、この例題についてはC言語と同じ
    - 数`x`に対して`x < 0.0`、`x == 0.0`、`x > 0.0`などと記述<br />　
- 実行例（2番目のもの）
    ```bash
    $ ./count -1 0 2 3
    負: 1
    ０: 1
    正: 2
    ```

---

## 練習の解答（2番目のもの）

```python
#!/usr/bin/python3
import sys

minus, zero, plus = 0, 0, 0     #こんなふうにまとめて初期化することが可能

for n in sys.argv[1:]:
    x = float(n)
    if x < 0.0:
        minus += 1
    elif x > 0.0:
        plus += 1
    else:                       #負でも正でもなければゼロ
        zero += 1

print("負:", minus)
print("０:", zero)
print("正:", plus)
```

---

## 後半: 標準入出力の操作と理解

---

## 標準入出力とは？

- コマンド（プログラム）には最初から3つの<span style="color:red">出入口</span>が用意されている
    - <span style="color:red">標準入力</span>(0): データを受け取る入口（何もしなければキーボード）
    - <span style="color:red">標準出力</span>(1): 結果を出す出口（何もしなければ端末の画面）
    - <span style="color:red">標準エラー出力</span>(2): エラーを出す出口（何もしなければ端末の画面）
    ```
    キーボード --> [0 標準入力] --> コマンド --> [1 標準出力]       --> 画面
                                        --> [2 標準エラー出力] --> 画面
    ```
    
- これまでの`print`は標準出力(1)に書いていた<br />
- 出入口の<span style="color:red">接続先はシェルが切り替えられる</span> $\rightarrow$ 後半はその方法を学ぶ
    - ファイルに保存（`>`）、ファイルから読む（`<`）、別のコマンドへ（`|`）

---

## コマンドの出力のファイルへの保存

- 端末への出力は<span style="color:red">「 > ファイル」</span>でファイルに保存可能
    ```bash
    $ ./plus_b 1 2 3 4 5 6 7 8 9 10 > ans    #ansというファイルに出力を保存
    $ cat ans                                #ansの中身の確認
    55.0
    ```
    - （出力の）<span style="color:red">リダイレクト</span>と呼ばれる機能
    - 注意: `>`はファイルがあれば上書き。末尾に追記したいときは`>>`<br />　
- リダイレクトの仕組み
    - シェルが標準出力(1)の接続先を、画面からファイルに切り替えている
    - コマンド側は何も変えていない。`print`で標準出力に書くだけ
        - 通常は、特に理由がなければ標準出力に結果を出す

---

## ファイルからの入力

- ファイルの中身は<span style="color:red">「 &lt; ファイル」</span>でコマンドに渡せる
    - 入力のリダイレクト: シェルが標準入力(0)の接続先をキーボードからファイルに切り替える<br />　
- Pythonでの受け取り方
    - <span style="color:red">`sys.stdin`</span>とfor文で<span style="color:red">標準入力</span>から1行ずつ受け取る（`read_stdin`）
    ```python
    #!/usr/bin/python3
    import sys

    for line in sys.stdin:
        word = line.strip()     #行末に改行文字が入っているのでstripメソッドで除去
        print(word + " を標準入力から読んだよ")
    ```

---

## 前ページのコードの実行結果

```bash
$ seq 5 > nums          #seq: 1から指定された数字まで出力。リダイレクトでnumsに保存
$ cat nums              #numsの中身の確認
1
2
・・・
5
$ ./read_stdin < nums   #numsを標準入力につなぐ
1 を標準入力から読んだよ
2 を標準入力から読んだよ
・・・
5 を標準入力から読んだよ

$ ./read_stdin          #<なしだと標準入力はキーボード。Ctrl+Dで終了
abc
abc を標準入力から読んだよ
```

---

## 標準入力からの数字の足し算

- コードの例（`plus_stdin`）: `plus_b`と違うのは`for`の1行だけ
    ```python
    #!/usr/bin/python3
    import sys

    x = 0.0
    for line in sys.stdin:      #plus_bのsys.argv[1:]をsys.stdinに変えただけ
        x += float(line)        #floatは前後の改行や空白を無視するのでstrip不要

    print(x)
    ```
    - できる人はリスト内包表記を使ってみましょう
- 実行
    ```bash
    $ ./plus_stdin < nums
    15.0
    ```

---

## パイプ

- 需要: `nums`の中身を見てから`plus_stdin`で足したい
    - 何かデータを処理する前に、まず`cat`で中身を見る人は多い
    ```bash
    $ cat nums
    1
    ・・・
    5
    $ cat nums | ./plus_stdin    #上矢印で直前のcat numsを呼び出し、| ./plus_stdinを追加
    15.0
    $ seq 5 | ./plus_stdin       #numsというファイルを作らなくても結局これでよい
    15.0
    ```
    
- <span style="color:red">`|`</span>（<span style="color:red">パイプ</span>）: コマンドの出力を別のコマンドの入力に渡す記号
    - 左のコマンドの標準出力(1)を右のコマンドの標準入力(0)に接続
    - ファイルを経由せずにデータを渡せる。リダイレクトと同じくシェルの機能

---

## パイプによるコマンドの連携

- 例: 横に並んだ数字を足す
    - `plus_stdin`は1行に1つの数がある前提 $\rightarrow$ 縦並びに変換してから渡す
    ```bash
    $ echo 1 2 3 4 5 > yoko_nums
    $ ./plus_stdin < yoko_nums                    #そのままだと1行全体を1つの数と見てエラー
    ValueError: could not convert string to float: '1 2 3 4 5\n'
    $ cat yoko_nums | tr ' ' '\n'                 #trで空白を改行に
    1
    ・・・
    5
    $ cat yoko_nums | tr ' ' '\n' | ./plus_stdin  #パイプは何個でもつなげられる
    15.0
    ```
    - <span style="color:red">`tr`</span>: 文字の置換コマンド<br />
- プログラムを書くときは、特別な理由がない限りデータは標準入力から受け取る
    - 引数や決まったファイルから読む作りだと、このような連携ができない

---

## パイプの利点

- 1つのコマンドは1つの仕事だけすればよい（<span style="color:red">UNIXの哲学</span>）
    - `plus_stdin`は横並びの数字や文字の混入に対応しなくてよい
        - 様々な入力に柔軟に対応<span style="color:red">しない</span>。柔軟さは`tr`などとの組み合わせで出す
    - 各コマンドのコードが短くなり、動作確認も楽
    - 既存のコマンドでできることは自分でプログラムしなくてよい<br />　
- <span style="color:red">実はROSも似た考え方で作られている</span>
    - プログラム（ノード）ごとに機能を分ける $\leftrightarrow$ コマンド
    - 入出力の形式を厳格に決めてデータを流す（トピック） $\leftrightarrow$ パイプ
    - 既存のプログラムを組み合わせて再利用しやすく

---

## 標準エラー出力

- コマンドにはパイプやリダイレクトで渡したくない出力も存在
    - エラーメッセージなど、ファイルにリダイレクトされると読めなくなる<br />　
- ちゃんとしたコマンドはエラーを<span style="color:red">標準エラー出力</span>(2)に出す
    - 例: `plus_stdin`に文字を入力してみる
        ```bash
        $ echo あ | ./plus_stdin > ans
        Traceback (most recent call last):                    #エラーはansに入らず画面に出てくる
          File "./plus_stdin", line 6, in <module>
            x += float(line)
        ValueError: could not convert string to float: 'あ\n' #余談: エラーはちゃんと読みましょう
        $ echo あ | ./plus_stdin > ans 2> err                 #エラーもファイルに入れたいときは2>
        ```
    - 標準出力(1)とは別の出口から出ている、`>`は`1>`の省略形
    - 標準エラー出力に表示するときは`print("メッセージ", file=sys.stderr)`

---

## 練習: 標準入力

- 前半で作った`count`を、標準入力から数を読む`count_stdin`に書き換えましょう<br />　
- 実行例
    ```bash
    $ seq -3 3 | ./count_stdin
    負: 3
    ０: 1
    正: 3
    ```

---

## まとめ

- 学んだこと
    - モジュールを`import`して使う、対話モードでちょっと試す
    - 引数と標準入力に関してPythonでプログラミング
        - 他の言語でも、ほぼ同じ
    - for文やリスト内包表記でリストを操作、if文の書き方
    - 標準入出力でコマンドを連携（ROSに通ずる考え方）<br />　
- 重要語句
    - モジュール、`import`、対話モード、`sys.argv`、float関数、リスト内包表記、if文
    - 標準入力(0)、標準出力(1)、標準エラー出力(2)、リダイレクト、パイプ
- コマンドや記号
    - `>`、`>>`、`<`、`2>`、`|`、`seq`、`tr`
