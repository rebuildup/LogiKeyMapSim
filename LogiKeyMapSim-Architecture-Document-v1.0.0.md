# Architecture Document: LogiKeyMapSim

Logical Key Mapping Simulator

論理キー配列シミュレータ

## 0. Document Information

- Version: 1.0.0
- Date: 2026/05/13
- Author: samuido(361do_sleep)
- Status: Approved
- Target Readers: AI Architects
- Related Documents: none

## 1. Overview

### 1.1 Purpose

この文書は、論理キー配列シミュレータ `LogiKeyMapSim` のアーキテクチャ設計を説明する。

この文書は、実装者、特にAIエージェントが重要な設計判断を追加で行わずに実装へ進めることを目的とする。  
そのため、単なる概要ではなく、責務分離、データ構造、依存方向、ファイル配置、命名、ADRの扱いまで含める。

### 1.2 System Summary

このシステムは、ユーザーが定義した物理キー配置と、その上に成立する論理キー配列を扱い、複数の論理キー配列間の変換をシミュレートするWebアプリケーションである。

物理キー配置は、実際にユーザーが使用するキーの数、位置、大きさの定義である。  
論理キー配列は、物理キー配置の上に成立する入力定義の集合であり、単純な文字入力だけでなく、レイヤー、同時押し、長押しなどを含む。

変換は常に論理キー配列対論理キー配列で行う。  
変換結果は、目的の配列にするために必要な変換操作の一覧として表示される。

### 1.3 Scope

この文書で扱う範囲は以下である。

- アプリ全体のアーキテクチャ方針
- 物理キー配置モデル
- 論理キー配列モデル
- 変換モデル
- 多段変換
- Workspace JSONファイル入出力
- 変換結果のPreview / JSON出力
- UI構成方針
- モジュール境界
- ファイル構成
- 依存方向
- ADRの管理方針
- 変換差分アルゴリズムの判定仕様
- Workspace JSON decode / validation仕様
- reducer action契約
- 初期テスト期待値
- TransformResultのResolved JSON出力契約
- reducer削除時の参照整合性ルール
- Action種別ごとのMVP対応段階
- import境界検証とDefinition of Done

### 1.4 Non-Scope

この文書では以下を扱わない。

- 個別具体的な実装コード全文
- 完成済みUIデザイン
- バックエンド設計
- 認証設計
- DB設計
- クラウド同期
- 全OSへの完全な自動設定
- 初期実装での全Exporter完成

## 2. Goals and Requirements

### 2.1 Business / Product Goals

複雑な論理キー配列変換を自動化し、発展した論理キー配列活用を補助する。

ユーザーごとに、使用している物理キー配置、論理キー配列、OS、変換目的が異なる。  
そのため、標準的なQWERTY配列やJIS/US配列を前提にせず、ユーザー自身が物理キー配置と論理キー配列を定義できることを重視する。

### 2.2 Functional Requirements

初期要件は以下である。

- 物理キー配置エディタ
  - キーの位置編集
  - キーの大きさ編集
  - ドラッグ移動
  - 数値入力による調整
  - キー削除
  - グループ編集
  - note編集
- 論理キー配列エディタ
  - 物理キー配置の参照
  - 文字入力Action
  - Layer
  - 同時押し
  - 長押し
- 論理キー配列間の変換
  - 変換元LogicalMapと変換先LogicalMapの比較
  - 多段変換
  - 変換元と変換先の入れ替え
  - 変換不能項目の手動対応表示
- Workspace JSONファイル入出力
  - Workspace全体の読み込み
  - Workspace全体のダウンロード
- 変換結果表示
  - 目的の配列にするために必要な変換操作一覧の表示
- 変換結果JSON出力
  - TransformResultを中立形式のJSONとして出力する

後続要件は以下である。

- 正規表現置換
- xmodmap出力
- Karabiner complex modifications出力
- ショートカットAction
- マクロAction
- IME状態Action

### 2.3 Quality Goals

- 変換結果の正しさを最優先する。
- 標準的な物理キーボードを前提にしない。
- ユーザーが定義した物理キー配置の上に、論理キー配列を構築する。
- 文字入力、レイヤー、同時押し、長押しを初期モデルの必須要素として扱う。
- ショートカット、マクロ、IME状態は追加要件として扱える構造にする。
- 多段変換を初期から扱えるようにする。
- 変換不能なものは自動でごまかさず、ユーザーに手動対応を求める。
- 同じ操作への重複割り当ては警告するが、出力は可能にする。
- 未割り当てキーなどは警告ではなく、ガイド情報として表示する。
- 変換ロジックはUIから独立させ、純粋な計算処理としてテスト可能にする。
- `diff`, `chain`, `manual`, `codec`, `state` はAI実装者の推測に任せず、この文書の契約に従って実装する。
- UI操作と変換ロジックを重点的にテストする。
- どの機能がどの債務を持つかを、ファイル構成から読み取れるようにする。

### 2.4 Constraints

- Next.js App Router配下の `/tools/logikeymapsim` に配置する。
- アプリは単一ページアプリとして構築する。
- サイト内の共有コンポーネントは使用しない。
- バックエンドは使用しない。
- localStorageは使用しない。
- 保存はWorkspace全体のJSONファイル読み込み・ダウンロードのみとする。
- JSONにはversionを入れない。
- React 18を使用する。
- Reactの状態管理は初期実装では `useReducer` を使用する。
- Zustand、Redux、Contextによるグローバル状態管理は初期実装では使用しない。
- Tailwind CSS v4を使用する。
- Tailwindは余白・配置には使ってよい。
- 色、ボーダー、背景色、選択色、警告色などの視覚装飾は指定しない。
- UI状態は、ReactDOM/HTML標準の状態属性とテキスト表示で表現する。
- `disabled`, `readOnly`, `checked`, `selected`, `open`, `aria-*` などの標準属性は使ってよい。
- 選択中、編集中、警告中、ドラッグ中などを独自色・独自ボーダー・独自背景で表現してはならない。
- UI以外の処理では、必要に応じてライブラリを使用してよい。
- UIはReactDOM中心で構成する。
- トップレベルに共有UIディレクトリを置かない。
- 共有を前提とした汎用 `Button`, `Modal`, `Form`, `Input` コンポーネントを作らない。
- 小さなフォーム要素や操作要素の重複は許容し、共通化より機能所有境界を優先する。

## 3. System Context

### 3.1 Users / Actors

対象ユーザーは、論理キー配列を使用している、または使用しようと考えている人である。

ユーザーごとに、物理キー配置、論理キー配列、OS、変換目的が異なる。  
多くのユーザーは物理キーや論理キー配列をカスタマイズしているため、標準的な物理キーを一意に定めることはできない。

### 3.2 External Systems

外部サービスとの連携は不要である。

ただし、将来的な出力先として以下を想定する。

- Workspace JSONファイル
- Resolved TransformResult JSON
- 正規表現置換
- xmodmap
- Karabiner complex modifications

### 3.3 Context Diagram

~~~mermaid
flowchart LR
  User[User] --> App[LogiKeyMapSim<br/>/tools/logikeymapsim]

  App --> WorkspaceJsonDownload[Workspace JSON Download]
  WorkspaceJsonFile[Workspace JSON File] --> App

  App --> Preview[Transform Preview]
  App --> ResultJson[Resolved TransformResult JSON]
  App --> Regex[Regex Replacement]
  App --> Xmodmap[xmodmap]
  App --> Karabiner[Karabiner complex modifications]
~~~

### 3.4 External Interfaces

| Interface | Direction | Description |
|---|---:|---|
| Browser UI | User -> App | 物理キー配置、論理キー配列、変換定義を編集する |
| Workspace JSON File Import | File -> App | Workspace全体を読み込む。永続化用途であり、`emit/` の責務ではない |
| Workspace JSON File Download | App -> File | Workspace全体をJSONとして保存する。永続化用途であり、`emit/` の責務ではない |
| Transform Preview | App -> User | 論理キー配列間の変換結果を表示する |
| Resolved TransformResult JSON | App -> Text/File | BindingRefを解決した自己完結スナップショットとして変換結果を出力する。`emit/json.ts` が所有する |
| Regex Replacement | Text -> Text | 設定ファイル等のテキスト内キー表記を置換する |
| xmodmap Export | App -> Text | xmodmap向け出力を生成する |
| Karabiner Export | App -> JSON/Text | Karabiner complex modifications向け出力を生成する |

## 4. Architecture Overview

### 4.1 Architecture Style

クライアントサイド完結の単一ページアプリケーションとする。

ただし、内部構造は単純なレイヤー分割ではなく、機能所有単位のモジュール分割を採用する。

このアプリでは、`ui/`, `domain/`, `calc/` のような技術カテゴリをトップレベルに並べない。  
UIは共有層ではなく、各機能の操作面であるため、それぞれの機能モジュール配下に閉じ込める。

トップレベルの分割は以下を基本とする。

| Module | Responsibility |
|---|---|
| `workspace/` | アプリ全体の状態、定義ブロック、機能モジュールの組み立て、Workspaceの検証・永続化形式 |
| `physical/` | 物理キー配置、キー位置・サイズ、ドラッグ編集、重なり検出 |
| `logical/` | 論理キー配列、Binding、Layer、同時押し、長押し、重複検出 |
| `transform/` | 論理キー配列間の差分比較、多段変換、手動対応項目の抽出 |
| `file/` | ブラウザFile API、汎用テキスト読み込み、汎用ダウンロード、汎用JSON構文処理 |
| `emit/` | TransformResultのPreviewおよび外部形式出力 |
| `preset/` | 初期データ |
| `base/` | どの機能にも属さない最小共通型 |

### 4.2 High-Level Structure

| Area | Responsibility | Debt Ownership |
|---|---|---|
| `workspace/` | Workspace全体、定義ブロック、アプリ全体の接続、Workspace codec | 全体状態とWorkspace構造の複雑さ |
| `physical/` | 物理キー配置、抽象座標、ドラッグ、数値編集、グループ | 物理配置編集の複雑さ |
| `logical/` | 物理キー配置上の論理入力、Layer、Combo、Hold | 入力意味定義の複雑さ |
| `transform/` | 論理キー配列間の差分、多段変換、変換操作一覧 | 変換アルゴリズムの複雑さ |
| `file/` | 汎用File API、汎用JSON構文処理 | Browser File APIとJSON構文処理の複雑さ |
| `emit/` | preview、Resolved TransformResult JSON、regex、xmodmap、Karabiner | 外部出力形式の複雑さ |
| `preset/` | 初期キー配置、初期論理配列 | プリセット内容の複雑さ |
| `base/` | ID、Issue、抽象単位などの最小共通概念 | 最小限の横断概念 |

### 4.3 Module Diagram

~~~mermaid
flowchart TD
  Page[page.tsx] --> App[app.tsx]

  App --> Workspace[workspace]
  Workspace --> Physical[physical]
  Workspace --> Logical[logical]
  Workspace --> Transform[transform]
  Workspace --> File[file]
  Workspace --> Emit[emit]

  Logical --> Physical
  Transform --> Logical
  Transform --> Physical
  Emit --> Transform
  Emit --> Logical
  Emit --> Physical
  Workspace --> WorkspaceCodec[workspace/codec]
  WorkspaceCodec --> File

  Preset[preset] --> Physical
  Preset --> Logical

  Workspace --> Base[base]
  Physical --> Base
  Logical --> Base
  Transform --> Base
  File --> Base
  Emit --> Base
~~~

`file/` から `workspace/` への実行時依存は禁止する。  
Workspaceの構造検証・永続化形式は `workspace/codec.ts` が所有し、`file/` は汎用File APIと汎用JSON構文処理だけを担当する。

### 4.4 Main Design Principles

- トップレベルの `ui/` ディレクトリは作らない。
- UIは共有層ではなく、各機能モジュールの内側に置く。
- 機能ごとに `model`, `calc`, `ui` を必要に応じて持つ。
- 物理キー配置の複雑さは `physical/` に閉じ込める。
- 論理キー配列の複雑さは `logical/` に閉じ込める。
- 変換アルゴリズムの複雑さは `transform/` に閉じ込める。
- 外部形式の都合は `emit/` に閉じ込める。
- ブラウザFile APIと汎用JSON構文処理は `file/` に閉じ込める。
- Workspace構造の検証と永続化形式は `workspace/codec.ts` に閉じ込める。
- `base/` は最小限に保ち、汎用 `utils.ts` のようなごみ箱にしない。
- import path上で同じ意味の単語が繰り返されないようにする。
- ファイル名は短くし、所属ディレクトリで意味を補う。
- 変換ロジックはUIから独立した純粋処理として実装する。
- 出力形式の差分は `emit/` に閉じ込める。
- `transform/` はxmodmapやKarabinerの事情を知らない。
- `file/` はWorkspaceの意味を知らない。

## 5. Building Block View

### 5.1 Component / Module List

