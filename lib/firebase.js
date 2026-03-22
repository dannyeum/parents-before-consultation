// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  setDoc,
  getDoc,
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

// ── 담임 등록/조회 ───────────────────────────────────────
// 문서 ID = "{year}_{grade}_{classNum}"  예) "2025_6_2"

export async function saveTeacher(data) {
  const id = `${data.year}_${data.grade}_${data.classNum}`;
  await setDoc(doc(db, "teachers", id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  return id;
}

export async function getTeacher(year, grade, classNum) {
  const id = `${year}_${grade}_${classNum}`;
  const snap = await getDoc(doc(db, "teachers", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getTeachersByGrade(year, grade) {
  // 단일 where → 인덱스 불필요, 나머지는 클라이언트 필터
  const q = query(
    collection(db, "teachers"),
    where("year", "==", Number(year))
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => d.grade === Number(grade))
    .sort((a, b) => a.classNum - b.classNum);
}

export async function getAllTeachers(year) {
  // orderBy 제거 → 복합 인덱스 불필요, 클라이언트에서 정렬
  const q = query(
    collection(db, "teachers"),
    where("year", "==", Number(year))
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.grade - b.grade || a.classNum - b.classNum);
}

// ── 설문 저장/조회 ────────────────────────────────────────

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

export async function getSurveysByClass(year, grade, classNum) {
  // where 1개만 사용 → 인덱스 불필요, 나머지 클라이언트 필터
  const q = query(
    collection(db, "surveys"),
    where("year", "==", Number(year))
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data(), submittedAt: toStr(d.data().createdAt) }))
    .filter(d => d.grade === Number(grade) && d.classNum === Number(classNum))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function getSurveysByGrade(year, grade) {
  // where 1개만 사용 → 인덱스 불필요, 나머지 클라이언트 필터
  const q = query(
    collection(db, "surveys"),
    where("year", "==", Number(year))
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data(), submittedAt: toStr(d.data().createdAt) }))
    .filter(d => d.grade === Number(grade))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}
