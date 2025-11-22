import React, { useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, History, Calendar, Users, UserCheck, X, Car, Award, Save, Edit2, Check } from 'lucide-react';

// --- Components ---

// 1. 차량 애니메이션 컴포넌트 (스타렉스)
const StarexVan = () => {
  const { scrollY } = useScroll();
  const [isEngineOn, setIsEngineOn] = useState(false);
  
  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsEngineOn(latest > 50);
    });
  }, [scrollY]);

  return (
    <div className="sticky top-0 z-0 flex justify-center w-full py-12 overflow-hidden bg-blue-50/50 backdrop-blur-sm">
      <motion.div
        initial={{ x: -1000, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          y: isEngineOn ? [0, -1, 1, 0] : 0
        }}
        transition={{ 
          x: { type: "spring", stiffness: 50, damping: 20 },
          y: { repeat: Infinity, duration: 0.2 }
        }}
        className="relative w-64 h-32"
      >
        {/* 차체 */}
        <div className="absolute bottom-0 w-full h-24 bg-gray-200 rounded-2xl shadow-lg border border-gray-300 overflow-hidden">
          <div className="absolute top-2 left-2 right-2 h-10 bg-slate-800 rounded-lg flex gap-1 px-1 items-center">
             <div className="w-1/3 h-8 bg-slate-900/50 rounded-md"></div>
             <div className="w-1/3 h-8 bg-slate-900/50 rounded-md"></div>
             <div className="w-1/3 h-8 bg-slate-900/50 rounded-md"></div>
          </div>
          <div className="absolute top-14 left-10 w-6 h-1 bg-gray-400 rounded-full"></div>
          <div className="absolute top-14 left-32 w-6 h-1 bg-gray-400 rounded-full"></div>
        </div>

        {/* 바퀴 */}
        <div className="absolute bottom-[-10px] left-8 w-12 h-12 bg-slate-800 rounded-full border-4 border-gray-300 flex items-center justify-center">
          <div className="w-4 h-4 bg-gray-500 rounded-full animate-spin"></div>
        </div>
        <div className="absolute bottom-[-10px] right-8 w-12 h-12 bg-slate-800 rounded-full border-4 border-gray-300 flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-500 rounded-full animate-spin"></div>
        </div>

        {/* 라이트 효과 */}
        <motion.div 
          animate={{ opacity: isEngineOn ? 1 : 0.3 }}
          className="absolute bottom-6 right-[-5px] w-4 h-8 bg-yellow-400 rounded-r-lg blur-[2px]"
        />
        <motion.div 
          animate={{ opacity: isEngineOn ? 0.8 : 0, scaleX: isEngineOn ? 1 : 0 }}
          className="absolute bottom-2 right-[-100px] w-24 h-16 bg-gradient-to-r from-yellow-200/50 to-transparent blur-xl origin-left"
        />
        
        <div className="absolute bottom-8 left-4 text-[10px] font-bold text-gray-400">HYUNDAI</div>
      </motion.div>
    </div>
  );
};

