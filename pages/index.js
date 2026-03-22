// pages/index.js  ── 학년도·학년·반·담임 다중 클래스 지원 버전
import { useState, useEffect, useRef } from "react";
import {
  saveTeacher, getTeacher, getAllTeachers, getTeachersByGrade,
  saveSurvey, getSurveysByClass, getSurveysByGrade,
} from "../lib/firebase";

/* ══════════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════════ */
const GS = () => (
  <style global jsx>{`
    @import url('https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    :root {
      --blue:#4A90D9; --blue-dk:#2C6FAC; --blue-lt:#EAF4FB; --blue-2:#D4EAFA;
      --mint:#3BBFA3; --mint-lt:#D4F5EE;
      --peach:#FF8C69; --peach-lt:#FFEEE8;
      --yellow:#FFD166; --yellow-lt:#FFF7E0;
      --purple:#9B7FD4; --purple-lt:#EDE7FF;
      --rose:#F47C9A; --rose-lt:#FFEBF2;
      --teal:#2EC4B6; --teal-lt:#E0FAF7;
      --g100:#F6F7FA; --g200:#E8EAF0; --g300:#C8CDD8;
      --g500:#7A8299; --g700:#3D4461; --g900:#1A1F36; --w:#FFFFFF;
      --sh-sm:0 2px 8px rgba(74,144,217,.10);
      --sh-md:0 4px 20px rgba(74,144,217,.15);
      --sh-lg:0 8px 40px rgba(74,144,217,.22);
      --r-sm:12px; --r-md:18px; --r-lg:28px;
    }
    body { font-family:'Noto Sans KR',sans-serif; background:var(--blue-lt); color:var(--g900); min-height:100vh; -webkit-font-smoothing:antialiased; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin   { to{transform:rotate(360deg)} }
    .fu  { animation:fadeUp .4s ease both }
    .fu1 { animation:fadeUp .4s .08s ease both }
    .fu2 { animation:fadeUp .4s .16s ease both }
    .card { background:var(--w); border-radius:var(--r-md); padding:24px; box-shadow:var(--sh-sm); }
    .lift { transition:transform .2s,box-shadow .2s; cursor:pointer; }
    .lift:hover { transform:translateY(-4px); box-shadow:var(--sh-lg)!important; }
    textarea, input[type=text], input[type=password], select {
      font-family:'Noto Sans KR',sans-serif; font-size:15px; color:var(--g900);
      border:2px solid var(--g200); border-radius:var(--r-sm); padding:12px 16px;
      width:100%; outline:none; transition:border-color .2s,box-shadow .2s;
      background:var(--w); appearance:none;
    }
    textarea { resize:vertical; }
    textarea:focus, input:focus, select:focus { border-color:var(--blue); box-shadow:0 0 0 3px rgba(74,144,217,.15); }
    .spinner { width:20px; height:20px; border:3px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .8s linear infinite; flex-shrink:0; }
    .kw-alert    { background:#FFE5E5; color:#c0325a; border-radius:4px; padding:1px 4px; font-weight:700; }
    .kw-strength { background:#FFF7E0; color:#b8860b; border-radius:4px; padding:1px 4px; font-weight:700; }
    .lk-btn { border:2px solid var(--g200); background:var(--g100); border-radius:10px; padding:10px 4px; cursor:pointer; font-size:12px; font-family:'Noto Sans KR'; font-weight:500; transition:all .18s; color:var(--g700); text-align:center; width:100%; }
    .lk-btn.on { background:var(--blue-lt); border-color:var(--blue); color:var(--blue-dk); font-weight:700; }
    .mood-btn { border:2px solid var(--g200); background:var(--g100); border-radius:var(--r-sm); padding:12px 8px; cursor:pointer; font-size:14px; font-family:'Noto Sans KR'; transition:all .18s; color:var(--g900); text-align:center; width:100%; }
    .mood-btn.on { background:var(--blue-lt); border-color:var(--blue); font-weight:700; }
    .tab-btn { padding:8px 14px; border:2px solid var(--g200); border-radius:var(--r-sm); cursor:pointer; font-family:'Noto Sans KR'; font-weight:400; font-size:13px; transition:all .18s; background:transparent; color:var(--g500); }
    .tab-btn.on { background:var(--blue-lt); color:var(--blue-dk); font-weight:700; border-color:var(--blue); }
    .sel-btn { border:2px solid var(--g200); background:var(--g100); border-radius:var(--r-sm); padding:12px 16px; cursor:pointer; font-family:'Noto Sans KR'; font-size:14px; transition:all .18s; color:var(--g900); text-align:center; width:100%; }
    .sel-btn.on { background:var(--blue-lt); border-color:var(--blue); font-weight:700; color:var(--blue-dk); }
    .bar-wrap { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
    .bar { height:10px; border-radius:999px; transition:width .6s ease; }
  `}</style>
);

