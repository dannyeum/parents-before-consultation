// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:     process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

function toStr(ts) {
  if (!ts) return "";
  if (ts.toDate) return ts.toDate().toLocaleString("ko-KR");
  return String(ts);
}

/* ── 설문 저장 ──────────────────────────────────────── */
export async function saveSurvey(data) {
  const docRef = await addDoc(collection(db, "surveys"), {
    ...data,
    year:     Number(data.year),
    grade:    Number(data.grade),
    classNum: Number(data.classNum),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/* ── 설문 전체 불러오기 (year 기준, 클라이언트 필터) ── */
export async function getSurveys(year) {
  const q = query(
    collection(db, "surveys"),
    where("year", "==", Number(year))
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data(), submittedAt: toStr(d.data().createdAt) }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

/* ── 개별 설문 삭제 ─────────────────────────────────── */
export async function deleteSurvey(id) {
  await deleteDoc(doc(db, "surveys", id));
}

/* ── 특정 조건 설문 전체 삭제 ───────────────────────── */
export async function deleteAllSurveys(year, grade, classNum) {
  const q = query(
    collection(db, "surveys"),
    where("year", "==", Number(year))
  );
  const snap = await getDocs(q);
  const targets = snap.docs.filter(d => {
    const dt = d.data();
    const gradeMatch = grade ? dt.grade === Number(grade) : true;
    const classMatch = classNum ? dt.classNum === Number(classNum) : true;
    return gradeMatch && classMatch;
  });
  await Promise.all(targets.map(d => deleteDoc(d.ref)));
  return targets.length;
}
