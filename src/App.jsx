import React, { useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, History, Calendar, Users, UserCheck, X, Car, Award, Save, Edit2 } from 'lucide-react';

// --- Firebase Imports (실시간 기능을 위해 추가됨) ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  setDoc,
  getDoc,
  writeBatch,
  getDocs
} from "firebase/firestore";

// ---------------------------------------------------------
// [설정] Firebase 콘솔에서 복사한 내 설정값을 여기에 붙여넣으세요.
// ---------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyApqIy9DDNZEIb5MIUdWGWSXpRfZtxc1u4",
  authDomain: "car-352f0.firebaseapp.com",
  projectId: "car-352f0",
  storageBucket: "car-352f0.firebasestorage.app",
  messagingSenderId: "779327619494",
  appId: "1:779327619494:web:7af797c295abcf14dc0f67",
  measurementId: "G-CVPPMN6E1P"
};

// Firebase 초기화 (설정값이 없으면 에러 방지)
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;

// --- Components ---

// 1. 차량 애니메이션 컴포넌트 (디자인 동일)
const StarexVan = () => {
  const { scrollY } = useScroll();
  const [isEngineOn, setIsEngineOn] = useState(false);
  useEffect(() => scrollY.onChange((latest) => setIsEngineOn(latest > 50)), [scrollY]);

  return (
    <div className="sticky top-0 z-0 flex justify-center w-full py-12 overflow-hidden bg-blue-50/50 backdrop-blur-sm">
      <motion.div
        initial={{ x: -1000, opacity: 0 }}
        animate={{ x: 0, opacity: 1, y: isEngineOn ? [0, -1, 1, 0] : 0 }}
        transition={{ x: { type: "spring", stiffness: 50, damping: 20 }, y: { repeat: Infinity, duration: 0.2 } }}
        className="relative w-64 h-32"
      >
        <div className="absolute bottom-0 w-full h-24 bg-gray-200 rounded-2xl shadow-lg border border-gray-300 overflow-hidden">
          <div className="absolute top-2 left-2 right-2 h-10 bg-slate-800 rounded-lg flex gap-1 px-1 items-center">
             <div className="w-1/3 h-8 bg-slate-900/50 rounded-md"></div>
             <div className="w-1/3 h-8 bg-slate-900/50 rounded-md"></div>
             <div className="w-1/3 h-8 bg-slate-900/50 rounded-md"></div>
          </div>
          <div className="absolute top-14 left-10 w-6 h-1 bg-gray-400 rounded-full"></div>
          <div className="absolute top-14 left-32 w-6 h-1 bg-gray-400 rounded-full"></div>
        </div>
        <div className="absolute bottom-[-10px] left-8 w-12 h-12 bg-slate-800 rounded-full border-4 border-gray-300 flex items-center justify-center">
          <div className="w-4 h-4 bg-gray-500 rounded-full animate-spin"></div>
        </div>
        <div className="absolute bottom-[-10px] right-8 w-12 h-12 bg-slate-800 rounded-full border-4 border-gray-300 flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-500 rounded-full animate-spin"></div>
        </div>
        <motion.div animate={{ opacity: isEngineOn ? 1 : 0.3 }} className="absolute bottom-6 right-[-5px] w-4 h-8 bg-yellow-400 rounded-r-lg blur-[2px]" />
        <motion.div animate={{ opacity: isEngineOn ? 0.8 : 0, scaleX: isEngineOn ? 1 : 0 }} className="absolute bottom-2 right-[-100px] w-24 h-16 bg-gradient-to-r from-yellow-200/50 to-transparent blur-xl origin-left" />
        <div className="absolute bottom-8 left-4 text-[10px] font-bold text-gray-400">HYUNDAI</div>
      </motion.div>
    </div>
  );
};

