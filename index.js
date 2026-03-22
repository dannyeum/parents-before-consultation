// pages/index.js
import { useState, useEffect, useRef } from "react";
import { saveSurvey, getSurveys, deleteSurvey, deleteAllSurveys } from "../lib/firebase";

/* ══════════════════════════════════════════════════════
   상수
══════════════════════════════════════════════════════ */
const YEARS     = [2025, 2026, 2027];
const GRADES    = [1, 2, 3, 4, 5, 6];
const CLASSES   = [1, 2, 3, 4, 5, 6, 7, 8];
const TEACHER_PW = "teacher1234"; // ← 배포 전 변경 권장

/* ══════════════════════════════════════════════════════
   설문 문항
══════════════════════════════════════════════════════ */
const SECTIONS = [
  {
    id: "emotions", emoji: "💛", title: "감정 & 심리 상태",
    desc: "요즘 내 마음이 어떤지 솔직하게 표시해 주세요",
    color: "#FF8C69", lightBg: "#FFEEE8",
    questions: [
      { id: "e1", type: "mood", label: "요즘 전반적으로 기분이 어떤가요?",
        options: ["😄 매우 행복해요", "😊 괜찮아요", "😐 그냥 그래요", "😔 좀 우울해요", "😢 많이 힘들어요"] },
      { id: "e2", type: "likert", label: "나는 학교 생활이 즐겁다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "e3", type: "likert", label: "나는 아침에 학교 가기 싫다고 느낀다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "e4", type: "likert", label: "나는 감정 조절이 어렵다고 느낀다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "e5", type: "text", label: "요즘 가장 많이 느끼는 감정과 그 이유는?" },
    ],
  },
  {
    id: "anxiety", emoji: "😰", title: "불안 & 걱정",
    desc: "해당하는 정도를 솔직하게 표시해 주세요",
    color: "#9B7FD4", lightBg: "#EDE7FF",
    questions: [
      { id: "a1", type: "likert", label: "시험이나 발표가 다가오면 많이 걱정된다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "a2", type: "likert", label: "밤에 걱정 때문에 잠을 잘 못 잔다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "a3", type: "likert", label: "실수하거나 틀릴까봐 불안하다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "a4", type: "likert", label: "친구나 선생님이 나를 어떻게 볼지 신경 쓰인다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "a5", type: "likert", label: "중학교 진학이 걱정된다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "a6", type: "text", label: "요즘 제일 걱정되거나 불안한 것은?" },
    ],
  },
  {
    id: "friendship", emoji: "🤝", title: "친구 관계",
    desc: "학교에서의 친구 관계에 대해 솔직하게 알려주세요",
    color: "#3BBFA3", lightBg: "#D4F5EE",
    questions: [
      { id: "f1", type: "likert", label: "학교에 친한 친구가 있다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "f2", type: "likert", label: "어려운 일이 생기면 친구에게 도움을 요청할 수 있다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "f3", type: "likert", label: "쉬는 시간이나 점심에 혼자 있는 편이다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "f4", type: "likert", label: "친구들 사이에서 소외된다고 느낀다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "f5", type: "likert", label: "친구와 갈등이 생기면 잘 해결할 수 있다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "f6", type: "mood", label: "지금 우리 반 분위기는?",
        options: ["🌈 매우 화목해요", "😊 괜찮아요", "😐 그냥 그래요", "😬 불편해요", "😤 사이가 안 좋아요"] },
      { id: "f7", type: "text", label: "친구 관계에서 힘들었던 점이나 선생님께 알리고 싶은 것이 있나요?" },
    ],
  },
  {
    id: "self", emoji: "🌟", title: "자아상태",
    desc: "나에 대해 어떻게 생각하는지 알려주세요",
    color: "#FFD166", lightBg: "#FFF7E0",
    questions: [
      { id: "s1", type: "likert", label: "나는 나 자신이 괜찮은 사람이라고 생각한다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "s2", type: "likert", label: "나는 어려운 문제도 해결할 수 있다고 믿는다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "s3", type: "likert", label: "나는 다른 친구들보다 내가 부족하다고 느낀다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "s4", type: "text", label: "내가 스스로 자랑스럽거나 잘한다고 생각하는 것은?" },
      { id: "s5", type: "text", label: "내가 고치고 싶거나 더 발전시키고 싶은 점은?" },
    ],
  },
  {
    id: "learning", emoji: "📚", title: "학습 & 학교생활",
    desc: "공부와 학교생활에 대해 알려주세요",
    color: "#4A90D9", lightBg: "#EAF4FB",
    questions: [
      { id: "l1", type: "likert", label: "수업 시간에 집중이 잘 된다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "l2", type: "likert", label: "숙제나 과제를 스스로 잘 한다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "l3", type: "likert", label: "공부하는 것이 즐겁다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "l4", type: "text", label: "제일 좋아하는 과목과 이유는?" },
      { id: "l5", type: "text", label: "제일 어렵고 힘든 과목과 이유는?" },
    ],
  },
  {
    id: "growth", emoji: "🚀", title: "성장 & 미래",
    desc: "앞으로의 나에 대해 생각해 봐요",
    color: "#2EC4B6", lightBg: "#E0FAF7",
    questions: [
      { id: "g1", type: "likert", label: "중학교에 가면 잘 적응할 수 있을 것 같다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "g2", type: "likert", label: "내 미래에 대해 긍정적으로 생각한다", anchors: ["전혀 아니다", "매우 그렇다"] },
      { id: "g3", type: "text", label: "중학교에서 꼭 해보고 싶은 것은?" },
      { id: "g4", type: "text", label: "선생님께 하고 싶은 말이나 부탁이 있다면 자유롭게 써주세요 😊" },
    ],
  },
];

const FLAG_KW = ["스트레스", "걱정", "불안", "힘들", "외로", "혼자", "포기", "무섭", "슬퍼", "다퉜", "속상", "싸움", "왕따", "때려", "맞았", "싫어"];

function highlight(text) {
  if (!text) return String(text || "");
  let r = String(text);
  FLAG_KW.forEach(k => {
    r = r.replace(new RegExp(k, "g"), `<mark class="kw-alert">${k}</mark>`);
  });
  return r;
}

function hasFlag(survey) {
  const all = Object.values(survey.answers || {})
    .map(v => typeof v === "string" ? v : v?.reason || "").join(" ");
  return FLAG_KW.some(k => all.includes(k));
}

function secAvg(survey, secId) {
  const sec = SECTIONS.find(s => s.id === secId);
  if (!sec) return null;
  const vals = sec.questions
    .filter(q => q.type === "likert")
    .map(q => parseInt(survey.answers?.[q.id]) || 0)
    .filter(v => v > 0);
  if (!vals.length) return null;
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

/* ══════════════════════════════════════════════════════
   공통 UI 컴포넌트
══════════════════════════════════════════════════════ */
function Btn({ children, onClick, color = "blue", size = "md", disabled, style = {} }) {
  const colors = {
    blue:   { background: "#4A90D9", color: "#fff", boxShadow: "0 4px 12px rgba(74,144,217,.35)" },
    mint:   { background: "#3BBFA3", color: "#fff", boxShadow: "0 4px 12px rgba(59,191,163,.35)" },
    rose:   { background: "#F47C9A", color: "#fff", boxShadow: "0 4px 12px rgba(244,124,154,.35)" },
    purple: { background: "#9B7FD4", color: "#fff", boxShadow: "0 4px 12px rgba(155,127,212,.35)" },
    ghost:  { background: "#F6F7FA", color: "#3D4461", boxShadow: "none" },
  };
  const sizes = {
    sm: { padding: "8px 16px", fontSize: 13 },
    md: { padding: "12px 22px", fontSize: 15 },
    lg: { padding: "15px 28px", fontSize: 16 },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Noto Sans KR', sans-serif",
        fontWeight: 700,
        borderRadius: 12,
        transition: "all .2s",
        opacity: disabled ? 0.45 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        ...sizes[size],
        ...colors[color],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Tag({ children, color = "blue" }) {
  const map = {
    blue:   { bg: "#EAF4FB", color: "#2C6FAC" },
    mint:   { bg: "#D4F5EE", color: "#1a8a74" },
    rose:   { bg: "#FFEBF2", color: "#c0325a" },
    yellow: { bg: "#FFF7E0", color: "#b8860b" },
    purple: { bg: "#EDE7FF", color: "#6a4db8" },
    teal:   { bg: "#E0FAF7", color: "#1a7a72" },
    gray:   { bg: "#E8EAF0", color: "#3D4461" },
  };
  return (
    <span style={{
      background: map[color].bg,
      color: map[color].color,
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      display: "inline-block",
    }}>
      {children}
    </span>
  );
}

function Likert({ value, onChange, anchors }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            className={`lk-btn${value === n ? " on" : ""}`}
            onClick={() => onChange(n)}
          >
            <div style={{ fontSize: 15, marginBottom: 2 }}>{"①②③④⑤"[n - 1]}</div>
            <div style={{ fontSize: 11 }}>{n}점</div>
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontSize: 10, color: "#7A8299" }}>{anchors[0]}</span>
        <span style={{ fontSize: 10, color: "#7A8299" }}>{anchors[1]}</span>
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,.5)",
      zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div className="card fu" style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   홈
══════════════════════════════════════════════════════ */
function HomePage({ onStudent, onTeacher }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24,
      background: "linear-gradient(150deg, #EAF4FB 0%, #D4F5EE 100%)",
    }}>
      <div className="fu" style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 62, marginBottom: 10 }}>🏫</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#2C6FAC", marginBottom: 6 }}>
          학부모 상담 준비 시스템
        </h1>
        <p style={{ color: "#7A8299", fontSize: 14 }}>
          6학년 심층 설문 · 1차/2차 비교 · AI 상담 분석
        </p>
      </div>

      <div className="fu1" style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: 500, width: "100%" }}>
        <div
          className="hover-lift"
          onClick={onStudent}
          style={{
            flex: 1, minWidth: 200,
            background: "#fff", borderRadius: 24,
            padding: "34px 24px", textAlign: "center",
            boxShadow: "0 4px 20px rgba(74,144,217,.15)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>✏️</div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#4A90D9", marginBottom: 8 }}>학생 설문하기</h2>
          <p style={{ color: "#7A8299", fontSize: 13, lineHeight: 1.7 }}>내 마음과 생각을<br />솔직하게 적어봐요</p>
          <div style={{ marginTop: 14 }}><Tag color="blue">약 7분</Tag></div>
        </div>

        <div
          className="hover-lift"
          onClick={onTeacher}
          style={{
            flex: 1, minWidth: 200,
            background: "#fff", borderRadius: 24,
            padding: "34px 24px", textAlign: "center",
            boxShadow: "0 4px 20px rgba(74,144,217,.15)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#3BBFA3", marginBottom: 8 }}>교사 대시보드</h2>
          <p style={{ color: "#7A8299", fontSize: 13, lineHeight: 1.7 }}>설문 결과 확인 및<br />AI 상담 분석</p>
          <div style={{ marginTop: 14 }}><Tag color="mint">교사 전용</Tag></div>
        </div>
      </div>

      <div className="fu2" style={{ marginTop: 30, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {SECTIONS.map(s => (
          <span key={s.id} style={{
            background: "#fff", borderRadius: 999,
            padding: "5px 12px", fontSize: 12, color: "#7A8299",
            boxShadow: "0 2px 8px rgba(74,144,217,.10)",
          }}>
            {s.emoji} {s.title}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   학생 설문
══════════════════════════════════════════════════════ */
function StudentSurvey({ onBack }) {
  const [step, setStep]   = useState("info"); // info → 0..N → done
  const [info, setInfo]   = useState({ year: 2026, grade: 6, classNum: 1, name: "", term: "1차" });
  const [answers, setAns] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone]   = useState(false);
  const topRef = useRef(null);
  const total  = SECTIONS.length;

  useEffect(() => {
    topRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const setA = (qid, val) => setAns(a => ({ ...a, [qid]: val }));

  const canGoNext = () => {
    if (step === "info") return info.name.trim().length > 0;
    const sec = SECTIONS[step];
    return sec.questions.every(q => {
      const v = answers[q.id];
      if (q.type === "likert") return !!v;
      if (q.type === "mood")   return !!v;
      return v && String(v).trim().length > 0;
    });
  };

  const goNext = () => {
    if (step === "info") { setStep(0); return; }
    if (step < total - 1) { setStep(s => s + 1); return; }
    handleSubmit();
  };

  const goPrev = () => {
    if (step === "info") { onBack(); return; }
    if (step === 0) { setStep("info"); return; }
    setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await saveSurvey({ ...info, answers });
      setDone(true);
    } catch (e) {
      alert("저장 오류: " + e.message);
    }
    setSaving(false);
  };

  if (done) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24,
      background: "linear-gradient(150deg,#EAF4FB,#D4F5EE)",
    }}>
      <div className="fu" style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>설문 완성!</h2>
        <p style={{ color: "#7A8299", lineHeight: 1.9, marginBottom: 28 }}>
          <strong>{info.year}학년도 {info.grade}학년 {info.classNum}반 {info.name}</strong> 학생<br />
          {info.term} 설문에 참여해줘서 고마워요 😊
        </p>
        <Btn onClick={onBack} color="blue" size="lg" style={{ justifyContent: "center" }}>
          처음 화면으로
        </Btn>
      </div>
    </div>
  );

  const pct = step === "info" ? 0 : Math.round(((step + 1) / total) * 100);

  return (
    <div ref={topRef} style={{
      minHeight: "100vh",
      background: "linear-gradient(150deg,#EAF4FB,#D4F5EE)",
      overflowY: "auto",
    }}>
      {/* 헤더 */}
      <div style={{
        background: "#fff", padding: "14px 18px",
        boxShadow: "0 2px 8px rgba(74,144,217,.10)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: typeof step === "number" ? 10 : 0 }}>
            <button onClick={goPrev} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#7A8299" }}>←</button>
            <span style={{ fontWeight: 700, color: "#3D4461" }}>학생 설문</span>
            {typeof step === "number" && (
              <>
                <Tag color={info.term === "1차" ? "blue" : "mint"}>{info.term}</Tag>
                <span style={{ marginLeft: "auto", fontSize: 13, color: "#7A8299" }}>{step + 1}/{total}</span>
              </>
            )}
          </div>
          {typeof step === "number" && (
            <div style={{ background: "#E8EAF0", borderRadius: 999, height: 6, overflow: "hidden" }}>
              <div style={{
                background: "linear-gradient(90deg,#4A90D9,#3BBFA3)",
                height: "100%", width: `${pct}%`,
                transition: "width .4s", borderRadius: 999,
              }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "22px 16px 80px" }}>

        {/* 기본 정보 입력 */}
        {step === "info" && (
          <div className="fu">
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 50, marginBottom: 8 }}>👋</div>
                <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>안녕하세요!</h2>
                <p style={{ color: "#7A8299", fontSize: 14, lineHeight: 1.8 }}>
                  솔직하게 적어줄수록 더 좋은 상담이 돼요 😊
                </p>
              </div>

              {/* 학년도 */}
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>학년도 <span style={{ color: "#F47C9A" }}>*</span></p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {YEARS.map(y => (
                    <button key={y} type="button"
                      className={`sel-btn${info.year === y ? " on" : ""}`}
                      onClick={() => setInfo(i => ({ ...i, year: y }))}>
                      {y}학년도
                    </button>
                  ))}
                </div>
              </div>

              {/* 학년 */}
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>학년 <span style={{ color: "#F47C9A" }}>*</span></p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
                  {GRADES.map(g => (
                    <button key={g} type="button"
                      className={`sel-btn${info.grade === g ? " on" : ""}`}
                      onClick={() => setInfo(i => ({ ...i, grade: g }))}>
                      {g}학년
                    </button>
                  ))}
                </div>
              </div>

              {/* 반 */}
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>반 <span style={{ color: "#F47C9A" }}>*</span></p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {CLASSES.map(c => (
                    <button key={c} type="button"
                      className={`sel-btn${info.classNum === c ? " on" : ""}`}
                      onClick={() => setInfo(i => ({ ...i, classNum: c }))}>
                      {c}반
                    </button>
                  ))}
                </div>
              </div>

              {/* 이름 */}
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>이름 <span style={{ color: "#F47C9A" }}>*</span></p>
                <input
                  type="text"
                  value={info.name}
                  onChange={e => setInfo(i => ({ ...i, name: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && canGoNext() && goNext()}
                  placeholder="예) 김민준"
                />
              </div>

              {/* 차수 */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>검사 차수 <span style={{ color: "#F47C9A" }}>*</span></p>
                <div style={{ display: "flex", gap: 10 }}>
                  {["1차", "2차"].map(t => (
                    <button key={t} type="button"
                      className={`sel-btn${info.term === t ? " on" : ""}`}
                      style={{ flex: 1 }}
                      onClick={() => setInfo(i => ({ ...i, term: t }))}>
                      {t === "1차" ? "🌱 1차 (1학기)" : "🌻 2차 (2학기)"}
                    </button>
                  ))}
                </div>
              </div>

              <Btn
                onClick={goNext}
                disabled={!canGoNext()}
                color="blue" size="lg"
                style={{ width: "100%", justifyContent: "center" }}>
                설문 시작하기 🚀
              </Btn>
            </div>
          </div>
        )}

        {/* 섹션 문항 */}
        {typeof step === "number" && (
          <div className="fu">
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 46, marginBottom: 6 }}>{SECTIONS[step].emoji}</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{SECTIONS[step].title}</h2>
              <p style={{ color: "#7A8299", fontSize: 13 }}>{SECTIONS[step].desc}</p>
            </div>

            {SECTIONS[step].questions.map((q, i) => (
              <div key={q.id} className="card" style={{ marginBottom: 14 }}>
                <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.7, marginBottom: 14, color: "#3D4461" }}>
                  <span style={{
                    background: SECTIONS[step].lightBg,
                    borderRadius: 999, padding: "2px 9px",
                    fontSize: 10, fontWeight: 700, marginRight: 8,
                  }}>Q{i + 1}</span>
                  {q.label}
                </p>

                {q.type === "text" && (
                  <textarea
                    rows={3}
                    placeholder="여기에 적어주세요..."
                    value={answers[q.id] || ""}
                    onChange={e => setA(q.id, e.target.value)}
                  />
                )}
                {q.type === "likert" && (
                  <Likert value={answers[q.id]} onChange={v => setA(q.id, v)} anchors={q.anchors} />
                )}
                {q.type === "mood" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {q.options.map(opt => (
                      <button key={opt} type="button"
                        className={`mood-btn${answers[q.id] === opt ? " on" : ""}`}
                        onClick={() => setA(q.id, opt)}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Btn onClick={goPrev} color="ghost" size="lg" style={{ flex: 1, justifyContent: "center" }}>← 이전</Btn>
              <Btn
                onClick={goNext}
                disabled={!canGoNext() || saving}
                color={step === total - 1 ? "mint" : "blue"}
                size="lg"
                style={{ flex: 2, justifyContent: "center" }}>
                {saving ? <><div className="spinner" />저장 중...</> : step === total - 1 ? "✅ 제출하기" : "다음 →"}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   교사 로그인
══════════════════════════════════════════════════════ */
function TeacherLogin({ onLogin, onBack }) {
  const [pw, setPw]   = useState("");
  const [err, setErr] = useState("");

  const go = () => {
    if (pw === TEACHER_PW) onLogin();
    else setErr("비밀번호가 맞지 않아요.");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24,
      background: "linear-gradient(150deg,#EAF4FB,#D4F5EE)",
    }}>
      <div className="card fu" style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 50, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>교사 로그인</h2>
        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && go()}
          placeholder="비밀번호 입력"
          style={{ marginBottom: 8 }}
        />
        {err && <p style={{ color: "#F47C9A", fontSize: 13, marginBottom: 8 }}>{err}</p>}
        <p style={{ fontSize: 11, color: "#C8CDD8", marginBottom: 16 }}>힌트: teacher1234</p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={onBack} color="ghost" style={{ flex: 1, justifyContent: "center" }}>취소</Btn>
          <Btn onClick={go} color="mint" style={{ flex: 2, justifyContent: "center" }}>로그인</Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   교사 대시보드
══════════════════════════════════════════════════════ */
function Dashboard({ onBack, onSelect, onLogout }) {
  const [year, setYear]         = useState(2026);
  const [surveys, setSurveys]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterTerm, setFT]     = useState("전체");
  const [filterGrade, setFG]    = useState("전체");
  const [filterClass, setFC]    = useState("전체");
  const [modal, setModal]       = useState(null); // {type:"one"|"all", survey?}
  const [deleting, setDeleting] = useState(false);

  const load = (y) => {
    setLoading(true);
    getSurveys(y)
      .then(data => { setSurveys(data); setLoading(false); })
      .catch(e => { alert("불러오기 오류: " + e.message); setLoading(false); });
  };

  useEffect(() => { load(year); }, [year]);

  const changeYear = (y) => { setYear(y); setFG("전체"); setFC("전체"); };

  const handleDelOne = async (s) => {
    setDeleting(true);
    try { await deleteSurvey(s.id); load(year); }
    catch (e) { alert("삭제 오류: " + e.message); }
    setDeleting(false); setModal(null);
  };

  const handleDelAll = async () => {
    setDeleting(true);
    const g = filterGrade !== "전체" ? filterGrade : null;
    const c = filterClass !== "전체" ? filterClass : null;
    try {
      const cnt = await deleteAllSurveys(year, g, c);
      alert(`${cnt}건 삭제 완료!`);
      load(year);
    } catch (e) { alert("삭제 오류: " + e.message); }
    setDeleting(false); setModal(null);
  };

  // 필터 적용
  const filtered = surveys.filter(s =>
    s.name?.includes(search) &&
    (filterTerm  === "전체" || s.term     === filterTerm) &&
    (filterGrade === "전체" || s.grade    === Number(filterGrade)) &&
    (filterClass === "전체" || s.classNum === Number(filterClass))
  );

  const byName = {};
  filtered.forEach(s => {
    if (!byName[s.name]) byName[s.name] = [];
    byName[s.name].push(s.term);
  });

  const flagCount = filtered.filter(hasFlag).length;

  // 고유 학년/반 목록
  const grades  = [...new Set(surveys.map(s => s.grade))].sort((a, b) => a - b);
  const classes = [...new Set(
    surveys.filter(s => filterGrade === "전체" || s.grade === Number(filterGrade)).map(s => s.classNum)
  )].sort((a, b) => a - b);

  return (
    <div style={{ minHeight: "100vh", background: "#F6F7FA" }}>

      {/* 삭제 확인 모달 */}
      {modal && (
        <Modal>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{modal.type === "one" ? "🗑️" : "⚠️"}</div>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>
            {modal.type === "one"
              ? `${modal.survey.name} 학생의 ${modal.survey.term} 설문을 삭제할까요?`
              : `필터된 설문 ${filtered.length}건을 전체 삭제할까요?`}
          </h3>
          <p style={{ color: "#7A8299", fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>
            삭제 후에는 복구할 수 없습니다.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => setModal(null)} color="ghost" style={{ flex: 1, justifyContent: "center" }}>취소</Btn>
            <Btn
              onClick={() => modal.type === "one" ? handleDelOne(modal.survey) : handleDelAll()}
              disabled={deleting}
              color="rose"
              style={{ flex: 1, justifyContent: "center" }}>
              {deleting ? <><div className="spinner" />삭제 중...</> : "삭제"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* 헤더 */}
      <div style={{
        background: "#fff", padding: "14px 18px",
        boxShadow: "0 2px 8px rgba(74,144,217,.10)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#7A8299" }}>←</button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 900 }}>교사 대시보드</h1>
              <p style={{ fontSize: 12, color: "#7A8299" }}>설문 결과 관리</p>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Tag color="blue">{filtered.length}건</Tag>
              {flagCount > 0 && <Tag color="rose">⚠️ {flagCount}명 주의</Tag>}
              <button onClick={onLogout} style={{
                background: "#F6F7FA", border: "none", borderRadius: 10,
                padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "#7A8299",
              }}>로그아웃</button>
            </div>
          </div>

          {/* 학년도 탭 */}
          <div style={{ display: "flex", gap: 6 }}>
            {YEARS.map(y => (
              <button key={y} className={`tab-btn${year === y ? " on" : ""}`} onClick={() => changeYear(y)}>
                {y}학년도
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "18px 16px 60px" }}>

        {/* 필터 바 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 이름 검색..."
            style={{ maxWidth: 180, marginBottom: 0 }}
          />
          {["전체", "1차", "2차"].map(t => (
            <button key={t} className={`tab-btn${filterTerm === t ? " on" : ""}`} onClick={() => setFT(t)}>{t}</button>
          ))}
          {["전체", ...grades.map(String)].map(g => (
            <button key={g} className={`tab-btn${filterGrade === g ? " on" : ""}`}
              onClick={() => { setFG(g); setFC("전체"); }}>
              {g === "전체" ? "전체 학년" : `${g}학년`}
            </button>
          ))}
          {filterGrade !== "전체" && ["전체", ...classes.map(String)].map(c => (
            <button key={c} className={`tab-btn${filterClass === c ? " on" : ""}`} onClick={() => setFC(c)}>
              {c === "전체" ? "전체 반" : `${c}반`}
            </button>
          ))}

          {/* 전체 삭제 버튼 */}
          {filtered.length > 0 && (
            <button
              onClick={() => setModal({ type: "all" })}
              style={{
                marginLeft: "auto",
                border: "2px solid #F47C9A", background: "#FFEBF2",
                borderRadius: 10, padding: "8px 14px",
                cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif",
                fontWeight: 700, fontSize: 13, color: "#F47C9A",
                display: "flex", alignItems: "center", gap: 6,
              }}>
              🗑️ 전체 삭제
            </button>
          )}
        </div>

        {/* 카드 목록 */}
        {loading ? (
          <div className="card" style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <p style={{ color: "#7A8299" }}>불러오는 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card fu" style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>📭</div>
            <h3 style={{ fontSize: 18, marginBottom: 8, color: "#3D4461" }}>응답이 없어요</h3>
            <p style={{ color: "#7A8299" }}>학생들이 설문을 제출하면 여기에 나타납니다</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(188px,1fr))", gap: 12 }}>
            {filtered.map(s => {
              const flagged = hasFlag(s);
              const hasBoth = byName[s.name]?.includes("1차") && byName[s.name]?.includes("2차");
              const moodVal = Object.values(s.answers || {})
                .find(v => typeof v === "string" && ["😄", "😊", "😐", "😔", "😢"].some(e => v.startsWith(e)));
              return (
                <div key={s.id} className="card" style={{
                  border: flagged ? "2px solid #FFE5E5" : "2px solid transparent",
                  position: "relative", animation: "fadeUp .3s ease both",
                }}>
                  {/* 개별 삭제 버튼 */}
                  <button
                    onClick={e => { e.stopPropagation(); setModal({ type: "one", survey: s }); }}
                    title="삭제"
                    style={{
                      position: "absolute", top: 8, right: 8,
                      background: "#FFEBF2", border: "none",
                      borderRadius: 8, width: 28, height: 28,
                      cursor: "pointer", fontSize: 14, color: "#F47C9A",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                    🗑
                  </button>

                  {/* 카드 내용 → 클릭 시 상세 */}
                  <div onClick={() => onSelect(s, surveys)} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 30 }}>👤</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end", paddingRight: 26 }}>
                        {flagged && <span style={{ fontSize: 10, color: "#c0325a", fontWeight: 700, background: "#FFE5E5", borderRadius: 999, padding: "2px 7px" }}>⚠️ 주의</span>}
                        {hasBoth && <span style={{ fontSize: 10, color: "#1a7a72", fontWeight: 700, background: "#E0FAF7", borderRadius: 999, padding: "2px 7px" }}>↔ 비교</span>}
                        <span style={{ fontSize: 18 }}>{moodVal?.split(" ")[0] || "😐"}</span>
                      </div>
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 5 }}>{s.name}</h3>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 5 }}>
                      <Tag color={s.term === "1차" ? "blue" : "mint"}>{s.term}</Tag>
                      <Tag color="gray">{s.grade}학년 {s.classNum}반</Tag>
                    </div>
                    <p style={{ fontSize: 11, color: "#7A8299" }}>{s.submittedAt}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   학생 상세 보기
══════════════════════════════════════════════════════ */
function StudentDetail({ survey, allSurveys, onBack }) {
  const [tab, setTab]     = useState("answers"); // answers | compare | ai
  const [aiRes, setAiRes] = useState(null);
  const [aiLoad, setAL]   = useState(false);
  const [script, setScript] = useState(null);
  const [scrLoad, setSL]    = useState(false);

  const otherTerm = survey.term === "1차" ? "2차" : "1차";
  const paired = allSurveys.find(s =>
    s.name === survey.name &&
    s.grade === survey.grade &&
    s.classNum === survey.classNum &&
    s.term === otherTerm
  );

  const buildText = sv => {
    let t = `학생: ${sv.name} (${sv.year}학년도 ${sv.grade}학년 ${sv.classNum}반 / ${sv.term})\n\n`;
    SECTIONS.forEach(sec => {
      t += `[${sec.emoji} ${sec.title}]\n`;
      sec.questions.forEach(q => {
        const a = sv.answers?.[q.id];
        if (q.type === "likert") t += `- ${q.label}: ${a || "?"}/5점\n`;
        else t += `- ${q.label}: ${a || ""}\n`;
      });
      t += "\n";
    });
    return t;
  };

  const callAI = async (prompt, maxTokens = 1500) => {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, maxTokens }),
    });
    const data = await res.json();
    // 에러 응답 처리
    if (data.error) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
    // Claude 응답에서 텍스트 추출
    const raw = data.content?.map(c => c.text || "").join("") || "";
    // JSON 블록 추출 (```json ... ``` 또는 { ... } 형태 모두 처리)
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) ||
                      raw.match(/```([\s\S]*?)```/) ||
                      raw.match(/({[\s\S]*})/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new Error("JSON 파싱 실패: " + jsonStr.substring(0, 100));
    }
  };

  const genAI = async () => {
    setAL(true); setAiRes(null);
    const cmp = paired
      ? `\n\n[1차]\n${buildText(survey.term === "1차" ? survey : paired)}\n[2차]\n${buildText(survey.term === "2차" ? survey : paired)}`
      : buildText(survey);
    const prompt = `초등학교 6학년 학생 학부모 상담 사전 설문${paired ? " (1·2차 비교포함)" : ""}:\n${cmp}\n
아래 JSON만 반환 (마크다운 없이):
{"summary":"요약 2문장","anxietyLevel":"낮음|보통|높음","friendshipLevel":"원만|보통|어려움","selfLevel":"긍정|보통|부정","points":["포인트1","포인트2","포인트3"],"positiveMessage":"학부모 전달 메시지 2문장","changeNote":"${paired ? "1→2차 변화 서술" : ""}","flagKeywords":["키워드"],"strengthKeywords":["키워드"]}`;
    try { setAiRes(await callAI(prompt)); }
    catch (e) { setAiRes({ error: "AI 오류: " + e.message }); }
    setAL(false);
  };

  const genScript = async () => {
    setSL(true); setScript(null);
    const prompt = `교사용 학부모 상담 스크립트 JSON만 반환:\n${buildText(survey)}\n{"opening":"인사 2문장","strengths":"강점 칭찬 2~3문장","improvements":"개선 지원 2~3문장","closing":"마무리 2문장"}`;
    try { setScript(await callAI(prompt, 800)); }
    catch (e) { setScript({ error: "스크립트 오류: " + e.message }); }
    setSL(false);
  };

  const LvBadge = ({ label, level }) => {
    const map = { "낮음": "mint", "보통": "yellow", "높음": "rose", "원만": "mint", "어려움": "rose", "긍정": "mint", "부정": "rose" };
    return (
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#7A8299", marginBottom: 4 }}>{label}</p>
        <Tag color={map[level] || "gray"}>{level}</Tag>
      </div>
    );
  };

  const s1 = survey.term === "1차" ? survey : paired;
  const s2 = survey.term === "2차" ? survey : paired;

  return (
    <div style={{ minHeight: "100vh", background: "#F6F7FA" }}>
      {/* 헤더 */}
      <div style={{ background: "#fff", padding: "14px 18px", boxShadow: "0 2px 8px rgba(74,144,217,.10)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#7A8299" }}>←</button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 900 }}>{survey.name} 학생</h1>
              <p style={{ fontSize: 12, color: "#7A8299" }}>
                {survey.year}학년도 {survey.grade}학년 {survey.classNum}반 · {survey.term} · {survey.submittedAt}
              </p>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Tag color={survey.term === "1차" ? "blue" : "mint"}>{survey.term}</Tag>
              {hasFlag(survey) && <Tag color="rose">⚠️ 주의</Tag>}
              {paired && <Tag color="teal">↔ 비교가능</Tag>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { id: "answers", label: "📋 설문 원문" },
              { id: "compare", label: `📊 비교${!paired ? " 🔒" : ""}` },
              { id: "ai",      label: "🤖 AI 분석" },
            ].map(t => (
              <button key={t.id} className={`tab-btn${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "18px 16px 60px" }}>

        {/* 설문 원문 */}
        {tab === "answers" && SECTIONS.map(sec => (
          <div key={sec.id} className="card fu" style={{ marginBottom: 12 }}>
            <h4 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{sec.emoji} {sec.title}</h4>
            {sec.questions.map(q => {
              const a = survey.answers?.[q.id];
              return (
                <div key={q.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #E8EAF0" }}>
                  <p style={{ fontSize: 12, color: "#7A8299", marginBottom: 4 }}>{q.label}</p>
                  {q.type === "likert" ? (
                    <div style={{ display: "flex", gap: 5 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <div key={n} style={{
                          width: 28, height: 28, borderRadius: 6,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: a === n ? 700 : 400,
                          background: a === n ? "#4A90D9" : "#E8EAF0",
                          color: a === n ? "#fff" : "#7A8299",
                        }}>{n}</div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, lineHeight: 1.8, color: "#3D4461" }}
                      dangerouslySetInnerHTML={{ __html: highlight(String(a || "")) }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* 비교 탭 */}
        {tab === "compare" && !paired && (
          <div className="card fu" style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>📭</div>
            <h3 style={{ color: "#3D4461", marginBottom: 8 }}>비교할 {otherTerm} 설문이 없어요</h3>
            <p style={{ color: "#7A8299" }}>{otherTerm} 설문이 제출되면 비교할 수 있어요</p>
          </div>
        )}
        {tab === "compare" && paired && (
          <>
            {/* 영역별 점수 비교 */}
            <div className="card fu" style={{ marginBottom: 12 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📊 영역별 점수 비교</h3>
              {SECTIONS.map(sec => {
                const sc1 = secAvg(s1, sec.id);
                const sc2 = secAvg(s2, sec.id);
                if (!sc1 && !sc2) return null;
                const diff = sc1 && sc2 ? (parseFloat(sc2) - parseFloat(sc1)).toFixed(1) : null;
                return (
                  <div key={sec.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{sec.emoji} {sec.title}</span>
                      {diff && <span style={{ fontSize: 12, color: parseFloat(diff) > 0 ? "#3BBFA3" : parseFloat(diff) < 0 ? "#F47C9A" : "#7A8299" }}>
                        {parseFloat(diff) > 0 ? "▲" : "▼"} {Math.abs(Number(diff))}점
                      </span>}
                    </div>
                    {sc1 && <div className="bar-wrap">
                      <span style={{ fontSize: 11, color: "#4A90D9", width: 24 }}>1차</span>
                      <div style={{ flex: 1, background: "#E8EAF0", borderRadius: 999, height: 10, overflow: "hidden" }}>
                        <div className="bar" style={{ width: `${(sc1 / 5) * 100}%`, background: "#4A90D9" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#4A90D9", width: 28 }}>{sc1}</span>
                    </div>}
                    {sc2 && <div className="bar-wrap">
                      <span style={{ fontSize: 11, color: "#3BBFA3", width: 24 }}>2차</span>
                      <div style={{ flex: 1, background: "#E8EAF0", borderRadius: 999, height: 10, overflow: "hidden" }}>
                        <div className="bar" style={{ width: `${(sc2 / 5) * 100}%`, background: "#3BBFA3" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#3BBFA3", width: 28 }}>{sc2}</span>
                    </div>}
                  </div>
                );
              })}
            </div>
            {/* 자유서술 비교 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[s1, s2].map((sv, idx) => sv && (
                <div key={idx} className="card fu">
                  <h4 style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: idx === 0 ? "#4A90D9" : "#3BBFA3" }}>
                    {idx === 0 ? "🌱 1차" : "🌻 2차"}
                  </h4>
                  {SECTIONS.flatMap(sec =>
                    sec.questions.filter(q => q.type === "text" || q.type === "mood").map(q => {
                      const a = sv.answers?.[q.id];
                      return a ? (
                        <div key={q.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #E8EAF0" }}>
                          <p style={{ fontSize: 10, color: "#7A8299", marginBottom: 3 }}>{q.label}</p>
                          <p style={{ fontSize: 12, lineHeight: 1.7, color: "#3D4461" }}
                            dangerouslySetInnerHTML={{ __html: highlight(String(a)) }} />
                        </div>
                      ) : null;
                    })
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* AI 분석 탭 */}
        {tab === "ai" && (
          <>
            {/* AI 분석 카드 */}
            <div className="card fu" style={{ marginBottom: 12, background: "linear-gradient(135deg,#EAF4FB,#D4F5EE)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🤖 AI 상담 분석</h3>
                  <p style={{ color: "#7A8299", fontSize: 13 }}>심리·불안·친구관계·자아상태 종합 분석{paired ? " + 1·2차 변화" : ""}</p>
                </div>
                <Btn onClick={genAI} disabled={aiLoad} color="blue">
                  {aiLoad ? <><div className="spinner" />분석 중...</> : "✨ AI 분석"}
                </Btn>
              </div>
            </div>

            {aiRes && !aiRes.error && (
              <div className="card fu" style={{ marginBottom: 12, border: "2px solid #D4EAFA" }}>
                {/* 수준 뱃지 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, background: "#F6F7FA", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                  <LvBadge label="불안 수준" level={aiRes.anxietyLevel} />
                  <LvBadge label="친구관계" level={aiRes.friendshipLevel} />
                  <LvBadge label="자아상태" level={aiRes.selfLevel} />
                </div>
                <div style={{ background: "#EAF4FB", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#7A8299", marginBottom: 4 }}>📌 상담 요약</p>
                  <p style={{ fontSize: 13, lineHeight: 1.9 }}>{aiRes.summary}</p>
                </div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#7A8299", marginBottom: 8 }}>🎯 상담 포인트</p>
                {aiRes.points?.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{
                      background: "#4A90D9", color: "#fff", borderRadius: 999,
                      width: 22, height: 22, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>{i + 1}</div>
                    <p style={{ fontSize: 13, lineHeight: 1.7, paddingTop: 2 }}>{p}</p>
                  </div>
                ))}
                {paired && aiRes.changeNote && (
                  <div style={{ background: "#E0FAF7", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#2EC4B6", marginBottom: 4 }}>↔ 변화 분석</p>
                    <p style={{ fontSize: 13, lineHeight: 1.8 }}>{aiRes.changeNote}</p>
                  </div>
                )}
                <div style={{ background: "#D4F5EE", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1a8a74", marginBottom: 4 }}>💚 학부모 전달 메시지</p>
                  <p style={{ fontSize: 13, lineHeight: 1.9, color: "#3D4461" }}>{aiRes.positiveMessage}</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {aiRes.flagKeywords?.map(k => <Tag key={k} color="rose">⚠️ {k}</Tag>)}
                  {aiRes.strengthKeywords?.map(k => <Tag key={k} color="yellow">⭐ {k}</Tag>)}
                </div>
              </div>
            )}
            {aiRes?.error && (
              <div className="card fu" style={{ color: "#F47C9A", fontSize: 13 }}>{aiRes.error}</div>
            )}

            {/* 스크립트 카드 */}
            <div className="card fu" style={{ marginBottom: 12, background: "linear-gradient(135deg,#EDE7FF,#FFEBF2)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>📝 상담 스크립트</h3>
                  <p style={{ color: "#7A8299", fontSize: 13 }}>학부모 상담에 바로 사용 가능</p>
                </div>
                <Btn onClick={genScript} disabled={scrLoad} color="purple">
                  {scrLoad ? <><div className="spinner" />생성 중...</> : "📜 스크립트"}
                </Btn>
              </div>
            </div>
            {script && !script.error && (
              <div className="card fu" style={{ border: "2px solid #EDE7FF" }}>
                {[
                  { label: "🌸 시작 인사", key: "opening",      bg: "#EAF4FB" },
                  { label: "⭐ 강점 & 칭찬", key: "strengths",   bg: "#FFF7E0" },
                  { label: "💪 개선 & 지원", key: "improvements", bg: "#FFEEE8" },
                  { label: "🤝 마무리",      key: "closing",     bg: "#D4F5EE" },
                ].map(({ label, key, bg }) => (
                  <div key={key} style={{ background: bg, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#7A8299", marginBottom: 4 }}>{label}</p>
                    <p style={{ fontSize: 13, lineHeight: 1.9, color: "#3D4461" }}>{script[key]}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   앱 루트
══════════════════════════════════════════════════════ */
export default function App() {
  const [view, setView]     = useState("home");
  const [selected, setSel]  = useState(null);
  const [allSurveys, setAll] = useState([]);

  return (
    <>
      {view === "home"    && <HomePage onStudent={() => setView("survey")} onTeacher={() => setView("login")} />}
      {view === "survey"  && <StudentSurvey onBack={() => setView("home")} />}
      {view === "login"   && <TeacherLogin onLogin={() => setView("dashboard")} onBack={() => setView("home")} />}
      {view === "dashboard" && (
        <Dashboard
          onBack={() => setView("home")}
          onLogout={() => setView("home")}
          onSelect={(s, all) => { setSel(s); setAll(all); setView("detail"); }}
        />
      )}
      {view === "detail" && selected && (
        <StudentDetail survey={selected} allSurveys={allSurveys} onBack={() => setView("dashboard")} />
      )}
    </>
  );
}