| Module | Internal Parts | Responsibility | Depends on |
|---|---|---|---|
| `workspace/` | `model.ts`, `state.ts`, `codec.ts`, `ui/` | Workspace全体、更新処理、Workspace JSON構造検証、定義ブロック管理 | `physical`, `logical`, `transform`, `file`, `emit` |
| `physical/` | `model.ts`, `seed.ts`, `calc/`, `ui/` | 物理キー配置の定義と編集 | `base` |
| `logical/` | `model.ts`, `calc/`, `ui/` | 論理キー配列の定義と編集 | `base`, `physical` |
| `transform/` | `model.ts`, `calc/`, `ui/` | 論理キー配列間の変換導出 | `base`, `physical`, `logical` |
| `file/` | `json.ts`, `browser.ts` | 汎用JSON構文処理、File API、download処理 | `base` |
| `emit/` | `model.ts`, `preview.ts`, `json.ts`, `regex.ts`, `xmodmap.ts`, `karabiner.ts`, `ui/` | TransformResultの外部形式出力 | `base`, `physical`, `logical`, `transform` |
| `preset/` | `physical.ts`, `logical.ts` | 具体的な初期データ | `physical`, `logical` |
| `base/` | `id.ts`, `issue.ts`, `unit.ts` | 最小共通型 | none |

### 5.2 Module Details

#### `workspace/`

Workspace全体を所有する。

ここでは、物理キー配置、論理キー配列、変換定義、出力UI、ファイル操作を接続する。  
ただし、それぞれの具体的な編集処理や計算処理は各機能モジュールに委譲する。

`workspace/` はアプリ全体を組み立てる場所であり、個別機能の詳細ロジックを持たない。

`workspace/state.ts` はWorkspace更新処理を所有する。  
初期実装ではReactの `useReducer` を使用し、reducerはUI非依存の純粋関数として実装する。

Runtime上の現在の `TransformResult` は、Workspace JSONに保存されない導出データである。  
そのため、`workspace/state.ts` は永続化対象の `Workspace` と、表示中の `activeResult?: TransformResult` を分けて扱う。  
PhysicalLayout、LogicalMap、TransformChainのいずれかを変更するreducer actionは、必ず `activeResult` を破棄する。  
再計算は自動では行わず、ユーザーが変換実行を明示したときだけ `transform/calc/` を呼び出す。

`workspace/codec.ts` はWorkspace JSONの構造検証、Workspaceへの復元、WorkspaceからJSON化可能な値への変換を所有する。  
`file/` にWorkspaceの意味を持ち込まないため、Workspace固有の検証は `workspace/codec.ts` に置く。

#### `physical/`

物理キー配置に関する責務を持つ。

対象は以下である。

- `x, y, w, h` の抽象単位
- キーの追加
- キーの削除
- ドラッグ移動
- 数値調整
- グループ設定
- note
- 初期整列キー生成
- キー重なり検出

物理キーの重なりは警告するが許可する。  
この判断と検出処理は `physical/` が所有する。

`physical/seed.ts` は、空の整列済みキーグリッドやキー集合を生成するロジックを所有する。  
一方で、具体的な名前付き配列定義は `preset/physical.ts` が所有する。

#### `logical/`

論理キー配列に関する責務を持つ。

対象は以下である。

- 物理キー配置の参照
- Binding
- Layer
- 文字入力
- 同時押し
- 長押し
- 重複操作検出
- 未割り当てガイド

`logical/` は `physical/` を参照してよい。  
ただし、`physical/` は `logical/` を参照してはならない。

長押しは `Action` ではなく `InputTrigger` の一種として扱う。  
つまり、長押しは「どの入力条件でActionが発火するか」を表すものであり、出力Actionそのものではない。

#### `transform/`

論理キー配列間の変換に関する責務を持つ。

対象は以下である。

- 変換元LogicalMapと変換先LogicalMapの比較
- 多段変換
- 逆方向変換のための前提入れ替え
- 目的配列にするための変換操作一覧
- 手動対応が必要な項目の抽出

`transform/` は外部出力形式を知らない。  
xmodmapやKarabinerなどの都合は `emit/` が持つ。

TransformOperationはBinding全体を値として埋め込まず、Bindingへの参照を持つ。  
これにより、大量の変換結果でTransformResultが過剰に肥大化することを避ける。

#### `file/`

ブラウザのファイル操作と汎用JSON構文処理に関する責務を持つ。

対象は以下である。

- text file read
- text file download
- JSON parse
- JSON stringify
- JSON構文エラーの検出

`file/` はWorkspaceの意味を知らない。  
`file/` は `workspace/model.ts` を実行時importしてはならない。  
型参照が必要な場合でも、原則としてWorkspace型は `workspace/codec.ts` 側で扱う。

#### `emit/`

TransformResultを外部形式へ出力する責務を持つ。

対象は以下である。

- Preview表示用データ
- Resolved TransformResult JSON出力
- 正規表現置換
- xmodmap
- Karabiner complex modifications

`emit/json.ts` はWorkspace JSON出力ではなく、Resolved TransformResult JSON出力を所有する。  
Resolved TransformResult JSONは、`BindingRef` を展開した自己完結スナップショットであり、そのJSON単体でoperationの意味を読める形式にする。  
Workspace全体のJSON保存は `workspace/codec.ts` と `file/` の責務である。

外部ツール固有の制約や表現差は `emit/` が引き受ける。  
`transform/` に外部形式の都合を漏らしてはならない。

`TransformResult` は `BindingRef` を保持するため、`emit/` は出力時に `LogicalMap` と `PhysicalLayout` を参照して詳細を解決してよい。  
ただし、この参照は出力生成のための読み取り専用であり、`emit/` が `LogicalMap`、`PhysicalLayout`、`TransformResult` を変更してはならない。

代表的な入力契約は以下とする。

~~~ts
type EmitContext = {
  result: TransformResult;
  logicalMaps: LogicalMap[];
  physicalLayouts: PhysicalLayout[];
};
~~~

各Emitterは、必要に応じて `EmitContext` 全体、またはその部分集合を受け取る。  
例えば `emitPreview(context)`、`emitJson(context)`、`emitKarabiner(context)` のように呼び出す。

#### `preset/`

具体的な初期データを所有する。

`preset/physical.ts` は名前付きの物理キー配置プリセットを持つ。  
`preset/logical.ts` は名前付きの論理キー配列プリセットを持つ。

`preset/` は実データを置く場所であり、初期配置生成アルゴリズムは置かない。  
初期配置生成アルゴリズムは `physical/seed.ts` が所有する。

#### `base/`

どの機能にも属さない最小共通概念のみを置く。

置いてよいものは以下に限定する。

- ID型
- 抽象単位
- Issue種別
- 汎用Result型が必要な場合の最小定義

`base/` に巨大な `utils.ts` や横断的な便利関数を置いてはならない。

### 5.3 Dependency Rules

#### Allowed Dependencies

~~~txt
workspace -> physical
workspace -> logical
workspace -> transform
workspace -> file
workspace -> emit

logical -> physical
transform -> logical
transform -> physical
emit -> transform
emit -> logical
emit -> physical
preset -> physical
preset -> logical

all modules -> base
~~~

#### Type-Only Exceptions

実行時依存として扱わない型参照だけ、以下を許可する。

~~~txt
workspace/codec.ts -> workspace/model.ts
file/json.ts -> base/issue.ts
~~~

`file/ -> workspace` は型のみであっても原則避ける。  
Workspace構造の検証は `workspace/codec.ts` が所有し、`file/` は汎用JSON構文処理に留める。

#### Forbidden Dependencies

~~~txt
physical -> logical
physical -> transform
physical -> emit

logical -> transform
logical -> emit

transform -> emit
transform -> file

file -> workspace
file -> physical
file -> logical
file -> transform
file -> emit

emit -> workspace
emit -> file

model -> ui
calc -> ui
base -> feature modules
~~~

#### UI Dependency Rule

UIは各機能モジュール配下に置く。

~~~txt
physical/ui
logical/ui
transform/ui
workspace/ui
emit/ui
~~~

トップレベルに `ui/` を作らない。  
`file/ui` も作らない。Workspace JSONの読み込み・保存UIは `workspace/ui` が所有し、汎用File APIだけを `file/` から呼び出す。

理由は、UIが共有コンポーネント群ではなく、それぞれの機能の編集・操作面だからである。  
UIをトップレベルに置くと、機能所有権が曖昧になり、UIが全機能の債務を集める場所になる。

#### Naming Rule

ファイル名は所属ディレクトリと意味が重複しないようにする。

悪い例:

~~~txt
physical/physicalLayoutEditor.tsx
logical/logicalLayoutEditor.tsx
transform/transformChainPlanner.ts
file/workspaceJsonFileDownloader.ts
emit/exportKarabinerComplexModifications.ts
~~~

よい例:

~~~txt
physical/ui/edit.tsx
logical/ui/edit.tsx
transform/calc/chain.ts
workspace/codec.ts
file/browser.ts
emit/karabiner.ts
~~~

## 6. Runtime View

### 6.1 Main Use Case Flow

#### Flow 1: 物理キー配置を作成する

1. ユーザーがPhysical Layout定義ブロックを追加する。
2. 初期整列されたキー群を生成する、またはキーを個別追加する。
3. ユーザーがキーをドラッグして位置を調整する。
4. 必要に応じて `x, y, w, h` を数値で調整する。
5. 必要に応じて指、グループ、noteを設定する。
6. キーの重なりがある場合は警告を表示するが、保存は許可する。

#### Flow 2: 論理キー配列を作成する

1. ユーザーがLogicalMap定義ブロックを追加する。
2. 参照するPhysicalLayoutを選択する。
3. 物理キー配置を視覚表示する。
4. 各物理キー、または複数キー条件にActionを割り当てる。
5. 文字入力、Layer、同時押し、長押しを定義する。
6. 追加要件としてショートカット、マクロ、IME状態を扱える余地を残す。

#### Flow 3: 変換を導出する

1. ユーザーが変換元LogicalMapを選択する。
2. ユーザーが変換先LogicalMapを選択する。
3. 必要に応じて中間LogicalMapを追加し、多段変換にする。
4. `transform/calc/diff.ts` が差異を比較する。
5. `transform/calc/chain.ts` が多段変換を扱う。
6. 目的の配列にするための変換操作一覧を生成する。
7. 変換不能なものはユーザーに手動対応を求める。

#### Flow 4: 変換結果を出力する

1. ユーザーが出力形式を選択する。
2. Workspace UIが `TransformResult`、`LogicalMap[]`、`PhysicalLayout[]` を `EmitContext` として `emit/` に渡す。
3. `emit/preview.ts` または `emit/json.ts` が `BindingRef` を解決し、PreviewまたはResolved TransformResult JSONへ変換する。
4. 後続拡張では `emit/regex.ts`, `emit/xmodmap.ts`, `emit/karabiner.ts` が外部形式を生成する。
5. 外部形式で直接表現できない操作は、手動対応または出力上の注意として表示する。

#### Flow 5: Workspace JSONとして保存する

1. ユーザーがDownloadを実行する。
2. `workspace/codec.ts` がWorkspaceをJSON化可能な構造に変換する。
3. `file/json.ts` がJSON文字列へ変換する。
4. `file/browser.ts` がJSONファイルとして保存する。

#### Flow 6: Workspace JSONを読み込む

1. ユーザーがJSONファイルを選択する。
2. `file/browser.ts` がファイルをテキストとして読み込む。
3. `file/json.ts` がJSON構文を解析する。
4. `workspace/codec.ts` がWorkspace構造として検証する。
5. 正しければWorkspaceとして読み込む。
6. JSONが間違っている場合はエラーとして扱う。

### 6.2 Sequence Diagram

~~~mermaid
sequenceDiagram
  actor User
  participant WorkspaceUI as workspace/ui
  participant Physical as physical
  participant Logical as logical
  participant Transform as transform
  participant Emit as emit
  participant File as file
  participant Codec as workspace/codec

  User->>WorkspaceUI: 物理キー配置を編集
  WorkspaceUI->>Physical: PhysicalLayoutを更新

  User->>WorkspaceUI: 論理キー配列を編集
  WorkspaceUI->>Logical: LogicalMapを更新

  User->>WorkspaceUI: 変換元・変換先を選択
  WorkspaceUI->>Transform: diff / chain
  Transform->>Logical: LogicalMapを参照
  Transform->>Physical: PhysicalLayoutを参照
  Transform-->>WorkspaceUI: TransformResult

  User->>WorkspaceUI: TransformResultを出力
  WorkspaceUI->>Emit: emit context(result, logicalMaps, physicalLayouts)
  Emit->>Logical: BindingRefを解決するために参照
  Emit->>Physical: keyIdsを解決するために参照
  Emit-->>WorkspaceUI: emitted output

  User->>WorkspaceUI: Workspace JSON Download
  WorkspaceUI->>Codec: encode workspace
  Codec->>File: stringify / download text

  User->>WorkspaceUI: Workspace JSON Import
  WorkspaceUI->>File: read text / parse syntax
  File-->>WorkspaceUI: unknown json value
  WorkspaceUI->>Codec: decode workspace
  Codec-->>WorkspaceUI: Workspace or error
~~~

### 6.3 Error Flow

| Case | Handling |
|---|---|
| JSON構文が不正 | `file/json.ts` でエラーとして扱い、読み込まない |
| JSON構造がWorkspaceとして不正 | `workspace/codec.ts` でエラーとして扱い、読み込まない |
| 出力時に構文エラーが出る | 実装ミスとして扱う |
| 同じ操作への重複割り当て | 警告として表示するが出力可能 |
| 未割り当てキー | 警告ではなくガイドとして表示 |
| 変換不能な操作 | ユーザーに手動対応を求める |
| 物理キーの重なり | 警告として表示するが許可する |

### 6.4 State Transitions