// 2. 계급장 뱃지
const RankBadge = ({ rank }) => {
  const getLines = () => {
    switch (rank) {
      case '이병': return 1; case '일병': return 2; case '상병': return 3; case '병장': return 4; default: return 1;
    }
  };
  if (['하사', '중사', '상사', '원사', '준위'].includes(rank)) {
      return (
        <div className="flex flex-col bg-slate-800 p-1.5 rounded w-8 h-8 justify-center items-center shadow-sm shrink-0">
            <div className="w-3 h-3 bg-yellow-400 rotate-45 shadow-[0_0_2px_rgba(250,204,21,0.8)]"></div>
        </div>
      );
  }
  return (
    <div className="flex flex-col gap-[2px] bg-slate-800 p-1.5 rounded w-8 h-8 justify-center items-center shadow-sm shrink-0">
      {Array.from({ length: getLines() }).map((_, i) => (
        <div key={i} className="w-full h-[2px] bg-yellow-400 rounded-full shadow-[0_0_2px_rgba(250,204,21,0.8)]"></div>
      ))}
    </div>
  );
};

// 3. 운행 상태 배지
const StatusBadge = () => {
  const [status, setStatus] = useState({ text: '운행 대기', color: 'bg-gray-400' });

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const day = now.getDay();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours * 60 + minutes;
      const runningDays = [0, 2, 4, 6];

      if (!runningDays.includes(day)) {
        setStatus({ text: '미운행 (화/목/토/일 운행)', color: 'bg-gray-400' });
        return;
      }
      const time1815 = 18 * 60 + 15;
      const time1825 = 18 * 60 + 25;
      const time1830 = 18 * 60 + 30;

      if (currentTime >= time1830) {
        setStatus({ text: '출발', color: 'bg-red-500 animate-pulse' });
      } else if (currentTime >= time1825) {
        setStatus({ text: '출발 5분전', color: 'bg-orange-500 animate-bounce' });
      } else if (currentTime >= time1815) {
        setStatus({ text: '출발 15분전', color: 'bg-blue-500' });
      } else {
        setStatus({ text: '운행 대기 (18:15 출발)', color: 'bg-blue-400' });
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);
  return <div className={`${status.color} text-white text-xs px-3 py-1.5 rounded-full font-bold transition-colors shadow-md`}>{status.text}</div>;
};

