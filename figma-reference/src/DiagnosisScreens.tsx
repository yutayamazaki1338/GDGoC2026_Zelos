import { useEffect, useRef, useState } from "react";
import { Avatar, Header, Icon, Pill } from "./ui";
import { diagnosisQuestions, scaleLabels, scoreDiagnosis, styleScaleLabels } from "./diagnosis";
import type { DiagnosisResult } from "./diagnosis";
import { concreteIndicators, diagnosisTypes, styleAxes } from "./diagnosis-types";
import type { Post } from "./discussion";

type PostPreview = { question: string; posts: readonly Post[] };

export const diagnosisNotice =
  "この診断は、現在のライフデザインの考え方を楽しみながら振り返るためのものです。タイプに優劣はなく、境界に近い場合は別のタイプにも当てはまる可能性があります。";

export function Diagnosis({
  finish,
  exit,
  onClose,
}: {
  finish: (result: DiagnosisResult) => void;
  exit: () => void;
  onClose?: () => void;
}) {
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const question = diagnosisQuestions[page];
  const isStyle = page < 12;
  const selected = answers[page];
  const labels = isStyle ? styleScaleLabels : scaleLabels;
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, [page]);
  return (
    <main className="screen life-quiz">
      <Header
        title="ライフデザイン診断"
        onBack={onClose ? undefined : () => (page ? setPage(page - 1) : exit())}
        onClose={onClose}
      />
      <div className="life-quiz-body">
        <div className="progress-meta">
          <span>
            Q{String(page + 1).padStart(2, "0")} <b>/ 20</b>
          </span>
          <Pill>{Object.keys(answers).length} / 20 回答</Pill>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label="回答の進み具合"
          aria-valuemin={0}
          aria-valuemax={20}
          aria-valuenow={Object.keys(answers).length}
        >
          <i style={{ width: `${Object.keys(answers).length * 5}%` }} />
        </div>
        <p className="life-instruction">
          {isStyle
            ? "今の自分は、どちらに近いですか？"
            : "今の自分に、どのくらい当てはまりますか？"}
        </p>
        <h2 ref={heading} tabIndex={-1} className="life-question-title">
          {question.text}
        </h2>
        {isStyle && (
          <div className="life-poles">
            <div className={selected && selected < 3 ? "chosen" : ""}>
              <small>左の考え方</small>
              <p>{question.left}</p>
            </div>
            <div className={selected && selected > 3 ? "chosen" : ""}>
              <small>右の考え方</small>
              <p>{question.right}</p>
            </div>
          </div>
        )}
        <fieldset
          className={`life-answers ${isStyle ? "bipolar-answers" : "agreement-answers"}`}
          key={page}
        >
          <legend className="sr-only">{question.text}：回答を選択</legend>
          {labels.map((label, i) => (
            <label key={label} className={selected === i + 1 ? "selected" : ""}>
              <input
                type="radio"
                aria-label={label}
                name={`question-${page}`}
                value={i + 1}
                checked={selected === i + 1}
                onChange={() => setAnswers((current) => ({ ...current, [page]: i + 1 }))}
              />
              <span className="life-answer-dot">
                {isStyle ? selected === i + 1 ? <Icon name="check" size={18} /> : <span /> : i + 1}
              </span>
              <span className="life-answer-label">
                {isStyle && (i === 1 || i === 3) ? null : isStyle && i === 2 ? (
                  <>
                    どちらとも
                    <br />
                    言えない
                  </>
                ) : (
                  label
                )}
              </span>
            </label>
          ))}
        </fieldset>
      </div>
      <div className="sticky-actions">
        <button className="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
          戻る
        </button>
        <button
          className="primary"
          disabled={!selected}
          onClick={() =>
            page === 19
              ? finish(scoreDiagnosis(diagnosisQuestions.map((_, i) => answers[i])))
              : setPage(page + 1)
          }
        >
          {page === 19 ? "結果を見る" : page === 11 ? "将来像の8問へ" : "次の質問へ"}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </main>
  );
}