~~~mermaid
stateDiagram-v2
  [*] --> EmptyWorkspace
  [*] --> WorkspaceJsonLoaded
  EmptyWorkspace --> PhysicalLayoutDefined
  WorkspaceJsonLoaded --> PhysicalLayoutDefined
  WorkspaceJsonLoaded --> LogicalMapDefined
  WorkspaceJsonLoaded --> TransformDefined
  PhysicalLayoutDefined --> LogicalMapDefined
  LogicalMapDefined --> TransformDefined
  TransformDefined --> TransformResultGenerated: explicit recalculate
  TransformResultGenerated --> Emitted
  TransformResultGenerated --> WorkspaceJsonDownloaded
  TransformResultGenerated --> TransformResultInvalidated: edit Workspace
  TransformResultInvalidated --> TransformDefined
  LogicalMapDefined --> PhysicalLayoutDefined
~~~

Workspace JSONを読み込んだ場合、空Workspaceを経由せず、読み込まれた内容に応じて `PhysicalLayoutDefined`、`LogicalMapDefined`、または `TransformDefined` 相当の状態へ遷移する。  
読み込み後の `TransformResult` は保存データから復元せず、必要になった時点で再計算する。

表示中の `TransformResult` がある状態で、PhysicalLayout、LogicalMap、TransformChainのいずれかが編集された場合、その `TransformResult` は無効化して破棄する。  
このアプリでは、Workspace編集後の自動再計算は行わない。  
ユーザーが明示的に変換実行を行ったときだけ、新しいWorkspace状態をもとに再計算する。

## 7. Data Architecture

### 7.1 Data Model

~~~ts
export type Id = string;
export type IdPrefix = "phys" | "key" | "map" | "layer" | "bind" | "chain" | "op";
export type Unit = number;

export type Workspace = {
  physicalLayouts: PhysicalLayout[];
  logicalMaps: LogicalMap[];
  transformChains: TransformChain[];
};

export type RuntimeState = {
  workspace: Workspace;
  activeResult?: TransformResult;
};

export type PhysicalLayout = {
  id: Id;
  name: string;
  keys: PhysicalKey[];
};

export type PhysicalKey = {
  id: Id;
  x: Unit;
  y: Unit;
  w: Unit;
  h: Unit;
  finger?: string;
  groups?: string[];
  note?: string;
};

export type LogicalMap = {
  id: Id;
  name: string;
  physicalId: Id;
  bindings: Binding[];
  layers: Layer[];
};

export type Layer = BaseLayer | ConditionalLayer;

export type BaseLayer = {
  id: Id;
  name: string;
  kind: "base";
};

export type ConditionalLayer = {
  id: Id;
  name: string;
  kind: "conditional";
  trigger: InputTrigger;
};

export type Binding = {
  id: Id;
  trigger: InputTrigger;
  action: Action;
};

export type InputTrigger = PressTrigger | ComboTrigger | HoldTrigger;

export type PressTrigger = {
  type: "press";
  keyId: Id;
  layerId?: Id;
};

export type ComboTrigger = {
  type: "combo";
  keyIds: Id[];
  layerId?: Id;
};

export type HoldTrigger = {
  type: "hold";
  keyId: Id;
  layerId?: Id;
  durationMs?: number;
};

export type Action =
  | CharacterAction
  | LayerAction
  | ShortcutAction
  | MacroAction
  | ImeAction;

export type CharacterAction = {
  type: "character";
  value: string;
};

export type LayerAction = {
  type: "layer";
  targetLayerId: Id;
  mode: "whileHeld" | "toggle";
};

export type ShortcutAction = {
  type: "shortcut";
  keys: string[];
};

export type MacroAction = {
  type: "macro";
  steps: MacroStep[];
};

export type ImeAction = {
  type: "ime";
  value: string;
};

export type MacroStep = {
  action: Action;
  delayMs?: number;
  note?: string;
};

export type TransformChain = {
  id: Id;
  name: string;
  logicalMapIds: Id[];
};

export type BindingRef = {
  logicalMapId: Id;
  bindingId: Id;
};

export type TransformResult = {
  chainId: Id;
  operations: TransformOperation[];
  warnings: Issue[];
  guides: Issue[];
};

export type TransformStage = {
  index: number;
  fromLogicalMapId: Id;
  toLogicalMapId: Id;
};

export type ManualReason =
  | "missingSourceAction"
  | "missingTargetAction"
  | "ambiguousSourceAction"
  | "ambiguousTargetAction"
  | "unsupportedAction"
  | "invalidReference";

export type TransformOperation = {
  id: Id;
  kind: "replace" | "manual";
  stage: TransformStage;
  from?: BindingRef;
  to?: BindingRef;
  reason?: ManualReason;
  note?: string;
};

export type Issue = {
  level: "error" | "warning" | "guide";
  code: string;
  message: string;
  relatedIds: Id[];
};

export type PhysicalKeyPatch = Partial<Pick<PhysicalKey, "x" | "y" | "w" | "h" | "finger" | "groups" | "note">>;
export type PhysicalLayoutPatch = Partial<Pick<PhysicalLayout, "name">>;
export type LogicalMapPatch = Partial<Pick<LogicalMap, "name">>;
export type BaseLayerPatch = Partial<Pick<BaseLayer, "name">>;
export type ConditionalLayerPatch = Partial<Pick<ConditionalLayer, "name" | "trigger">>;
export type BindingTriggerPatch = Pick<Binding, "trigger">;
export type BindingActionPatch = Pick<Binding, "action">;
export type TransformChainPatch = Partial<Pick<TransformChain, "name" | "logicalMapIds">>;

export type ResolvedTransformResultJson = {
  kind: "resolved-transform-result";
  chainId: Id;
  operations: ResolvedTransformOperation[];
  warnings: Issue[];
  guides: Issue[];
};

export type ResolvedTransformOperation = {
  id: Id;
  kind: "replace" | "manual";
  stage: TransformStage;
  from?: ResolvedBinding;
  to?: ResolvedBinding;
  reason?: ManualReason;
  note?: string;
};

export type ResolvedBinding = {
  logicalMapId: Id;
  bindingId: Id;
  trigger: InputTrigger;
  action: Action;
  keyNames: string[];
  layerName: string;
};
~~~

### 7.2 Model Notes

#### Hold

長押しは `InputTrigger` の一種である。  
`HoldAction` は定義しない。

理由は、長押しは「Actionの種類」ではなく、「Actionを発火させる条件」だからである。  
長押しによってレイヤーを有効化したい場合は、`HoldTrigger` と `LayerAction` を組み合わせる。

#### Layer

`Layer` は `BaseLayer` と `ConditionalLayer` に分ける。

- `BaseLayer` は通常時に有効なレイヤーである。
- `ConditionalLayer` は `trigger` によって有効になるレイヤーである。

1つのLogicalMapには、`kind: "base"` のBaseLayerを必ず1つ置く。  
同一LogicalMap内のLayer nameは一意でなければならない。  
Layer nameは、LogicalMap間でLayerActionを比較するときの意味キーとして使う。  
`PressTrigger`、`ComboTrigger`、`HoldTrigger` の `layerId` が `undefined` のBindingは、BaseLayerに属するものとして扱う。  
`layerId: undefined` は「全レイヤーで有効」を意味しない。  
全レイヤー共通のBindingを表現したい場合は、初期実装では各Layerに明示的なBindingを作成する。

`ConditionalLayer.trigger` は、BaseLayer上で評価されるTriggerだけを許可する。  
つまり、`ConditionalLayer.trigger.layerId` は `undefined` またはBaseLayerのIDでなければならない。  
ConditionalLayerのtriggerが自分自身、または別のConditionalLayerを参照することは禁止する。  
これにより、Layer発火条件の自己参照・循環参照を初期モデルから排除する。

`trigger?: InputTrigger` のようなoptional定義にはしない。  
optionalにすると、Layer自体の `trigger` の `undefined` が「常時有効」なのか「未設定」なのか曖昧になるためである。

#### MacroStep

`MacroStep` は単なる `Action[]` の別名ではない。  
将来的に各ステップへ `delayMs` や `note` を持たせるため、Actionを直接配列にせず、ラッパーを残す。

#### Action Support Stage

`Action` 型には後続拡張の種類も含めるが、初期実装で全種別をUI編集・diff・emitまで完全対応するわけではない。  
Action種別ごとの対応段階はSection 7.12で固定する。

#### TransformOperation

`TransformOperation` は `Binding` 全体を埋め込まず、`BindingRef` を持つ。

理由は以下である。

- TransformResultの肥大化を避けるため。
- 変換結果と元データの関係を追跡しやすくするため。
- UIやemit側で必要な詳細を、LogicalMapから解決できるようにするため。

`BindingRef` の解決は、出力生成時に `EmitContext` として渡される `LogicalMap[]` と `PhysicalLayout[]` を使って行う。  
`TransformResult` 自体は、BindingやPhysicalKeyの完全なコピーを持たない。

`replace` operation は `from` と `to` を必ず持つ。  
`manual` operation は、手動対応の理由に応じて `from` だけ、`to` だけ、または両方を持てる。

| ManualReason | Meaning |
|---|---|
| `missingSourceAction` | target側に存在するActionをsource側で見つけられない |
| `missingTargetAction` | source側に存在するActionがtarget側に存在しない |
| `ambiguousSourceAction` | 同じActionに対応するsource Bindingが複数あり、自動選択できない |
| `ambiguousTargetAction` | 同じActionに対応するtarget Bindingが複数あり、自動選択できない |
| `unsupportedAction` | 初期実装のdiffで等価判定できないActionである |
| `invalidReference` | BindingRef解決に必要な参照が壊れている |

`stage` は多段変換内のどの段階で発生したoperationかを表す。  
`stage.index` は `TransformChain.logicalMapIds` の隣接ペアに対する0始まりの番号である。

### 7.3 Data Ownership

| Data | Owner |
|---|---|
| Workspace | `workspace/` |
| RuntimeState / activeResult | `workspace/state.ts` |
| Workspace encode/decode | `workspace/codec.ts` |
| PhysicalLayout | `physical/` |
| PhysicalKey | `physical/` |
| LogicalMap | `logical/` |
| Binding | `logical/` |
| Layer | `logical/` |
| TransformChain | `transform/` |
| TransformResult | `transform/` |
| Generic JSON parse/stringify | `file/` |
| Browser File API | `file/` |
| Preview / TransformResult external output | `emit/` |

### 7.4 Persistence

- Workspace全体をJSONファイルとして保存する。
- JSONにはversionを入れない。
- versionなし方針は、公開互換性を保証しない公開前の実装段階のWorkspace JSONに限定する。
- 公開後に過去Workspace JSONとの互換性を保証する必要が出た場合は、新ADRでADR-009を置き換え、`schemaVersion` または同等の互換性フィールドを追加する。
- localStorageは使用しない。
- 個別の物理キー配置、論理配列、変換定義だけを保存する機能は初期要件に含めない。
- `TransformResult` は導出データであり、Workspace JSONには保存しない。
- `emit/json.ts` が出力するResolved TransformResult JSONは、Workspace永続化形式ではなく、外部確認・共有用の自己完結スナップショットである。
- Workspace JSONを読み込んだ後、変換結果は `transform/calc/` によって再計算する。
- Runtime上で表示中の `TransformResult` は `activeResult` として扱う。
- PhysicalLayout、LogicalMap、TransformChainのいずれかが編集された場合、既存の `activeResult` は破棄する。
- Workspace編集後に自動再計算は行わない。ユーザーが変換実行を明示したときだけ再計算する。
- 読み込まれるJSONが構文として間違っている場合は `file/json.ts` のエラーとして扱う。
- 読み込まれるJSONがWorkspace構造として間違っている場合は `workspace/codec.ts` のエラーとして扱う。

### 7.5 Data Flow

~~~mermaid
flowchart LR
  PhysicalLayout[PhysicalLayout] --> LogicalMap[LogicalMap]
  LogicalMap --> TransformChain[TransformChain]
  TransformChain --> TransformCalc[transform/calc]
  TransformCalc --> TransformResult[TransformResult]
  TransformResult --> Preview[emit/preview]
  TransformResult --> ResultJson[emit/json]
  TransformResult --> External[emit/regex/xmodmap/karabiner]

  Workspace[Workspace] --> CodecEncode[workspace/codec encode]
  CodecEncode --> FileJson[file/json stringify]
  FileJson --> Download[file/browser download]

  Upload[file/browser read] --> FileParse[file/json parse]
  FileParse --> CodecDecode[workspace/codec decode]
  CodecDecode --> Workspace
~~~

### 7.6 Workspace Codec Contract

`workspace/codec.ts` は、Workspace JSONをアプリ内部の `Workspace` として受け入れてよいかを判定する。  
`file/json.ts` はJSON構文だけを扱い、Workspaceとしての意味検証を行わない。

#### Decode Result

~~~ts
export type DecodeResult =
  | { ok: true; workspace: Workspace }
  | { ok: false; issues: Issue[] };
~~~

`decodeWorkspace(value)` は、部分的に壊れたWorkspaceを補正して受け入れてはならない。  
1つでも `error` がある場合は `ok: false` を返し、既存のRuntimeStateを変更しない。

#### Unknown Field Policy

未知フィールドはエラーとして扱う。  
`version`, `schemaName`, `format` などの将来予約フィールドも、初期仕様では入れない。

理由は、JSONにversionを入れない判断を採用しているため、未知フィールドを黙って許可すると、AI実装者や将来の実装が暗黙の互換性を期待し始めるためである。  
形式を変更する場合は、新しいADRで明示的に判断する。

#### ADR-009 Exit Condition

