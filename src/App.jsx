import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ShieldCheck, History, Calendar, Users, UserCheck, X, Car, Award, Package, Box, AlertCircle, Edit2, Loader2, WifiOff, RefreshCw, LogIn, Cloud, Sun, Moon, Wind, ThermometerSnowflake, Trash2, Check, XCircle, Info, Smartphone } from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";
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
// [설정] Firebase 초기화
// ---------------------------------------------------------
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }
  return {
    apiKey: "AIzaSyApqIy9DDNZEIb5MIUdWGWSXpRfZtxc1u4",
    authDomain: "car-352f0.firebaseapp.com",
    projectId: "car-352f0",
    storageBucket: "car-352f0.firebasestorage.app",
    messagingSenderId: "779327619494",
    appId: "1:779327619494:web:7af797c295abcf14dc0f67",
    measurementId: "G-CVPPMN6E1P"
  };
};

const app = !getApps().length ? initializeApp(getFirebaseConfig()) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Gemini 환경 변수
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Helper: 컬렉션 참조 함수 ---
const getCollection = (colName) => {
  return collection(db, 'artifacts', APP_ID, 'public', 'data', colName);
};

const getDocRef = (colName, docId) => {
  return doc(db, 'artifacts', APP_ID, 'public', 'data', colName, docId);
};

// [NEW] 클라이언트 정보 수집 함수
const collectClientInfo = async () => {
    let info = {
        ip: '알수없음',
        city: '알수없음',
        region: '',
        userAgent: navigator.userAgent,
        device: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Mobile' : 'PC'
    };

    try {
        // 무료 IP 정보 API 사용 (ipapi.co)
        // 타임아웃 3초 설정
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        const data = await response.json();
        
        clearTimeout(timeoutId);

        if (data.ip) {
            info.ip = data.ip;
            info.city = data.city || '';
            info.region = data.region || '';
            info.org = data.org || ''; // 통신사 정보 등
        }
    } catch (e) {
        console.warn("IP info fetch failed:", e);
        // 실패해도 신청은 진행되어야 하므로 에러는 무시하고 기본값 반환
    }
    return info;
};

// --- Components ---

