import React, { useState, useEffect, useRef } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { routes, Waypoint } from '../lib/routes';
import { cn, formatDistance } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Share2, X, Download } from 'lucide-react';
import { toJpeg } from 'html-to-image';

interface Props {
  challenge: any;
  profile?: any;
}

export function Postcards({ challenge, profile }: Props) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [selectedPostcard, setSelectedPostcard] = useState<{ wp: Waypoint; index: number } | null>(null);
  const postcardRef = useRef<HTMLDivElement>(null);

  const route = routes.find(r => r.id === challenge?.routeId);
  const postcardWaypoints = route?.waypoints.slice(1) || [];
  const userName = profile?.name || 'Trailblazer';

  useEffect(() => {
    if (!challenge || !auth.currentUser) return;
    const q = query(collection(db, 'milestones'), where('challengeId', '==', challenge.id));
    const unsub = onSnapshot(q, (snap) => {
      const ms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ms.sort((a: any, b: any) => (a.waypointIndex || 0) - (b.waypointIndex || 0));
      setMilestones(ms);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'milestones'));
    return () => unsub();
  }, [challenge]);

  const isUnlocked = (waypointIndex: number) => milestones.some(m => m.waypointIndex === waypointIndex);

  const getStreetViewUrl = (wp: Waypoint, size = '600x400') =>
    `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${wp.lat},${wp.lng}&fov=90&heading=${wp.streetViewHeading}&pitch=10&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;

  const handleShare = async (wp: Waypoint) => {
    if (!postcardRef.current) return;
    try {
      const dataUrl = await toJpeg(postcardRef.current, { quality: 0.92, backgroundColor: '#000000' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `trailblaze-${wp.name.toLowerCase().replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Trailblaze Postcard',
          text: `I reached ${wp.name} on the ${route?.name} trail! 🏔️`,
          files: [file],
        });
      } else {
        // Fallback: download the image
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = file.name;
        a.click();
      }
    } catch (err) {
      console.error('Share failed:', err);
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
          const waypointIndex = idx + 1;
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

      {/* ── Real postcard modal ── */}
      <AnimatePresence>
        {selectedPostcard && (() => {
          const { wp } = selectedPostcard;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
              onClick={() => setSelectedPostcard(null)}
            >
              <motion.div
                initial={{ scale: 0.85, rotateX: 10 }}
                animate={{ scale: 1, rotateX: 0 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="w-full max-w-md shadow-2xl"
                style={{ perspective: 1200 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Capturable postcard area */}
                <div ref={postcardRef}>
                {/* ─── FRONT: Photo side ─── */}
                <div className="relative rounded-t-2xl overflow-hidden aspect-[16/9]">
                  <img
                    src={getStreetViewUrl(wp, '800x450')}
                    alt={wp.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${wp.name}/800/450`; }}
                  />
                  <button
                    onClick={() => setSelectedPostcard(null)}
                    className="absolute top-3 right-3 p-1.5 bg-black/40 rounded-full text-white/80"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* ─── BACK: Classic postcard layout ─── */}
                <div
                  className="rounded-b-2xl p-5 relative overflow-hidden"
                  style={{ background: '#fdf6e3' }}
                >
                  {/* Subtle paper texture */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
                  }} />

                  {/* POST CARD header */}
                  <div className="text-center mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: '#8b7355' }}>
                      POST CARD
                    </p>
                    <div className="h-px mt-1" style={{ background: '#d4c5a9' }} />
                  </div>

                  <div className="flex gap-4 relative">
                    {/* Vertical divider */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: '#d4c5a9' }} />

                    {/* LEFT: Message */}
                    <div className="flex-1 pr-3 min-h-[140px]">
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{
                          color: '#3d3425',
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontStyle: 'italic',
                          lineHeight: '1.7',
                        }}
                      >
                        {wp.postcard}
                      </p>
                    </div>

                    {/* RIGHT: Address + Stamp */}
                    <div className="flex-1 pl-3 flex flex-col">
                      {/* Stamp */}
                      <div className="self-end mb-3">
                        <div
                          className="w-14 h-10 rounded-sm overflow-hidden border-2 relative"
                          style={{ borderColor: '#8b7355' }}
                        >
                          <img
                            src={getStreetViewUrl(wp, '120x80')}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 mix-blend-multiply" style={{ background: 'rgba(180,150,100,0.15)' }} />
                        </div>
                        <p className="text-[7px] text-center mt-0.5 font-bold uppercase tracking-widest" style={{ color: '#8b7355' }}>
                          {formatDistance(wp.distanceFromStart, profile?.units || 'km')}
                        </p>
                      </div>

                      {/* Address lines */}
                      <div className="space-y-2 flex-1">
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#a08c6c' }}>To</p>
                          <div className="border-b pb-1" style={{ borderColor: '#d4c5a9' }}>
                            <p className="text-xs font-bold" style={{ color: '#3d3425', fontFamily: 'Georgia, serif' }}>{userName}</p>
                          </div>
                          <div className="border-b pb-1 mt-1" style={{ borderColor: '#d4c5a9' }}>
                            <p className="text-[10px]" style={{ color: '#6b5d4d', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Trailblaze Explorer</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#a08c6c' }}>From</p>
                          <div className="border-b pb-1" style={{ borderColor: '#d4c5a9' }}>
                            <p className="text-xs font-bold" style={{ color: '#3d3425', fontFamily: 'Georgia, serif' }}>{wp.name}</p>
                          </div>
                          <div className="border-b pb-1 mt-1" style={{ borderColor: '#d4c5a9' }}>
                            <p className="text-[10px]" style={{ color: '#6b5d4d', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{route?.name}, {route?.country}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  </div>
                  {/* end capturable area */}

                  {/* Actions row (outside screenshot area) */}
                  <div className="flex gap-3 mt-4 pt-3" style={{ borderTop: '1px solid #d4c5a9' }}>
                    <button
                      onClick={() => handleShare(wp)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors"
                      style={{ background: '#3d3425', color: '#fdf6e3' }}
                    >
                      <Download size={15} /> Save & Share
                    </button>
                    <button
                      onClick={() => setSelectedPostcard(null)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors border"
                      style={{ borderColor: '#d4c5a9', color: '#8b7355' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
