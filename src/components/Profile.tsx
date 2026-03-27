import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore';
import { cn, formatDistance, getInitials } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface Props {
  profile: any;
}

export function Profile({ profile }: Props) {
  const [completedChallenges, setCompletedChallenges] = useState<any[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'challenges'),
      where('creatorId', '==', auth.currentUser.uid),
      where('status', '==', 'completed'),
      orderBy('startDate', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setCompletedChallenges(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const fetchTotalDistance = async () => {
      const logsQ = query(
        collection(db, 'logs'),
        where('userId', '==', auth.currentUser?.uid)
      );
      const logsSnap = await getDocs(logsQ);
      const total = logsSnap.docs.reduce((acc, doc) => acc + (doc.data().distanceKm || 0), 0);
      setTotalDistance(total);
    };

    fetchTotalDistance();
    return () => unsub();
  }, []);

  const handleUnitToggle = async () => {
    if (!auth.currentUser || !profile) return;
    const newUnit = profile.units === 'km' ? 'miles' : 'km';
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        units: newUnit
      });
      localStorage.setItem('trailblaze_unit', newUnit);
    } catch (err) {
      console.error('Failed to update units:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-surface/60 to-surface z-10"></div>
        <img 
          className="w-full h-full object-cover opacity-20 scale-110" 
          alt="misty mountain peaks" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvAch9j9QTtQBq4wi5p-1WCYEH-vNArgWtvGezGbYPH0cY0v9qOib0Vanz_vV9kJGOgzgpzffrmgdCIjVx7qUD5l2-IiJdQT8GgYDeymT4woeBJ3_3cdZl4_TyAkyz7j7y5OmEQdjoxIgU4HItfWMNQQIs8lCLXyl5Sik_y1pKazahHOfSea7BFpNvK4gUSt58d5iEXvXHiy_HIukOg-WwnfYzB1E0EtKj-ibcUTXsIkVDOStYPmytFzVeVbmlD86vsRWZ7n8meMI"
          referrerPolicy="no-referrer"
        />
        <div className="grainy-overlay absolute inset-0 z-20"></div>
      </div>

      <header className="relative z-30 p-6 pt-12 flex justify-between items-center">
        <h1 className="text-4xl font-headline font-black tracking-tighter text-on-surface">PROFILE</h1>
        <button 
          onClick={handleLogout} 
          className="w-12 h-12 bg-surface-container/40 backdrop-blur-md rounded-2xl flex items-center justify-center text-error border border-error/20 hover:bg-error/10 transition-all active:scale-90"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </header>

      <main className="relative z-30 flex-1 overflow-y-auto px-6 pb-32 space-y-8">
        {/* User Info */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div 
              className="w-32 h-32 rounded-3xl flex items-center justify-center text-5xl font-headline font-black text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-surface-container/50 overflow-hidden"
              style={{ backgroundColor: profile?.avatarColor || '#4ade80' }}
            >
              {getInitials(profile?.name || 'U')}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-on-primary shadow-lg border-4 border-background">
              <span className="material-symbols-outlined text-sm">edit</span>
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-headline font-black tracking-tight text-on-surface">{profile?.name || 'Trailblazer'}</h2>
            <p className="text-on-surface-variant/50 text-xs font-body tracking-widest uppercase">{auth.currentUser?.email}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container/40 backdrop-blur-md rounded-3xl border border-outline-variant/10 p-6 space-y-3 group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-4xl">trending_up</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-sm">monitoring</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Lifetime</span>
            </div>
            <p className="text-2xl font-headline font-black text-on-surface">
              {formatDistance(totalDistance, profile?.units || 'km')}
            </p>
          </div>
          <div className="bg-surface-container/40 backdrop-blur-md rounded-3xl border border-outline-variant/10 p-6 space-y-3 group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-4xl">award</span>
            </div>
            <div className="flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Completed</span>
            </div>
            <p className="text-2xl font-headline font-black text-on-surface">
              {completedChallenges.length}
            </p>
          </div>
        </div>

        {/* Settings List */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-on-surface-variant/40 tracking-[0.3em] px-2">Settings</h3>
          <div className="bg-surface-container/40 backdrop-blur-md rounded-3xl border border-outline-variant/10 overflow-hidden divide-y divide-outline-variant/10">
            <button
              onClick={handleUnitToggle}
              className="w-full flex items-center justify-between p-5 hover:bg-surface-container/60 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container/60 flex items-center justify-center text-on-surface-variant/60 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">globe</span>
                </div>
                <span className="text-sm font-bold text-on-surface">Distance Units</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">{profile?.units || 'km'}</span>
                <span className="material-symbols-outlined text-on-surface-variant/30">chevron_right</span>
              </div>
            </button>
            
            <button className="w-full flex items-center justify-between p-5 hover:bg-surface-container/60 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container/60 flex items-center justify-center text-on-surface-variant/60 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">notifications</span>
                </div>
                <span className="text-sm font-bold text-on-surface">Notifications</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/30">chevron_right</span>
            </button>

            <button className="w-full flex items-center justify-between p-5 hover:bg-surface-container/60 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container/60 flex items-center justify-center text-on-surface-variant/60 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">security</span>
                </div>
                <span className="text-sm font-bold text-on-surface">Privacy & Security</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/30">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-on-surface-variant/40 tracking-[0.3em] px-2">Hall of Fame</h3>
            <div className="space-y-3">
              {completedChallenges.map((c) => (
                <div key={c.id} className="bg-surface-container/40 backdrop-blur-md rounded-3xl border border-outline-variant/10 p-5 flex items-center gap-4 group overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="material-symbols-outlined text-6xl">military_tech</span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">emoji_events</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline font-bold text-on-surface">{c.routeName}</h4>
                    <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest font-bold">Finished {format(new Date(c.startDate), 'MMM yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-headline font-black text-primary">{formatDistance(c.totalDistanceKm, profile?.units || 'km')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="flex flex-col items-center gap-2 pt-8 opacity-20 pb-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">info</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">Trailblaze v1.0.0</span>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest">Built for explorers by explorers.</p>
        </div>
      </main>
    </div>
  );
}
