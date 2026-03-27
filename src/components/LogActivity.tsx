import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { routes } from '../lib/routes';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Navigation, Calendar, FileText, Send, X, Footprints, Camera, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

interface Props {
  challenge: any;
  onLogged: () => void;
  onMilestoneUnlocked?: (data: { waypoint: any; waypointIndex: number }) => void;
  onChallengeCompleted?: (challenge: any) => void;
}

const activityTypes = [
  { id: 'walk', label: 'Walk', icon: '🚶' },
  { id: 'run', label: 'Run', icon: '🏃' },
  { id: 'cycle', label: 'Cycle', icon: '🚴' },
  { id: 'swim', label: 'Swim', icon: '🏊' },
  { id: 'other', label: 'Other', icon: '⚡' }
];

// Convert steps to km with a randomised stride length (element of surprise)
function stepsToKm(steps: number): number {
  // Average human stride: 0.65–0.85m depending on pace, height, terrain
  const baseStride = 0.72; // metres
  const jitter = 0.12; // ±12% variation
  const stride = baseStride * (1 + (Math.random() * 2 - 1) * jitter);
  return (steps * stride) / 1000;
}

export function LogActivity({ challenge, onLogged, onMilestoneUnlocked, onChallengeCompleted }: Props) {
  const [activityType, setActivityType] = useState('walk');
  const [distance, setDistance] = useState('');
  const [steps, setSteps] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [unit, setUnit] = useState<'km' | 'miles'>('km');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStepsMode = activityType === 'walk';

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

      // 1. Create Log
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

      // 2. Update Challenge Total
      const challengeRef = doc(db, 'challenges', challenge.id);
      const challengeSnap = await getDoc(challengeRef);
      const currentTotal = challengeSnap.data()?.totalDistanceLogged || 0;
      const newTotal = currentTotal + distanceKm;
      
      await updateDoc(challengeRef, {
        totalDistanceLogged: newTotal,
        status: newTotal >= challenge.totalDistanceKm ? 'completed' : 'active'
      });

      // 3. Check Milestones — one per waypoint (except start)
      const route = routes.find(r => r.id === challenge.routeId);
      let firstUnlocked: { waypoint: any; waypointIndex: number } | null = null;
      if (route) {
        for (let i = 1; i < route.waypoints.length; i++) {
          const wp = route.waypoints[i];
          if (currentTotal < wp.distanceFromStart && newTotal >= wp.distanceFromStart) {
            await addDoc(collection(db, 'milestones'), {
              challengeId: challenge.id,
              userId: auth.currentUser.uid,
              waypointIndex: i,
              unlockedAt: new Date().toISOString()
            });

            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#4ade80', '#f97316', '#ffffff']
            });

            if (!firstUnlocked) {
              firstUnlocked = { waypoint: wp, waypointIndex: i };
            }
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

        {/* Steps (walk) or Distance (other activities) */}
        {isStepsMode ? (
          <div className="card p-6 space-y-4">
            <label className="text-xs font-bold uppercase text-text-secondary tracking-widest flex items-center gap-2">
              <Footprints size={14} /> Steps
            </label>
            <input
              type="number"
              step="1"
              min="1"
              required
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent border-none p-0 text-5xl font-headline font-bold focus:ring-0 outline-none placeholder:text-outline/30"
            />
            <p className="text-xs text-text-secondary">
              Your stride varies each time — distance is a surprise!
            </p>
          </div>
        ) : (
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
        )}

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

        {/* Photo */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-text-secondary tracking-widest flex items-center gap-2">
            <Camera size={14} /> Photo (Optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          {photo ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={photo} alt="Activity" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={() => { setPhoto(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 rounded-xl border border-dashed border-outline/40 flex flex-col items-center justify-center gap-2 text-text-secondary active:bg-surface-low transition-colors"
            >
              <Camera size={20} />
              <span className="text-xs font-bold">Add a photo</span>
            </button>
          )}
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
