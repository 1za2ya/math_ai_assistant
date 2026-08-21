# 数学AIアシスタント

高校数学の学習を支援するWebアプリです。最終解答をすぐに示すのではなく、解法ステップと最初のヒントを提示し、学習者が自分で考えながら問題を解けるようにすることを目指しています。

## 使用技術

- Frontend: React、Vite、CSS
- Backend: FastAPI、Python
- AI: Google Gemini API（公式Python SDK）
- テスト: pytest（自動テストはレビュー待ちのブランチで開発中）
- バージョン管理・レビュー: Git、GitHub

## ディレクトリ構成

```text
math_ai_assistant/
├── frontend/          # React + Viteの画面
│   └── src/
│       ├── components/ # Header、Sidebar、Chatなど
│       └── pages/      # Homeページ
├── backend/           # FastAPIとGemini API連携
│   ├── main.py        # APIエンドポイント
│   ├── ai_service.py  # Gemini API通信
│   ├── prompt.py      # AIへの指示
│   └── requirements.txt
└── README.md
```

## Frontendのセットアップ

ターミナルで`frontend`へ移動し、依存パッケージをインストールして開発サーバーを起動します。

```bash
cd frontend
npm install
npm run dev
```

ターミナルに表示されるURLをブラウザで開いてください。通常は次のURLです。

- http://localhost:5173

終了するときは、ターミナルで`Ctrl + C`を押します。

## Backendのセットアップ

macOSでの実行例です。プロジェクトルートから`backend`へ移動し、Pythonの仮想環境を作成します。

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

## 環境変数

前の手順に続いて`backend`ディレクトリにいる状態で、`.env.example`をコピーして`.env`を作成します。

```bash
cp .env.example .env
```

作成した`.env`へ、自分で取得したGemini APIキーを設定してください。

```env
GEMINI_API_KEY=ここに自分のAPIキーを設定する
```

実際のAPIキーをソースコードやREADMEへ書かないでください。`.env`はGitの管理対象外であり、GitHubへコミット・Pushしてはいけません。

## Backendの起動

仮想環境を有効にした状態で、`backend`ディレクトリから起動します。

```bash
python -m uvicorn main:app --reload
```

起動後はSwagger UIでAPIの仕様確認と動作確認ができます。

- Swagger UI: http://127.0.0.1:8000/docs

`POST /api/chat`は数学の問題を受け取り、Gemini APIで生成した解法ステップと最初のヒントを返します。利用には有効な`GEMINI_API_KEY`が必要です。

サーバーを終了するときは`Ctrl + C`を押します。その後、仮想環境を終了する場合は次を実行します。

```bash
deactivate
```

## テストとコードチェック

現在の`main`ブランチにはpytestのテストとpytest依存関係がまだ含まれていません。Backend自動テストは`test/backend-chat`ブランチで開発中です。テストが`main`へマージされた時点で、実際の構成に合わせて実行手順を追記します。

Frontendでは、現在利用可能な次のコマンドでコードチェックとビルド確認ができます。プロジェクトルートから実行してください。

```bash
cd frontend
npm run lint
npm run build
```

## 現在の機能

`main`ブランチで確認できる内容は次のとおりです。

- Header、Sidebar、StatusBarを含むレスポンシブな画面
- 問題・詳細質問の入力欄と各種ボタンのUI
- サンプルの解法ステップとチャット表示
- サイドバーのボタン、オーバーレイ、Escapeキーによる開閉
- FastAPIの`POST /api/chat`
- Gemini APIによる解法ステップと最初のヒントの生成

Frontendの送信ボタンはBackend APIへ接続され、`/api`配下のエンドポイントへリクエストを送信します。

## 開発中の機能

次の機能はレビュー待ちであり、`main`へマージされるまでは実装済みとして扱いません。

- Backendの`POST /api/chat`自動テスト（`test/backend-chat`）
- 段階的なヒント機能（`feat/more_hint`）
- 会話履歴機能（`feat/talk_history`）

## 開発上の注意

- APIキーや`.env`をGitHubへPushしないでください。
- `.venv`、`__pycache__`、`*.pyc`、`node_modules`などの生成物をGit管理へ含めないでください。
- 機能や作業ごとにブランチを作成し、Pull Request、レビュー、マージの順で`main`へ反映します。
