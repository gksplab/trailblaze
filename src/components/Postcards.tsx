import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { routes, Waypoint } from '../lib/routes';
import { cn, formatDistance } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Share2, MapPin, X, Download } from 'lucide-react';

interface Props {
  challenge: any;
  profile?: any;
}

export function Postcards({ challenge, profile }: Props) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [selectedPostcard, setSelectedPostcard] = useState<{ wp: Waypoint; index: number } | null>(null);

  const route = routes.find(r => r.id === challenge?.routeId);
  const postcardWaypoints = route?.waypoints.slice(1) || []; // everything except start

  useEffect(() => {
    if (!challenge || !auth.currentUser) return;

    const q = query(
      collection(db, 'milestones'),
      where('challengeId', '==', challenge.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const ms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ms.sort((a: any, b: any) => (a.waypointIndex || 0) - (b.waypointIndex || 0));
      setMilestones(ms);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'milestones');
    });

    return () => unsub();
  }, [challenge]);

  const isUnlocked = (waypointIndex: number) => {
    return milestones.some(m => m.waypointIndex === waypointIndex);
  };

  const getStreetViewUrl = (wp: Waypoint) => {
    return `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${wp.lat},${wp.lng}&fov=90&heading=${wp.streetViewHeading}&pitch=10&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
  };

  const handleShare = async (wp: Waypoint) => {
    const text = `I just reached ${wp.name} on the ${route?.name} trail on Trailblaze! 🏔️ #Trailblaze`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Trailblaze Postcard', text, url: window.location.origin });
      } catch (err) { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <header className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Postcards</h1>
        <p className="text-text-secondary text-sm">
          {milestones.length} of {postcardWaypoints.length} unlocked
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {postcardWaypoints.map((wp, idx) => {
          const waypointIndex = idx + 1; // index in the full waypoints array
          const unlocked = isUnlocked(waypointIndex);

          return (
            <motion.div
              key={waypointIndex}
              whileTap={{ scale: 0.95 }}
              onClick={() => unlocked && setSelectedPostcard({ wp, index: waypointIndex })}
              className={cn(
                "relative aspect-[3/4] rounded-2xl overflow-hidden border border-outline/30 shadow-lg cursor-pointer",
                !unlocked && "bg-surface-low"
              )}
            >
              {unlocked ? (
                <>
                  <img
                    src={getStreetViewUrl(wp)}
                    alt={wp.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${wp.name}/600/400`; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[10px] font-bold uppercase text-primary tracking-widest">
                      {formatDistance(wp.distanceFromStart, profile?.units || 'km')}
                    </p>
                    <p className="text-xs font-bold text-white truncate">{wp.name}</p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <Lock size={18} className="text-text-secondary opacity-40" />
                  <p className="text-[10px] font-bold text-text-secondary truncate w-full">{wp.name}</p>
                  <p className="text-[9px] text-text-secondary opacity-50">
                    {formatDistance(wp.distanceFromStart, profile?.units || 'km')}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Postcard detail modal */}
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
              className="w-full max-w-md bg-surface rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="relative aspect-video shrink-0">
                <img
                  src={getStreetViewUrl(selectedPostcard.wp)}
                  alt={selectedPostcard.wp.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${selectedPostcard.wp.name}/600/400`; }}
                />
                <button
                  onClick={() => setSelectedPostcard(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-4 left-4 bg-primary text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {formatDistance(selectedPostcard.wp.distanceFromStart, profile?.units || 'km')} reached
                </div>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <MapPin size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">{route?.name}</span>
                  </div>
                  <h2 className="text-2xl font-headline font-bold">{selectedPostcard.wp.name}</h2>
                </div>

                <p className="text-text-secondary text-sm leading-relaxed">
                  {selectedPostcard.wp.postcard}
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleShare(selectedPostcard.wp)}
                    className="flex-1 btn-primary py-3"
                  >
                    <Share2 size={18} /> Share
                  </button>
                  <button
                    className="p-3 bg-surface-low rounded-xl border border-outline/30 text-text-secondary hover:text-primary transition-colors"
                    onClick={() => window.open(getStreetViewUrl(selectedPostcard.wp), '_blank')}
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
