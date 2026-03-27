import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { routes } from '../lib/routes';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Navigation, Calendar, FileText, Send, X } from 'lucide-react';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

interface Props {
  challenge: any;
  onLogged: () => void;
}

const activityTypes = [
  { id: 'walk', label: 'Walk', icon: '🚶' },
  { id: 'run', label: 'Run', icon: '🏃' },
  { id: 'cycle', label: 'Cycle', icon: '🚴' },
  { id: 'swim', label: 'Swim', icon: '🏊' },
  { id: 'other', label: 'Other', icon: '⚡' }
];

export function LogActivity({ challenge, onLogged }: Props) {
  const [activityType, setActivityType] = useState('walk');
  const [distance, setDistance] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [unit, setUnit] = useState<'km' | 'miles'>('km');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUnit = localStorage.getItem('trailblaze_unit') as 'km' | 'miles';
    if (savedUnit) setUnit(savedUnit);
  }, []);

  const handleUnitToggle = () => {
    const newUnit = unit === 'km' ? 'miles' : 'km';
    setUnit(newUnit);
    localStorage.setItem('trailblaze_unit', newUnit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distance || !auth.currentUser || !challenge) return;
    setLoading(true);
    setError('');

    try {
      const distanceKm = unit === 'miles' ? parseFloat(distance) * 1.60934 : parseFloat(distance);
      
      // 1. Create Log
      await addDoc(collection(db, 'logs'), {
        userId: auth.currentUser.uid,
        challengeId: challenge.id,
        activityType,
        distanceKm,
        date,
        notes,
        createdAt: new Date().toISOString()
      });

      // 2. Update Challenge Total
      const challengeRef = doc(db, 'challenges', challenge.id);
      const challengeSnap = await getDoc(challengeRef);
      const currentTotal = challengeSnap.data()?.totalDistanceLogged || 0;
      const newTotal = currentTotal + distanceKm;
      
      await updateDoc(challengeRef, {
        totalDistanceLogged: newTotal,
        status: newTotal >= challenge.totalDistanceKm ? 'completed' : 'active'
      });

      // 3. Check Milestones
      const route = routes.find(r => r.id === challenge.routeId);
      if (route) {
        const thresholds = [20, 40, 60, 80, 100];
        const oldPercent = (currentTotal / challenge.totalDistanceKm) * 100;
        const newPercent = (newTotal / challenge.totalDistanceKm) * 100;

        for (const t of thresholds) {
          if (oldPercent < t && newPercent >= t) {
            // Milestone unlocked!
            const waypointIndex = Math.min(
              route.waypoints.length - 1,
              Math.floor((t / 100) * (route.waypoints.length - 1))
            );

            await addDoc(collection(db, 'milestones'), {
              challengeId: challenge.id,
              userId: auth.currentUser.uid,
              percentage: t,
              waypointIndex,
              unlockedAt: new Date().toISOString()
            });

            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#4ade80', '#f97316', '#ffffff']
            });
          }
        }
      }

      onLogged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-headline font-bold">Log Activity</h1>
        <button onClick={onLogged} className="p-2 rounded-full hover:bg-surface-low transition-colors">
          <X size={24} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 space-y-8 pb-24">
        {/* Activity Type */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-text-secondary tracking-widest">Select Activity</label>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {activityTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setActivityType(type.id)}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-2xl transition-all",
                  activityType === type.id ? "bg-primary text-background shadow-lg shadow-primary/20" : "bg-surface border border-outline/30 text-text-secondary"
                )}
              >
                <span className="text-2xl mb-1">{type.icon}</span>
                <span className="text-[10px] font-bold uppercase">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div className="card p-6 space-y-4">
          <label className="text-xs font-bold uppercase text-text-secondary tracking-widest">Distance</label>
          <div className="flex items-end gap-3">
            <input
              type="number"
              step="0.1"
              required
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent border-none p-0 text-5xl font-headline font-bold focus:ring-0 outline-none placeholder:text-outline/30"
            />
            <div className="flex bg-surface-low rounded-lg p-1 border border-outline/30">
              <button
                type="button"
                onClick={handleUnitToggle}
                className={cn("px-3 py-1 rounded-md text-xs font-bold transition-colors", unit === 'km' ? "bg-primary text-background" : "text-text-secondary")}
              >
                KM
              </button>
              <button
                type="button"
                onClick={handleUnitToggle}
                className={cn("px-3 py-1 rounded-md text-xs font-bold transition-colors", unit === 'miles' ? "bg-primary text-background" : "text-text-secondary")}
              >
                MI
              </button>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="card p-6 space-y-4">
          <label className="text-xs font-bold uppercase text-text-secondary tracking-widest flex items-center gap-2">
            <Calendar size={14} /> Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-surface-low border-outline/30 rounded-lg p-3 text-lg font-bold outline-none focus:border-primary"
          />
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-text-secondary tracking-widest flex items-center gap-2">
            <FileText size={14} /> Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe your trail adventure..."
            rows={3}
            className="w-full bg-surface border border-outline/30 rounded-xl p-4 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary"
        >
          {loading ? 'Logging...' : 'Log It 🚀'}
          {!loading && <Send size={20} />}
        </button>
      </form>
    </div>
  );
}