JSONにversionを入れない判断は、初期実装とDraft運用のための制約である。
公開後にユーザーがWorkspace JSONを永続データとして使い始める前に、version導入の要否を再判断する。

以下のいずれかが発生する場合、ADR-009を `Superseded` にし、version付きWorkspace JSONへ移行する新ADRを追加する。

- Workspace JSONの破壊的形式変更が1回でも必要になる。
- 公開後のWorkspace JSONを後方互換で読み込む必要が出る。
- 未知フィールドをerrorにする方針が実運用上の互換性問題になる。

#### Validation Rules

| Target | Error Condition | Level | Code |
|---|---|---|---|
| Workspace | rootがobjectでない | error | `workspace.notObject` |
| Workspace | `physicalLayouts` が配列でない | error | `workspace.invalidPhysicalLayouts` |
| Workspace | `logicalMaps` が配列でない | error | `workspace.invalidLogicalMaps` |
| Workspace | `transformChains` が配列でない | error | `workspace.invalidTransformChains` |
| Any object | 未知フィールドを持つ | error | `codec.unknownField` |
| Id | 空文字または文字列でない | error | `id.invalid` |
| PhysicalLayout | layout id が重複する | error | `physical.duplicateLayoutId` |
| PhysicalKey | key id が同一PhysicalLayout内で重複する | error | `physical.duplicateKeyId` |
| PhysicalKey | `x`, `y`, `w`, `h` が有限数でない | error | `physical.invalidUnit` |
| PhysicalKey | `w <= 0` または `h <= 0` | error | `physical.invalidSize` |
| LogicalMap | `physicalId` が存在しない | error | `logical.missingPhysicalLayout` |
| Layer | BaseLayerが0個または2個以上 | error | `layer.invalidBaseLayerCount` |
| Layer | layer id が同一LogicalMap内で重複する | error | `layer.duplicateLayerId` |
| Layer | layer name が同一LogicalMap内で重複する | error | `layer.duplicateLayerName` |
| ConditionalLayer | `trigger` が存在しない | error | `layer.missingTrigger` |
| ConditionalLayer | `trigger.layerId` がConditionalLayerを参照する | error | `layer.triggerNotBase` |
| ConditionalLayer | `trigger.layerId` が自分自身を参照する | error | `layer.selfTrigger` |
| Binding | binding id が同一LogicalMap内で重複する | error | `binding.duplicateBindingId` |
| PressTrigger | `keyId` が参照先PhysicalLayoutに存在しない | error | `binding.missingKey` |
| ComboTrigger | `keyIds.length < 2` | error | `binding.invalidComboLength` |
| ComboTrigger | `keyIds` に重複がある | error | `binding.duplicateComboKey` |
| ComboTrigger | `keyIds` 内のkey idが参照先PhysicalLayoutに存在しない | error | `binding.missingKey` |
| HoldTrigger | `keyId` が参照先PhysicalLayoutに存在しない | error | `binding.missingKey` |
| Any Trigger | `layerId` が指定され、同一LogicalMap内に存在しない | error | `binding.missingLayer` |
| LayerAction | `targetLayerId` が同一LogicalMap内に存在しない | error | `action.missingTargetLayer` |
| ShortcutAction | `keys` が配列でない | error | `action.invalidShortcutKeys` |
| MacroAction | `steps` が配列でない | error | `action.invalidMacroSteps` |
| ImeAction | `value` が文字列でない | error | `action.invalidImeValue` |
| MacroStep | `delayMs` が指定され、有限数でない | error | `action.invalidMacroDelay` |
| TransformChain | chain id が重複する | error | `transform.duplicateChainId` |
| TransformChain | `logicalMapIds.length < 2` | error | `transform.invalidChainLength` |
| TransformChain | `logicalMapIds` 内のLogicalMap idが存在しない | error | `transform.missingLogicalMap` |

### 7.7 Transform Diff Contract

`transform/calc/diff.ts` は、Trigger同士を直接比較して変換を作るのではなく、Actionを意味キーとして逆引きし、source側のTriggerをtarget側のTriggerへ置き換えるoperationを生成する。

#### Inputs and Output

~~~ts
diff(source: LogicalMap, target: LogicalMap, context: {
  physicalLayouts: PhysicalLayout[];
  stage: TransformStage;
}): TransformResult
~~~

`diff` はUI、File API、emit処理に依存しない。  
入力LogicalMapは `workspace/codec.ts` または `workspace/state.ts` によって参照整合性が保たれている前提とする。

#### Layer Key Normalization

LayerはLogicalMap内部のIDで参照されるが、LogicalMap間のAction比較ではIDを直接比較しない。  
Action比較では以下の `layerKey` を使う。

| Layer | layerKey |
|---|---|
| BaseLayer | `base` |
| ConditionalLayer | `conditional:<layer.name>` |

このため、Layer名は同一LogicalMap内で一意でなければならない。  
同名LayerがあるWorkspaceは `workspace/codec.ts` でエラーにする。

#### Trigger Normalization

| Trigger | Normalized Form |
|---|---|
| PressTrigger | `press:<layerKey>:<keyId>` |
| ComboTrigger | `combo:<layerKey>:<sorted keyIds joined by +>` |
| HoldTrigger with no duration | `hold:<layerKey>:<keyId>:default` |
| HoldTrigger with duration | `hold:<layerKey>:<keyId>:<durationMs>` |

- `layerId: undefined` はBaseLayerとして正規化する。
- Comboの `keyIds` の順序は意味を持たない。
- Comboの `keyIds` は正規化前に昇順ソートする。
- Holdの `durationMs` は、未定義同士だけを等価とする。
- `durationMs: undefined` と `durationMs: 300` は等価ではない。
- durationの許容誤差は設けない。

#### Action Normalization

初期実装のdiffで自動変換対象にするActionは `CharacterAction` と `LayerAction` のみとする。  
`ShortcutAction`、`MacroAction`、`ImeAction` は型とcodecでは受け入れるが、初期diffでは `unsupportedAction` としてmanual operationにする。

| Action | Action Key Rule | MVP diff support |
|---|---|---|
| CharacterAction | `character:<value>` | supported |
| LayerAction | `layer:<mode>:<target layerKey>` | supported |
| ShortcutAction | `shortcut:<sorted keys joined by +>` | unsupported in MVP |
| MacroAction | `macro:<step action keys with delayMs>` | unsupported in MVP |
| ImeAction | `ime:<value>` | unsupported in MVP |

- Characterの `value` は完全一致で比較する。Unicode正規化や大文字小文字変換は行わない。
- Shortcutの `keys` は同時入力として扱い、順序は意味を持たない。
- Macroの `steps` は順序に意味がある。
- MacroStepの `delayMs` は未定義と数値を区別する。
- Action keyを作れない場合は `unsupportedAction` としてmanual operationにする。
- LayerActionの `targetLayerId` は、同一LogicalMap内のLayerを解決してから `layerKey` に変換する。

#### Diff Algorithm

1. source LogicalMapの各BindingについてAction keyを作る。
2. target LogicalMapの各BindingについてAction keyを作る。
3. Action keyごとにsource bindingsとtarget bindingsをindex化する。
4. target bindingごとに、同じAction keyを持つsource bindingを探す。
5. sourceが1件、targetが1件で、trigger keyが異なる場合は `replace` operationを生成する。
6. sourceが1件、targetが1件で、trigger keyが同じ場合はoperationを生成しない。
7. sourceが0件の場合は `manual` operationを生成し、`reason: "missingSourceAction"` とする。
8. sourceが複数ある場合は `manual` operationを生成し、`reason: "ambiguousSourceAction"` とする。
9. target側で同じAction keyが複数ある場合は `manual` operationを生成し、`reason: "ambiguousTargetAction"` とする。
10. sourceに存在し、targetに存在しないAction keyは `manual` operationを生成し、`reason: "missingTargetAction"` とする。
11. Action keyを作れないBindingは `manual` operationを生成し、`reason: "unsupportedAction"` とする。

#### Warning and Guide Ownership

`diff.ts` は変換operationの生成だけを行う。  
重複Action検出は `logical/calc/duplicate.ts`、手動対応項目の整理は `transform/calc/manual.ts` が所有する。

ただし、`diff.ts` がmanual operationを生成することは許可する。  
`manual.ts` は、manual operationをユーザー表示向けに整理する役割を持つ。

### 7.8 Transform Chain Contract

`transform/calc/chain.ts` は、`TransformChain.logicalMapIds` の隣接ペアごとに `diff` を実行する。

例:

~~~txt
[A, B, C]
~~~

この場合、以下の2段階を実行する。

~~~txt
stage 0: A -> B
stage 1: B -> C
~~~

各operationには必ず `stage` を付与する。  
あるstageでmanual operationが発生しても、後続stageのdiffは継続する。  
ただし、最終表示ではmanual operationをstageごとに分けて表示する。

### 7.9 Reducer Action Contract

初期状態管理は `useReducer` で実装し、RuntimeStateは `workspace/state.ts` が所有する。  
状態更新Actionは以下に限定する。AI実装者は新しいActionを勝手に追加しない。必要になった場合は文書を更新する。

Reducerは常に参照整合性のあるWorkspaceだけを返す。  
参照を壊す削除・patchはrejectし、RuntimeStateを変更しない。

| Action | Payload | activeResult |
|---|---|---|
| `workspace/load` | `{ workspace: Workspace }` | discard |
| `workspace/reset` | none | discard |
| `physical/addLayout` | `{ layout: PhysicalLayout }` | discard |
| `physical/removeLayout` | `{ layoutId: Id }` | discard if accepted |
| `physical/patchLayout` | `{ layoutId: Id; patch: PhysicalLayoutPatch }` | discard |
| `physical/addKey` | `{ layoutId: Id; key: PhysicalKey }` | discard |
| `physical/patchKey` | `{ layoutId: Id; keyId: Id; patch: PhysicalKeyPatch }` | discard |
| `physical/removeKey` | `{ layoutId: Id; keyId: Id }` | discard if accepted |
| `logical/addMap` | `{ map: LogicalMap }` | discard |
| `logical/removeMap` | `{ logicalMapId: Id }` | discard if accepted |
| `logical/patchMap` | `{ logicalMapId: Id; patch: LogicalMapPatch }` | discard |
| `logical/addLayer` | `{ logicalMapId: Id; layer: Layer }` | discard |
| `logical/patchBaseLayer` | `{ logicalMapId: Id; layerId: Id; patch: BaseLayerPatch }` | discard |
| `logical/patchConditionalLayer` | `{ logicalMapId: Id; layerId: Id; patch: ConditionalLayerPatch }` | discard |
| `logical/removeLayer` | `{ logicalMapId: Id; layerId: Id }` | discard if accepted |
| `logical/addBinding` | `{ logicalMapId: Id; binding: Binding }` | discard |
| `logical/patchBindingTrigger` | `{ logicalMapId: Id; bindingId: Id; patch: BindingTriggerPatch }` | discard |
| `logical/patchBindingAction` | `{ logicalMapId: Id; bindingId: Id; patch: BindingActionPatch }` | discard |
| `logical/removeBinding` | `{ logicalMapId: Id; bindingId: Id }` | discard |
| `transform/addChain` | `{ chain: TransformChain }` | discard |
| `transform/removeChain` | `{ chainId: Id }` | discard |
| `transform/patchChain` | `{ chainId: Id; patch: TransformChainPatch }` | discard |
| `transform/run` | `{ result: TransformResult }` | keep result |
| `transform/clearResult` | none | clear |

`discard` は `activeResult` を `undefined` にすることを意味する。  
`transform/run` だけが `activeResult` を設定してよい。  
Workspace編集Actionの内部で自動的に `diff` や `chain` を実行してはならない。

#### Patch Payload Rule

Reducer actionのpatch payloadに `Partial<PhysicalKey>`、`Partial<Binding>`、`Partial<Layer>`、`Partial<TransformChain>` を直接使ってはならない。  
変更可能なフィールドを絞った専用Patch型だけを使う。

禁止例:

~~~ts
{ patch: Partial<Binding> }
{ patch: Partial<PhysicalKey> }
~~~

許可例:

~~~ts
{ patch: PhysicalKeyPatch }
{ patch: BindingTriggerPatch }
{ patch: BindingActionPatch }
~~~

ID、kind、typeなど、参照整合性や判別共用体を壊すフィールドはpatchできない。

#### Reducer Reference Integrity Policy

Reducerは、UI操作によって参照整合性の壊れたWorkspaceを作ってはならない。
Import時の参照壊れは `workspace/codec.ts` が拒否し、実行中の編集による参照壊れは `workspace/state.ts` が拒否する。

初期実装では、自動cascade deleteは行わない。
ユーザーが参照先を削除したい場合は、先に参照しているBinding、LayerAction、LogicalMap、TransformChainを明示的に解除・削除する必要がある。

`activeResult` は導出データであり、削除Actionが受理された場合は破棄する。
削除Actionがrejectされた場合は、Workspaceも `activeResult` も変更しない。

#### Delete Reference Policy

削除Actionは、参照を壊す場合に連鎖削除しない。  
参照が残る削除はrejectし、RuntimeStateを変更しない。

