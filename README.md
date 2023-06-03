# 機械学習サービス基盤用簡易UI - mlgrid-ui

[mlgrid-services](https://github.com/openlangrid/mlgrid-services)で提供されるサービスを利用するための簡易UIです。
TypeScriptおよびReactで開発されています。

# ビルド方法

## 必要なソフトウェア

* Docker 20.10

mlgrid-uiは、ビルドにnodejsとyarnを利用しています。ただしDockerを用いてビルド環境を作成するため、Dockerのみインストールされていれば、他のソフトウェアは必要ありません。

## ビルド

初めてビルドを行う際には、次のコマンドを実行してください。

```bash
bash ./yarn_install.sh
```

yarnを用いてライブラリがダウンロードされ、node_modulesディレクトリが作成されます。
次に、以下のコマンドを実行してください。

```bash
bash ./yarn_build.sh
```

mlgrid-uiがビルドされ、buildディレクトリにビルド結果が生成されます。


## Acknowledgements
このソフトウェアは、科研費19K20243の助成を受けた研究において作成されたものです。

## References
* 中口孝雄. 機械学習システムへの複合サービス技術の適用. 電子情報通信学会技術研究報告; 信学技報, 2019, 119.178: 39-40.
* 中口孝雄. 機械学習サービスを登録・提供するサービス基盤の構築に向けて. NAIS Journal, 2021, 15: 66-73.
