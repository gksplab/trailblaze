import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs } from 'firebase/firestore';
import { formatDistance, getInitials } from '../lib/utils';
import { format } from 'date-fns';
import { LogOut, Ruler, Trophy, ChevronRight } from 'lucide-react';

interface Props {
  profile: any;
}

export function Profile({ profile }: Props) {
  const [completedChallenges, setCompletedChallenges] = useState<any[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);

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
      const total = logsSnap.docs.reduce((acc, d) => acc + (d.data().distanceKm || 0), 0);
      setTotalDistance(total);
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
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-5 space-y-1">
            <p className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Total Distance</p>
            <p className="text-3xl font-headline font-bold text-primary">
              {formatDistance(totalDistance, profile?.units || 'km')}
            </p>
            <p className="text-xs text-text-secondary">across all routes</p>
          </div>
          <div className="card p-5 space-y-1">
            <p className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Completed</p>
            <p className="text-3xl font-headline font-bold text-primary">
              {completedChallenges.length}
            </p>
            <p className="text-xs text-text-secondary">
              {completedChallenges.length === 1 ? 'challenge' : 'challenges'} finished
            </p>
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

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-500/30 text-red-400 font-bold text-sm active:bg-red-500/10 transition-colors"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