// 날씨 위젯 컴포넌트
const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=35.1485&longitude=128.7056&current=temperature_2m,relative_humidity_2m,weather_code,is_day,wind_speed_10m&timezone=Asia%2FTokyo"
        );
        const data = await response.json();
        setWeather(data.current);
      } catch (error) {
        console.error("Weather fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !weather) return null;

  const { temperature_2m, weather_code, is_day, wind_speed_10m } = weather;

  const getWeatherStatus = () => {
    let emoji = is_day ? "☀️" : "🌙";
    let message = "오늘도 안전운행 하세요!";
    let bgClass = is_day ? "bg-blue-50 text-blue-800" : "bg-indigo-50 text-indigo-800";
    let icon = is_day ? <Sun className="w-4 h-4 text-orange-500" /> : <Moon className="w-4 h-4 text-indigo-500" />;

    if ([71, 73, 75, 77, 85, 86].includes(weather_code)) {
      emoji = "❄️";
      message = "눈이 오네요. 빙판길 조심하세요!";
      bgClass = "bg-sky-50 text-sky-800";
      icon = <ThermometerSnowflake className="w-4 h-4 text-sky-500" />;
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weather_code)) {
      emoji = "🌧️";
      message = "비가 내립니다. 빗길 감속 운전!";
      bgClass = "bg-slate-100 text-slate-800";
      icon = <Cloud className="w-4 h-4 text-slate-500" />;
    }

    if (wind_speed_10m > 20) {
      emoji = "💨";
      message = message === "오늘도 안전운행 하세요!" ? "바람이 많이 붑니다. 안전에 유의하세요." : message;
      icon = <Wind className="w-4 h-4 text-gray-500" />;
    }

    if (temperature_2m <= 5) {
      if (![71, 73, 75, 77, 85, 86].includes(weather_code)) { 
        emoji = emoji === "☀️" || emoji === "🌙" ? "🥶" : emoji;
        message = message === "오늘도 안전운행 하세요!" ? "날씨가 춥습니다. 따뜻하게 입으세요." : message;
      }
    }

    return { emoji, message, bgClass, icon };
  };

  const status = getWeatherStatus();

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={`mx-4 mt-2 px-4 py-2 rounded-xl flex items-center justify-between shadow-sm border border-opacity-50 ${status.bgClass} backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{status.emoji}</span>
        <div className="flex flex-col">
          <span className="text-[10px] opacity-70 font-semibold flex items-center gap-1">창원시 진해구 {status.icon}</span>
          <span className="text-xs font-bold">{status.message}</span>
        </div>
      </div>
      <div className="text-lg font-bold tracking-tight">
        {Math.round(temperature_2m)}°
      </div>
    </motion.div>
  );
};


// 1. Canvas 기반 스타렉스 컴포넌트
const StarexVan = ({ isDoorOpen }) => {
  const canvasRef = useRef(null);
  const { scrollY } = useScroll();
  const scrollRef = useRef(0);
  const doorPosRef = useRef(0); 

  useEffect(() => {
    return scrollY.onChange((latest) => {
      scrollRef.current = latest;
    });
  }, [scrollY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const drawStarex = (ctx, scrollY, time) => {
      const width = canvas.width;
      const height = canvas.height;
      
      const targetDoorPos = isDoorOpen ? 1 : 0;
      doorPosRef.current += (targetDoorPos - doorPosRef.current) * 0.1;

      ctx.clearRect(0, 0, width, height);

      const isEngineOn = scrollY > 50;
      const bounce = isEngineOn ? Math.sin(time / 60) * 1.5 : 0;
      
      const carX = width / 2 - 150; 
      const carY = height / 2 - 40 + bounce; 

      ctx.save();
      ctx.translate(carX, carY);

      // 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(150, 115, 140, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // 바디
      const bodyGrad = ctx.createLinearGradient(0, 0, 0, 100);
      bodyGrad.addColorStop(0, '#E2E8F0');
      bodyGrad.addColorStop(1, '#94A3B8');

      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(0, 100); ctx.lineTo(0, 30); ctx.lineTo(30, 5); ctx.lineTo(220, 5); 
      ctx.lineTo(290, 60); ctx.lineTo(300, 80); ctx.lineTo(300, 100); 
      ctx.lineTo(240, 100); ctx.arc(240, 100, 24, Math.PI, 0, false); 
      ctx.lineTo(100, 100); ctx.arc(80, 100, 24, Math.PI, 0, false); 
      ctx.lineTo(0, 100);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 내부
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(100, 15, 80, 80); 

      // 택배
      if (doorPosRef.current > 0.1) {
          ctx.save();
          const packageScale = Math.min(doorPosRef.current, 1);
          ctx.translate(140, 80);
          ctx.scale(packageScale, packageScale);
          ctx.font = "40px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText("📦", 0, 0);
          ctx.restore();
      }

      // 슬라이딩 도어
      ctx.save();
      const doorOffset = doorPosRef.current * -70; 
      ctx.translate(doorOffset, 0);
      ctx.fillStyle = bodyGrad; 
      ctx.strokeStyle = '#64748B';
      ctx.beginPath(); ctx.rect(100, 10, 85, 90); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1E293B'; ctx.fillRect(105, 15, 75, 40);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath(); ctx.moveTo(105, 55); ctx.lineTo(130, 15); ctx.lineTo(145, 15); ctx.lineTo(120, 55); ctx.fill();
      ctx.fillStyle = '#94A3B8'; ctx.beginPath(); ctx.roundRect(110, 65, 20, 4, 2); ctx.fill();
      ctx.fillStyle = '#64748B'; ctx.fillRect(100, 58, 85, 2);
      ctx.restore(); 

      // 앞/뒤 창문 및 디테일
      ctx.fillStyle = '#1E293B';
      ctx.beginPath(); ctx.moveTo(185, 10); ctx.lineTo(220, 10); ctx.lineTo(275, 55); ctx.lineTo(275, 58); ctx.lineTo(185, 55); ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath(); ctx.moveTo(220, 10); ctx.lineTo(240, 10); ctx.lineTo(185, 55); ctx.lineTo(165, 55); ctx.fill();
      ctx.fillStyle = '#1E293B';
      ctx.beginPath(); ctx.moveTo(10, 32); ctx.lineTo(35, 10); ctx.lineTo(95, 10); ctx.lineTo(95, 52); ctx.lineTo(10, 50); ctx.fill();
      ctx.fillStyle = '#DC2626'; ctx.fillRect(0, 35, 6, 40);
      ctx.fillStyle = '#FEF3C7'; ctx.beginPath(); ctx.moveTo(290, 65); ctx.lineTo(300, 70); ctx.lineTo(300, 85); ctx.lineTo(285, 80); ctx.fill(); ctx.strokeStyle = '#CBD5E1'; ctx.stroke();
      ctx.fillStyle = '#475569'; ctx.fillRect(0, 90, 305, 10);

      // 바퀴
      const drawWheel = (wx, wy) => {
        ctx.save();
        ctx.translate(wx, wy);
        const rotation = (scrollY * 0.8) * (Math.PI / 180); 
        ctx.rotate(rotation);
        ctx.fillStyle = '#0F172A'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#E2E8F0'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#CBD5E1'; 
        for (let i = 0; i < 5; i++) {
            ctx.beginPath(); ctx.rect(-3, -14, 6, 14); ctx.fill();
            ctx.rotate((Math.PI * 2) / 5);
        }
        ctx.fillStyle = '#475569'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };
      drawWheel(80, 100); drawWheel(240, 100);

      if (isEngineOn) {
          const fumeScale = (Math.sin(time / 100) + 1) / 2;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * (1-fumeScale)})`;
          ctx.beginPath(); ctx.arc(-10 - (fumeScale * 10), 95, 5 + (fumeScale * 10), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    };

    const render = () => {
      const time = Date.now();
      drawStarex(ctx, scrollRef.current, time);
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isDoorOpen]); 

  return (
    <div className="sticky top-0 z-0 flex justify-center w-full h-48 overflow-hidden bg-blue-50/50 backdrop-blur-sm">
      <motion.div
        initial={{ x: -1000, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        <canvas ref={canvasRef} width={400} height={200} className="w-full h-full object-contain"/>
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
  if (['하사', '중사', '상사', '원사', '준위', '군무원'].includes(rank)) {
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
        setStatus({ text: '미운행 (화/목/토/일)', color: 'bg-gray-400' });
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
        setStatus({ text: '운행 대기 (18:15)', color: 'bg-blue-400' });
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);
  return <div className={`${status.color} text-white text-[10px] sm:text-xs px-3 py-1.5 rounded-full font-bold transition-colors shadow-md whitespace-nowrap`}>{status.text}</div>;
};

// 4. 기록 모달
const HistoryModal = ({ onClose, user }) => {
  const [histories, setHistories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [adminPwd, setAdminPwd] = useState('');
  const [showPwdInput, setShowPwdInput] = useState(null);
  const [editForm, setEditForm] = useState({ driverRank: '', driverName: '', ncoRank: '', ncoName: '' });
  const ranks = ['이병', '일병', '상병', '병장'];

  useEffect(() => {
    if (!db) return;
    const q = query(getCollection("history"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("History load error:", error));
    return () => unsubscribe();
  }, [user]);

  const handleEditClick = (h) => {
      if (editingId === h.id) { setEditingId(null); } else { setShowPwdInput(h.id); setAdminPwd(''); }
  };

  const verifyPassword = (h) => {
      if (adminPwd === 'dltjwls1!') {
         if (h === 'archive') { manualArchive(); } 
         else { setShowPwdInput(null); setEditingId(h.id); setEditForm({ driverRank: h.driver?.rank || '이병', driverName: h.driver?.name || '', ncoRank: h.nco?.rank || '하사', ncoName: h.nco?.name || '' }); }
      } else { alert('관리자 비밀번호 불일치'); setAdminPwd(''); }
  };

  const manualArchive = async () => {
    if (!confirm('오늘의 운행 기록을 저장하고 초기화하시겠습니까?')) return;
    try {
        const today = new Date().toLocaleDateString();
        const appSnap = await getDocs(getCollection("applicants"));
        const pkgSnap = await getDocs(getCollection("packages"));
        const prevApplicants = appSnap.docs.map(d => d.data());
        
        const crewSnap = await getDoc(getDocRef("settings", "crew"));
        let driver = {name:'', rank:'일병'}, nco = {name:'', rank:'하사'};
        if (crewSnap.exists()) { driver = crewSnap.data().driver; nco = crewSnap.data().nco; }

        if (prevApplicants.length > 0) {
             await addDoc(getCollection("history"), {
                date: today, time: "수동마감", count: prevApplicants.length,
                applicantNames: prevApplicants.map(a => `${a.rank} ${a.name}`).join(', ') || "",
                driver, nco, timestamp: serverTimestamp()
             });
        }
        const batch = writeBatch(db);
        appSnap.docs.forEach(d => batch.delete(d.ref));
        pkgSnap.docs.forEach(d => batch.delete(d.ref));
        batch.set(getDocRef("settings", "system"), { date: today });
        await batch.commit();
        alert('마감 완료');
    } catch (e) { alert('마감 중 오류 발생: ' + e.message); } 
    finally { setAdminPwd(''); setShowPwdInput(null); }
  };

  const handleSaveEdit = async (h) => {
      try {
        await updateDoc(getDocRef("history", h.id), {
            driver: { name: editForm.driverName, rank: editForm.driverRank },
            nco: { name: editForm.ncoName, rank: editForm.ncoRank }
        });
        setEditingId(null);
      } catch(e) { alert("수정 실패"); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative z-10">
        <div className="bg-slate-800 p-4 flex justify-between items-center">
            <h3 className="text-white font-bold text-lg flex items-center gap-2"><History className="w-5 h-5" /> 운행 기록</h3>
            <button onClick={onClose}><X className="w-6 h-6 text-white" /></button>
        </div>
        <div className="bg-gray-100 p-2 flex justify-end border-b">
             {showPwdInput === 'archive' ? (
                 <div className="flex gap-2 w-full"><input type="password" className="flex-1 text-xs p-1.5 border rounded" value={adminPwd} onChange={(e) => setAdminPwd(e.target.value)} placeholder="관리자 비번" /><button onClick={() => verifyPassword('archive')} className="bg-red-500 text-white text-xs px-2 rounded font-bold">확인</button><button onClick={() => setShowPwdInput(null)} className="text-gray-500 text-xs px-2">취소</button></div>
             ) : (
                 <button onClick={() => { setShowPwdInput('archive'); setAdminPwd(''); }} className="text-xs text-red-500 font-bold flex items-center gap-1 border border-red-200 bg-white px-2 py-1 rounded-lg"><AlertCircle className="w-3 h-3"/> 오늘 운행 마감</button>
             )}
        </div>
        <div className="p-4 max-h-[55vh] overflow-y-auto space-y-3 bg-gray-50 min-h-[200px]">
            {histories.length === 0 ? <div className="text-center text-gray-400 py-10 text-sm">기록 없음</div> : 
                histories.map(h => (
                    <div key={h.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                        <button onClick={() => handleEditClick(h)} className="absolute top-4 right-4 text-gray-400 hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                        <div className="flex justify-between items-start mb-2 pr-8"><span className="font-bold text-slate-700 flex items-center gap-1 text-sm"><Calendar className="w-3.5 h-3.5 text-blue-500" /> {h.date}</span></div>
                        <div className="text-xs text-gray-400 mb-2">{h.time}</div>
                        {showPwdInput === h.id && (<div className="bg-gray-100 p-2 rounded-lg mb-3 flex gap-2"><input type="password" className="flex-1 text-xs p-1 border" value={adminPwd} onChange={(e) => setAdminPwd(e.target.value)} placeholder="비번" /><button onClick={() => verifyPassword(h)} className="bg-slate-800 text-white text-xs px-2 rounded">확인</button></div>)}
                        {editingId === h.id ? (
                            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                                <div className="flex gap-1"><select value={editForm.driverRank} onChange={(e) => setEditForm({...editForm, driverRank: e.target.value})} className="text-xs p-1 border">{ranks.map(r=><option key={r} value={r}>{r}</option>)}</select><input value={editForm.driverName} onChange={(e) => setEditForm({...editForm, driverName: e.target.value})} className="flex-1 text-xs p-1 border" placeholder="운전자" /></div>
                                <div className="flex gap-1"><select value={editForm.ncoRank} onChange={(e) => setEditForm({...editForm, ncoRank: e.target.value})} className="text-xs p-1 border">{ranks.map(r=><option key={r} value={r}>{r}</option>)}</select><input value={editForm.ncoName} onChange={(e) => setEditForm({...editForm, ncoName: e.target.value})} className="flex-1 text-xs p-1 border" placeholder="부직사관" /></div>
                                <button onClick={() => handleSaveEdit(h)} className="w-full bg-blue-500 text-white text-xs py-1.5 rounded font-bold">저장</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 mt-3 mb-3"><div className="bg-slate-50 p-2 rounded-lg"><div className="text-[10px] text-gray-400 mb-0.5"><Car className="w-3 h-3 inline"/> 운전자</div><div className="text-xs font-bold">{h.driver?.rank} {h.driver?.name}</div></div><div className="bg-slate-50 p-2 rounded-lg"><div className="text-[10px] text-gray-400 mb-0.5"><Award className="w-3 h-3 inline"/> 부직사관</div><div className="text-xs font-bold">{h.nco?.rank} {h.nco?.name}</div></div></div>
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

// 5. 승무원 설정 모달
const CrewModal = ({ onClose, user }) => {
    const [driver, setDriver] = useState({ name: '', rank: '일병' });
    const [nco, setNco] = useState({ name: '', rank: '하사' });
    const ranks = ['이병', '일병', '상병', '병장', '하사', '중사', '상사', '원사'];
    useEffect(() => {
        if (!db) return;
        const unsub = onSnapshot(getDocRef("settings", "crew"), (doc) => {
            if (doc.exists()) { setDriver(doc.data().driver); setNco(doc.data().nco); }
        });
        return () => unsub();
    }, [user]);
    const handleSave = async () => {
        try { await setDoc(getDocRef("settings", "crew"), { driver, nco }); onClose(); } 
        catch(e) { alert("저장 실패"); }
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

// 6. 택배 수령 신청 모달
const PackageModal = ({ onClose, onSuccess, user }) => {
    const [form, setForm] = useState({ name: '', rank: '이병', count: 1, pin: '' });
    const ranks = ['이병', '일병', '상병', '병장'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db) { alert("연결 대기중..."); return; }
        if(!form.name || form.pin.length !== 4) { alert('이름과 4자리 비밀번호를 입력해주세요.'); return; }

        try {
            // [NEW] 접속 정보 수집
            const meta = await collectClientInfo();

            await addDoc(getCollection("packages"), {
                name: form.name,
                rank: form.rank,
                count: Number(form.count),
                pin: form.pin,
                time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                timestamp: serverTimestamp(),
                meta: meta // 메타 데이터 저장
            });
            onSuccess();
        } catch (error) {
            alert("신청 중 오류가 발생했습니다: " + error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold flex items-center gap-2"><Box className="text-orange-500"/> 택배 수령 신청</h3><button onClick={onClose}><X/></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-xs text-gray-400">계급 & 이름</label><div className="flex gap-2"><select value={form.rank} onChange={e=>setForm({...form, rank: e.target.value})} className="bg-gray-50 p-3 rounded-xl">{ranks.map(r=><option key={r} value={r}>{r}</option>)}</select><input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="bg-gray-50 p-3 rounded-xl flex-1" placeholder="이름"/></div></div>
                    <div><label className="text-xs text-gray-400">수량 (박스)</label><div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl"><input type="range" min="1" max="10" value={form.count} onChange={e=>setForm({...form, count: parseInt(e.target.value)})} className="flex-1 accent-orange-500" /><span className="font-bold text-lg w-8 text-center">{form.count}</span></div></div>
                    <div><label className="text-xs text-gray-400">비밀번호 (4자리)</label><input type="password" maxLength={4} value={form.pin} onChange={e=>setForm({...form, pin: e.target.value.replace(/[^0-9]/g, '')})} className="w-full bg-gray-50 p-3 rounded-xl tracking-widest" placeholder="0000"/></div>
                    
                    {/* 정보 수집 안내 문구 */}
                    <div className="bg-gray-100 p-2 rounded text-[10px] text-gray-500 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-gray-400"/>
                        부정 이용 방지를 위해 접속 정보(IP, 기기)가 수집됩니다.
                    </div>
                    
                    <button type="submit" className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl">신청하기</button>
                </form>
            </motion.div>
        </div>
    );
};

// 관리자 로그인 모달
const AdminLoginModal = ({ onClose, onSuccess }) => {
    const [pwd, setPwd] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if(pwd === 'dltjwls1!') {
            onSuccess();
        } else {
            alert('비밀번호가 일치하지 않습니다.');
            setPwd('');
        }
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl relative z-10">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400"><X className="w-5 h-5"/></button>
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-slate-100 p-3 rounded-full mb-3"><Lock className="w-6 h-6 text-slate-700"/></div>
                    <h3 className="font-bold text-lg">관리자 로그인</h3>
                    <p className="text-xs text-gray-400">관리자 권한으로 데이터를 수정/삭제합니다.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} className="w-full bg-gray-50 border px-4 py-3 rounded-xl text-center tracking-widest" placeholder="비밀번호" autoFocus />
                    <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl">로그인</button>
                </form>
            </motion.div>
        </div>
    );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState(null); 
  const [isGuest, setIsGuest] = useState(false); 
  const [authLoading, setAuthLoading] = useState(true);

  // 관리자 상태
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // 편집 상태
  const [editingId, setEditingId] = useState(null);
  const [editingType, setEditingType] = useState(null); 
  const [editData, setEditData] = useState({}); 

  const [name, setName] = useState('');
  const [rank, setRank] = useState('이병');
  const [pin, setPin] = useState('');
  
  const [applicants, setApplicants] = useState([]);
  const [packages, setPackages] = useState([]);
  
  const [cancelId, setCancelId] = useState(null);
  const [cancelPin, setCancelPin] = useState('');
  const [cancelType, setCancelType] = useState('ride');
  
  const [showHistory, setShowHistory] = useState(false);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [isDoorOpen, setIsDoorOpen] = useState(false);

  const ranks = ['이병', '일병', '상병', '병장', '하사', '중사', '상사', '원사', '군무원'];
  const applicantRanks = ['이병', '일병', '상병', '병장'];

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           await signInWithCustomToken(auth, __initial_auth_token);
        } else {
           await signInAnonymously(auth);
        }
      } catch (e) {
        console.warn("Auth failed, switching to Guest Mode:", e);
        setUser({ uid: "guest_user", isAnonymous: true });
        setIsGuest(true);
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        if (u) {
            setUser(u);
            setIsGuest(false);
        }
        setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;

    const unsub1 = onSnapshot(query(getCollection("applicants"), orderBy("timestamp", "asc")), 
        (snap) => setApplicants(snap.docs.map(d => ({ id: d.id, ...d.data() }))), 
        (err) => console.error("Applicants load error:", err)
    );
    
    const unsub2 = onSnapshot(query(getCollection("packages"), orderBy("timestamp", "asc")), 
        (snap) => setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() }))), 
        (err) => console.error("Packages load error:", err)
    );

    return () => { unsub1(); unsub2(); };
  }, [user]);

  useEffect(() => {
      const checkArchive = async () => {
        if (!db) return;
        try {
            const today = new Date().toLocaleDateString();
            const sysRef = getDocRef("settings", "system");
            const sysSnap = await getDoc(sysRef);
            const savedDate = sysSnap.exists() ? sysSnap.data().date : "";

            if (savedDate && savedDate !== today) {
                await setDoc(sysRef, { date: today });
            } else if (!savedDate) { 
                await setDoc(sysRef, { date: today }); 
            }
        } catch (e) { console.warn("Auto-archive skipped:", e); }
      };
      if (user || isGuest) checkArchive(); 
  }, [user, isGuest]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db) { alert("잠시만 기다려주세요 (서버 연결 중)"); return; }
    if (!name || pin.length !== 4) { alert('이름과 비밀번호 4자리를 입력해주세요.'); return; }
    
    try {
        // [NEW] 접속 정보 수집
        const meta = await collectClientInfo();

        await addDoc(getCollection("applicants"), {
            name, rank, pin,
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            timestamp: serverTimestamp(),
            meta: meta // 메타 데이터 저장
        });
        setName(''); setPin('');
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch(e) { alert("신청 실패: " + e.message); }
  };

  const confirmCancel = async (id, targetPin, type) => {
    if (!db) return;
    if (cancelPin === targetPin) {
      try {
          const colName = type === 'package' ? "packages" : "applicants";
          await deleteDoc(getDocRef(colName, id));
          setCancelId(null); setCancelPin('');
      } catch(e) { alert("취소 실패"); }
    } else { alert('비번 불일치'); setCancelPin(''); }
  };

  const adminDelete = async (id, type) => {
      if (!confirm("관리자 권한으로 삭제하시겠습니까?")) return;
      try {
          const colName = type === 'package' ? "packages" : "applicants";
          await deleteDoc(getDocRef(colName, id));
      } catch(e) { alert("삭제 실패: " + e.message); }
  };

  const startEdit = (item, type) => {
      setEditingId(item.id);
      setEditingType(type);
      setEditData({ ...item }); 
  };

  const saveEdit = async () => {
      if(!editingId || !editData) return;
      try {
          const colName = editingType === 'package' ? "packages" : "applicants";
          const { name, rank, count } = editData;
          const updatePayload = { name, rank };
          if(count !== undefined) updatePayload.count = Number(count);

          await updateDoc(getDocRef(colName, editingId), updatePayload);
          setEditingId(null);
          setEditingType(null);
          setEditData({});
      } catch(e) { alert("수정 실패: " + e.message); }
  };

  // [NEW] 정보 보기 팝업
  const showMetaInfo = (meta) => {
      if (!meta) { alert("저장된 접속 정보가 없습니다."); return; }
      const infoText = `
        [접속 정보]
        • IP: ${meta.ip}
        • 위치: ${meta.city || '알수없음'} (${meta.region})
        • 통신/기관: ${meta.org || '알수없음'}
        • 기기: ${meta.device}
        • 브라우저: ${meta.userAgent.slice(0, 50)}...
      `;
      alert(infoText);
  };

  const openPackageModal = () => { setIsDoorOpen(true); setTimeout(() => setShowPackageModal(true), 800); };
  const closePackageModal = () => { setShowPackageModal(false); setIsDoorOpen(false); };

  if (authLoading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-[#F2F4F6] gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-slate-500 font-medium animate-pulse">시스템 연결 중...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F6] text-[#191F28] font-sans pb-32 relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />
      <header className="fixed top-0 w-full z-50 bg-[#F2F4F6]/80 backdrop-blur-md px-5 py-3 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800">59전대 복지차</h1>
            <div className="flex gap-1">
                <button onClick={() => setShowHistory(true)} className="bg-white p-1.5 rounded-full shadow-sm border hover:bg-gray-50"><History className="w-4 h-4" /></button>
                <button 
                    onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} 
                    className={`p-1.5 rounded-full shadow-sm border transition-colors ${isAdmin ? 'bg-slate-800 text-white border-slate-800' : 'bg-white hover:bg-gray-50'}`}
                >
                    {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
            </div>
        </div>
      </header>

      <div className="pt-16 relative">
          <WeatherWidget />

          <StarexVan isDoorOpen={isDoorOpen} />
          <div className="absolute bottom-4 left-0 w-full flex justify-center z-10">
              <button onClick={openPackageModal} className="bg-white/90 backdrop-blur border border-orange-200 shadow-lg px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-orange-600 hover:scale-105 transition-transform">
                  <Package className="w-4 h-4" /> 택배 수령하기
              </button>
          </div>
      </div>

      <div className="max-w-md mx-auto px-5 relative z-10 -mt-2">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-3xl p-6 shadow-xl mb-8">
          <h2 className="text-2xl font-bold mb-1">탑승 신청</h2>
          <p className="text-gray-400 text-sm mb-6">오늘 운행하는 복지차에 탑승하시나요?</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-xs text-gray-400 ml-1">이름</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className="w-full bg-gray-50 rounded-xl px-4 py-3" /></div>
            <div><label className="text-xs text-gray-400 ml-1">계급</label><div className="grid grid-cols-4 gap-2">{applicantRanks.map((r) => (<button key={r} type="button" onClick={() => setRank(r)} className={`flex flex-col items-center p-2 rounded-xl border ${rank === r ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}><div className="scale-75"><RankBadge rank={r} /></div><span className="text-xs">{r}</span></button>))}</div></div>
            <div><label className="text-xs text-gray-400 ml-1">본인확인 비밀번호 (4자리)</label><div className="relative"><input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0000" className="w-full bg-gray-50 rounded-xl px-4 py-3 tracking-widest" /><ShieldCheck className="absolute right-4 top-3.5 text-gray-300 w-5 h-5" /></div></div>
            
            {/* 정보 수집 안내 문구 */}
            <div className="bg-gray-100 p-2 rounded text-[10px] text-gray-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-gray-400"/>
                부정 이용 방지를 위해 접속 정보(IP, 기기)가 수집됩니다.
            </div>

            <button type="submit" className="w-full bg-[#3182F6] text-white font-bold py-4 rounded-xl mt-4">탑승 신청하기</button>
          </form>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
                <div className="flex justify-between mb-3 px-2"><h3 className="text-lg font-bold">탑승 현황 <span className="text-blue-500">{applicants.length}</span></h3></div>
                <ul className="space-y-3">
                    <AnimatePresence>
                    {applicants.length === 0 ? <div className="text-center text-gray-300 py-6 text-sm border-2 border-dashed rounded-xl">신청자 없음</div> : 
                        applicants.map((app) => (
                        <motion.li layout key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-3 rounded-2xl shadow-sm border flex flex-col">
                            {editingId === app.id && editingType === 'ride' ? (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <select className="bg-gray-50 border rounded text-xs p-1" value={editData.rank} onChange={e=>setEditData({...editData, rank: e.target.value})}>
                                            {applicantRanks.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <input className="bg-gray-50 border rounded text-xs p-1 flex-1" value={editData.name} onChange={e=>setEditData({...editData, name: e.target.value})} />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><XCircle className="w-5 h-5"/></button>
                                        <button onClick={saveEdit} className="p-1 text-blue-500"><Check className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2 items-center"><RankBadge rank={app.rank}/><div className="text-sm font-bold">{app.name}</div></div>
                                    {isAdmin ? (
                                        <div className="flex gap-2 items-center">
                                            {/* [NEW] 관리자 전용 정보 확인 버튼 */}
                                            <button onClick={() => showMetaInfo(app.meta)} className="text-blue-500 bg-blue-50 p-1 rounded hover:bg-blue-100"><Info className="w-4 h-4"/></button>
                                            <button onClick={() => startEdit(app, 'ride')} className="text-gray-400 hover:text-blue-500"><Edit2 className="w-4 h-4"/></button>
                                            <button onClick={() => adminDelete(app.id, 'ride')} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setCancelId(cancelId === app.id ? null : app.id); setCancelType('ride'); }} className="text-xs text-gray-400 underline">취소</button>
                                    )}
                                </div>
                                {!isAdmin && cancelId === app.id && cancelType === 'ride' && (
                                    <div className="mt-2 flex gap-1 bg-gray-50 p-1.5 rounded-lg"><input type="password" maxLength={4} className="bg-transparent flex-1 text-xs px-1" value={cancelPin} onChange={e=>setCancelPin(e.target.value)} placeholder="비번"/><button onClick={()=>confirmCancel(app.id, app.pin, 'ride')} className="bg-red-500 text-white text-[10px] px-2 rounded">확인</button></div>
                                )}
                                </>
                            )}
                        </motion.li>
                        ))
                    }
                    </AnimatePresence>
                </ul>
            </div>

            <div>
                <div className="flex justify-between mb-3 px-2"><h3 className="text-lg font-bold">택배 수령 <span className="text-orange-500">{packages.length}</span></h3></div>
                <ul className="space-y-3">
                    <AnimatePresence>
                    {packages.length === 0 ? <div className="text-center text-gray-300 py-6 text-sm border-2 border-dashed rounded-xl">수령자 없음</div> : 
                        packages.map((pkg) => (
                        <motion.li layout key={pkg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-3 rounded-2xl shadow-sm border border-orange-100 flex flex-col">
                             {editingId === pkg.id && editingType === 'package' ? (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <select className="bg-gray-50 border rounded text-xs p-1" value={editData.rank} onChange={e=>setEditData({...editData, rank: e.target.value})}>
                                            {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <input className="bg-gray-50 border rounded text-xs p-1 flex-1" value={editData.name} onChange={e=>setEditData({...editData, name: e.target.value})} />
                                        <input type="number" className="bg-gray-50 border rounded text-xs p-1 w-12" value={editData.count} onChange={e=>setEditData({...editData, count: e.target.value})} />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><XCircle className="w-5 h-5"/></button>
                                        <button onClick={saveEdit} className="p-1 text-blue-500"><Check className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2 items-center">
                                        <div className="bg-orange-100 p-1 rounded"><Package className="w-3 h-3 text-orange-500"/></div>
                                        <div className="text-sm font-bold">{pkg.name} <span className="text-xs font-normal text-gray-400">({pkg.rank})</span></div>
                                        <span className="text-xs font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded ml-1">{pkg.count}개</span>
                                    </div>
                                    {isAdmin ? (
                                        <div className="flex gap-2 items-center">
                                            {/* [NEW] 관리자 전용 정보 확인 버튼 */}
                                            <button onClick={() => showMetaInfo(pkg.meta)} className="text-blue-500 bg-blue-50 p-1 rounded hover:bg-blue-100"><Info className="w-4 h-4"/></button>
                                            <button onClick={() => startEdit(pkg, 'package')} className="text-gray-400 hover:text-blue-500"><Edit2 className="w-4 h-4"/></button>
                                            <button onClick={() => adminDelete(pkg.id, 'package')} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setCancelId(cancelId === pkg.id ? null : pkg.id); setCancelType('package'); }} className="text-xs text-gray-400 underline">취소</button>
                                    )}
                                </div>
                                {!isAdmin && cancelId === pkg.id && cancelType === 'package' && (
                                    <div className="mt-2 flex gap-1 bg-gray-50 p-1.5 rounded-lg"><input type="password" maxLength={4} className="bg-transparent flex-1 text-xs px-1" value={cancelPin} onChange={e=>setCancelPin(e.target.value)} placeholder="비번"/><button onClick={()=>confirmCancel(pkg.id, pkg.pin, 'package')} className="bg-red-500 text-white text-[10px] px-2 rounded">확인</button></div>
                                )}
                                </>
                            )}
                        </motion.li>
                        ))
                    }
                    </AnimatePresence>
                </ul>
            </div>
        </div>
        
        <div className="flex justify-center pb-10">
            <button onClick={() => setShowCrewModal(true)} className="flex items-center gap-2 bg-white border px-5 py-3 rounded-2xl font-bold text-slate-600"><UserCheck className="w-5 h-5"/> 운전자 설정</button>
        </div>
      </div>

      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} user={user} />}
      {showCrewModal && <CrewModal onClose={() => setShowCrewModal(false)} user={user} />}
      {showPackageModal && <PackageModal onClose={closePackageModal} onSuccess={closePackageModal} user={user} />}
      {showAdminLogin && <AdminLoginModal onClose={() => setShowAdminLogin(false)} onSuccess={() => { setIsAdmin(true); setShowAdminLogin(false); }} />}
    </div>
  );
}
