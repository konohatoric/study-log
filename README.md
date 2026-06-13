# StudyLog - 研究・勉強ログ管理アプリ

# StudyLog - Research and Study Log Management App

## 概要

## Overview

StudyLogは、研究や勉強の作業時間、作業内容、気づき、次にやることを記録・振り返るためのWebアプリです。

StudyLog is a web application for recording and reviewing your study or research time, work details, insights, and next actions.

研究や勉強は長時間取り組んでいても、「実際に何にどれくらい時間を使ったのか」「何を進めたのか」「次に何をやるべきか」が曖昧になりやすいという課題があります。

When working on research or studying for long periods of time, it can be difficult to clearly understand how much time was spent on each task, what progress was made, and what should be done next.

このアプリでは、作業開始時にカテゴリと作業タイトルを入力して記録を開始し、終了時に作業内容や気づきを残すことで、日ごと・週ごとの振り返りに活用できることを目指しています。

With this app, users can start a work session by entering a category and task title, then record what they worked on and what they noticed when the session ends. These records can be used for daily and weekly reflection.

## アプリURL

## App URL

https://0u0phpnj8g71hwzvvwrs3pw4s.bolt.host/

## 解決したい課題

## Problem to Solve

勉強や研究では、長時間取り組んでいても、実際にどの作業にどれくらい時間を使ったのかが見えづらいという課題があります。

In studying and research, even if you spend many hours working, it is often difficult to see exactly how much time was spent on each specific task.

特に研究活動では、論文執筆、文献調査、実験・実装、ゼミ準備など複数の作業が並行して進むため、後から振り返ったときに「何をどれくらいやったのか」が曖昧になりやすいです。

This is especially true in research, where multiple tasks such as paper writing, literature review, experiments, implementation, and seminar preparation often progress in parallel. As a result, it can become unclear what was done and how much time was spent on each activity.

また、週報作成時にも感覚ベースの振り返りになりやすく、実際の作業時間や未完了タスクをもとに次の計画を立てにくい点が課題だと考えました。

I also found that weekly reports often rely on vague impressions rather than actual records. This makes it difficult to plan the next steps based on real working hours and unfinished tasks.

## プロダクトの強み

## Product Strengths

このプロダクトの強みは、単に勉強時間や研究時間を記録するだけでなく、記録を次の行動につなげることを目指している点です。

The strength of this product is that it does not simply record study or research time. It is designed to help users connect their records to their next actions.

一般的なタイマーアプリでは時間を測ることはできますが、このアプリでは「何にどれくらい時間を使ったのか」「どの作業に時間がかかったのか」「次に何を優先するべきか」を振り返れるように設計しています。

While general timer apps can measure time, this app is designed to help users review what they spent time on, which tasks took longer than expected, and what should be prioritized next.

研究や勉強は成果がすぐに見えにくく、1週間後に振り返ると何をしていたのか曖昧になりやすいです。

In research and studying, results are not always visible immediately. After a week, it can be hard to remember exactly what you worked on.

そこで、開始・終了ボタンで簡単に作業を記録し、作業内容を日ごと・週ごとに確認できるようにすることで、自分の取り組みを客観的に把握できるようにしました。

To solve this, StudyLog allows users to easily record work sessions with start and end buttons, and review their work by day or week. This helps users understand their efforts more objectively.

最終的には、研究や勉強を「なんとなく頑張った」で終わらせず、記録をもとに改善し、次の一週間の計画に活かせることを目指しています。

Ultimately, this app aims to help users avoid ending the week with only a vague feeling that they “worked hard.” Instead, they can use actual records to improve their work habits and plan the next week more effectively.

## 主な機能

## Main Features

* 作業カテゴリの選択
  Select a work category

* 作業開始・終了の記録
  Record the start and end of a work session

* 今日の作業時間の表示
  Display today’s total working time

* 今週の作業時間の表示
  Display this week’s total working time

* 未完了タスクの表示
  Display unfinished tasks

* 継続日数の表示
  Display continuous working days

* 作業ログの一覧表示
  Show a list of work logs

* タスクの優先度・締切管理
  Manage task priorities and deadlines

* 週報の確認画面
  View weekly reports

* 次に取り組むべきタスクの表示
  Display the next task to work on

## サイトマップ

## Sitemap

```text
/
├── ダッシュボード / Dashboard
│   ├── 今日の作業時間 / Today's working time
│   ├── 今週の作業時間 / This week's working time
│   ├── 未完了タスク / Unfinished tasks
│   ├── 継続日数 / Continuous working days
│   ├── 作業開始フォーム / Work session start form
│   ├── 次に取り組むべきタスク / Next task to work on
│   └── 最近の作業記録 / Recent work logs
│
├── 作業ログ / Work Logs
│   └── 過去の作業記録一覧 / List of past work records
│
├── タスク管理 / Task Management
│   ├── タスク一覧 / Task list
│   ├── 優先度 / Priority
│   └── 締切管理 / Deadline management
│
└── 週報 / Weekly Report
    ├── 1週間の作業時間 / Weekly working time
    ├── 作業内容の振り返り / Review of work content
    └── 未完了タスクの確認 / Check unfinished tasks
```