/* ══════════════════════════════════════════════════════
   SURVEY SCHEMA
══════════════════════════════════════════════════════ */
const SECTIONS = [
  { id:"emotions", emoji:"💛", title:"감정 & 심리 상태", desc:"요즘 내 마음이 어떤지 솔직하게 표시해 주세요", color:"--peach", light:"--peach-lt",
    questions:[
      { id:"e1", type:"mood", label:"요즘 전반적으로 기분이 어떤가요?", options:["😄 매우 행복해요","😊 괜찮아요","😐 그냥 그래요","😔 좀 우울해요","😢 많이 힘들어요"] },
      { id:"e2", type:"likert5", label:"나는 학교 생활이 즐겁다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"e3", type:"likert5", label:"나는 아침에 학교 가기 싫다고 느끼는 편이다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"e4", type:"likert5", label:"나는 감정을 조절하는 것이 어렵다고 느낀다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"e5", type:"text", label:"요즘 가장 많이 느끼는 감정은 무엇이고, 그 이유는 무엇인가요?" },
    ],
  },
  { id:"anxiety", emoji:"😰", title:"불안 & 걱정", desc:"해당하는 정도를 솔직하게 표시해 주세요", color:"--purple", light:"--purple-lt",
    questions:[
      { id:"a1", type:"likert5", label:"나는 시험이나 발표가 다가오면 많이 걱정된다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"a2", type:"likert5", label:"나는 밤에 걱정 때문에 잠을 잘 못 잔다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"a3", type:"likert5", label:"나는 실수하거나 틀릴까봐 불안하다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"a4", type:"likert5", label:"나는 친구나 선생님이 나를 어떻게 볼지 신경이 쓰인다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"a5", type:"likert5", label:"나는 중학교 진학이 걱정된다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"a6", type:"text", label:"요즘 제일 걱정되거나 불안한 것이 있다면 무엇인가요?" },
    ],
  },
  { id:"friendship", emoji:"🤝", title:"친구 관계", desc:"학교에서의 친구 관계에 대해 솔직하게 알려주세요", color:"--mint", light:"--mint-lt",
    questions:[
      { id:"f1", type:"likert5", label:"나는 학교에 친한 친구가 있다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"f2", type:"likert5", label:"나는 어려운 일이 생기면 친구에게 도움을 요청할 수 있다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"f3", type:"likert5", label:"나는 쉬는 시간이나 점심에 혼자 있는 편이다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"f4", type:"likert5", label:"나는 친구들 사이에서 소외된다고 느낀다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"f5", type:"likert5", label:"나는 친구와 갈등이 생기면 잘 해결할 수 있다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"f6", type:"mood", label:"지금 우리 반 분위기를 한 마디로 표현하면?", options:["🌈 매우 화목해요","😊 괜찮아요","😐 그냥 그래요","😬 불편한 편이에요","😤 사이가 안 좋아요"] },
      { id:"f7", type:"text", label:"친구 관계에서 힘들었던 점이나 선생님께 알리고 싶은 것이 있나요?" },
    ],
  },
  { id:"selfconcept", emoji:"🌟", title:"나 자신 (자아상태)", desc:"나에 대해 어떻게 생각하는지 알려주세요", color:"--yellow", light:"--yellow-lt",
    questions:[
      { id:"s1", type:"likert5", label:"나는 나 자신이 괜찮은 사람이라고 생각한다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"s2", type:"likert5", label:"나는 어려운 문제가 생겨도 해결할 수 있다고 믿는다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"s3", type:"likert5", label:"나는 내 외모나 몸이 마음에 든다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"s4", type:"likert5", label:"나는 다른 친구들보다 내가 부족하다고 느낀다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"s5", type:"likert5", label:"나는 내가 하고 싶은 것이 무엇인지 알고 있다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"s6", type:"text", label:"내가 스스로 자랑스럽거나 잘한다고 생각하는 것은 무엇인가요?" },
      { id:"s7", type:"text", label:"내가 고치고 싶거나 더 발전시키고 싶은 점이 있다면 무엇인가요?" },
    ],
  },
  { id:"learning", emoji:"📚", title:"학습 & 학교생활", desc:"공부와 학교생활에 대해 알려주세요", color:"--blue", light:"--blue-lt",
    questions:[
      { id:"l1", type:"likert5", label:"나는 수업 시간에 집중이 잘 된다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"l2", type:"likert5", label:"나는 숙제나 과제를 스스로 잘 한다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"l3", type:"likert5", label:"나는 공부하는 것이 즐겁다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"l4", type:"text", label:"제일 좋아하는 과목과 그 이유는 무엇인가요?" },
      { id:"l5", type:"text", label:"제일 어렵고 힘든 과목과 그 이유는 무엇인가요?" },
      { id:"l6", type:"text", label:"집에서 공부하는 방법이나 학습 습관을 알려주세요" },
    ],
  },
  { id:"growth", emoji:"🚀", title:"성장 & 미래", desc:"앞으로의 나에 대해 생각해 봐요", color:"--teal", light:"--teal-lt",
    questions:[
      { id:"g1", type:"likert5", label:"나는 중학교에 가면 잘 적응할 수 있을 것 같다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"g2", type:"likert5", label:"나는 내 미래에 대해 긍정적으로 생각한다", anchors:["전혀 그렇지 않다","매우 그렇다"] },
      { id:"g3", type:"text", label:"중학교에서 꼭 해보고 싶은 것이 있나요?" },
      { id:"g4", type:"text", label:"선생님께 따로 하고 싶은 말이나 부탁이 있다면 자유롭게 써주세요 😊" },
    ],
  },
];

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
const YEARS  = [2026, 2027, 2028];
const GRADES = [1, 2, 3, 4, 5, 6];
const CLASS_NUMS = [1, 2, 3, 4, 5, 6, 7, 8]; // 1반~8반 고정

const FLAG_KW = ["스트레스","걱정","불안","힘들","외로","혼자","포기","무섭","슬퍼","다퉜","속상","싸움","왕따","때려","맞았","싫어"];
const STR_KW  = ["잘해요","뿌듯","자랑","좋아요","행복","즐거","자신있","재미있"];

function highlight(text) {
  if (!text) return String(text || "");
  let r = String(text);
  FLAG_KW.forEach(k => { r = r.replace(new RegExp(k, "g"), `<mark class="kw-alert">${k}</mark>`); });
  STR_KW.forEach(k  => { r = r.replace(new RegExp(k, "g"), `<mark class="kw-strength">${k}</mark>`); });
  return r;
}
function hasFlag(s) {
  const all = Object.values(s.answers || {}).map(v => typeof v === "string" ? v : v?.reason || "").join(" ");
  return FLAG_KW.some(k => all.includes(k));
}
function sectionAvg(survey, secId) {
  const sec = SECTIONS.find(s => s.id === secId);
  if (!sec) return null;
  const vals = sec.questions.filter(q => q.type === "likert5").map(q => parseInt(survey.answers?.[q.id]) || 0).filter(v => v > 0);
  if (!vals.length) return null;
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

/* ══════════════════════════════════════════════════════
   SHARED UI
══════════════════════════════════════════════════════ */
const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, style = {} }) => {
  const V = {
    primary: { background:"var(--blue)",   color:"#fff", boxShadow:"0 4px 14px rgba(74,144,217,.35)" },
    mint:    { background:"var(--mint)",   color:"#fff", boxShadow:"0 4px 14px rgba(59,191,163,.35)" },
    purple:  { background:"var(--purple)", color:"#fff", boxShadow:"0 4px 14px rgba(155,127,212,.35)" },
    teal:    { background:"var(--teal)",   color:"#fff", boxShadow:"0 4px 14px rgba(46,196,182,.35)" },
    rose:    { background:"var(--rose)",   color:"#fff", boxShadow:"0 4px 14px rgba(244,124,154,.35)" },
    yellow:  { background:"var(--yellow)", color:"#fff", boxShadow:"0 4px 14px rgba(255,209,102,.35)" },
    ghost:   { background:"var(--g100)",   color:"var(--g700)" },
  };
  const Z = { sm:{padding:"8px 16px",fontSize:13}, md:{padding:"12px 22px",fontSize:15}, lg:{padding:"15px 30px",fontSize:16} };
  return <button onClick={onClick} disabled={disabled} style={{ border:"none", cursor:disabled?"not-allowed":"pointer", fontFamily:"'Noto Sans KR',sans-serif", fontWeight:700, borderRadius:"var(--r-sm)", transition:"all .2s", opacity:disabled?.5:1, display:"inline-flex", alignItems:"center", gap:8, ...Z[size], ...V[variant], ...style }}>{children}</button>;
};

const Tag = ({ children, color = "blue" }) => {
  const C = { blue:{bg:"var(--blue-lt)",color:"var(--blue-dk)"}, mint:{bg:"var(--mint-lt)",color:"#1a8a74"}, rose:{bg:"var(--rose-lt)",color:"#c0325a"}, yellow:{bg:"var(--yellow-lt)",color:"#b8860b"}, purple:{bg:"var(--purple-lt)",color:"#6a4db8"}, teal:{bg:"var(--teal-lt)",color:"#1a7a72"}, gray:{bg:"var(--g200)",color:"var(--g700)"} };
  return <span style={{ background:C[color].bg, color:C[color].color, padding:"4px 12px", borderRadius:999, fontSize:12, fontWeight:700, display:"inline-block" }}>{children}</span>;
};

const Label = ({ children, required }) => (
  <label style={{ fontWeight:700, fontSize:14, display:"block", marginBottom:8, color:"var(--g700)" }}>
    {children}{required && <span style={{ color:"var(--rose)", marginLeft:4 }}>*</span>}
  </label>
);

const Likert5 = ({ value, onChange, anchors }) => (
  <div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" className={`lk-btn${value === n ? " on" : ""}`} onClick={() => onChange(n)}>
          <div style={{ fontSize:16, marginBottom:2 }}>{"①②③④⑤"[n-1]}</div>
          <div style={{ fontSize:11 }}>{n}점</div>
        </button>
      ))}
    </div>
    <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
      <span style={{ fontSize:10, color:"var(--g500)" }}>{anchors[0]}</span>
      <span style={{ fontSize:10, color:"var(--g500)" }}>{anchors[1]}</span>
    </div>
  </div>
);

const Field = ({ label, required, children }) => (
  <div style={{ marginBottom:18 }}>
    <Label required={required}>{label}</Label>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════ */
function HomePage({ onStudent, onTeacher }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, background:"linear-gradient(160deg,#EAF4FB 0%,#D4F5EE 100%)" }}>
      <div className="fu" style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ fontSize:64, marginBottom:10 }}>🏫</div>
        <h1 style={{ fontFamily:"'Gowun Dodum',sans-serif", fontSize:26, fontWeight:400, marginBottom:6 }}>학부모 상담 준비 시스템</h1>
        <p style={{ color:"var(--g500)", fontSize:14 }}>학년도 · 학년 · 반별 운영 · 1차/2차 비교 · AI 상담 분석</p>
      </div>

      <div className="fu1" style={{ display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center", maxWidth:520, width:"100%" }}>
        {[
          { emoji:"✏️", title:"학생 설문하기", desc:"내 마음과 생각을 솔직하게\n적어봐요 (약 7분)", tag:"약 7분", tc:"blue", onClick:onStudent, accent:"var(--blue)" },
          { emoji:"📋", title:"교사 대시보드", desc:"반별 설문 확인 및\nAI 상담 분석", tag:"교사 전용", tc:"mint", onClick:onTeacher, accent:"var(--mint)" },
        ].map(item => (
          <div key={item.title} className="lift" onClick={item.onClick}
            style={{ flex:1, minWidth:200, background:"var(--w)", borderRadius:"var(--r-lg)", padding:"32px 24px", textAlign:"center", boxShadow:"var(--sh-md)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>{item.emoji}</div>
            <h2 style={{ fontSize:17, fontWeight:700, marginBottom:8, color:item.accent }}>{item.title}</h2>
            <p style={{ color:"var(--g500)", fontSize:13, lineHeight:1.7, whiteSpace:"pre-line", marginBottom:14 }}>{item.desc}</p>
            <Tag color={item.tc}>{item.tag}</Tag>
          </div>
        ))}
      </div>

      <div className="fu2" style={{ marginTop:32, display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
        {SECTIONS.map(s => (
          <span key={s.id} style={{ background:"var(--w)", borderRadius:999, padding:"5px 12px", fontSize:12, color:"var(--g500)", boxShadow:"var(--sh-sm)" }}>{s.emoji} {s.title}</span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STUDENT SURVEY
══════════════════════════════════════════════════════ */
function StudentSurvey({ onBack }) {
  // step: "class" → -1(이름/차수) → 0..N(섹션) → done
  const [step, setStep]     = useState("class");
  const [classInfo, setCI]  = useState({ year: 2026, grade: 6, classNum: "" });
  const [teachers, setTeachers] = useState([]);
  const [teacherInfo, setTI] = useState(null); // 선택된 담임
  const [name, setName]     = useState("");
  const [term, setTerm]     = useState("1차");
  const [answers, setAns]   = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);
  const topRef = useRef(null);
  const total  = SECTIONS.length;

  // 학년 선택 시 해당 학년 담임 목록 로드
  useEffect(() => {
    if (classInfo.year && classInfo.grade) {
      getAllTeachers(classInfo.year).then(list => {
        setTeachers(list.filter(t => t.grade === Number(classInfo.grade)));
        setTI(null);
        setCI(ci => ({ ...ci, classNum: "" }));
      });
    }
  }, [classInfo.year, classInfo.grade]);

  useEffect(() => { topRef.current?.scrollTo({ top:0, behavior:"smooth" }); }, [step]);

  const set = (qid, val) => setAns(a => ({ ...a, [qid]: val }));

  const canNextClass = () => !!classInfo.classNum;

  const canNextSection = () => {
    if (step === -1) return name.trim().length > 0;
    return SECTIONS[step].questions.every(q => {
      const v = answers[q.id];
      if (q.type === "likert5") return !!v;
      if (q.type === "mood")    return !!v;
      return v && String(v).trim().length > 0;
    });
  };

  const handleClassNext = () => {
    setTI(null); // Firebase 담임 연결 없이 직접 선택
    setStep(-1);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await saveSurvey({
        name: name.trim(), term,
        year:      classInfo.year,
        grade:     classInfo.grade,
        classNum:  Number(classInfo.classNum),
        teacherId: teacherInfo?.id || "",
        teacherName: teacherInfo?.teacherName || "",
        submittedAt: new Date().toLocaleString("ko-KR"),
        answers,
      });
      setDone(true);
    } catch (e) { alert("저장 오류: " + e.message); }
    setSaving(false);
  };

  if (done) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#EAF4FB,#D4F5EE)", padding:24 }}>
      <div className="fu" style={{ textAlign:"center", maxWidth:380 }}>
        <div style={{ fontSize:80, marginBottom:18 }}>🎉</div>
        <h2 style={{ fontFamily:"'Gowun Dodum'", fontSize:26, marginBottom:10 }}>설문 완성!</h2>
        <p style={{ color:"var(--g500)", lineHeight:1.9, marginBottom:10 }}>
          <strong>{classInfo.year}학년도 {classInfo.grade}학년 {classInfo.classNum}반</strong><br />
          {name} 학생
        </p>
        <p style={{ color:"var(--g500)", fontSize:14, marginBottom:28 }}>{term} 설문에 참여해줘서 고마워요 😊</p>
        <Btn onClick={onBack} variant="primary">처음 화면으로</Btn>
      </div>
    </div>
  );

  return (
    <div ref={topRef} style={{ minHeight:"100vh", background:"linear-gradient(160deg,#EAF4FB,#D4F5EE)", overflowY:"auto" }}>
      {/* header */}
      <div style={{ background:"var(--w)", padding:"14px 18px", boxShadow:"var(--sh-sm)", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ maxWidth:620, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: typeof step === "number" && step >= 0 ? 10 : 0 }}>
            <button onClick={() => step === "class" ? onBack() : step === -1 ? setStep("class") : step === 0 ? setStep(-1) : setStep(s => s - 1)}
              style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"var(--g500)" }}>←</button>
            <span style={{ fontWeight:700, color:"var(--g700)" }}>학생 설문</span>
            {typeof step === "number" && step >= 0 && (
              <><Tag color={term === "1차" ? "blue" : "mint"}>{term}</Tag>
              <span style={{ marginLeft:"auto", fontSize:13, color:"var(--g500)" }}>{step+1}/{total}</span></>
            )}
          </div>
          {typeof step === "number" && step >= 0 && (
            <div style={{ background:"var(--g200)", borderRadius:999, height:6, overflow:"hidden" }}>
              <div style={{ background:"linear-gradient(90deg,var(--blue),var(--mint))", height:"100%", width:`${Math.round(((step+1)/total)*100)}%`, transition:"width .4s", borderRadius:999 }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth:620, margin:"0 auto", padding:"22px 16px 72px" }}>

        {/* ─ 반 선택 ─ */}
        {step === "class" && (
          <div className="fu">
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ fontSize:48, marginBottom:8 }}>🏫</div>
                <h2 style={{ fontFamily:"'Gowun Dodum'", fontSize:22, marginBottom:6 }}>내 반을 선택해주세요</h2>
                <p style={{ color:"var(--g500)", fontSize:13 }}>잘못 선택하면 선생님이 못 찾아요!</p>
              </div>

              <Field label="학년도" required>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {YEARS.map(y => (
                    <button key={y} type="button" className={`sel-btn${classInfo.year === y ? " on" : ""}`}
                      onClick={() => setCI(c => ({ ...c, year:y }))}>📅 {y}학년도</button>
                  ))}
                </div>
              </Field>

              <Field label="학년" required>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:6 }}>
                  {GRADES.map(g => (
                    <button key={g} type="button" className={`sel-btn${classInfo.grade === g ? " on" : ""}`}
                      onClick={() => setCI(c => ({ ...c, grade:g, classNum:"" }))}>{g}학년</button>
                  ))}
                </div>
              </Field>

              <Field label="반" required>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                  {CLASS_NUMS.map(n => (
                    <button key={n} type="button"
                      className={`sel-btn${classInfo.classNum === String(n) ? " on" : ""}`}
                      onClick={() => setCI(c => ({ ...c, classNum: String(n) }))}>
                      <div style={{ fontWeight:700, fontSize:16 }}>{n}반</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Btn onClick={handleClassNext} disabled={!canNextClass()} variant="primary" size="lg" style={{ width:"100%", justifyContent:"center" }}>
                다음 →
              </Btn>
            </div>
          </div>
        )}

        {/* ─ 이름 & 차수 ─ */}
        {step === -1 && (
          <div className="fu">
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ background:"var(--blue-lt)", borderRadius:"var(--r-sm)", padding:"10px 14px", marginBottom:20, fontSize:13 }}>
                📌 {classInfo.year}학년도 {classInfo.grade}학년 {classInfo.classNum}반
              </div>
              <div style={{ textAlign:"center", marginBottom:22 }}>
                <div style={{ fontSize:48, marginBottom:8 }}>👋</div>
                <h2 style={{ fontFamily:"'Gowun Dodum'", fontSize:22, marginBottom:6 }}>안녕하세요!</h2>
                <p style={{ color:"var(--g500)", fontSize:13, lineHeight:1.8 }}>솔직하게 적어줄수록 더 좋은 상담이 돼요 😊</p>
              </div>

              <Field label="이름" required>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && name.trim() && setStep(0)}
                  placeholder="예) 김민준" />
              </Field>

              <Field label="검사 차수" required>
                <div style={{ display:"flex", gap:10 }}>
                  {["1차","2차"].map(t => (
                    <button key={t} type="button" className={`sel-btn${term === t ? " on" : ""}`} onClick={() => setTerm(t)}>
                      {t === "1차" ? "🌱 1차 (1학기)" : "🌻 2차 (2학기)"}
                    </button>
                  ))}
                </div>
              </Field>

              <Btn onClick={() => setStep(0)} disabled={!name.trim()} variant="primary" size="lg" style={{ width:"100%", justifyContent:"center" }}>
                설문 시작하기 🚀
              </Btn>
            </div>
          </div>
        )}

        {/* ─ 설문 섹션 ─ */}
        {typeof step === "number" && step >= 0 && (
          <div className="fu">
            <div style={{ textAlign:"center", marginBottom:18 }}>
              <div style={{ fontSize:48, marginBottom:6 }}>{SECTIONS[step].emoji}</div>
              <h2 style={{ fontFamily:"'Gowun Dodum'", fontSize:22, marginBottom:4 }}>{SECTIONS[step].title}</h2>
              <p style={{ color:"var(--g500)", fontSize:13 }}>{SECTIONS[step].desc}</p>
            </div>
            {SECTIONS[step].questions.map((q, i) => (
              <div key={q.id} className="card" style={{ marginBottom:14 }}>
                <p style={{ fontWeight:600, fontSize:14, lineHeight:1.7, marginBottom:14, color:"var(--g700)" }}>
                  <span style={{ background:`var(${SECTIONS[step].light})`, borderRadius:999, padding:"2px 9px", fontSize:10, fontWeight:700, marginRight:8 }}>Q{i+1}</span>
                  {q.label}
                </p>
                {q.type === "text" && <textarea rows={3} placeholder="여기에 적어주세요..." value={answers[q.id]||""} onChange={e => set(q.id, e.target.value)} />}
                {q.type === "likert5" && <Likert5 value={answers[q.id]} onChange={v => set(q.id, v)} anchors={q.anchors} />}
                {q.type === "mood" && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {q.options.map(opt => <button key={opt} type="button" className={`mood-btn${answers[q.id]===opt?" on":""}`} onClick={() => set(q.id,opt)}>{opt}</button>)}
                  </div>
                )}
              </div>
            ))}
            <div style={{ display:"flex", gap:10, marginTop:6 }}>
              <Btn onClick={() => step===0?setStep(-1):setStep(s=>s-1)} variant="ghost" size="lg" style={{ flex:1, justifyContent:"center" }}>← 이전</Btn>
              <Btn onClick={() => step<total-1?setStep(s=>s+1):submit()} disabled={!canNextSection()||saving}
                variant={step===total-1?"mint":"primary"} size="lg" style={{ flex:2, justifyContent:"center" }}>
                {saving?<><div className="spinner"/>저장 중...</>:step===total-1?"✅ 제출하기":"다음 →"}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TEACHER SETUP / LOGIN
══════════════════════════════════════════════════════ */
function TeacherLogin({ onLogin, onBack }) {
  const [tab, setTab]         = useState("login"); // login | setup
  // login
  const [year, setYear]       = useState(CURRENT_YEAR);
  const [grade, setGrade]     = useState(6);
  const [classNum, setClass]  = useState("");
  const [pw, setPw]           = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);
  // setup
  const [sYear, setSYear]     = useState(CURRENT_YEAR);
  const [sGrade, setSGrade]   = useState(6);
  const [sClass, setSClass]   = useState("");
  const [sName, setSName]     = useState("");
  const [sPw, setSPw]         = useState("");
  const [sConfirm, setSConfirm] = useState("");
  const [sErr, setSErr]       = useState("");
  const [sLoading, setSLoading] = useState(false);
  const [sOk, setSOk]         = useState(false);

  const doLogin = async () => {
    if (!classNum) { setErr("반을 입력해주세요."); return; }
    setLoading(true); setErr("");
    try {
      const t = await getTeacher(year, grade, Number(classNum));
      if (!t) { setErr("등록된 정보가 없습니다. 먼저 담임 등록을 해주세요."); }
      else if (t.password !== pw) { setErr("비밀번호가 맞지 않아요."); }
      else { onLogin(t); }
    } catch { setErr("Firebase 연결 오류. 설정을 확인해주세요."); }
    setLoading(false);
  };

  const doSetup = async () => {
    if (!sClass || !sName || !sPw) { setSErr("모든 항목을 입력해주세요."); return; }
    if (sPw !== sConfirm) { setSErr("비밀번호가 일치하지 않아요."); return; }
    if (sPw.length < 4)   { setSErr("비밀번호는 4자 이상으로 설정해주세요."); return; }
    setSLoading(true); setSErr("");
    try {
      await saveTeacher({ year:sYear, grade:sGrade, classNum:Number(sClass), teacherName:sName, password:sPw });
      setSOk(true);
    } catch (e) { setSErr("저장 오류: " + e.message); }
    setSLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#EAF4FB,#D4F5EE)", padding:24 }}>
      <div className="fu" style={{ maxWidth:420, width:"100%" }}>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🔐</div>
          <h2 style={{ fontFamily:"'Gowun Dodum'", fontSize:22 }}>교사 로그인</h2>
        </div>

        {/* Tab */}
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          <button className={`tab-btn${tab==="login"?" on":""}`} onClick={()=>setTab("login")} style={{ flex:1, textAlign:"center" }}>🔑 로그인</button>
          <button className={`tab-btn${tab==="setup"?" on":""}`} onClick={()=>setTab("setup")} style={{ flex:1, textAlign:"center" }}>✏️ 담임 등록</button>
        </div>

        {/* ─ 로그인 탭 ─ */}
        {tab === "login" && (
          <div className="card">
            <Field label="학년도" required>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {YEARS.map(y=><button key={y} type="button" className={`sel-btn${year===y?" on":""}`} onClick={()=>setYear(y)}>{y}학년도</button>)}
              </div>
            </Field>
            <Field label="학년" required>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:6 }}>
                {GRADES.map(g=><button key={g} type="button" className={`sel-btn${grade===g?" on":""}`} onClick={()=>setGrade(g)}>{g}학년</button>)}
              </div>
            </Field>
            <Field label="반" required>
              <input type="text" value={classNum} onChange={e=>setClass(e.target.value)} placeholder="예) 2" style={{ marginBottom:0 }} />
            </Field>
            <Field label="비밀번호" required>
              <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="등록 시 설정한 비밀번호" />
            </Field>
            {err && <p style={{ color:"var(--rose)", fontSize:13, marginBottom:12 }}>{err}</p>}
            <div style={{ display:"flex", gap:10 }}>
              <Btn onClick={onBack} variant="ghost" style={{ flex:1, justifyContent:"center" }}>취소</Btn>
              <Btn onClick={doLogin} disabled={loading} variant="mint" style={{ flex:2, justifyContent:"center" }}>
                {loading?<><div className="spinner"/>확인 중...</>:"로그인"}
              </Btn>
            </div>
          </div>
        )}

        {/* ─ 담임 등록 탭 ─ */}
        {tab === "setup" && (
          <div className="card">
            {sOk ? (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:60, marginBottom:14 }}>✅</div>
                <h3 style={{ fontSize:18, marginBottom:8 }}>담임 등록 완료!</h3>
                <p style={{ color:"var(--g500)", fontSize:14, marginBottom:20, lineHeight:1.8 }}>
                  {sYear}학년도 {sGrade}학년 {sClass}반<br/>{sName} 선생님
                </p>
                <Btn onClick={()=>{setSOk(false);setTab("login");}} variant="mint" style={{ justifyContent:"center" }}>로그인 하러 가기</Btn>
              </div>
            ) : (
              <>
                <p style={{ fontSize:13, color:"var(--g500)", marginBottom:18, lineHeight:1.7, background:"var(--blue-lt)", padding:"10px 14px", borderRadius:"var(--r-sm)" }}>
                  ℹ️ 처음 사용하거나 새 학년도 시작 시 담임 정보를 등록해주세요.<br/>같은 학년 선생님들이 각자 등록하면 학년 전체 현황도 볼 수 있어요.
                </p>
                <Field label="학년도" required>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {YEARS.map(y=><button key={y} type="button" className={`sel-btn${sYear===y?" on":""}`} onClick={()=>setSYear(y)}>{y}학년도</button>)}
                  </div>
                </Field>
                <Field label="학년" required>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:6 }}>
                    {GRADES.map(g=><button key={g} type="button" className={`sel-btn${sGrade===g?" on":""}`} onClick={()=>setSGrade(g)}>{g}학년</button>)}
                  </div>
                </Field>
                <Field label="반" required>
                  <input type="text" value={sClass} onChange={e=>setSClass(e.target.value)} placeholder="예) 3" />
                </Field>
                <Field label="담임 이름" required>
                  <input type="text" value={sName} onChange={e=>setSName(e.target.value)} placeholder="예) 김민서" />
                </Field>
                <Field label="비밀번호 설정 (4자 이상)" required>
                  <input type="password" value={sPw} onChange={e=>{setSPw(e.target.value);setSErr("");}} placeholder="본인만 아는 비밀번호" />
                </Field>
                <Field label="비밀번호 확인" required>
                  <input type="password" value={sConfirm} onChange={e=>setSConfirm(e.target.value)} placeholder="동일하게 입력" />
                </Field>
                {sErr && <p style={{ color:"var(--rose)", fontSize:13, marginBottom:12 }}>{sErr}</p>}
                <div style={{ display:"flex", gap:10 }}>
                  <Btn onClick={onBack} variant="ghost" style={{ flex:1, justifyContent:"center" }}>취소</Btn>
                  <Btn onClick={doSetup} disabled={sLoading} variant="primary" style={{ flex:2, justifyContent:"center" }}>
                    {sLoading?<><div className="spinner"/>저장 중...</>:"담임 등록"}
                  </Btn>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TEACHER DASHBOARD
══════════════════════════════════════════════════════ */
function TeacherDashboard({ teacher, onBack, onSelect, onLogout }) {
  const [surveys, setSurveys]   = useState([]);
  const [gradeSurveys, setGS]   = useState([]);
  const [gradeTeachers, setGT]  = useState([]);
  const [loading, setLoading]   = useState(true);
  const [viewMode, setViewMode] = useState("myClass"); // myClass | grade
  const [search, setSearch]     = useState("");
  const [filterTerm, setFilter] = useState("전체");
  const [filterClass, setFC]    = useState("전체");

  useEffect(() => {
    Promise.all([
      getSurveysByClass(teacher.year, teacher.grade, teacher.classNum),
      getSurveysByGrade(teacher.year, teacher.grade),
      getTeachersByGrade(teacher.year, teacher.grade),
    ]).then(([mine, grade, teachers]) => {
      setSurveys(mine);
      setGS(grade);
      setGT(teachers);
      setLoading(false);
    }).catch(e => { alert("불러오기 오류: " + e.message); setLoading(false); });
  }, [teacher]);

  const display = viewMode === "myClass" ? surveys : gradeSurveys;
  const byName  = {};
  display.forEach(s => { if (!byName[s.name]) byName[s.name]=[]; byName[s.name].push(s.term); });

  // unique class numbers in grade
  const classNums = [...new Set(gradeSurveys.map(s => s.classNum))].sort();

  const filtered = display.filter(s =>
    s.name.includes(search) &&
    (filterTerm === "전체" || s.term === filterTerm) &&
    (viewMode === "myClass" || filterClass === "전체" || s.classNum === Number(filterClass))
  );
  const flagCount = display.filter(hasFlag).length;

  // Grade stats
  const gradeStats = gradeTeachers.map(t => {
    const cls = gradeSurveys.filter(s => s.classNum === t.classNum);
    return { ...t, count: cls.length, flagCount: cls.filter(hasFlag).length };
  });

  return (
    <div style={{ minHeight:"100vh", background:"var(--g100)" }}>
      {/* header */}
      <div style={{ background:"var(--w)", padding:"14px 18px", boxShadow:"var(--sh-sm)", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:10 }}>
            <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"var(--g500)" }}>←</button>
            <div>
              <h1 style={{ fontFamily:"'Gowun Dodum'", fontSize:18 }}>교사 대시보드</h1>
              <p style={{ fontSize:12, color:"var(--g500)" }}>
                {teacher.year}학년도 {teacher.grade}학년 {teacher.classNum}반 · {teacher.teacherName} 선생님
              </p>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
              <Tag color="blue">{display.length}건</Tag>
              {flagCount > 0 && <Tag color="rose">⚠️ {flagCount}명</Tag>}
              <button onClick={onLogout} style={{ background:"var(--g100)", border:"none", borderRadius:"var(--r-sm)", padding:"6px 12px", cursor:"pointer", fontSize:12, color:"var(--g500)" }}>로그아웃</button>
            </div>
          </div>
          {/* view mode tabs */}
          <div style={{ display:"flex", gap:6 }}>
            <button className={`tab-btn${viewMode==="myClass"?" on":""}`} onClick={()=>setViewMode("myClass")}>
              🏷️ 우리 반 ({surveys.length}명)
            </button>
            <button className={`tab-btn${viewMode==="grade"?" on":""}`} onClick={()=>setViewMode("grade")}>
              🏫 학년 전체 ({gradeSurveys.length}명)
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"18px 16px 60px" }}>

        {/* 학년 통계 요약 (학년 전체 탭에서만) */}
        {viewMode === "grade" && gradeStats.length > 0 && (
          <div className="card fu" style={{ marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>📊 {teacher.grade}학년 반별 현황</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
              {gradeStats.sort((a,b)=>a.classNum-b.classNum).map(t => (
                <div key={t.id} style={{ background: t.classNum===teacher.classNum?"var(--blue-lt)":"var(--g100)", borderRadius:"var(--r-sm)", padding:"12px 14px", border: t.classNum===teacher.classNum?"2px solid var(--blue)":"2px solid transparent" }}>
                  <p style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{t.classNum}반 {t.classNum===teacher.classNum?"(내 반)":""}</p>
                  <p style={{ fontSize:12, color:"var(--g500)", marginBottom:6 }}>{t.teacherName} 선생님</p>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <Tag color="blue">{t.count}명</Tag>
                    {t.flagCount>0&&<Tag color="rose">⚠️{t.flagCount}</Tag>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* filter bar */}
        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 이름 검색..." style={{ maxWidth:200, marginBottom:0 }} />
          {["전체","1차","2차"].map(t=>(
            <button key={t} className={`tab-btn${filterTerm===t?" on":""}`} onClick={()=>setFilter(t)}>{t}</button>
          ))}
          {viewMode === "grade" && ["전체",...classNums.map(String)].map(c=>(
            <button key={c} className={`tab-btn${filterClass===c?" on":""}`} onClick={()=>setFC(c)}>
              {c==="전체"?"전체 반":`${c}반`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card" style={{ textAlign:"center", padding:60 }}><div style={{ fontSize:40, marginBottom:12 }}>⏳</div><p style={{ color:"var(--g500)" }}>불러오는 중...</p></div>
        ) : filtered.length === 0 ? (
          <div className="card fu" style={{ textAlign:"center", padding:60 }}>
            <div style={{ fontSize:64, marginBottom:14 }}>📭</div>
            <h3 style={{ fontSize:18, marginBottom:8, color:"var(--g700)" }}>응답이 없어요</h3>
            <p style={{ color:"var(--g500)" }}>학생들이 설문을 제출하면 여기에 나타납니다</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:12 }}>
            {filtered.map(s => {
              const flagged = hasFlag(s);
              const hasBoth = byName[s.name]?.includes("1차") && byName[s.name]?.includes("2차");
              const moodVal = Object.values(s.answers||{}).find(v => typeof v==="string" && ["😄","😊","😐","😔","😢"].some(e=>v.startsWith(e)));
              return (
                <div key={s.id} className="lift card" onClick={()=>onSelect(s, surveys)}
                  style={{ border:flagged?"2px solid #FFE5E5":"2px solid transparent", animation:"fadeUp .4s ease both" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <span style={{ fontSize:32 }}>👤</span>
                    <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                      {flagged && <span style={{ fontSize:10, color:"var(--rose)", fontWeight:700, background:"var(--rose-lt)", borderRadius:999, padding:"2px 8px" }}>⚠️ 주의</span>}
                      {hasBoth && <span style={{ fontSize:10, color:"var(--teal)", fontWeight:700, background:"var(--teal-lt)", borderRadius:999, padding:"2px 8px" }}>↔ 비교</span>}
                      <span style={{ fontSize:18 }}>{moodVal?.split(" ")[0]||"😐"}</span>
                    </div>
                  </div>
                  <h3 style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{s.name}</h3>
                  <div style={{ display:"flex", gap:6, marginBottom:4, flexWrap:"wrap" }}>
                    <Tag color={s.term==="1차"?"blue":"mint"}>{s.term}</Tag>
                    {viewMode==="grade"&&<Tag color="gray">{s.classNum}반</Tag>}
                  </div>
                  <p style={{ fontSize:11, color:"var(--g500)" }}>{s.submittedAt}</p>
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
   STUDENT DETAIL
══════════════════════════════════════════════════════ */
function StudentDetail({ survey, classSurveys, onBack }) {
  const [tab, setTab]           = useState("responses");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoad, setAiLoad]     = useState(false);
  const [script, setScript]     = useState(null);
  const [scrLoad, setScrLoad]   = useState(false);

  const otherTerm = survey.term==="1차"?"2차":"1차";
  const paired = classSurveys.find(s => s.name===survey.name && s.term===otherTerm);
  const canCompare = !!paired;

  const buildText = sv => {
    let t = `학생: ${sv.name} (${sv.year}학년도 ${sv.grade}학년 ${sv.classNum}반 / ${sv.term})\n\n`;
    SECTIONS.forEach(sec => {
      t += `【${sec.emoji} ${sec.title}】\n`;
      sec.questions.forEach(q => {
        const a = sv.answers?.[q.id];
        if (q.type==="likert5") t += `- ${q.label}: ${a||"?"}/5점\n`;
        else if (q.type==="yesno") t += `- ${q.label}: ${a?.choice||""} (${a?.reason||""})\n`;
        else t += `- ${q.label}: ${a||""}\n`;
      });
      t += "\n";
    });
    return t;
  };

  const callAI = async (prompt, maxTokens=1500) => {
    const res = await fetch("/api/ai", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ prompt, maxTokens }),
    });
    const data = await res.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    const text = data.content?.map(c=>c.text||"").join("").replace(/```json|```/g,"").trim();
    return JSON.parse(text);
  };

  const generateAI = async () => {
    setAiLoad(true); setAiResult(null);
    const cmpText = canCompare
      ? `\n\n【1차】\n${buildText(survey.term==="1차"?survey:paired)}\n【2차】\n${buildText(survey.term==="2차"?survey:paired)}`
      : buildText(survey);
    const prompt = `초등학교 6학년 학생 학부모 상담 사전 설문${canCompare?"(1·2차 비교포함)":""}:\n${cmpText}\n
JSON만 반환:
{"summary":"요약","anxietyLevel":"낮음|보통|높음","friendshipLevel":"원만|보통|어려움","selfconceptLevel":"긍정|보통|부정","points":["포인트1","포인트2","포인트3"],"positiveMessage":"학부모 긍정 메시지","changeNote":"${canCompare?"1→2차 변화 서술":""}","flagKeywords":["키워드"],"strengthKeywords":["키워드"]}`;
    try { setAiResult(await callAI(prompt)); }
    catch { setAiResult({ error:"AI 오류가 발생했습니다." }); }
    setAiLoad(false);
  };

  const generateScript = async () => {
    setScrLoad(true); setScript(null);
    const prompt = `교사용 학부모 상담 스크립트 JSON만 반환:\n${buildText(survey)}\n{"opening":"인사 2문장","strengths":"강점 2~3문장","improvements":"개선 2~3문장","closing":"마무리 2문장"}`;
    try { setScript(await callAI(prompt, 800)); }
    catch { setScript({ error:"생성 오류" }); }
    setScrLoad(false);
  };

  const LvBadge = ({label,level}) => {
    const m={"낮음":"mint","보통":"yellow","높음":"rose","원만":"mint","어려움":"rose","긍정":"mint","부정":"rose"};
    return <div style={{textAlign:"center"}}><p style={{fontSize:11,color:"var(--g500)",marginBottom:4}}>{label}</p><Tag color={m[level]||"gray"}>{level}</Tag></div>;
  };

  const s1 = survey.term==="1차"?survey:paired;
  const s2 = survey.term==="2차"?survey:paired;

  return (
    <div style={{ minHeight:"100vh", background:"var(--g100)" }}>
      <div style={{ background:"var(--w)", padding:"14px 18px", boxShadow:"var(--sh-sm)" }}>
        <div style={{ maxWidth:840, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:10 }}>
            <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"var(--g500)" }}>←</button>
            <div>
              <h1 style={{ fontFamily:"'Gowun Dodum'", fontSize:18 }}>{survey.name} 학생</h1>
              <p style={{ fontSize:12, color:"var(--g500)" }}>
                {survey.year}학년도 {survey.grade}학년 {survey.classNum}반 · {survey.term} · {survey.submittedAt}
              </p>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:6, flexWrap:"wrap" }}>
              <Tag color={survey.term==="1차"?"blue":"mint"}>{survey.term}</Tag>
              {hasFlag(survey)&&<Tag color="rose">⚠️ 주의</Tag>}
              {canCompare&&<Tag color="teal">↔ 비교가능</Tag>}
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {[{id:"responses",l:"📋 원문"},{id:"compare",l:`📊 비교${!canCompare?" 🔒":""}`},{id:"ai",l:"🤖 AI"}].map(t=>(
              <button key={t.id} className={`tab-btn${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>{t.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:840, margin:"0 auto", padding:"18px 16px 60px" }}>

        {tab==="responses" && SECTIONS.map(sec=>(
          <div key={sec.id} className="card fu" style={{ marginBottom:12 }}>
            <h4 style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>{sec.emoji} {sec.title}</h4>
            {sec.questions.map(q=>{
              const a = survey.answers?.[q.id];
              return (
                <div key={q.id} style={{ marginBottom:10, paddingBottom:10, borderBottom:"1px solid var(--g200)" }}>
                  <p style={{ fontSize:12, color:"var(--g500)", marginBottom:4 }}>{q.label}</p>
                  {q.type==="likert5"?(
                    <div style={{ display:"flex", gap:5 }}>
                      {[1,2,3,4,5].map(n=><div key={n} style={{ width:28, height:28, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:a===n?700:400, background:a===n?"var(--blue)":"var(--g200)", color:a===n?"#fff":"var(--g500)" }}>{n}</div>)}
                    </div>
                  ):(
                    <p style={{ fontSize:13, lineHeight:1.8, color:"var(--g700)" }} dangerouslySetInnerHTML={{ __html:highlight(typeof a==="string"?a:`${a?.choice||""} ${a?.reason||""}`) }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {tab==="compare" && !canCompare && (
          <div className="card fu" style={{ textAlign:"center", padding:60 }}>
            <div style={{ fontSize:64, marginBottom:14 }}>📭</div>
            <h3 style={{ color:"var(--g700)", marginBottom:8 }}>비교할 {otherTerm} 설문이 없어요</h3>
          </div>
        )}
        {tab==="compare" && canCompare && (
          <>
            <div className="card fu" style={{ marginBottom:12 }}>
              <h3 style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>📊 영역별 리커트 점수 비교</h3>
              {SECTIONS.map(sec=>{
                const sc1=sectionAvg(s1,sec.id), sc2=sectionAvg(s2,sec.id);
                if(!sc1&&!sc2) return null;
                const diff = sc1&&sc2 ? (parseFloat(sc2)-parseFloat(sc1)).toFixed(1) : null;
                return (
                  <div key={sec.id} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:600 }}>{sec.emoji} {sec.title}</span>
                      {diff&&<span style={{ fontSize:12, color:parseFloat(diff)>0?"var(--mint)":parseFloat(diff)<0?"var(--rose)":"var(--g500)" }}>{parseFloat(diff)>0?"▲":"▼"} {Math.abs(diff)}점</span>}
                    </div>
                    {sc1&&<div className="bar-wrap"><span style={{ fontSize:11, color:"var(--blue)", width:24 }}>1차</span><div style={{ flex:1, background:"var(--g200)", borderRadius:999, height:10, overflow:"hidden" }}><div className="bar" style={{ width:`${(sc1/5)*100}%`, background:"var(--blue)" }} /></div><span style={{ fontSize:12, fontWeight:700, color:"var(--blue)", width:28 }}>{sc1}</span></div>}
                    {sc2&&<div className="bar-wrap"><span style={{ fontSize:11, color:"var(--mint)", width:24 }}>2차</span><div style={{ flex:1, background:"var(--g200)", borderRadius:999, height:10, overflow:"hidden" }}><div className="bar" style={{ width:`${(sc2/5)*100}%`, background:"var(--mint)" }} /></div><span style={{ fontSize:12, fontWeight:700, color:"var(--mint)", width:28 }}>{sc2}</span></div>}
                  </div>
                );
              })}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[s1,s2].map((sv,idx)=>(
                <div key={idx} className="card fu">
                  <h4 style={{ fontWeight:700, fontSize:13, marginBottom:10, color:idx===0?"var(--blue)":"var(--mint)" }}>{idx===0?"🌱 1차":"🌻 2차"}</h4>
                  {SECTIONS.flatMap(sec=>sec.questions.filter(q=>q.type==="text"||q.type==="mood").map(q=>{
                    const a=sv?.answers?.[q.id];
                    return a?(<div key={q.id} style={{ marginBottom:8, paddingBottom:8, borderBottom:"1px solid var(--g200)" }}><p style={{ fontSize:10, color:"var(--g500)", marginBottom:3 }}>{q.label}</p><p style={{ fontSize:12, lineHeight:1.7, color:"var(--g700)" }} dangerouslySetInnerHTML={{ __html:highlight(String(a)) }} /></div>):null;
                  }))}
                </div>
              ))}
            </div>
          </>
        )}

        {tab==="ai" && (
          <>
            <div className="card fu" style={{ marginBottom:12, background:"linear-gradient(135deg,#EAF4FB,#D4F5EE)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div><h3 style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>🤖 AI 상담 분석</h3>
                  <p style={{ color:"var(--g500)", fontSize:12 }}>심리·불안·친구관계·자아상태{canCompare?" + 1·2차 변화":""}</p></div>
                <Btn onClick={generateAI} disabled={aiLoad} variant="primary">
                  {aiLoad?<><div className="spinner"/>분석 중...</>:"✨ AI 분석"}
                </Btn>
              </div>
            </div>
            {aiResult&&!aiResult.error&&(
              <div className="card fu" style={{ marginBottom:12, border:"2px solid var(--blue-2)" }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, background:"var(--g100)", borderRadius:"var(--r-sm)", padding:12, marginBottom:14 }}>
                  <LvBadge label="불안 수준" level={aiResult.anxietyLevel} />
                  <LvBadge label="친구관계" level={aiResult.friendshipLevel} />
                  <LvBadge label="자아상태" level={aiResult.selfconceptLevel} />
                </div>
                <div style={{ background:"var(--blue-lt)", borderRadius:"var(--r-sm)", padding:12, marginBottom:10 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"var(--g500)", marginBottom:4 }}>📌 상담 요약</p>
                  <p style={{ fontSize:13, lineHeight:1.9 }}>{aiResult.summary}</p>
                </div>
                {aiResult.points?.map((p,i)=>(
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ background:"var(--blue)", color:"#fff", borderRadius:999, width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                    <p style={{ fontSize:13, lineHeight:1.7, paddingTop:2 }}>{p}</p>
                  </div>
                ))}
                {canCompare&&aiResult.changeNote&&(
                  <div style={{ background:"var(--teal-lt)", borderRadius:"var(--r-sm)", padding:12, marginBottom:10 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"var(--teal)", marginBottom:4 }}>↔ 변화 분석</p>
                    <p style={{ fontSize:13, lineHeight:1.8 }}>{aiResult.changeNote}</p>
                  </div>
                )}
                <div style={{ background:"var(--mint-lt)", borderRadius:"var(--r-sm)", padding:12, marginBottom:10 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#1a8a74", marginBottom:4 }}>💚 학부모 전달 메시지</p>
                  <p style={{ fontSize:13, lineHeight:1.9, color:"var(--g700)" }}>{aiResult.positiveMessage}</p>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {aiResult.flagKeywords?.map(k=><Tag key={k} color="rose">⚠️ {k}</Tag>)}
                  {aiResult.strengthKeywords?.map(k=><Tag key={k} color="yellow">⭐ {k}</Tag>)}
                </div>
              </div>
            )}
            {aiResult?.error && <div className="card fu" style={{ color:"var(--rose)", fontSize:13 }}>{aiResult.error}</div>}

            <div className="card fu" style={{ marginBottom:12, background:"linear-gradient(135deg,#EDE7FF,#FFEBF2)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div><h3 style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>📝 상담 스크립트</h3>
                  <p style={{ color:"var(--g500)", fontSize:12 }}>학부모 상담에 바로 사용 가능</p></div>
                <Btn onClick={generateScript} disabled={scrLoad} variant="purple">
                  {scrLoad?<><div className="spinner"/>생성 중...</>:"📜 스크립트"}
                </Btn>
              </div>
            </div>
            {script&&!script.error&&(
              <div className="card fu" style={{ border:"2px solid var(--purple-lt)" }}>
                {[{label:"🌸 시작 인사",key:"opening",bg:"--blue-lt"},{label:"⭐ 강점 & 칭찬",key:"strengths",bg:"--yellow-lt"},{label:"💪 개선 & 지원",key:"improvements",bg:"--peach-lt"},{label:"🤝 마무리",key:"closing",bg:"--mint-lt"}].map(({label,key,bg})=>(
                  <div key={key} style={{ background:`var(${bg})`, borderRadius:"var(--r-sm)", padding:12, marginBottom:10 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"var(--g500)", marginBottom:4 }}>{label}</p>
                    <p style={{ fontSize:13, lineHeight:1.9, color:"var(--g700)" }}>{script[key]}</p>
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
   APP ROOT
══════════════════════════════════════════════════════ */
export default function App() {
  const [view, setView]         = useState("home");
  const [teacher, setTeacher]   = useState(null);
  const [selected, setSelected] = useState(null);
  const [classSurveys, setCS]   = useState([]);

  return (
    <>
      <GS />
      {view==="home"      && <HomePage onStudent={()=>setView("student")} onTeacher={()=>setView("login")} />}
      {view==="student"   && <StudentSurvey onBack={()=>setView("home")} />}
      {view==="login"     && <TeacherLogin onLogin={t=>{setTeacher(t);setView("dashboard");}} onBack={()=>setView("home")} />}
      {view==="dashboard" && teacher && (
        <TeacherDashboard teacher={teacher} onBack={()=>setView("home")}
          onLogout={()=>{setTeacher(null);setView("home");}}
          onSelect={(s,cs)=>{setSelected(s);setCS(cs);setView("detail");}} />
      )}
      {view==="detail" && selected && (
        <StudentDetail survey={selected} classSurveys={classSurveys} onBack={()=>setView("dashboard")} />
      )}
    </>
  );
}
