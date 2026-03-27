import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { routes, Route, Waypoint } from '../lib/routes';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Share2, MapPin, X, Download } from 'lucide-react';

interface Props {
  challenge: any;
}

export function Postcards({ challenge }: Props) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [selectedPostcard, setSelectedPostcard] = useState<any | null>(null);
  
  const route = routes.find(r => r.id === challenge?.routeId);
  const thresholds = [20, 40, 60, 80, 100];

  useEffect(() => {
    if (!challenge || !auth.currentUser) return;

    const q = query(
      collection(db, 'milestones'),
      where('challengeId', '==', challenge.id)
      // Removed orderBy to avoid index requirement for now
    );

    const unsub = onSnapshot(q, (snap) => {
      const ms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Fetched Milestones:', ms);
      // Sort in memory
      ms.sort((a: any, b: any) => (a.percentage || 0) - (b.percentage || 0));
      setMilestones(ms);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'milestones');
    });

    return () => unsub();
  }, [challenge]);

  const isUnlocked = (percentage: number) => {
    return milestones.some(m => m.percentage === percentage);
  };

  const getStreetViewUrl = (wp: Waypoint) => {
    return `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${wp.lat},${wp.lng}&fov=90&heading=235&pitch=10&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
  };

  const handleShare = async (wp: Waypoint, percentage: number) => {
    const text = `I just reached ${percentage}% of the ${route?.name} trail on Trailblaze! 🏔️ #Trailblaze #FitnessChallenge`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Trailblaze Milestone',
          text: text,
          url: window.location.origin
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-headline font-bold">Postcards</h1>
        <p className="text-text-secondary text-sm">Unlock memories as you blaze the trail.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {thresholds.map((t) => {
          const unlocked = isUnlocked(t);
          const wpIndex = Math.min(
            route?.waypoints.length || 0 - 1,
            Math.floor((t / 100) * ((route?.waypoints.length || 1) - 1))
          );
          const wp = route?.waypoints[wpIndex];

          return (
            <motion.div
              key={t}
              whileTap={{ scale: 0.95 }}
              onClick={() => unlocked && wp && setSelectedPostcard({ ...wp, percentage: t })}
              className={cn(
                "relative aspect-[3/4] rounded-2xl overflow-hidden border border-outline/30 shadow-lg cursor-pointer",
                !unlocked && "bg-surface-low"
              )}
            >
              {unlocked && wp ? (
                <>
                  <img
                    src={getStreetViewUrl(wp)}
                    alt={wp.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://picsum.photos/seed/${wp.name}/600/400`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[10px] font-bold uppercase text-primary tracking-widest">{t}% Reached</p>
                    <p className="text-xs font-bold text-white truncate">{wp.name}</p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-outline/10 flex items-center justify-center text-text-secondary">
                    <Lock size={20} />
                  </div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">{t}% Locked</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedPostcard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="relative aspect-video">
                <img
                  src={getStreetViewUrl(selectedPostcard)}
                  alt={selectedPostcard.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/seed/${selectedPostcard.name}/600/400`;
                  }}
                />
                <button
                  onClick={() => setSelectedPostcard(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-4 left-4 bg-primary text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {selectedPostcard.percentage}% Milestone
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <MapPin size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">{route?.name}</span>
                  </div>
                  <h2 className="text-2xl font-headline font-bold">{selectedPostcard.name}</h2>
                  <p className="text-text-secondary text-sm mt-2 italic">"{selectedPostcard.funFact}"</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleShare(selectedPostcard, selectedPostcard.percentage)}
                    className="flex-1 btn-primary py-3"
                  >
                    <Share2 size={18} />
                    Share Story
                  </button>
                  <button
                    className="p-3 bg-surface-low rounded-xl border border-outline/30 text-text-secondary hover:text-primary transition-colors"
                    onClick={() => window.open(getStreetViewUrl(selectedPostcard), '_blank')}
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
