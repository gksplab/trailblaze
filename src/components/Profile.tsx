import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs, deleteDoc, writeBatch, terminate, clearIndexedDbPersistence } from 'firebase/firestore';
import { formatDistance, getInitials, calculateStreak } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { LogOut, Ruler, Trophy, ChevronRight, RotateCcw, AlertTriangle, Flame } from 'lucide-react';

interface Props {
  profile: any;
}

export function Profile({ profile }: Props) {
  const [completedChallenges, setCompletedChallenges] = useState<any[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'challenges'),
      where('creatorId', '==', auth.currentUser.uid),
      where('status', '==', 'completed'),
      orderBy('startDate', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setCompletedChallenges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const fetchTotalDistance = async () => {
      const logsQ = query(collection(db, 'logs'), where('userId', '==', auth.currentUser?.uid));
      const logsSnap = await getDocs(logsQ);
      const logs = logsSnap.docs.map(d => d.data());
      const total = logs.reduce((acc, l) => acc + (l.distanceKm || 0), 0);
      setTotalDistance(total);
      setStreak(calculateStreak(logs as { date: string }[]));
    };

    fetchTotalDistance();
    return () => unsub();
  }, []);

  const handleUnitToggle = async () => {
    if (!auth.currentUser || !profile) return;
    const newUnit = profile.units === 'km' ? 'miles' : 'km';
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { units: newUnit });
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

  const handleResetProgress = async () => {
    if (!auth.currentUser) return;
    setResetting(true);
    try {
      const uid = auth.currentUser.uid;
      const batch = writeBatch(db);

      // Delete all user's logs
      const logsSnap = await getDocs(query(collection(db, 'logs'), where('userId', '==', uid)));
      logsSnap.docs.forEach(d => batch.delete(d.ref));

      // Delete all user's milestones
      const msSnap = await getDocs(query(collection(db, 'milestones'), where('userId', '==', uid)));
      msSnap.docs.forEach(d => batch.delete(d.ref));

      // Delete all challenges the user created
      const challengeSnap = await getDocs(query(collection(db, 'challenges'), where('creatorId', '==', uid)));
      challengeSnap.docs.forEach(d => batch.delete(d.ref));

      // Remove user as partner from any partner challenges
      const partnerSnap = await getDocs(query(collection(db, 'challenges'), where('partnerId', '==', uid)));
      partnerSnap.docs.forEach(d => batch.update(d.ref, { partnerId: null }));

      await batch.commit();
      // Terminate Firestore and clear its local cache so reload starts fresh
      await terminate(db);
      await clearIndexedDbPersistence(db);
      window.location.reload();
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setResetting(false);
    }
  };

  const avatarColor = profile?.avatarColor || '#4ade80';

  return (
    <div className="min-h-screen bg-background overflow-y-auto pb-28">
      {/* Hero */}
      <div
        className="relative px-6 pt-14 pb-8 flex flex-col items-center text-center"
        style={{ background: `linear-gradient(180deg, ${avatarColor}28 0%, transparent 100%)` }}
      >
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-xl mb-4"
          style={{ backgroundColor: avatarColor }}
        >
          {getInitials(profile?.name || 'T')}
        </div>
        <h2 className="text-2xl font-headline font-bold">{profile?.name || 'Trailblazer'}</h2>
        <p className="text-text-secondary text-sm mt-1">{auth.currentUser?.email}</p>
      </div>

      <div className="px-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 space-y-1">
            <p className="text-[9px] font-bold uppercase text-text-secondary tracking-widest">Distance</p>
            <p className="text-2xl font-headline font-bold text-primary">
              {formatDistance(totalDistance, profile?.units || 'km')}
            </p>
          </div>
          <div className="card p-4 space-y-1">
            <p className="text-[9px] font-bold uppercase text-text-secondary tracking-widest">Completed</p>
            <p className="text-2xl font-headline font-bold text-primary">
              {completedChallenges.length}
            </p>
          </div>
          <div className="card p-4 space-y-1">
            <p className="text-[9px] font-bold uppercase text-text-secondary tracking-widest flex items-center gap-1">
              <Flame size={10} className="text-orange-400" /> Streak
            </p>
            <p className="text-2xl font-headline font-bold text-orange-400">
              {streak.current}
            </p>
            <p className="text-[9px] text-text-secondary">best: {streak.longest}</p>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase text-text-secondary tracking-widest px-1">Preferences</p>
          <div className="card overflow-hidden">
            <button
              onClick={handleUnitToggle}
              className="w-full flex items-center justify-between p-4 active:bg-surface-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Ruler size={17} className="text-primary" />
                </div>
                <span className="font-medium text-sm">Distance Units</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
                  {profile?.units || 'km'}
                </span>
                <ChevronRight size={16} className="text-text-secondary" />
              </div>
            </button>
          </div>
        </div>

        {/* Hall of Fame */}
        {completedChallenges.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase text-text-secondary tracking-widest px-1">Hall of Fame</p>
            <div className="space-y-3">
              {completedChallenges.map((c) => (
                <div key={c.id} className="card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Trophy size={22} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{c.routeName}</h4>
                    <p className="text-xs text-text-secondary">
                      Finished {format(new Date(c.startDate), 'MMM yyyy')}
                    </p>
                  </div>
                  <p className="font-bold text-primary text-sm shrink-0">
                    {formatDistance(c.totalDistanceKm, profile?.units || 'km')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-500/20 text-red-400/70 font-bold text-sm active:bg-red-500/10 transition-colors"
          >
            <RotateCcw size={17} />
            Reset All Progress
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-500/30 text-red-400 font-bold text-sm active:bg-red-500/10 transition-colors"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Reset confirmation modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-surface rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle size={28} className="text-red-400" />
                </div>
                <h3 className="text-xl font-headline font-bold">Reset Everything?</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  This will permanently delete <strong>all your challenges, activity logs, and unlocked postcards</strong>. You'll start fresh as if you just signed up. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  disabled={resetting}
                  className="flex-1 py-3 rounded-2xl border border-outline/30 text-text-secondary font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetProgress}
                  disabled={resetting}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm active:bg-red-600 transition-colors"
                >
                  {resetting ? 'Resetting...' : 'Reset'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
