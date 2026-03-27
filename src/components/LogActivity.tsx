import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { routes } from '../lib/routes';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronDown, Send, X, Footprints, Camera, Trash2, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

interface Props {
  challenge: any;
  onLogged: () => void;
  onMilestoneUnlocked?: (data: { waypoint: any; waypointIndex: number }) => void;
  onChallengeCompleted?: (challenge: any) => void;
}

const activityTypes = [
  { id: 'walk', label: 'Walk', icon: '🚶', color: 'bg-green-500/20 text-green-400' },
  { id: 'run', label: 'Run', icon: '🏃', color: 'bg-orange-500/20 text-orange-400' },
  { id: 'cycle', label: 'Cycle', icon: '🚴', color: 'bg-blue-500/20 text-blue-400' },
  { id: 'swim', label: 'Swim', icon: '🏊', color: 'bg-cyan-500/20 text-cyan-400' },
  { id: 'other', label: 'Other', icon: '⚡', color: 'bg-purple-500/20 text-purple-400' }
];

function stepsToKm(steps: number): number {
  const baseStride = 0.72;
  const jitter = 0.12;
  const stride = baseStride * (1 + (Math.random() * 2 - 1) * jitter);
  return (steps * stride) / 1000;
}

export function LogActivity({ challenge, onLogged, onMilestoneUnlocked, onChallengeCompleted }: Props) {
  const [activityType, setActivityType] = useState('walk');
  const [distance, setDistance] = useState('');
  const [steps, setSteps] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [unit, setUnit] = useState<'km' | 'miles'>('km');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStepsMode = activityType === 'walk';
  const route = routes.find(r => r.id === challenge?.routeId);
  const currentType = activityTypes.find(t => t.id === activityType)!;

  useEffect(() => {
    const savedUnit = localStorage.getItem('trailblaze_unit') as 'km' | 'miles';
    if (savedUnit) setUnit(savedUnit);
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUnitToggle = () => {
    const newUnit = unit === 'km' ? 'miles' : 'km';
    setUnit(newUnit);
    localStorage.setItem('trailblaze_unit', newUnit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStepsMode ? !steps : !distance) return;
    if (!auth.currentUser || !challenge) return;
    setLoading(true);
    setError('');

    try {
      let distanceKm: number;
      let logSteps: number | null = null;

      if (isStepsMode) {
        logSteps = parseInt(steps, 10);
        distanceKm = stepsToKm(logSteps);
      } else {
        distanceKm = unit === 'miles' ? parseFloat(distance) * 1.60934 : parseFloat(distance);
      }

      await addDoc(collection(db, 'logs'), {
        userId: auth.currentUser.uid,
        challengeId: challenge.id,
        activityType,
        distanceKm,
        ...(logSteps !== null && { steps: logSteps }),
        ...(photo && { photo }),
        date,
        notes,
        createdAt: new Date().toISOString()
      });

      const challengeRef = doc(db, 'challenges', challenge.id);
      const challengeSnap = await getDoc(challengeRef);
      const currentTotal = challengeSnap.data()?.totalDistanceLogged || 0;
      const newTotal = currentTotal + distanceKm;

      await updateDoc(challengeRef, {
        totalDistanceLogged: newTotal,
        status: newTotal >= challenge.totalDistanceKm ? 'completed' : 'active'
      });

      const routeData = routes.find(r => r.id === challenge.routeId);
      let firstUnlocked: { waypoint: any; waypointIndex: number } | null = null;
      if (routeData) {
        for (let i = 1; i < routeData.waypoints.length; i++) {
          const wp = routeData.waypoints[i];
          if (currentTotal < wp.distanceFromStart && newTotal >= wp.distanceFromStart) {
            await addDoc(collection(db, 'milestones'), {
              challengeId: challenge.id,
              userId: auth.currentUser.uid,
              waypointIndex: i,
              unlockedAt: new Date().toISOString()
            });
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4ade80', '#f97316', '#ffffff'] });
            if (!firstUnlocked) firstUnlocked = { waypoint: wp, waypointIndex: i };
          }
        }
      }

      const challengeCompleted = newTotal >= challenge.totalDistanceKm;
      onLogged();
      if (firstUnlocked) onMilestoneUnlocked?.(firstUnlocked);
      if (challengeCompleted) onChallengeCompleted?.(challenge);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h1 className="text-2xl font-headline font-bold">Log Activity</h1>
          {route && (
            <p className="text-xs text-text-secondary mt-0.5">{route.name} {route.country}</p>
          )}
        </div>
        <button onClick={onLogged} className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-secondary">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-32">
        {/* Activity Type — full width pills */}
        <div className="flex gap-2 mb-6">
          {activityTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setActivityType(type.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all",
                activityType === type.id
                  ? "bg-primary text-background shadow-lg shadow-primary/30 scale-105"
                  : "bg-surface border border-outline/20 text-text-secondary"
              )}
            >
              <span className="text-xl">{type.icon}</span>
              <span className="text-[9px] font-bold uppercase mt-1">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Big number input — the hero */}
        <div className="rounded-3xl bg-surface border border-outline/20 p-6 mb-5 text-center">
          {isStepsMode ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Footprints size={14} className="text-primary" />
                <span className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Steps</span>
              </div>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent border-none text-center p-0 text-6xl font-headline font-bold focus:ring-0 outline-none placeholder:text-outline/20"
              />
              <p className="text-[11px] text-primary/70 mt-2 font-medium">
                Your stride varies — distance is a surprise!
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Distance</span>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="0.0"
                  className="w-auto bg-transparent border-none text-center p-0 text-6xl font-headline font-bold focus:ring-0 outline-none placeholder:text-outline/20"
                  style={{ maxWidth: '200px' }}
                />
                <button
                  type="button"
                  onClick={handleUnitToggle}
                  className="text-primary text-lg font-bold uppercase"
                >
                  {unit}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Date + extras row */}
        <div className="flex gap-3 mb-5">
          {/* Date chip */}
          <div className="flex-1 relative">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
            <div className="bg-surface border border-outline/20 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Calendar size={16} className="text-primary shrink-0" />
              <span className="text-sm font-bold">
                {date === format(new Date(), 'yyyy-MM-dd') ? 'Today' : format(new Date(date + 'T00:00:00'), 'MMM d')}
              </span>
              <ChevronDown size={14} className="text-text-secondary ml-auto" />
            </div>
          </div>

          {/* Notes toggle */}
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className={cn(
              "bg-surface border rounded-2xl px-4 py-3 flex items-center gap-2 transition-colors",
              showNotes ? "border-primary text-primary" : "border-outline/20 text-text-secondary"
            )}
          >
            <span className="text-sm">📝</span>
            <span className="text-sm font-bold">Note</span>
          </button>

          {/* Photo button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "bg-surface border rounded-2xl px-4 py-3 flex items-center gap-2 transition-colors",
              photo ? "border-primary text-primary" : "border-outline/20 text-text-secondary"
            )}
          >
            <Camera size={16} />
          </button>
        </div>

        {/* Expandable notes */}
        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5"
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How was your adventure today?"
                rows={3}
                autoFocus
                className="w-full bg-surface border border-outline/20 rounded-2xl p-4 text-sm outline-none focus:border-primary transition-colors"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo preview */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoSelect}
        />
        <AnimatePresence>
          {photo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="relative rounded-2xl overflow-hidden">
                <img src={photo} alt="Activity" className="w-full h-44 object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
      </form>

      {/* Sticky submit button */}
      <div className="absolute bottom-0 left-0 w-full p-5 pb-6 bg-gradient-to-t from-background via-background to-transparent">
        <button
          type="submit"
          disabled={loading || (isStepsMode ? !steps : !distance)}
          onClick={handleSubmit}
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all",
            (isStepsMode ? steps : distance)
              ? "bg-primary text-background shadow-lg shadow-primary/30 active:scale-[0.98]"
              : "bg-surface border border-outline/20 text-text-secondary"
          )}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send size={18} />
              {isStepsMode ? `Log ${steps ? parseInt(steps).toLocaleString() + ' steps' : 'Steps'}` : `Log ${distance || '0'} ${unit}`}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