| Action | Reject Condition | Accepted Behavior |
|---|---|---|
| `physical/removeLayout` | LogicalMapがそのPhysicalLayoutを参照している | layoutを削除し、activeResultを破棄 |
| `physical/removeKey` | 対象layoutを参照するLogicalMap内のBindingまたはConditionalLayer.triggerがkeyを参照している | keyを削除し、activeResultを破棄 |
| `logical/removeMap` | TransformChainがそのLogicalMapを参照している | mapを削除し、activeResultを破棄 |
| `logical/removeLayer` | BaseLayerである、Binding.trigger.layerIdが参照している、LayerAction.targetLayerIdが参照している、ConditionalLayer.trigger.layerIdが参照している | layerを削除し、activeResultを破棄 |
| `logical/removeBinding` | なし | bindingを削除し、activeResultを破棄 |
| `transform/removeChain` | なし | chainを削除し、activeResultを破棄 |

Rejected actionはno-opとする。  
Rejected actionではWorkspaceも `activeResult` も変更しない。

UIは削除前に参照状況を表示してよいが、参照を自動で連鎖削除してはならない。

#### LogicalMap Physical Reference Rule

`LogicalMap.physicalId` は作成後にpatchで変更しない。  
物理キー配置を変えたい場合は、新しいLogicalMapを作成する。  
この制約により、既存Bindingのkey参照が別PhysicalLayoutで不正化することを防ぐ。

### 7.10 UI DOM Contract

UIは標準HTML要素とReactDOMイベントで実装する。  
独自の色・ボーダー・背景・影・アニメーションによる状態表現は追加しない。

#### Physical Key Element

物理キーの表示要素は、原則として以下のどちらかにする。

- `<button type="button">`
- `<div role="button" tabIndex={0}>`

初期実装では `<button type="button">` を優先する。  
ブラウザ標準のbutton表示に含まれる境界やフォーカス表示は許容する。  
ただし、独自CSSで色、ボーダー、背景、outline、shadowを追加してはならない。

#### Drag Handling

物理キーの移動はHTML Drag and Drop APIではなく、ReactのPointer Eventsで実装する。

使用するイベント:

- `onPointerDown`
- `onPointerMove`
- `onPointerUp`
- `onPointerCancel`

理由は、HTML Drag and Drop APIはファイルやデータ転送向けの挙動が強く、抽象座標の連続更新に向かないためである。

### 7.11 Resolved TransformResult JSON Contract

`emit/json.ts` は、Runtime上の `TransformResult` をそのままJSON化しない。  
`TransformResult` は `BindingRef` を持つ参照型であり、単体では意味を復元できないためである。

`emit/json.ts` の出力は、以下の方針に固定する。

| Item | Policy |
|---|---|
| JSON kind | `resolved-transform-result` |
| Self-contained | yes |
| Contains BindingRef only | no |
| Contains resolved trigger/action | yes |
| Contains resolved key names | yes |
| Re-import target | no |
| Workspace persistence | no |

Resolved TransformResult JSONは、Workspace JSONとセットで再計算するための保存形式ではない。  
変換結果を外部確認・比較・共有するためのスナップショットである。

`emit/json.ts` は `EmitContext` を受け取り、`BindingRef` をLogicalMapとPhysicalLayoutから解決してから出力する。

~~~ts
emitJson(context: EmitContext): string
~~~

`BindingRef` を解決できないoperationは、JSON出力内で `reason: "invalidReference"` を持つmanual相当のresolved operationとして出力し、throwで処理全体を中断しない。

### 7.12 Action Support Matrix

| Action | Type definition | Codec | UI editing | Diff | Preview emit | JSON emit |
|---|---|---|---|---|---|---|
| CharacterAction | MVP | MVP | MVP | supported | MVP | MVP |
| LayerAction | MVP | MVP | MVP | supported | MVP | MVP |
| ShortcutAction | present | MVP structural validation | later | unsupportedAction | display as manual | resolved snapshot only |
| MacroAction | present | MVP structural validation | later | unsupportedAction | display as manual | resolved snapshot only |
| ImeAction | present | MVP structural validation | later | unsupportedAction | display as manual | resolved snapshot only |

`present` は型として存在することを意味する。  
`MVP structural validation` は、参照整合性と最低限の型検証だけを行い、UI編集や自動diff対象にはしないことを意味する。  
後続Actionを自動変換対象にする場合は、新しいADRでこの表を更新する。

#### Initial Implementation Scope for Extended Actions

`ShortcutAction`、`MacroAction`、`ImeAction` は後続要件であり、MVPでの扱いを以下に固定する。

- 型定義は初期実装に含める。
- `workspace/codec.ts` は構造検証だけを行う。
- UIでの新規作成・編集は初期実装では必須ではない。
- UIがWorkspace JSONから未対応Actionを読み込んだ場合は、読み取り表示または `unsupported` 表示に留める。
- `diff` では `unsupportedAction` としてmanual operationにする。
- `emit/preview.ts` はmanualとして表示できるようにする。
- `emit/json.ts` はresolved snapshotとして出力してよい。
- 正規表現、xmodmap、Karabinerなどの外部Exporterでは、未対応Actionを自動変換してはならない。

### 7.13 ID Generation Contract

`base/id.ts` はID生成を所有する。

~~~ts
createId(prefix: IdPrefix): Id
~~~

生成形式は以下に固定する。

~~~txt
<prefix>_<uuid>
~~~

例:

~~~txt
key_018f4f7e-0000-7000-9000-000000000000
~~~

- 新規作成時のIDは `createId(prefix)` で作る。
- Imported Workspace内のIDは保持する。
- `createId` は既存Workspaceとの衝突確認を行わない。
- 衝突確認は、追加前に `workspace/state.ts` またはUI側の作成処理で行う。
- Codecは、Workspace内の重複IDをerrorとして拒否する。
- Prefixは意味補助であり、参照整合性の判定には使わない。

初期prefixは以下に限定する。

| Prefix | Use |
|---|---|
| `phys` | PhysicalLayout |
| `key` | PhysicalKey |
| `map` | LogicalMap |
| `layer` | Layer |
| `bind` | Binding |
| `chain` | TransformChain |
| `op` | TransformOperation |

#### State Display

| State | Allowed Display |
|---|---|
| selected | テキスト表示、`aria-selected` |
| editing | テキスト表示、フォーム要素のfocus |
| disabled | `disabled` |
| warning | テキスト、見出し、リスト |
| dragging | テキスト表示、`aria-grabbed` 相当のARIA属性が必要な場合のみ |

状態別のclassName切り替えで、色、ボーダー、背景、影、アニメーションを変更してはならない。

## 8. Deployment and Operations

### 8.1 Deployment View

- Next.js App Router配下の `/tools/logikeymapsim` に配置する。
- 単一ページアプリとしてブラウザ上で動作する。
- バックエンドAPIは使用しない。
- サーバー保存は行わない。
- サイト内共有コンポーネントは使用しない。

### 8.2 Configuration

- 必須の環境変数は持たない。
- サイト内共有コンポーネントは使用しない。
- プリセットや初期キー生成ロジックはアプリ内部で管理する。
- UI以外の処理には必要に応じてライブラリを使用してよい。
- 初期状態管理には `useReducer` を使用する。

### 8.3 Logging / Monitoring

- 外部監視は不要。
- 開発中はブラウザのconsoleとテストで確認する。
- ユーザー向けにはエラー、警告、ガイドをUI上に表示する。

### 8.4 Release / Migration

- JSONにversionを入れないため、初期段階では形式変更時の自動マイグレーションを設けない。
- 将来的に互換性維持が必要になった場合は、別途ADRを追加し、ADR-009を置き換える。

## 9. Cross-Cutting Concerns

### 9.1 Security

- 認証・認可は不要。
- バックエンドへデータを送信しない。
- localStorageにも保存しない。
- JSON Import時は、構文とWorkspace構造を検証する。
- 生成テキストは実行せず、表示・ダウンロードのみに留める。

### 9.2 Performance

- 変換処理はUIから独立した関数として実装する。
- 物理キー数、Binding数、Layer数、多段変換数が主な計算量になる。
- 大量のキーやBindingがあっても、再描画と変換計算を分離する。
- 物理キー配置エディタでは、ドラッグ中の不要な全体再計算を避ける。
- TransformResultはBinding全体ではなくBindingRefを持つことで、結果の肥大化を避ける。

### 9.3 Reliability

- JSON Import失敗時に既存Workspaceを破壊しない。
- 変換不能な操作は自動変換せず、手動対応を求める。
- 警告がある状態でも出力可能にする。
- UI操作によってData Modelが不整合にならないようにする。
- `useReducer` による更新経路を通し、Workspace更新を一箇所に集約する。

### 9.4 Maintainability

このアプリでは、技術カテゴリではなく機能所有単位で分割する。

トップレベルに `ui/`, `domain/`, `calc/` を置く構造は採用しない。  
UI、model、calcはそれぞれの機能モジュール配下に置く。

これにより、どの複雑さをどの機能が所有しているかを明確にする。

| Complexity | Owner |
|---|---|
| Workspace構造、状態更新、Workspace codec | `workspace/` |
| 物理キーの抽象座標、ドラッグ、重なり | `physical/` |
| 論理キー配列、Layer、Combo、Hold | `logical/` |
| 差分比較、多段変換、手動対応抽出 | `transform/` |
| 汎用File API、汎用JSON構文処理 | `file/` |
| xmodmap、Karabiner、正規表現置換、Resolved TransformResult JSON | `emit/` |
| アプリ全体の組み立て | `workspace/` |

各モジュールは、必要に応じて内部に `model.ts`, `calc/`, `ui/` を持つ。  
ただし、他モジュールの内部構造に依存してはならない。

`base/` は最小限に保つ。  
`base/` に便利関数や曖昧な共通処理を集めない。

変換ロジックは必ずUIから独立させる。  
`transform/calc/` はReactに依存してはならない。

状態管理は初期実装では `useReducer` に集約する。  
`workspace/` は各機能モジュールのルートUIへ、必要な状態スライスと更新操作を渡す。  
深い子コンポーネントには、生の `dispatch` を無制限に渡さず、機能モジュール内の `ui/` で必要な狭いcallbackに変換して渡す。

Prop drillingが発生しても、初期実装ではContextや外部状態管理へ逃がさない。  
深さが問題になる場合は、その機能モジュール配下でコンポーネントを再分割し、責務を局所化する。

共有を前提とした汎用UI部品は作らない。  
`Button`, `Modal`, `Form`, `Input` のような純粋汎用UIをトップレベルや `base/` に逃がしてはならない。  
小さなUI重複は技術的負債ではなく、機能所有境界を守るための意図的制約として扱う。

### 9.5 UI / UX / Accessibility

- UIは定義ブロック追加型を主とする。
- 物理キー配置から論理キー配列を作る順序だけは明示する。
- ヘッダーやフッターなどの装飾的UIは不要。
- 物理キー配置エディタはドラッグと数値入力の両方を持つ。
- 論理キー配列エディタは物理キー配置を視覚的に参照する。
- 表形式の補助UIは追加してよい。
- Tailwindは余白・配置に限って使用してよい。
- 色、ボーダー、背景色、選択色、警告色、装飾的スタイルは指定しない。
- UI状態はReactDOM/HTML標準の状態属性とテキストで表現する。
- 有効/無効、選択、展開、入力不可、ドラッグ可能などは標準属性で表現する。
- 選択中のキー、ドラッグ中のキー、警告中のキーを独自の色・ボーダー・背景で表現してはならない。
- 警告やガイドは、色ではなくテキスト、見出し、リスト、標準フォーム状態で表示する。
- 操作要素は標準HTML要素を優先する。
- 共有汎用UIコンポーネントを作らず、必要なUIは各機能モジュール配下に置く。

#### Accessibility Minimums

- ブラウザ標準のfocus indicatorを消してはならない。
- `outline: none`、`focus:outline-none`、`tabIndex={-1}` によって操作可能要素のフォーカス到達性や可視性を消してはならない。
- すべての操作ボタンは、識別可能なテキストまたは `aria-label` を持つ。
- Pointer操作で可能な編集は、数値入力などのキーボード操作でも可能にする。
- `aria-*` は視覚装飾の代替ではなく、実際の状態と同期させる。
- 警告・ガイドは色だけに依存せず、テキストとして読める形で表示する。

## 10. Architectural Decisions

### 10.1 ADR Policy

この章では、アーキテクチャ上の重要な判断を記録する。

ADRは常に履歴として扱う。  
ある判断が変更・廃止された場合、古いADRを削除せず、Statusと関連ADRを更新する。

- ADRは削除しない。
- 判断が変更された場合、古いADRのStatusを `Superseded` にする。
- 新しいADRには `Supersedes` として古いADR IDを書く。
- 古いADRには `Superseded By` として新しいADR IDを書く。
- 廃止されたが置き換え先がない場合は `Deprecated` または `Withdrawn` を使う。
- 現在有効な判断だけを見たい場合は、Statusが `Accepted` の行を参照する。

### 10.2 ADR Status

| Status | Meaning |
|---|---|
| `Proposed` | 提案中。まだ採用されていない |
| `Accepted` | 採用中の判断 |
| `Deprecated` | 非推奨。まだ参照される可能性はあるが、新規判断では使わない |
| `Superseded` | 後続ADRによって置き換えられた |
| `Rejected` | 検討したが採用しなかった |
| `Withdrawn` | 判断対象から外れた |

### 10.3 ADR Table

