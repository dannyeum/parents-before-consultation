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
  orderBy,
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
  const q = query(
    collection(db, "teachers"),
    where("year", "==", Number(year)),
    where("grade", "==", Number(grade))
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllTeachers(year) {
  const q = query(
    collection(db, "teachers"),
    where("year", "==", Number(year)),
    orderBy("grade")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
  const q = query(
    collection(db, "surveys"),
    where("year",     "==", Number(year)),
    where("grade",    "==", Number(grade)),
    where("classNum", "==", Number(classNum)),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data(), submittedAt: toStr(d.data().createdAt) }));
}

export async function getSurveysByGrade(year, grade) {
  const q = query(
    collection(db, "surveys"),
    where("year",  "==", Number(year)),
    where("grade", "==", Number(grade)),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data(), submittedAt: toStr(d.data().createdAt) }));
}