export function BalanceBars({
  result,
  previous,
}: {
  result: DiagnosisResult;
  previous?: DiagnosisResult;
}) {
  return (
    <div className={`life-balance-list${previous ? " is-comparing" : ""}`}>
      {styleAxes.map((axis, i) => {
        const value = result.scores[i];
        const flag = result.boundaries[i];
        return (
          <div className="life-balance-item" key={axis.code}>
            <div className="life-axis-labels">
              <span>
                <b>{axis.first}</b> {axis.left}
              </span>
              <span>
                {axis.right} <b>{axis.second}</b>
              </span>
            </div>
            {previous && (
              <BalanceGauge
                value={previous.scores[i]}
                label={`${axis.left}と${axis.right}・前回`}
                period="前回"
              />
            )}
            <BalanceGauge
              value={value}
              label={`${axis.left}と${axis.right}${previous ? "・今回" : "のバランス"}`}
              period={previous ? "今回" : undefined}
            />
            {previous && (
              <p className="life-previous">
                今回の変化：
                {value === previous.scores[i]
                  ? "変化なし"
                  : `${axis.first} ${value > previous.scores[i] ? "+" : ""}${value - previous.scores[i]} / ${axis.second} ${value < previous.scores[i] ? "+" : ""}${previous.scores[i] - value} ポイント`}
              </p>
            )}
            {flag === "tie" && (
              <p className="life-boundary">
                {`両方向が同じくらい。表示上は${axis.first}に分類していますが、${axis.second}にも当てはまります。`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BalanceGauge({ value, label, period }: { value: number; label: string; period?: string }) {
  return (
    <div className={`life-balance-row${period ? " with-period" : ""}`}>
      {period && <small className="life-gauge-period">{period}</small>}
      <div className="life-axis-values">
        <strong>
          {value}
          <small> / 100</small>
        </strong>
        <strong>
          {100 - value}
          <small> / 100</small>
        </strong>
      </div>
      <div
        className="life-balance-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`左 ${value}、右 ${100 - value}`}
      >
        <i className="life-balance-left" style={{ width: `${value}%` }} />
        <i className="life-balance-right" style={{ width: `${100 - value}%` }} />
        <span className="life-midline" />
      </div>
    </div>
  );
}

export function ConcreteScores({
  result,
  previous,
}: {
  result: DiagnosisResult;
  previous?: DiagnosisResult;
}) {
  return (
    <section className={`card life-concrete${previous ? " is-comparing" : ""}`}>
      <div className="section-heading">
        <div>
          <small>FUTURE IN FOCUS</small>
          <h3>将来像の具体化状況</h3>
        </div>
      </div>
      <p className="life-section-caption">
        今、どこまで考えているかの目安。
        <br />
        スタイルのタイプ判定には使いません。
      </p>
      {concreteIndicators.map((indicator, i) => (
        <div className="life-indicator" key={indicator.code}>
          <div>
            <h4>
              <span>{indicator.code}</span>
              {indicator.name}
            </h4>
            {!previous && (
              <strong>
                {result.concreteness[i]}
                <small> / 100</small>
              </strong>
            )}
          </div>
          <p>{indicator.description}</p>
          {previous && (
            <ConcreteGauge
              value={previous.concreteness[i]}
              label={`${indicator.name}・前回`}
              period="前回"
            />
          )}
          <ConcreteGauge
            value={result.concreteness[i]}
            label={`${indicator.name}${previous ? "・今回" : ""}`}
            period={previous ? "今回" : undefined}
          />
          {previous && (
            <p className="life-indicator-change">
              前回から
              {result.concreteness[i] - previous.concreteness[i] > 0 ? "+" : ""}
              {result.concreteness[i] - previous.concreteness[i]} ポイント
            </p>
          )}
        </div>
      ))}
      <p className="life-section-caption">
        3つの指標はそれぞれ独立したものです。点数は、生き方の良し悪しや準備の十分さを評価するものではありません。
      </p>
    </section>
  );
}

function ConcreteGauge({
  value,
  label,
  period,
}: {
  value: number;
  label: string;
  period?: string;
}) {
  return (
    <div
      className={`life-concrete-row${period ? " with-period" : ""}${period === "前回" ? " is-previous" : ""}`}
    >
      {period && (
        <div className="life-concrete-row-heading">
          <small>{period}</small>
          <strong>
            {value}
            <small> / 100</small>
          </strong>
        </div>
      )}
      <div
        className="life-concrete-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ResultContent({
  result,
  previous,
  home,
  onProfile,
  preview,
}: {
  result: DiagnosisResult;
  previous?: DiagnosisResult;
  home: () => void;
  onProfile?: () => void;
  preview?: PostPreview;
}) {
  const type = diagnosisTypes.find((item) => item.code === result.code)!;
  return (
    <>
      <section className="life-result-hero">
        <small>いまのライフデザイン・スタイル</small>
        <h2>{type.name}</h2>
        <div className="life-code" aria-label={`タイプコード ${result.code}`}>
          {result.code}
        </div>
        <p>{type.description}</p>
        {previous && (
          <div className="life-previous-type">
            <small>前回のタイプ</small>
            <strong>{previous.type}</strong>
            <span>
              {previous.code} → {result.code}
            </span>
          </div>
        )}
        <span className="life-now-label">固定的な性格ではなく、今の回答から見える傾向です</span>
      </section>
      <section className="card life-balance-card">
        <div className="section-heading">
          <div>
            <small>STYLE BALANCE</small>
            <h3>4軸のバランス</h3>
          </div>
        </div>
        <BalanceBars result={result} previous={previous} />
      </section>
      <ConcreteScores result={result} previous={previous} />
      {onProfile ? (
        <section className="life-profile-invitation">
          <small>COMMUNITY</small>
          <h3>違うスタイルの人は、どう考える？</h3>
          {preview && (
            <>
              <p className="life-preview-question">{preview.question}</p>
              <div className="life-post-previews" aria-label="みんなの投稿の紹介">
                {preview.posts.map((post) => (
                  <article className="life-post-preview" key={post.id}>
                    <div className="life-preview-author">
                      <Avatar color={post.color} size={32} image={post.image} flat />
                      <div>
                        <strong>{post.name}</strong>
                        <small>{post.type}</small>
                      </div>
                    </div>
                    {post.poll && (
                      <div className="choice-tag">
                        <span>選んだ回答</span>
                        <strong>{post.poll}</strong>
                      </div>
                    )}
                    <p>{post.text}</p>
                  </article>
                ))}
              </div>
            </>
          )}
          <div className="life-invitation-action">
            <h3>あなたの考えも、話してみませんか。</h3>
            <p>プロフィールを入力すると、投稿や対話に参加できます。</p>
            <button className="primary full" onClick={onProfile}>
              プロフィールを入力する
              <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      ) : (
        <section className="life-community">
          <Icon name="message" size={25} />
          <h3>同じ問いにも、いろいろな視点。</h3>
          <p>
            考え方のスタイルが違う人は、どう答える？
            <br />
            今日のテーマから、みんなの理由を見てみよう。
          </p>
          <button className="primary full" onClick={home}>
            異なるスタイルの声を見る
            <Icon name="arrow" size={18} />
          </button>
          <small>今日の問いに答えると、タイプ別に投稿を読めます。</small>
        </section>
      )}
      <p className="life-notice">{diagnosisNotice}</p>
    </>
  );
}

export function Result({
  home,
  result,
  previous,
  onProfile,
  onClose,
  preview,
}: {
  home: () => void;
  result: DiagnosisResult;
  previous?: DiagnosisResult;
  onProfile?: () => void;
  onClose?: () => void;
  preview?: PostPreview;
}) {
  return (
    <main className="screen result-screen">
      <Header title="診断結果" onClose={onClose} />
      <div className="content life-result-content">
        <ResultContent
          result={result}
          previous={previous}
          home={home}
          onProfile={onProfile}
          preview={preview}
        />
      </div>
    </main>
  );
}