| ID | Status | Decision | Reason | Alternatives | Consequences | Supersedes | Superseded By | Notes |
|---|---|---|---|---|---|---|---|---|
| ADR-001 | Accepted | `/tools/logikeymapsim` の単一ページアプリとして実装する | サイト内ツールとして配置し、アプリ単体で完結させるため | 独立サイト、複数ページ構成 | ルーティングと状態管理が単純になる | - | - | - |
| ADR-002 | Accepted | バックエンドを使用しない | 入力、変換、保存がブラウザ内で完結するため | DB保存、API保存 | サーバー同期はできないが構成が単純になる | - | - | - |
| ADR-003 | Accepted | localStorageを使用しない | 状態保存を明示的なJSONファイル管理に限定するため | localStorage自動保存 | 自動復元はできないが、状態の所在が明確になる | - | - | - |
| ADR-004 | Accepted | 物理キー配置をユーザー定義にする | 標準物理キーを前提にできないため | JIS/US固定モデル | 初期入力は増えるが、変則的な環境に対応できる | - | - | - |
| ADR-005 | Accepted | 物理キー座標は抽象単位の `x, y, w, h` とする | 表示pxや特定CSSに依存させないため | px固定、grid固定 | レンダリングとデータを分離できる | - | - | - |
| ADR-006 | Accepted | 論理キー配列は物理キー配置を参照して成立する | 論理入力は物理キー上に定義されるため | 文字やOSキーコード中心モデル | カスタム物理配置に対応できる | - | - | - |
| ADR-007 | Accepted | 変換は論理キー配列対論理キー配列で行う | 物理キーの置換ではなく、目的配列への差分導出が本質であるため | 物理キー対物理キー変換 | 多段変換や逆方向変換に対応しやすい | - | - | - |
| ADR-008 | Accepted | 多段変換を初期から扱う | 現実の入力環境が複数変換の合成になりうるため | 1対1変換のみ | モデルは複雑になるが、実態に近い | - | - | - |
| ADR-009 | Accepted | JSONにはversionを入れない | 初期段階では形式管理を単純化するため | version付きJSON | 将来の互換性管理は別途必要になる | - | - | 互換性が必要になった場合は新ADRで置き換える |
| ADR-010 | Accepted | UIをトップレベルに置かず、各機能モジュール配下に置く | UIは共有層ではなく、各機能の操作面であるため | top-level `ui/` | 機能所有権が明確になる | - | - | - |
| ADR-011 | Accepted | 技術カテゴリ分割ではなく機能所有単位で分割する | どこがどの債務を持つかを明確にするため | `ui/`, `domain/`, `calc/` の横断分割 | モジュール境界が実装判断の基準になる | - | - | - |
| ADR-012 | Accepted | 色・ボーダー指定をしない | 装飾より定義と計算を優先するため | デザイン済みUI | 視覚的リッチさは下がるが、実装判断が減る | - | - | - |
| ADR-013 | Accepted | `file/` はWorkspaceを知らない汎用File/JSON処理に限定する | `workspace/` と `file/` の循環依存を避けるため | `file/` がWorkspace JSONを直接扱う | Workspace構造検証は `workspace/codec.ts` に集約される | - | - | - |
| ADR-014 | Accepted | 長押しは `Action` ではなく `InputTrigger` として表現する | 長押しは出力結果ではなく発火条件であるため | `HoldAction` をActionに含める | TriggerとActionの責務が明確になる | - | - | - |
| ADR-015 | Accepted | Workspace JSONとResolved TransformResult JSONを別責務に分離する | 永続化と変換結果出力の混同を避けるため | `emit/json.ts` にWorkspace JSON出力も含める | Workspace JSONは `workspace/codec.ts`、Resolved TransformResult JSONは `emit/json.ts` が所有する | - | - | - |
| ADR-016 | Accepted | 初期状態管理は `useReducer` とする | 追加ライブラリなしでWorkspace更新経路を一箇所に集約できるため | Zustand、Redux、Context中心設計 | 状態管理は単純になるが、大規模化した場合は再判断が必要 | - | - | - |
| ADR-017 | Accepted | `emit/` は `BindingRef` 解決のために `logical/` と `physical/` を読み取り参照してよい | `TransformResult` は参照型であり、出力時にLogicalMapとPhysicalLayoutから詳細を解決する必要があるため | `TransformResult` にBindingとPhysicalKeyを完全コピーする | TransformResultの肥大化を避けられるが、Emitterは `EmitContext` を受け取る必要がある | - | - | ADR-015の責務分離を維持したまま、出力生成に必要な参照依存を明示する |
| ADR-018 | Accepted | `layerId` 未設定のBindingはBaseLayer所属として扱う | `undefined` を全Layer有効と解釈するとdiffと編集UIの挙動が曖昧になるため | `layerId` 未設定を全Layer有効にする | BaseLayerの意味が明確になり、全Layer共通Bindingは明示的に複製する必要がある | - | - | 1つのLogicalMapにはBaseLayerを必ず1つ置く |
| ADR-019 | Accepted | Workspace編集時は表示中の `TransformResult` を破棄し、明示操作時のみ再計算する | 古いBindingRefを含む結果を表示し続けると誤った変換結果になるため | Workspace編集後に自動再計算する | reducerの挙動が明確になり、古い結果の表示を防げる。自動再計算は初期実装では行わない | - | - | `TransformResult` はWorkspace JSONに保存されない導出データである |
| ADR-020 | Accepted | `useReducer` の状態更新は `workspace/` に集約し、機能UIには必要な状態スライスと狭いcallbackを渡す | 生のdispatchを深い子へ無制限に渡すと更新意図が追いにくくなるため | Context、Zustand、Redux、各機能ごとの独立store | 初期実装では状態経路が明確になる。Prop drillingが深い場合も、外部状態管理ではなく機能モジュール内のUI分割で対処する | - | - | ADR-016の実装方針を補足する |
| ADR-021 | Accepted | 共有汎用UIコンポーネントを作らず、小さなUI重複を許容する | 共有UIがトップレベルの債務受け皿になることを避けるため | 共通 `Button`, `Modal`, `Form`, `Input` を作る | 重複は増えるが、機能所有境界が明確になる | - | - | ADR-010/011の補足。機能固有UIは各機能配下に置く |
| ADR-022 | Accepted | UI状態は標準DOM状態、ARIA属性、テキストで表現し、独自の色・ボーダー・背景・outlineによる状態表示を追加しない | 装飾制約に抜け道を作ると、AI実装者が独自のUI表現を追加するため | 選択色、警告色、状態別背景、状態別ボーダー、状態別outlineを許可する | 視覚的表現は簡素になるが、UI仕様の判断余地を減らせる | - | - | ブラウザ標準のbutton/focus/disabled表示は許容するが、独自CSSで上書きしない |
| ADR-023 | Accepted | `diff` はAction keyを意味キーとして逆引きし、source triggerからtarget triggerへのoperationを生成する | Triggerだけの比較では、目的の論理配列に必要な置換を導出できないため | Trigger差分中心、物理キー差分中心 | Action等価判定が変換仕様の中心になる。Action key生成規則を固定する必要がある | - | - | Section 7.7で仕様化する |
| ADR-024 | Accepted | Workspace decodeは補正せず、参照壊れ・未知フィールド・構造不正をerrorとして拒否する | 壊れた入力を補正すると、AI実装者が暗黙仕様を増やすため | 部分復元、未知フィールド許可、自動補正 | 読み込みは厳格になるが、状態不整合を避けられる | - | - | Section 7.6で仕様化する |
| ADR-025 | Accepted | `useReducer` のAction名、payload、`activeResult` 破棄条件を固定する | reducer設計をAI実装者に推測させないため | 実装時に自由にActionを追加する | 更新経路が明確になる。新Actionが必要な場合は文書更新が必要 | - | - | Section 7.9で仕様化する |
| ADR-026 | Accepted | 物理キー移動はHTML Drag and Drop APIではなくReact Pointer Eventsで実装する | HTML Drag and Drop APIは抽象座標の連続編集よりファイル/データ転送向けの挙動が強いため | `draggable` + drag events | 座標更新が明確になる。視覚状態は独自装飾ではなくテキスト/ARIAで表現する | - | - | Section 7.10で仕様化する |
| ADR-027 | Accepted | `emit/json.ts` はResolved TransformResult JSONを出力する | BindingRefのみのJSONは単体で意味を復元できないため | Workspace-relative TransformResult JSON | JSONは肥大化するが、外部確認・共有に使える自己完結形式になる | - | - | Workspace永続化形式ではない |
| ADR-028 | Accepted | 参照を壊す削除Actionはrejectし、連鎖削除しない | 自動連鎖削除はユーザー定義を予期せず失わせるため | cascade delete, broken referenceを許可 | 削除前に参照解除が必要になるが、Workspace整合性は保たれる | - | - | Rejected actionはno-op |
| ADR-029 | Accepted | reducer patch payloadは専用型に限定する | `Partial<T>` はIDや判別フィールドを壊せるため | `Partial<PhysicalKey>`, `Partial<Binding>` を直接使う | 実装量は増えるが、不整合を型で抑えられる | - | - | Section 7.9で仕様化する |
| ADR-030 | Accepted | MVPで自動diffするActionはCharacterActionとLayerActionに限定する | Shortcut/Macro/IMEは意味等価判定が追加設計を必要とするため | 全Actionを初期diff対象にする | 後続Actionはmanualになるが、初期変換仕様は安定する | - | - | Section 7.12で仕様化する |
| ADR-031 | Accepted | ConditionalLayer.triggerはBaseLayer上で評価し、ConditionalLayer参照を禁止する | Layer自己参照・循環参照を避けるため | ConditionalLayerの連鎖発火を許可する | Layerモデルは単純になるが、複雑なLayer依存は初期実装対象外になる | - | - | `layer.triggerNotBase` で検証する |
| ADR-032 | Accepted | import境界はテストで検出する | 文書上の禁止依存だけではAI実装の逸脱を検出できないため | 手動レビューのみ | 初期実装で境界違反を発見しやすくなる | - | - | `test/architecture/import-boundaries.test.ts` |
| ADR-033 | Accepted | CSSは構造・配置・サイズ・ドラッグ計算に必要なプロパティだけ許可する | UI逃げ道を作らず、物理キー編集に必要な最低限のstyleだけ許可するため | 色・背景・border・outlineを例外許可する | 操作性は簡素だが、装飾判断の余地を抑えられる | - | - | Section 14.6でallowlist化する |
| ADR-034 | Accepted | ID生成は `base/id.ts` の `createId(prefix)` に集約する | 新規作成時のID形式と衝突責務を明確にするため | 各UIが自由にID生成する | ID形式は揃うが、衝突確認はstate/UI側で行う必要がある | - | - | Section 7.13で仕様化する |
| ADR-035 | Accepted | 後続ActionはMVPでは型とcodec中心に扱い、UI編集と自動diffは必須にしない | Shortcut/Macro/IMEは意味等価判定と外部出力に追加設計が必要なため | 初期実装で全ActionをUI編集・diff対応する | 拡張余地を保持しつつ、MVPの変換仕様を安定させる | - | - | Section 7.12で仕様化する |
| ADR-036 | Accepted | JSON versionなし方針には公開前の出口条件を持たせる | 公開後にWorkspace JSONが永続データになると互換性負債が大きいため | versionなし方針を無期限に継続する | Draft中は単純さを保ち、公開前に互換性要否を再判断できる | ADR-009 | - | ADR-009を補足する出口条件 |
| ADR-037 | Accepted | ブラウザ標準のfocus indicatorを消さず、最低限のアクセシビリティ条件を満たす | 装飾禁止がフォーカス不可視化や操作不能に誤解されることを避けるため | 装飾禁止を優先してfocus表示も消す | 独自装飾は増やさず、標準HTMLの操作可能性を保てる | - | - | Section 9.5で仕様化する |
| ADR-038 | Accepted | AI実装時の禁止事項とDefinition of Doneを受け入れ条件として扱う | AIが文書外の設計判断や空テストで実装完了扱いにすることを防ぐため | 実装者判断に任せる | 実装前レビューと自動検査がしやすくなる | - | - | Section 14.8/14.12で仕様化する |

## 11. Risks and Technical Debt

