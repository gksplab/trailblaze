/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, limit, addDoc, updateDoc, Timestamp, getDocs } from 'firebase/firestore';
import { routes, Route, Waypoint } from './lib/routes';
import { Map, LogActivity, Postcards, Partner, Profile, Auth, ChallengeSetup } from './components';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MapPin, History, Trophy, Users, User as UserIcon, Plus, X, Download } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'map' | 'log' | 'postcards' | 'partner' | 'profile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [allChallenges, setAllChallenges] = useState<any[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [showSetup, setShowSetup] = useState(false);
  const [unlockedPostcard, setUnlockedPostcard] = useState<{ waypoint: any; waypointIndex: number } | null>(null);
  const [completedChallenge, setCompletedChallenge] = useState<any>(null);
  const milestoneCardRef = useRef<HTMLDivElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  const activeChallenge = useMemo(
    () => allChallenges.find(c => c.id === selectedChallengeId) || allChallenges[0] || null,
    [allChallenges, selectedChallengeId]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Listen to profile in real-time so unit/name changes propagate immediately
        const profileRef = doc(db, 'users', u.uid);
        onSnapshot(profileRef, (snap) => {
          if (snap.exists()) setProfile(snap.data());
        });

        // Fetch all active challenges (created + joined) with two parallel listeners
        let creatorList: any[] = [];
        let partnerList: any[] = [];

        const merge = (creator: any[], partner: any[]) => {
          const combined = [...creator, ...partner];
          // deduplicate by id
          const unique = combined.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);
          setAllChallenges(unique);
          setShowSetup(unique.length === 0);
        };

        const unsubCreator = onSnapshot(
          query(collection(db, 'challenges'), where('status', '==', 'active'), where('creatorId', '==', u.uid)),
          (snap) => {
            creatorList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            merge(creatorList, partnerList);
          },
          (error) => handleFirestoreError(error, OperationType.GET, 'challenges')
        );

        const unsubPartner = onSnapshot(
          query(collection(db, 'challenges'), where('status', '==', 'active'), where('partnerId', '==', u.uid)),
          (snap) => {
            partnerList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            merge(creatorList, partnerList);
          },
          (error) => handleFirestoreError(error, OperationType.GET, 'challenges')
        );

        setLoading(false);
        return () => { unsubCreator(); unsubPartner(); };
      } else {
        setProfile(null);
        setAllChallenges([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant font-medium">Loading Trailblaze...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (showSetup) {
    return (
      <ChallengeSetup
        onComplete={() => setShowSetup(false)}
        onCancel={allChallenges.length > 0 ? () => setShowSetup(false) : undefined}
        existingChallenges={allChallenges}
        onResumeChallenge={(c) => { setSelectedChallengeId(c.id); setShowSetup(false); }}
      />
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'map':
        return (
          <Map
            challenge={activeChallenge}
            profile={profile}
            allChallenges={allChallenges}
            onSelectChallenge={(c) => setSelectedChallengeId(c.id)}
            onNewChallenge={() => setShowSetup(true)}
          />
        );
      case 'log':
        return (
          <LogActivity
            challenge={activeChallenge}
            onLogged={() => setActiveTab('map')}
            onMilestoneUnlocked={(data) => setUnlockedPostcard(data)}
            onChallengeCompleted={(c) => setCompletedChallenge(c)}
          />
        );
      case 'postcards':
        return <Postcards challenge={activeChallenge} profile={profile} />;
      case 'partner':
        return <Partner challenge={activeChallenge} profile={profile} />;
      case 'profile':
        return <Profile profile={profile} />;
      default:
        return <Map challenge={activeChallenge} profile={profile} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-screen bg-background flex flex-col max-w-[430px] mx-auto relative shadow-2xl overflow-hidden">
        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-surface-container/80 backdrop-blur-md border-t border-outline-variant/30 px-4 py-2 flex justify-around items-center z-50">
          <button
            onClick={() => setActiveTab('map')}
            className={cn("bottom-nav-item", activeTab === 'map' && "active")}
          >
            <MapPin size={24} fill={activeTab === 'map' ? "currentColor" : "none"} />
            <span className="text-[10px] font-bold uppercase">Map</span>
          </button>
          <button
            onClick={() => setActiveTab('postcards')}
            className={cn("bottom-nav-item", activeTab === 'postcards' && "active")}
          >
            <History size={24} />
            <span className="text-[10px] font-bold uppercase">Postcards</span>
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className="relative -top-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform"
          >
            <Plus size={32} className="text-background" />
          </button>
          <button
            onClick={() => setActiveTab('partner')}
            className={cn("bottom-nav-item", activeTab === 'partner' && "active", activeChallenge?.mode === 'solo' && "opacity-30 pointer-events-none")}
          >
            <Users size={24} />
            <span className="text-[10px] font-bold uppercase">Partner</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={cn("bottom-nav-item", activeTab === 'profile' && "active")}
          >
            <UserIcon size={24} />
            <span className="text-[10px] font-bold uppercase">Profile</span>
          </button>
        </nav>
        {/* Milestone postcard pop-up — same real-postcard style */}
        <AnimatePresence>
          {unlockedPostcard && (() => {
            const route = routes.find(r => r.id === activeChallenge?.routeId);
            const { waypoint } = unlockedPostcard;
            const svUrl = (size: string) => `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${waypoint.lat},${waypoint.lng}&fov=90&heading=${waypoint.streetViewHeading ?? 90}&pitch=10&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
            const userName = profile?.name || 'Trailblazer';
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                onClick={() => setUnlockedPostcard(null)}
              >
                <motion.div
                  initial={{ scale: 0.8, rotateX: 12 }}
                  animate={{ scale: 1, rotateX: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 180 }}
                  className="w-full max-w-md shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Unlock banner */}
                  <div className="text-center mb-2">
                    <span className="inline-block bg-primary text-background px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Postcard Unlocked!
                    </span>
                  </div>

                  {/* Capturable postcard area */}
                  <div ref={milestoneCardRef}>
                  {/* Photo side */}
                  <div className="relative rounded-t-2xl overflow-hidden aspect-[16/9]">
                    <img
                      src={svUrl('800x450')}
                      alt={waypoint.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${waypoint.name}/800/450`; }}
                    />
                    <button
                      onClick={() => setUnlockedPostcard(null)}
                      className="absolute top-3 right-3 p-1.5 bg-black/40 rounded-full text-white/80"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Postcard back */}
                  <div className="rounded-b-2xl p-5 relative overflow-hidden max-h-[45vh] overflow-y-auto" style={{ background: '#fdf6e3' }}>
                    <div className="text-center mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: '#8b7355' }}>POST CARD</p>
                      <div className="h-px mt-1" style={{ background: '#d4c5a9' }} />
                    </div>

                    <div className="flex gap-4 relative">
                      <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: '#d4c5a9' }} />

                      {/* Message */}
                      <div className="flex-1 pr-3">
                        <p className="text-[11px] leading-relaxed" style={{ color: '#3d3425', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', lineHeight: '1.7' }}>
                          {waypoint.postcard}
                        </p>
                      </div>

                      {/* Address + Stamp */}
                      <div className="flex-1 pl-3 flex flex-col">
                        <div className="self-end mb-3">
                          <div className="w-14 h-10 rounded-sm overflow-hidden border-2" style={{ borderColor: '#8b7355' }}>
                            <img src={svUrl('120x80')} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-[7px] text-center mt-0.5 font-bold uppercase tracking-widest" style={{ color: '#8b7355' }}>
                            {waypoint.distanceFromStart} km
                          </p>
                        </div>

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
                              <p className="text-xs font-bold" style={{ color: '#3d3425', fontFamily: 'Georgia, serif' }}>{waypoint.name}</p>
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

                    <div className="flex gap-3 mt-4 pt-3" style={{ borderTop: '1px solid #d4c5a9' }}>
                      <button
                        onClick={async () => {
                          if (!milestoneCardRef.current) return;
                          try {
                            const dataUrl = await toJpeg(milestoneCardRef.current, { quality: 0.92, backgroundColor: '#000000' });
                            const blob = await (await fetch(dataUrl)).blob();
                            const file = new File([blob], `trailblaze-${waypoint.name.toLowerCase().replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' });
                            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                              await navigator.share({ title: 'Trailblaze Postcard', text: `I reached ${waypoint.name}! 🏔️`, files: [file] });
                            } else {
                              const a = document.createElement('a');
                              a.href = dataUrl;
                              a.download = file.name;
                              a.click();
                            }
                          } catch (err) { console.error('Share failed:', err); }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: '#3d3425', color: '#fdf6e3' }}
                      >
                        <Download size={15} /> Save & Share
                      </button>
                      <button
                        onClick={() => setUnlockedPostcard(null)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
                        style={{ borderColor: '#d4c5a9', color: '#8b7355' }}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Completion certificate modal */}
        <AnimatePresence>
          {completedChallenge && (() => {
            const route = routes.find(r => r.id === completedChallenge.routeId);
            const userName = profile?.name || 'Trailblazer';
            const finishDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                onClick={() => setCompletedChallenge(null)}
              >
                <motion.div
                  initial={{ scale: 0.8, y: 30 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', damping: 18 }}
                  className="w-full max-w-md shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Capturable certificate */}
                  <div ref={certificateRef} className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                    {/* Gold border frame */}
                    <div className="m-3 border-2 border-yellow-600/40 rounded-xl p-6 text-center space-y-5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-yellow-600/70">Certificate of Completion</p>
                        <div className="w-16 h-px bg-yellow-600/40 mx-auto" />
                      </div>

                      <div className="text-5xl">🏆</div>

                      <div className="space-y-2">
                        <p className="text-yellow-600/60 text-xs uppercase tracking-widest">This certifies that</p>
                        <p className="text-2xl font-headline font-bold text-white">{userName}</p>
                        <p className="text-yellow-600/60 text-xs uppercase tracking-widest">has successfully completed</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xl font-headline font-bold text-primary">{route?.name}</p>
                        <p className="text-white/60 text-sm">{route?.country}</p>
                      </div>

                      <div className="flex justify-center gap-6 text-center">
                        <div>
                          <p className="text-lg font-headline font-bold text-white">{route?.totalDistance} km</p>
                          <p className="text-[9px] uppercase tracking-widest text-white/40">Distance</p>
                        </div>
                        <div className="w-px bg-yellow-600/20" />
                        <div>
                          <p className="text-lg font-headline font-bold text-white">{route?.waypoints.length}</p>
                          <p className="text-[9px] uppercase tracking-widest text-white/40">Waypoints</p>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2">
                        <div className="w-24 h-px bg-yellow-600/30 mx-auto" />
                        <p className="text-[10px] text-white/40">{finishDate}</p>
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-yellow-600/50">Trailblaze</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions below certificate */}
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={async () => {
                        if (!certificateRef.current) return;
                        try {
                          const dataUrl = await toJpeg(certificateRef.current, { quality: 0.92, backgroundColor: '#1a1a2e' });
                          const blob = await (await fetch(dataUrl)).blob();
                          const file = new File([blob], `trailblaze-certificate-${route?.id}.jpg`, { type: 'image/jpeg' });
                          if (navigator.share && navigator.canShare?.({ files: [file] })) {
                            await navigator.share({ title: 'Trailblaze Certificate', text: `I completed the ${route?.name} challenge!`, files: [file] });
                          } else {
                            const a = document.createElement('a'); a.href = dataUrl; a.download = file.name; a.click();
                          }
                        } catch {}
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-background font-bold text-sm"
                    >
                      <Download size={16} /> Save Certificate
                    </button>
                    <button
                      onClick={() => setCompletedChallenge(null)}
                      className="flex-1 py-3 rounded-2xl border border-outline/30 text-text-secondary font-bold text-sm"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