// 4. 기록 모달 (Firebase 연동)
const HistoryModal = ({ onClose }) => {
  const [histories, setHistories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [adminPwd, setAdminPwd] = useState('');
  const [showPwdInput, setShowPwdInput] = useState(null);
  const [editForm, setEditForm] = useState({ driverRank: '', driverName: '', ncoRank: '', ncoName: '' });
  const ranks = ['이병', '일병', '상병', '병장', '하사', '중사', '상사', '원사'];

  // Firebase에서 기록 실시간 가져오기
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "history"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleEditClick = (h) => {
      if (editingId === h.id) { setEditingId(null); } else { setShowPwdInput(h.id); setAdminPwd(''); }
  };

  const verifyPassword = (h) => {
      if (adminPwd === '수송') {
          setShowPwdInput(null); setEditingId(h.id);
          setEditForm({ driverRank: h.driver.rank, driverName: h.driver.name, ncoRank: h.nco.rank, ncoName: h.nco.name });
      } else { alert('관리자 비밀번호 불일치'); setAdminPwd(''); }
  };

  const handleSaveEdit = async (h) => {
      if (!db) return;
      await updateDoc(doc(db, "history", h.id), {
          driver: { name: editForm.driverName, rank: editForm.driverRank },
          nco: { name: editForm.ncoName, rank: editForm.ncoRank }
      });
      setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative z-10">
        <div className="bg-slate-800 p-4 flex justify-between items-center">
            <h3 className="text-white font-bold text-lg flex items-center gap-2"><History className="w-5 h-5" /> 운행 기록</h3>
            <button onClick={onClose}><X className="w-6 h-6 text-white" /></button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-gray-50 min-h-[200px]">
            {histories.length === 0 ? <div className="text-center text-gray-400 py-10 text-sm">기록 없음</div> : 
                histories.map(h => (
                    <div key={h.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                        <button onClick={() => handleEditClick(h)} className="absolute top-4 right-4 text-gray-400 hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                        <div className="flex justify-between items-start mb-2 pr-8">
                            <span className="font-bold text-slate-700 flex items-center gap-1 text-sm"><Calendar className="w-3.5 h-3.5 text-blue-500" /> {h.date}</span>
                        </div>
                        <div className="text-xs text-gray-400 mb-2">{h.time}</div>
                        
                        {showPwdInput === h.id && (
                             <div className="bg-gray-100 p-2 rounded-lg mb-3 flex gap-2">
                                <input type="password" className="flex-1 text-xs p-1 border" value={adminPwd} onChange={(e) => setAdminPwd(e.target.value)} placeholder="비번" />
                                <button onClick={() => verifyPassword(h)} className="bg-slate-800 text-white text-xs px-2 rounded">확인</button>
                             </div>
                        )}

                        {editingId === h.id ? (
                            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                                <div className="flex gap-1">
                                    <select value={editForm.driverRank} onChange={(e) => setEditForm({...editForm, driverRank: e.target.value})} className="text-xs p-1 border">{ranks.map(r=><option key={r} value={r}>{r}</option>)}</select>
                                    <input value={editForm.driverName} onChange={(e) => setEditForm({...editForm, driverName: e.target.value})} className="flex-1 text-xs p-1 border" placeholder="운전자" />
                                </div>
                                <div className="flex gap-1">
                                    <select value={editForm.ncoRank} onChange={(e) => setEditForm({...editForm, ncoRank: e.target.value})} className="text-xs p-1 border">{ranks.map(r=><option key={r} value={r}>{r}</option>)}</select>
                                    <input value={editForm.ncoName} onChange={(e) => setEditForm({...editForm, ncoName: e.target.value})} className="flex-1 text-xs p-1 border" placeholder="부직사관" />
                                </div>
                                <button onClick={() => handleSaveEdit(h)} className="w-full bg-blue-500 text-white text-xs py-1.5 rounded font-bold">저장</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
                                <div className="bg-slate-50 p-2 rounded-lg"><div className="text-[10px] text-gray-400 mb-0.5"><Car className="w-3 h-3 inline"/> 운전자</div><div className="text-xs font-bold">{h.driver?.rank} {h.driver?.name}</div></div>
                                <div className="bg-slate-50 p-2 rounded-lg"><div className="text-[10px] text-gray-400 mb-0.5"><Award className="w-3 h-3 inline"/> 부직사관</div><div className="text-xs font-bold">{h.nco?.rank} {h.nco?.name}</div></div>
                            </div>
                        )}
                        <div className="text-xs text-gray-500 border-t pt-2"><span className="font-semibold">탑승자({h.count}명):</span> {h.applicantNames}</div>
                    </div>
                ))
            }
        </div>
      </motion.div>
    </div>
  );
};

// 5. 승무원 설정 모달 (Firebase 연동)
const CrewModal = ({ onClose }) => {
    const [driver, setDriver] = useState({ name: '', rank: '일병' });
    const [nco, setNco] = useState({ name: '', rank: '하사' });
    const ranks = ['이병', '일병', '상병', '병장', '하사', '중사', '상사', '원사'];

    useEffect(() => {
        if (!db) return;
        const unsub = onSnapshot(doc(db, "settings", "crew"), (doc) => {
            if (doc.exists()) {
                setDriver(doc.data().driver);
                setNco(doc.data().nco);
            }
        });
        return () => unsub();
    }, []);

    const handleSave = async () => {
        if (!db) return;
        await setDoc(doc(db, "settings", "crew"), { driver, nco });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">승무원 설정</h3><button onClick={onClose}><X/></button></div>
                <div className="space-y-4">
                    <div><label className="text-xs font-bold text-blue-600">운전자</label><div className="flex gap-2"><select value={driver.rank} onChange={e=>setDriver({...driver, rank: e.target.value})} className="bg-gray-50 p-2 rounded">{ranks.map(r=><option key={r} value={r}>{r}</option>)}</select><input value={driver.name} onChange={e=>setDriver({...driver, name: e.target.value})} className="bg-gray-50 p-2 rounded flex-1" placeholder="이름"/></div></div>
                    <div><label className="text-xs font-bold text-orange-600">부직사관</label><div className="flex gap-2"><select value={nco.rank} onChange={e=>setNco({...nco, rank: e.target.value})} className="bg-gray-50 p-2 rounded">{ranks.map(r=><option key={r} value={r}>{r}</option>)}</select><input value={nco.name} onChange={e=>setNco({...nco, name: e.target.value})} className="bg-gray-50 p-2 rounded flex-1" placeholder="이름"/></div></div>
                    <button onClick={handleSave} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold mt-4">저장</button>
                </div>
            </motion.div>
        </div>
    );
}

// --- Main App ---

export default function WelfareCarApp() {
  const [name, setName] = useState('');
  const [rank, setRank] = useState('이병');
  const [pin, setPin] = useState('');
  const [applicants, setApplicants] = useState([]);
  
  const [cancelId, setCancelId] = useState(null);
  const [cancelPin, setCancelPin] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showCrewModal, setShowCrewModal] = useState(false);

  const ranks = ['이병', '일병', '상병', '병장'];

  // 1. 실시간 신청자 목록 (Applicants)
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "applicants"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApplicants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 2. 자동 아카이빙 로직 (날짜가 바뀌면 신청자 목록 -> 히스토리로 이동)
  useEffect(() => {
    const checkArchive = async () => {
        if (!db) return;
        const today = new Date().toLocaleDateString();
        const sysRef = doc(db, "settings", "system");
        
        // 시스템 날짜 확인
        const sysSnap = await getDoc(sysRef);
        let savedDate = "";
        
        if (sysSnap.exists()) {
            savedDate = sysSnap.data().date;
        }

        // 날짜가 바뀌었다면 아카이빙 실행
        if (savedDate && savedDate !== today) {
            // 1. 기존 신청자들 가져오기
            const appSnapshot = await getDocs(collection(db, "applicants"));
            const prevApplicants = appSnapshot.docs.map(d => d.data());
            
            // 2. 승무원 정보 가져오기
            const crewSnap = await getDoc(doc(db, "settings", "crew"));
            let driver = {name:'', rank:'일병'}, nco = {name:'', rank:'하사'};
            if (crewSnap.exists()) {
                driver = crewSnap.data().driver;
                nco = crewSnap.data().nco;
            }

            // 3. 신청자가 있다면 히스토리에 저장
            if (prevApplicants.length > 0) {
                 await addDoc(collection(db, "history"), {
                    date: savedDate,
                    time: "자동저장",
                    count: prevApplicants.length,
                    applicantNames: prevApplicants.map(a => `${a.rank} ${a.name}`).join(', '),
                    driver, nco,
                    timestamp: serverTimestamp()
                 });
            }

            // 4. 신청자 목록 초기화 (삭제)
            const batch = writeBatch(db);
            appSnapshot.docs.forEach((d) => {
                batch.delete(d.ref);
            });
            // 시스템 날짜 업데이트
            batch.set(sysRef, { date: today });
            
            await batch.commit();
            console.log("아카이빙 완료");
        } else if (!savedDate) {
            // 처음 실행 시 날짜 설정
            await setDoc(sysRef, { date: today });
        }
    };
    checkArchive();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db) { alert("Firebase 설정이 필요합니다!"); return; }
    if (!name || !pin || pin.length !== 4) { alert('이름과 비밀번호 4자리를 입력해주세요.'); return; }
    
    await addDoc(collection(db, "applicants"), {
        name, rank, pin,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp()
    });
    setName(''); setPin('');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const confirmCancel = async (targetId, targetPin) => {
    if (!db) return;
    if (cancelPin === targetPin) {
      await deleteDoc(doc(db, "applicants", targetId));
      setCancelId(null); setCancelPin('');
    } else {
      alert('비밀번호가 일치하지 않습니다.'); setCancelPin('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F6] text-[#191F28] font-sans pb-32 relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />
      <header className="fixed top-0 w-full z-50 bg-[#F2F4F6]/80 backdrop-blur-md px-5 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800">59전대 복지차</h1>
            <button onClick={() => setShowHistory(true)} className="bg-white p-1.5 rounded-full shadow-sm border"><History className="w-4 h-4" /></button>
        </div>
        <StatusBadge />
      </header>

      <div className="pt-16"><StarexVan /></div>

      <div className="max-w-md mx-auto px-5 relative z-10 -mt-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-3xl p-6 shadow-xl mb-8">
          <h2 className="text-2xl font-bold mb-1">탑승 신청</h2>
          <p className="text-gray-400 text-sm mb-6">오늘 운행하는 복지차에 탑승하시나요?</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-xs text-gray-400 ml-1">이름</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className="w-full bg-gray-50 rounded-xl px-4 py-3" /></div>
            <div><label className="text-xs text-gray-400 ml-1">계급</label><div className="grid grid-cols-4 gap-2">{ranks.map((r) => (<button key={r} type="button" onClick={() => setRank(r)} className={`flex flex-col items-center p-2 rounded-xl border ${rank === r ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}><div className="scale-75"><RankBadge rank={r} /></div><span className="text-xs">{r}</span></button>))}</div></div>
            <div><label className="text-xs text-gray-400 ml-1">비밀번호 (4자리)</label><div className="relative"><input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0000" className="w-full bg-gray-50 rounded-xl px-4 py-3 tracking-widest" /><ShieldCheck className="absolute right-4 top-3.5 text-gray-300 w-5 h-5" /></div></div>
            <button type="submit" className="w-full bg-[#3182F6] text-white font-bold py-4 rounded-xl mt-4">탑승 신청하기</button>
          </form>
        </motion.div>

        <div className="mb-8">
          <div className="flex justify-between mb-4 px-2"><h3 className="text-xl font-bold">신청 현황 <span className="text-blue-500">{applicants.length}명</span></h3></div>
          <ul className="space-y-3">
            <AnimatePresence>
              {applicants.length === 0 ? <div className="text-center text-gray-400 py-10 border-dashed border-2 rounded-2xl">신청자가 없습니다.</div> : 
                applicants.map((app) => (
                  <motion.li layout key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-3 items-center"><RankBadge rank={app.rank}/><div><div className="font-bold">{app.name} <span className="text-xs font-normal text-gray-400">{app.rank}</span></div><div className="text-xs text-gray-400">{app.time}</div></div></div>
                        <button onClick={() => setCancelId(cancelId === app.id ? null : app.id)} className="text-sm text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">{cancelId === app.id ? '닫기' : '취소'}</button>
                    </div>
                    {cancelId === app.id && (
                        <div className="mt-3 flex gap-2 bg-gray-50 p-2 rounded-lg"><Lock className="w-4 h-4"/><input type="password" maxLength={4} className="bg-transparent flex-1" value={cancelPin} onChange={e=>setCancelPin(e.target.value)} placeholder="비번 입력"/><button onClick={()=>confirmCancel(app.id, app.pin)} className="bg-red-500 text-white text-xs px-3 rounded">확인</button></div>
                    )}
                  </motion.li>
                ))
              }
            </AnimatePresence>
          </ul>
        </div>
        
        <div className="flex justify-center pb-10">
            <button onClick={() => setShowCrewModal(true)} className="flex items-center gap-2 bg-white border px-5 py-3 rounded-2xl font-bold text-slate-600"><UserCheck className="w-5 h-5"/> 운전자 설정</button>
        </div>
      </div>

      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
      {showCrewModal && <CrewModal onClose={() => setShowCrewModal(false)} />}
    </div>
  );
}