| Risk / Debt | Impact | Current Status | Mitigation |
|---|---|---|---|
| 論理キー配列モデルが複雑化する | 変換ロジックが不安定になる | 初期リスク | 文字入力、レイヤー、同時押し、長押しを中核として整理する |
| 多段変換の解釈が曖昧になる | 変換結果の正しさが崩れる | 初期リスク | TransformChainを明示的な順序付き配列として扱う |
| 変換不能な操作が増える | 出力結果が不完全になる | 既知リスク | 手動対応が必要な項目として表示する |
| 物理キー配置エディタが肥大化する | UI実装コストが増える | 初期リスク | 必須はドラッグ、数値入力、削除、グループ編集に絞る |
| JSONにversionがない | 将来の互換性対応が難しくなる | 意図的制約 | 初期段階では割り切り、必要になった時点でADRを追加して再判断する |
| 色・ボーダーを使わないUIが分かりにくくなる | 操作性が下がる可能性がある | 意図的制約 | DOM構造、余白、配置、標準HTML状態属性、テキストで情報階層を表現する |
| UI状態を独自装飾で表現したくなる | 選択・警告・ドラッグ状態の表現が実装者判断で増える | 意図的制約 | 状態表示は標準DOM状態、ARIA属性、テキスト表示に限定する |
| Prop drillingが発生する | 深いUI階層でprops受け渡しが増える | 初期リスク | Contextや外部storeに逃がさず、機能モジュール内で狭いcallbackへ変換して局所化する |
| 汎用UI部品を共通化したくなる | 共有UIがトップレベルの債務受け皿になる | 意図的制約 | 小さなUI重複を許容し、機能固有UIを各機能配下に閉じ込める |
| `base/` が肥大化する | 所有者不明の共通処理が増える | 初期リスク | `base/` は最小共通型に限定し、便利関数を置かない |
| `workspace/` が個別機能の詳細を持ち始める | アプリ全体が密結合になる | 初期リスク | 個別編集・計算処理は各機能モジュールに委譲する |
| `emit/` の外部仕様が `transform/` に漏れる | 変換ロジックが外部ツール都合に汚染される | 初期リスク | `transform/` は中立的なTransformResultだけを生成する |
| `BindingRef` 解決がEmitterごとに分散する | 出力形式間で解決ロジックがずれる | 初期リスク | `emit/model.ts` に `EmitContext` と共通解決方針を定義する |
| Workspace編集後に古いTransformResultが残る | 削除・変更済みBindingRefを含む古い結果を表示してしまう | 初期リスク | Workspace変更actionでは `activeResult` を破棄し、明示操作時だけ再計算する |
| `workspace/` と `file/` が循環依存する | モジュール境界が崩れる | 修正済み方針 | `file/` は汎用File/JSON、Workspace検証は `workspace/codec.ts` に分離する |
| TransformResultが肥大化する | 大量変換時のメモリ使用量や描画負荷が増える | 修正済み方針 | TransformOperationはBinding全体ではなくBindingRefを持つ |
| diff仕様が実装者ごとにぶれる | 変換結果の正しさが崩れる | 修正済み方針 | Action key / Trigger key / manual reason をSection 7.7で固定する |
| codecが不正JSONを補正してしまう | 壊れたWorkspaceが内部状態に入る | 修正済み方針 | `decodeWorkspace` は補正せずerrorで拒否する |
| reducer actionが増殖する | 更新経路とactiveResult破棄条件が追えなくなる | 修正済み方針 | Section 7.9のAction contractに限定する |
| テストが空実装になる | AI実装者が期待値なしでテストファイルだけを作る | 修正済み方針 | Section 14.7に初期テスト期待値を明記する |
| `seed.ts` と `preset/` の責務が混同される | 初期生成ロジックと実データが混ざる | 修正済み方針 | `seed.ts` は生成ロジック、`preset/` は具体データに限定する |
| Resolved TransformResult JSONが肥大化する | 大量変換時に出力ファイルが大きくなる | 意図的制約 | 外部共有用スナップショットとして受け入れ、Runtime内部はBindingRefのままにする |
| 削除Actionが拒否され操作が分かりづらい | 参照解除が必要になり手間が増える | 意図的制約 | UIで参照中であることをテキスト表示する。連鎖削除はしない |
| import境界テストが未実装になる | 文書と実装が乖離する | 初期リスク | Definition of Doneに `import-boundaries.test.ts` を含める |

## 12. Open Questions

| Priority | Question | Owner | Due | Notes |
|---|---|---|---|---|
| P1 | 初期プリセットに何を含めるか | samuido | 実装前 | 物理キー配置・論理キー配列の両方 |
| P1 | 正規表現置換エディタをどの段階で実装するか | samuido | 後続 | 初期は変換表示、Resolved TransformResult JSON、Workspace JSONまで |
| P1 | xmodmap出力をどの粒度まで実装するか | samuido | 後続 | 後続拡張 |
| P1 | Karabiner complex modificationsをどの粒度まで実装するか | samuido | 後続 | 後続拡張 |
| P0 | 公開前にWorkspace JSON versionを導入するか | samuido | 公開前 | 形式変更が1回でも必要な場合は、ADR-009をSupersededにしてversion付きJSONへ移行する |
| P2 | `useReducer` で状態管理が不足した場合に何へ移行するか | samuido | 必要になった時点 | 必要になった場合は新ADRでADR-016を置き換える |
| P2 | Shortcut / Macro / IMEをいつUI編集・diff対応するか | samuido | 後続 | 初期は型とcodecのみ。diffではunsupportedAction |

## 13. Glossary

| Term | Meaning |
|---|---|
| 物理キー配置 | ユーザーが実際に使用するキーの数、位置、大きさを定義したもの |
| 物理キー | 物理キー配置上の1つのキー。標準キーボード上のキーとは限らない |
| 論理キー配列 | 物理キー配置の上に成立する入力定義の集合 |
| LogicalMap | 論理キー配列を表すデータ単位 |
| Binding | 入力条件とActionの対応関係 |
| InputTrigger | Actionを発火させる入力条件 |
| Action | 入力によって発生する結果。文字入力、レイヤー切り替え、ショートカット、マクロなど |
| Layer | 特定条件で有効になる論理入力の集合 |
| BaseLayer | 通常時に有効なレイヤー |
| ConditionalLayer | Triggerによって有効になるレイヤー |
| Combo | 同時押し入力 |
| Hold | 長押し入力。ActionではなくInputTriggerとして扱う |
| Macro | キー入力を発火条件として扱われる自動操作全般 |
| TransformChain | 複数の論理キー配列を順にたどる多段変換 |
| TransformOperation | 目的の配列にするために必要な変換操作 |
| BindingRef | LogicalMap内のBindingへの参照 |
| Warning | 操作を止めない注意表示 |
| Guide | 未割り当てなど、判断補助として表示する情報 |
| Emit | TransformResultを表示用・外部形式用に変換して出力すること |
| Workspace JSON | Workspace全体を保存・復元するためのJSON |
| Resolved TransformResult JSON | BindingRefをLogicalMapとPhysicalLayoutから解決した、外部確認・共有用の自己完結した変換結果JSON |
| Action key | Action等価判定のために正規化された意味キー |
| Trigger key | Trigger等価判定のために正規化された入力条件キー |
| ManualReason | 自動変換できず手動対応が必要になった理由 |
| Codec | Workspace JSONを内部Workspaceとして受け入れてよいか判定するencode/decode処理 |

## 14. Appendix

### 14.1 Suggested File Structure

~~~txt
app/
  tools/
    logikeymapsim/
      page.tsx
      app.tsx

      base/
        id.ts
        issue.ts
        unit.ts

      workspace/
        model.ts
        state.ts
        codec.ts
        ui/
          view.tsx
          block.tsx
          load.tsx
          save.tsx

      physical/
        model.ts
        seed.ts
        calc/
          overlap.ts
        ui/
          edit.tsx
          key.tsx
          group.tsx
          inspector.tsx

      logical/
        model.ts
        calc/
          duplicate.ts
          unassigned.ts
        ui/
          edit.tsx
          key.tsx
          binding.tsx
          layer.tsx
          table.tsx

      transform/
        model.ts
        calc/
          diff.ts
          chain.ts
          manual.ts
        ui/
          edit.tsx
          result.tsx

      file/
        json.ts
        browser.ts

      emit/
        model.ts
        preview.ts
        json.ts
        regex.ts
        xmodmap.ts
        karabiner.ts
        ui/
          panel.tsx

      preset/
        physical.ts
        logical.ts

      test/
        architecture/
          import-boundaries.test.ts
        workspace/
          codec.test.ts
          state.test.ts
        physical/
          overlap.test.ts
        logical/
          duplicate.test.ts
          unassigned.test.ts
        transform/
          diff.test.ts
          chain.test.ts
          manual.test.ts
        file/
          json.test.ts
        ui/
          physical-edit.test.tsx
          logical-edit.test.tsx
          workspace-file.test.tsx
~~~

### 14.2 File Ownership

| Path | Owns |
|---|---|
| `workspace/model.ts` | Workspace全体の型 |
| `workspace/state.ts` | `useReducer` 用のWorkspace更新処理。Workspace編集時に `activeResult` を破棄する |
| `workspace/codec.ts` | Workspace JSON構造検証、encode/decode |
| `workspace/ui/view.tsx` | Workspace全体表示 |
| `workspace/ui/block.tsx` | 定義ブロック表示 |
| `workspace/ui/load.tsx` | Workspace JSON読み込みUI |
| `workspace/ui/save.tsx` | Workspace JSON保存UI |
| `physical/model.ts` | PhysicalLayout, PhysicalKey |
| `physical/seed.ts` | 空の整列済みキーグリッド生成ロジック |
| `physical/calc/overlap.ts` | 物理キー重なり検出 |
| `physical/ui/edit.tsx` | 物理キー配置編集UI |
| `physical/ui/key.tsx` | 個別キー表示 |
| `physical/ui/group.tsx` | グループ編集UI |
| `physical/ui/inspector.tsx` | 数値・note編集UI |
| `logical/model.ts` | LogicalMap, Binding, Layer, Trigger, Action |
| `logical/calc/duplicate.ts` | 同じ操作への重複検出 |
| `logical/calc/unassigned.ts` | 未割り当てガイド抽出 |
| `logical/ui/edit.tsx` | 論理キー配列編集UI |
| `logical/ui/key.tsx` | 物理キー参照上の論理キー表示 |
| `logical/ui/binding.tsx` | Binding編集 |
| `logical/ui/layer.tsx` | Layer編集 |
| `logical/ui/table.tsx` | 表形式の補助UI |
| `transform/model.ts` | TransformChain, BindingRef, TransformOperation, TransformResult |
| `transform/calc/diff.ts` | Action key / Trigger key正規化、論理キー配列間の差分 |
| `transform/calc/chain.ts` | 多段変換 |
| `transform/calc/manual.ts` | 手動対応が必要な操作の抽出 |
| `transform/ui/edit.tsx` | 変換元・変換先・中間配列の選択UI |
| `transform/ui/result.tsx` | 変換結果一覧 |
| `file/json.ts` | 汎用JSON parse/stringify。Workspaceの意味は持たない |
| `file/browser.ts` | File API、text read、download処理 |
| `emit/model.ts` | `EmitContext`、Emit対象、出力結果の型 |
| `emit/preview.ts` | 画面表示用出力 |
| `emit/json.ts` | Resolved TransformResult JSON出力。Workspace JSONは扱わない |
| `emit/regex.ts` | 正規表現置換 |
| `emit/xmodmap.ts` | xmodmap出力 |
| `emit/karabiner.ts` | Karabiner complex modifications出力 |
| `emit/ui/panel.tsx` | 出力形式選択UI |
| `preset/physical.ts` | 具体的な物理キー配置プリセット |
| `preset/logical.ts` | 具体的な論理キー配列プリセット |
| `test/architecture/import-boundaries.test.ts` | 禁止importとトップレベル禁止ディレクトリの検出 |

### 14.3 Import Examples

~~~ts
import type { Workspace } from "./workspace/model";
import type { PhysicalLayout } from "./physical/model";
import type { LogicalMap } from "./logical/model";

import { reduceWorkspace } from "./workspace/state";
import { encode, decode } from "./workspace/codec";

import { findOverlaps } from "./physical/calc/overlap";
import { findDuplicates } from "./logical/calc/duplicate";
import { diff } from "./transform/calc/diff";
import { planChain } from "./transform/calc/chain";

import { parseJson, stringifyJson } from "./file/json";
import { readTextFile, downloadTextFile } from "./file/browser";

import type { EmitContext } from "./emit/model";
import { emitPreview } from "./emit/preview";
import { emitJson } from "./emit/json";
import { emitKarabiner } from "./emit/karabiner";

// Representative signatures:
// decode(value: unknown): DecodeResult
// reduceWorkspace(state: RuntimeState, action: WorkspaceAction): RuntimeState
// diff(source: LogicalMap, target: LogicalMap, context: { physicalLayouts: PhysicalLayout[]; stage: TransformStage }): TransformResult
// planChain(chain: TransformChain, maps: LogicalMap[], layouts: PhysicalLayout[]): TransformResult
// emitPreview(context: EmitContext): PreviewOutput
// emitJson(context: EmitContext): string
// emitKarabiner(context: EmitContext): string
~~~

### 14.4 Naming Rules

- ディレクトリ名で所属を示す。
- ファイル名は役割だけにする。
- 関数名は過剰に説明しない。
- import path上で同じ語を繰り返さない。
- `utils.ts`, `types.ts`, `helpers.ts` は原則作らない。
- 必要な型は、それを所有する機能の `model.ts` に置く。
- 共通型は本当に機能に属さない場合だけ `base/` に置く。
- 外部形式固有の名前は `emit/` 配下に限定する。
- Workspace永続化固有の名前は `workspace/codec.ts` に限定する。

### 14.5 Import Boundary Verification

依存ルールは文書上の規約だけで終わらせない。  
初期実装では、最低限 `test/architecture/import-boundaries.test.ts` を作り、禁止importを検出する。

検出対象:

- `physical/` から `logical/`, `transform/`, `emit/` へのimport
- `logical/` から `transform/`, `emit/` へのimport
- `transform/` から `emit/`, `file/` へのimport
- `emit/` から `workspace/`, `file/` へのimport
- `file/` から `workspace/`, `physical/`, `logical/`, `transform/`, `emit/` へのimport
- `base/` からfeature moduleへのimport
- top-level `ui/`, `domain/`, `calc/`, `utils.ts`, `types.ts`, `helpers.ts` の作成

Type-only exceptionは、文書で許可されたものだけを認める。  
検出実装はdependency-cruiser等を使ってもよいが、初期実装ではNodeのファイル走査テストでもよい。

### 14.6 UI Implementation Rules