// 2. 계급장 뱃지
const RankBadge = ({ rank }) => {
  const getLines = () => {
    switch (rank) {
      case '이병': return 1;
      case '일병': return 2;
      case '상병': return 3;
      case '병장': return 4;
      case '하사': case '중사': case '상사': case '원사': return 0;
      default: return 1;
    }
  };
  const lines = getLines();
  
  if (['하사', '중사', '상사', '원사', '준위'].includes(rank)) {
      return (
        <div className="flex flex-col bg-slate-800 p-1.5 rounded w-8 h-8 justify-center items-center shadow-sm shrink-0">
            <div className="w-3 h-3 bg-yellow-400 rotate-45 shadow-[0_0_2px_rgba(250,204,21,0.8)]"></div>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-[2px] bg-slate-800 p-1.5 rounded w-8 h-8 justify-center items-center shadow-sm shrink-0">
      {Array.from({ length: lines }).map((_, i) => (
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
      const runningDays = [0, 2, 4, 6]; // 일, 화, 목, 토

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

  return (
    <div className={`${status.color} text-white text-xs px-3 py-1.5 rounded-full font-bold transition-colors shadow-md`}>
      {status.text}
    </div>
  );
};

// 4. 운행 기록 모달 (관리자 수정 기능 포함)
const HistoryModal = ({ onClose, histories, onUpdateHistory }) => {
  const [editingId, setEditingId] = useState(null);
  const [adminPwd, setAdminPwd] = useState('');
  const [showPwdInput, setShowPwdInput] = useState(null); // ID of item asking for pwd
  
  // 수정용 state
  const [editForm, setEditForm] = useState({
      driverRank: '', driverName: '', ncoRank: '', ncoName: ''
  });

  const ranks = ['이병', '일병', '상병', '병장', '하사', '중사', '상사', '원사'];

  const handleEditClick = (h) => {
      if (editingId === h.id) {
          setEditingId(null); // Toggle off
      } else {
          setShowPwdInput(h.id);
          setAdminPwd('');
      }
  };

  const verifyPassword = (h) => {
      if (adminPwd === '수송') {
          setShowPwdInput(null);
          setEditingId(h.id);
          setEditForm({
              driverRank: h.driver.rank,
              driverName: h.driver.name,
              ncoRank: h.nco.rank,
              ncoName: h.nco.name
          });
      } else {
          alert('관리자 비밀번호가 일치하지 않습니다.');
          setAdminPwd('');
      }
  };

  const handleSaveEdit = (originalHistory) => {
      const updatedHistory = {
          ...originalHistory,
          driver: { name: editForm.driverName, rank: editForm.driverRank },
          nco: { name: editForm.ncoName, rank: editForm.ncoRank }
      };
      onUpdateHistory(updatedHistory);
      setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative z-10"
      >
        <div className="bg-slate-800 p-4 flex justify-between items-center">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <History className="w-5 h-5" /> 실제 운행 기록
            </h3>
            <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-gray-50 min-h-[200px]">
            {histories.length === 0 ? (
                <div className="text-center text-gray-400 py-10 text-sm">
                    아직 저장된 운행 기록이 없습니다.
                </div>
            ) : (
                histories.slice().reverse().map(h => (
                    <div key={h.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                        {/* 수정 버튼 */}
                        <button 
                            onClick={() => handleEditClick(h)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-blue-500"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>

                        <div className="flex justify-between items-start mb-2 pr-8">
                            <span className="font-bold text-slate-700 flex items-center gap-1 text-sm">
                                <Calendar className="w-3.5 h-3.5 text-blue-500" /> {h.date}
                            </span>
                        </div>
                        <div className="text-xs text-gray-400 mb-2">{h.time} 기록됨</div>
                        
                        {/* 비밀번호 입력창 (수정 접근 시) */}
                        {showPwdInput === h.id && (
                             <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="bg-gray-100 p-2 rounded-lg mb-3"
                             >
                                <p className="text-[10px] text-gray-500 mb-1">관리자 비밀번호 입력</p>
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        className="flex-1 text-xs p-1 px-2 rounded border border-gray-300"
                                        value={adminPwd}
                                        onChange={(e) => setAdminPwd(e.target.value)}
                                        placeholder="비밀번호"
                                    />
                                    <button 
                                        onClick={() => verifyPassword(h)}
                                        className="bg-slate-800 text-white text-xs px-2 rounded"
                                    >확인</button>
                                </div>
                             </motion.div>
                        )}

                        {/* 수정 모드 vs 보기 모드 */}
                        {editingId === h.id ? (
                            <div className="bg-blue-50 p-3 rounded-lg space-y-2 border border-blue-100">
                                <div className="text-xs font-bold text-blue-800 mb-1">정보 수정</div>
                                <div className="flex gap-1">
                                    <select 
                                        value={editForm.driverRank}
                                        onChange={(e) => setEditForm({...editForm, driverRank: e.target.value})}
                                        className="text-xs p-1 rounded border"
                                    >{ranks.map(r=><option key={r} value={r}>{r}</option>)}</select>
                                    <input 
                                        value={editForm.driverName} 
                                        onChange={(e) => setEditForm({...editForm, driverName: e.target.value})}
                                        className="flex-1 text-xs p-1 rounded border" placeholder="운전자 이름" 
                                    />
                                </div>
                                <div className="flex gap-1">
                                    <select 
                                        value={editForm.ncoRank}
                                        onChange={(e) => setEditForm({...editForm, ncoRank: e.target.value})}
                                        className="text-xs p-1 rounded border"
                                    >{ranks.map(r=><option key={r} value={r}>{r}</option>)}</select>
                                    <input 
                                        value={editForm.ncoName} 
                                        onChange={(e) => setEditForm({...editForm, ncoName: e.target.value})}
                                        className="flex-1 text-xs p-1 rounded border" placeholder="부직사관 이름" 
                                    />
                                </div>
                                <button 
                                    onClick={() => handleSaveEdit(h)}
                                    className="w-full bg-blue-500 text-white text-xs py-1.5 rounded font-bold mt-1"
                                >
                                    저장 완료
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
                                <div className="bg-slate-50 p-2 rounded-lg">
                                    <div className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1"><Car className="w-3 h-3"/> 운전자</div>
                                    <div className="text-xs font-bold text-slate-700">
                                        {h.driver?.rank} {h.driver?.name || '-'}
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-lg">
                                    <div className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1"><Award className="w-3 h-3"/> 부직사관</div>
                                    <div className="text-xs font-bold text-slate-700">
                                        {h.nco?.rank} {h.nco?.name || '-'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {h.applicantNames && (
                            <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 leading-relaxed">
                                <span className="font-semibold text-gray-400 mr-1">탑승자({h.count}명):</span>
                                {h.applicantNames}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
      </motion.div>
    </div>
  );
};

// 5. 승무원 설정 모달 (단순 저장용)
const CrewModal = ({ onClose, driver, setDriver, nco, setNco, onSave }) => {
    const ranks = ['이병', '일병', '상병', '병장', '하사', '중사', '상사', '원사'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">승무원 설정</h3>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
                </div>

                <div className="space-y-6">
                    {/* 운전자 설정 */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                            <Car className="w-3.5 h-3.5" /> 운전자 (Driver)
                        </label>
                        <div className="flex gap-2">
                            <select 
                                className="bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-medium w-24 focus:ring-2 focus:ring-blue-500/20"
                                value={driver.rank}
                                onChange={(e) => setDriver({...driver, rank: e.target.value})}
                            >
                                {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <input 
                                type="text" 
                                placeholder="이름"
                                className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium flex-1 focus:ring-2 focus:ring-blue-500/20"
                                value={driver.name}
                                onChange={(e) => setDriver({...driver, name: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* 부직사관 설정 */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" /> 부직사관 (NCO)
                        </label>
                        <div className="flex gap-2">
                            <select 
                                className="bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-medium w-24 focus:ring-2 focus:ring-orange-500/20"
                                value={nco.rank}
                                onChange={(e) => setNco({...nco, rank: e.target.value})}
                            >
                                {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <input 
                                type="text" 
                                placeholder="이름"
                                className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium flex-1 focus:ring-2 focus:ring-orange-500/20"
                                value={nco.name}
                                onChange={(e) => setNco({...nco, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 my-4" />

                    <button 
                        onClick={onSave}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <Save className="w-5 h-5" />
                        설정 저장 (닫기)
                    </button>
                    <p className="text-[10px] text-center text-gray-400">
                        * 운전자와 부직사관 정보만 저장됩니다.<br/>운행 기록은 다음날 자동으로 저장됩니다.
                    </p>
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
  
  // 운전자 및 부직사관 상태
  const [driver, setDriver] = useState({ name: '', rank: '일병' });
  const [nco, setNco] = useState({ name: '', rank: '하사' });
  
  // 기록 상태
  const [histories, setHistories] = useState([]);

  const [cancelId, setCancelId] = useState(null);
  const [cancelPin, setCancelPin] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showCrewModal, setShowCrewModal] = useState(false);

  const ranks = ['이병', '일병', '상병', '병장'];

  // 초기 로드 및 자동 아카이빙(Auto-Archiving) 로직
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const savedDate = localStorage.getItem('welfare_date');
    const savedApplicantsRaw = localStorage.getItem('welfare_applicants');
    const savedDriverRaw = localStorage.getItem('welfare_driver');
    const savedNcoRaw = localStorage.getItem('welfare_nco');

    // 이전 데이터 복원
    const prevApplicants = savedApplicantsRaw ? JSON.parse(savedApplicantsRaw) : [];
    const prevDriver = savedDriverRaw ? JSON.parse(savedDriverRaw) : { name: '', rank: '일병' };
    const prevNco = savedNcoRaw ? JSON.parse(savedNcoRaw) : { name: '', rank: '하사' };

    // 기록 로드
    const savedHistories = localStorage.getItem('welfare_histories');
    let loadedHistories = [];
    if (savedHistories) {
        loadedHistories = JSON.parse(savedHistories);
        setHistories(loadedHistories);
    }

    // --- 핵심: 날짜가 바뀌었는지 체크 ---
    if (savedDate && savedDate !== today) {
        // 날짜가 다름! 어제(savedDate) 데이터를 기록으로 넘겨야 함
        if (prevApplicants.length > 0) {
            const newHistory = {
                id: Date.now(),
                date: savedDate, // 저장된 과거 날짜 사용
                time: "자동저장",
                count: prevApplicants.length,
                applicantNames: prevApplicants.map(a => `${a.rank} ${a.name}`).join(', '),
                driver: prevDriver,
                nco: prevNco
            };
            
            // 기록 업데이트 (상태 + 로컬스토리지)
            const updatedHistories = [...loadedHistories, newHistory];
            setHistories(updatedHistories);
            localStorage.setItem('welfare_histories', JSON.stringify(updatedHistories));
        }

        // 금일 데이터 초기화
        setApplicants([]);
        setDriver({ name: '', rank: '일병' });
        setNco({ name: '', rank: '하사' });
        localStorage.setItem('welfare_date', today);
        localStorage.setItem('welfare_applicants', JSON.stringify([]));
        localStorage.setItem('welfare_driver', JSON.stringify({ name: '', rank: '일병' }));
        localStorage.setItem('welfare_nco', JSON.stringify({ name: '', rank: '하사' }));
    } else {
        // 같은 날짜면 기존 데이터 로드
        setApplicants(prevApplicants);
        setDriver(prevDriver);
        setNco(prevNco);
        if (!savedDate) localStorage.setItem('welfare_date', today);
    }
  }, []);

  // 상태 변경 시 저장
  useEffect(() => {
    localStorage.setItem('welfare_applicants', JSON.stringify(applicants));
  }, [applicants]);

  useEffect(() => {
    localStorage.setItem('welfare_histories', JSON.stringify(histories));
  }, [histories]);

  useEffect(() => {
    localStorage.setItem('welfare_driver', JSON.stringify(driver));
    localStorage.setItem('welfare_nco', JSON.stringify(nco));
  }, [driver, nco]);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !pin || pin.length !== 4) {
      alert('이름과 4자리 비밀번호를 정확히 입력해주세요.');
      return;
    }
    const newApplicant = {
      id: Date.now(),
      name,
      rank,
      pin,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setApplicants(prev => [...prev, newApplicant]);
    setName('');
    setPin('');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const confirmCancel = (targetId, targetPin) => {
    if (cancelPin === targetPin) {
      setApplicants(applicants.filter(app => app.id !== targetId));
      setCancelId(null);
      setCancelPin('');
    } else {
      alert('비밀번호가 일치하지 않습니다.');
      setCancelPin('');
    }
  };

  // 기록 수정 핸들러
  const handleUpdateHistory = (updatedHistory) => {
      const newHistories = histories.map(h => 
          h.id === updatedHistory.id ? updatedHistory : h
      );
      setHistories(newHistories);
      alert('운행 기록 정보가 수정되었습니다.');
  };

  return (
    <div className="min-h-screen bg-[#F2F4F6] text-[#191F28] font-sans pb-32 relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />

      {/* 헤더 */}
      <header className="fixed top-0 w-full z-50 bg-[#F2F4F6]/80 backdrop-blur-md px-5 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800">59전대 복지차</h1>
            <button 
                onClick={() => setShowHistory(true)}
                className="bg-white p-1.5 rounded-full shadow-sm border border-gray-200 text-gray-500 hover:text-blue-500 transition-colors"
            >
                <History className="w-4 h-4" />
            </button>
        </div>
        <StatusBadge />
      </header>

      <div className="pt-16">
        <StarexVan />
      </div>

      <div className="max-w-md mx-auto px-5 relative z-10 -mt-6">
        
        {/* 신청 폼 */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 mb-8 ring-1 ring-gray-100"
        >
          <h2 className="text-2xl font-bold mb-1">탑승 신청</h2>
          <p className="text-gray-400 text-sm mb-6">오늘 운행하는 복지차에 탑승하시나요?</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="text-xs font-semibold text-gray-400 ml-1 mb-1 block">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-lg font-medium focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 ml-1 mb-2 block">계급</label>
              <div className="grid grid-cols-4 gap-2">
                {ranks.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRank(r)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      rank === r 
                        ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm transform scale-105' 
                        : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="scale-75 mb-1 origin-bottom">
                        <RankBadge rank={r} />
                    </div>
                    <span className="text-xs font-medium">{r}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 ml-1 mb-1 block">비밀번호 (숫자 4자리)</label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0000"
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-lg font-medium focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-300 tracking-widest"
                />
                <ShieldCheck className="absolute right-4 top-3.5 text-gray-300 w-5 h-5" />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#3182F6] hover:bg-[#1b64da] text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 mt-4 flex items-center justify-center gap-2">
              탑승 신청하기
            </button>
          </form>
        </motion.div>

        {/* 신청자 명단 */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xl font-bold text-slate-800">신청 현황 <span className="text-blue-500 ml-1">{applicants.length}명</span></h3>
                <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm">최신순</span>
            </div>

          <motion.ul layout className="space-y-3">
            <AnimatePresence>
              {applicants.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="text-center py-10 text-gray-400 bg-white/50 rounded-2xl border-dashed border-2 border-gray-200"
                  >
                    아직 신청자가 없습니다.<br/>첫 번째 신청자가 되어보세요!
                  </motion.div>
              ) : (
                [...applicants].reverse().map((applicant) => (
                  <motion.li
                    layout
                    key={applicant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden"
                  >
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                        <div className="shrink-0">
                            <RankBadge rank={applicant.rank} />
                        </div>
                        <div>
                            <div className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                {applicant.name}
                                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {applicant.rank}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400 font-medium">{applicant.time} 신청</div>
                        </div>
                        </div>
                        <button
                            onClick={() => setCancelId(cancelId === applicant.id ? null : applicant.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                cancelId === applicant.id ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-500 hover:bg-red-100'
                            }`}
                        >
                            {cancelId === applicant.id ? '닫기' : '취소'}
                        </button>
                    </div>
                    <AnimatePresence>
                        {cancelId === applicant.id && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-gray-400" />
                                    <input 
                                        type="password"
                                        maxLength={4}
                                        placeholder="비밀번호 4자리"
                                        className="bg-transparent border-none outline-none text-sm w-full font-medium"
                                        value={cancelPin}
                                        onChange={(e) => setCancelPin(e.target.value)}
                                        autoFocus
                                    />
                                    <button 
                                        onClick={() => confirmCancel(applicant.id, applicant.pin)}
                                        className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold shrink-0 active:scale-95 transition-transform"
                                    >
                                        확인
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </motion.li>
                ))
              )}
            </AnimatePresence>
          </motion.ul>
        </div>
        
        {/* 운행/승무원 관리 버튼 */}
        <div className="flex justify-center pb-10">
            <button 
                onClick={() => setShowCrewModal(true)}
                className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm px-5 py-3 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-colors active:scale-95"
            >
                <UserCheck className="w-5 h-5 text-slate-800" />
                운전자 및 부직사관 설정
            </button>
        </div>
      </div>
      
      {/* 하단 플로팅 메시지 */}
      <div className="fixed bottom-6 left-0 w-full flex justify-center pointer-events-none z-50">
        <div className="bg-black/80 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto">
            <span>🚀 59전대 복지차 안전운행 기원</span>
        </div>
      </div>

      {/* 모달들 */}
      <AnimatePresence>
        {showHistory && (
            <HistoryModal 
                histories={histories} 
                onClose={() => setShowHistory(false)}
                onUpdateHistory={handleUpdateHistory}
            />
        )}
        {showCrewModal && (
            <CrewModal 
                onClose={() => setShowCrewModal(false)}
                driver={driver} setDriver={setDriver}
                nco={nco} setNco={setNco}
                onSave={() => setShowCrewModal(false)}
            />
        )}
      </AnimatePresence>
    </div>
  );
}