- UI状態は標準HTML要素の状態属性、ARIA属性、テキストで表現する。
- 使用してよい状態属性の例は `disabled`, `readOnly`, `checked`, `selected`, `open`, `aria-*` である。
- 物理キー移動はHTML Drag and Drop APIではなく、React Pointer Eventsで実装する。
- 選択中、編集中、警告中、ドラッグ中を、独自の色、ボーダー、背景色、outline、影、アニメーションで表現してはならない。
- 警告やガイドは色ではなく、テキスト、見出し、リスト、標準フォーム状態で表現する。
- 共有汎用UIコンポーネントは作らない。
- 小さなボタン、入力欄、セクション見出しの重複は許容する。
- ただし、機能固有のUI部品は、その機能モジュール配下の `ui/` に置いてよい。
- ブラウザ標準の `<button>` 表示、focus表示、disabled表示は許容するが、独自CSSで上書きしない。

#### CSS / Tailwind Allowlist

Tailwindまたはstyle属性で許可するのは、構造・配置・サイズ・ドラッグ計算に必要なものだけである。

| Category | Allowed examples |
|---|---|
| spacing | margin, padding, gap |
| layout | display, flex, grid, block, inline-block |
| size | width, height, min/max width, min/max height |
| position | relative, absolute, inset, left, top |
| transform | translate for physical key positioning |
| overflow | overflow, overflow-x, overflow-y |
| text structure | white-space, text-align, font-size only when necessary for fit |
| interaction | cursor, touch-action, user-select |
| form structure | disabled, readOnly, checked, selected, open, aria-* |

禁止するもの:

- color
- background / background-color
- border
- outline
- box-shadow / shadow
- opacityによる状態表現
- transition
- animation
- ring系Tailwind class
- 状態別classNameでの視覚表現

物理キーの矩形表示は、ブラウザ標準のbutton描画、または要素の寸法と配置だけで表現する。  
独自borderや背景色でキー境界を作ってはならない。

### 14.7 Initial Implementation Priority

1. `/tools/logikeymapsim/page.tsx`
2. `app.tsx`
3. `base/id.ts`
4. `base/issue.ts`
5. `base/unit.ts`
6. `physical/model.ts`
7. `logical/model.ts`
8. `workspace/model.ts`
9. `workspace/state.ts`
10. `workspace/codec.ts`
11. `physical/seed.ts`
12. `physical/ui/edit.tsx`
13. `physical/ui/key.tsx`
14. `physical/ui/inspector.tsx`
15. `physical/calc/overlap.ts`
16. `logical/ui/edit.tsx`
17. `logical/ui/binding.tsx`
18. `logical/ui/layer.tsx`
19. `logical/calc/duplicate.ts`
20. `logical/calc/unassigned.ts`
21. `transform/model.ts`
22. `transform/calc/diff.ts`
23. `transform/calc/chain.ts`
24. `transform/calc/manual.ts`
25. `transform/ui/edit.tsx`
26. `transform/ui/result.tsx`
27. `file/json.ts`
28. `file/browser.ts`
29. `workspace/ui/load.tsx`
30. `workspace/ui/save.tsx`
31. `emit/model.ts`
32. `emit/preview.ts`
33. `emit/json.ts`

### 14.8 Definition of Done

Initial implementation is complete only when all of the following are true.

- Suggested File Structureの初期対象ファイルが存在する。
- Forbidden Dependenciesに違反するimportがない。
- `test/architecture/import-boundaries.test.ts` が禁止importと禁止トップレベルファイルを検出する。
- `workspace/codec.test.ts` がValidation Rulesの主要ケースを検証している。
- `transform/diff.test.ts` がAction key / Trigger keyの主要ケースを検証している。
- `workspace/state.test.ts` が参照破壊rejectと `activeResult` 破棄条件を検証している。
- Workspace JSONのimport失敗時に既存RuntimeStateが変化しない。
- Workspace編集後に `activeResult` が必ず `undefined` になる。
- 削除Actionが参照を壊す場合、Workspaceも `activeResult` も変化しない。
- TransformResult JSONとWorkspace JSONの出力責務が混ざっていない。
- 空テスト、snapshotのみのテスト、期待値なしのテストが存在しない。
- UI実装がSection 14.6のCSS / Tailwind allowlistを超えていない。

### 14.9 Definition of Done by Implementation Phase

| Phase | Files | Done when |
|---|---|---|
| Base model | `base/*`, `physical/model.ts`, `logical/model.ts`, `workspace/model.ts`, `transform/model.ts` | TypeScript compiles, no React import, no forbidden import |
| Workspace state | `workspace/state.ts` | Reducer action contract is implemented, rejected delete actions are no-op, state tests pass |
| Workspace codec | `workspace/codec.ts` | DecodeResult contract is implemented, unknown fields rejected, codec tests pass |
| Physical editing | `physical/*` | Seed generation, pointer movement, numeric patch, overlap test pass |
| Logical editing | `logical/*` | BaseLayer invariant, binding edit, duplicate/unassigned tests pass |
| Transform calc | `transform/calc/*` | diff/chain/manual tests pass, unsupported actions become manual |
| File IO | `file/*`, `workspace/ui/load.tsx`, `workspace/ui/save.tsx` | JSON load/download works without localStorage |
| Emit MVP | `emit/model.ts`, `emit/preview.ts`, `emit/json.ts` | Preview output and Resolved TransformResult JSON are generated from EmitContext |
| Architecture guard | `test/architecture/import-boundaries.test.ts` | Forbidden imports and forbidden top-level files/directories are detected |

A phase is not done if it only creates files without the specified tests or behavior.

### 14.10 Initial Test Expectations

初期実装では、以下のテスト期待値を満たすことを受け入れ条件にする。  
AI実装者は、テストファイルだけを作って空テストにしてはならない。

#### `physical/overlap.test.ts`

| Case | Input | Expected |
|---|---|---|
| overlapping rectangles | `A {x:0,y:0,w:2,h:1}`, `B {x:1,y:0,w:2,h:1}` | overlap warning |
| touching rectangles | `A {x:0,y:0,w:1,h:1}`, `B {x:1,y:0,w:1,h:1}` | no overlap |
| separated rectangles | `A {x:0,y:0,w:1,h:1}`, `B {x:2,y:0,w:1,h:1}` | no overlap |

矩形が辺で接しているだけの場合は、重なりとは扱わない。

#### `logical/duplicate.test.ts`

| Case | Input | Expected |
|---|---|---|
| same Action in same layer | 2 bindings with `character:A` in BaseLayer | duplicate warning |
| same Trigger | 2 bindings with same normalized trigger | duplicate warning |
| same Action in different layer | `character:A` in BaseLayer and conditional layer | duplicate warning |
| different Action | `character:A`, `character:B` | no duplicate |

同じ操作への重複割り当ては警告であり、Workspaceを無効化しない。

#### `logical/unassigned.test.ts`

| Case | Input | Expected |
|---|---|---|
| key without BaseLayer binding | PhysicalKey exists, no BaseLayer binding | guide |
| key assigned in BaseLayer | PhysicalKey has BaseLayer binding | no guide |
| key assigned only in conditional layer | no BaseLayer binding, conditional binding exists | BaseLayer guide |
| non-existing key | binding references missing key | codec error, not guide |

未割り当ては警告ではなくガイドである。  
参照壊れは `workspace/codec.ts` のerrorであり、unassigned guideとして扱わない。

#### `transform/diff.test.ts`

| Case | Source | Target | Expected |
|---|---|---|---|
| character replace | `KeyA -> "A"` | `KeyB -> "A"` | `replace from KeyA to KeyB` |
| same trigger and action | `KeyA -> "A"` | `KeyA -> "A"` | no operation |
| missing source action | no `"A"` | `KeyB -> "A"` | manual `missingSourceAction` |
| missing target action | `KeyA -> "A"` | no `"A"` | manual `missingTargetAction` |
| ambiguous source | two source bindings emit `"A"` | one target binding emits `"A"` | manual `ambiguousSourceAction` |
| combo order | `[KeyA, KeyB] -> "X"` | `[KeyB, KeyA] -> "X"` | no operation |
| combo difference | `[KeyA, KeyB] -> "X"` | `[KeyA, KeyC] -> "X"` | replace |
| hold same default | hold KeyA no duration | hold KeyA no duration | no operation |
| hold duration difference | hold KeyA no duration | hold KeyA 300ms | replace |
| base layer undefined | `layerId: undefined` | explicit BaseLayer id | same layer |
| layer action by name | LayerAction to layer named `nav` | LayerAction to layer named `nav` | same action |
| unsupported action | action key cannot be created | any | manual `unsupportedAction` |

#### `transform/chain.test.ts`

| Case | Chain | Expected |
|---|---|---|
| two stage chain | `A -> B -> C` | operations include stage 0 and stage 1 |
| manual propagation | `A -> B` has manual, `B -> C` has replace | both operations remain |
| invalid chain length | only one map id | codec error before chain calc |
| missing map id | unknown map id | codec error before chain calc |

`chain.ts` はmanualがあっても後続stageの計算を止めない。

#### `workspace/codec.test.ts`

| Case | Input | Expected |
|---|---|---|
| valid workspace | valid physical, logical, chain | `ok: true` |
| missing physical layout | LogicalMap.physicalId unknown | `ok: false`, `logical.missingPhysicalLayout` |
| missing key | Binding trigger key unknown | `ok: false`, `binding.missingKey` |
| missing target layer | LayerAction target unknown | `ok: false`, `action.missingTargetLayer` |
| no BaseLayer | LogicalMap has no base layer | `ok: false`, `layer.invalidBaseLayerCount` |
| multiple BaseLayers | LogicalMap has two base layers | `ok: false`, `layer.invalidBaseLayerCount` |
| duplicate layer names | two layers with same name | `ok: false`, `layer.duplicateLayerName` |
| unknown field | object has extra field | `ok: false`, `codec.unknownField` |
| invalid combo | combo has one key or duplicated key | `ok: false` |

#### `workspace/state.test.ts`

| Case | Action | Expected |
|---|---|---|
| run transform | `transform/run` | sets `activeResult` |
| update physical key after result | `physical/patchKey` | clears `activeResult` |
| update binding after result | `logical/patchBindingAction` | clears `activeResult` |
| patch transform chain after result | `transform/patchChain` | clears `activeResult` |
| reject referenced key delete | `physical/removeKey` for referenced key | no state change, activeResult kept |
| reject referenced layer delete | `logical/removeLayer` for referenced layer | no state change, activeResult kept |
| clear result | `transform/clearResult` | clears `activeResult` |
| load workspace | `workspace/load` | replaces workspace and clears `activeResult` |

#### `architecture/import-boundaries.test.ts`

| Case | Input | Expected |
|---|---|---|
| physical imports logical | file under `physical/` imports `../logical/model` | fail |
| transform imports emit | file under `transform/` imports `../emit/json` | fail |
| file imports workspace | file under `file/` imports `../workspace/model` | fail |
| top-level ui directory | `logikeymapsim/ui/` exists | fail |
| helper sink | `utils.ts`, `types.ts`, or `helpers.ts` exists | fail |
| allowed logical import | `logical/` imports `physical/model` | pass |
| allowed emit import | `emit/` imports `transform/model`, `logical/model`, `physical/model` | pass |

### 14.11 Initial Export Priority

1. 変換キー表示
2. Resolved TransformResult JSON
3. Workspace JSON file persistence
4. 正規表現置換
5. xmodmap
6. Karabiner complex modifications

#### External Exporter Stub Policy

正規表現置換、xmodmap、Karabiner complex modifications は後続Exporterである。
MVPでstubを置く場合は、以下の方針に従う。

- `emit/regex.ts`, `emit/xmodmap.ts`, `emit/karabiner.ts` は存在してよい。
- 未実装Exporterは成功したかのような出力を返してはならない。
- 未実装の場合は、明示的にunsupported結果を返すか、UIから呼び出せない状態にする。
- 未対応Actionを外部形式へ勝手に近似変換してはならない。
- TransformResultやWorkspaceを変更してはならない。

### 14.12 AI Implementation Guardrails

AI実装者は以下をしてはならない。

- top-level `ui/`, `components/`, `utils.ts`, `helpers.ts`, `types.ts` を作らない。
- `file/` から `workspace/`, `physical/`, `logical/`, `transform/`, `emit/` をimportしない。
- `transform/` から `emit/` や `file/` をimportしない。
- `physical/` から `logical/`、`transform/`、`emit/` をimportしない。
- `model.ts` や `calc/` から `ui/` をimportしない。
- Section 7.9にないreducer actionを追加しない。
- Workspace編集Action内で `diff` / `chain` を自動実行しない。
- JSON decode時に壊れたWorkspaceを補正して受け入れない。
- `Partial<PhysicalKey>`、`Partial<Binding>`、`Partial<Layer>`、`Partial<TransformChain>` をreducer payloadに使わない。
- 参照を壊す削除をcascade deleteで処理しない。
- 状態表示のために独自色、独自border、独自background、独自outline、shadow、animationを追加しない。
- ブラウザ標準のfocus indicatorを消さない。
- 空テスト、snapshotのみのテスト、期待値なしのテストを作らない。
- MVPで未対応のShortcut/Macro/IMEを自動diff対象や外部Exporter対象として実装しない。

### 14.13 Non-Goals

- バックエンド
- 認証
- DB
- localStorage
- サイト内共有コンポーネント
- 共有汎用UIコンポーネント
- 色指定
- ボーダー指定
- 背景色指定
- 選択色指定
- 警告色指定
- 状態別の独自装飾
- クラウド同期
- 初期実装での正規表現置換完成
- 初期実装でのxmodmap完成
- 初期実装でのKarabiner完成
- 公開前の実装段階におけるWorkspace JSON後方互換保証
