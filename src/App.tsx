/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, limit, addDoc, updateDoc, Timestamp, getDocs } from 'firebase/firestore';
import { routes, Route, Waypoint } from './lib/routes';
import { Map, LogActivity, Postcards, Partner, Profile, Auth, ChallengeSetup } from './components';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MapPin, History, Trophy, Users, User as UserIcon, Plus } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'map' | 'log' | 'postcards' | 'partner' | 'profile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch profile
        const profileRef = doc(db, 'users', u.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
        }

        // Listen for active challenge
        const challengesQuery = query(
          collection(db, 'challenges'),
          where('status', '==', 'active'),
          where('creatorId', '==', u.uid)
        );
        
        const partnerQuery = query(
          collection(db, 'challenges'),
          where('status', '==', 'active'),
          where('partnerId', '==', u.uid)
        );

        const unsubChallenges = onSnapshot(challengesQuery, (snap) => {
          if (!snap.empty) {
            setActiveChallenge({ id: snap.docs[0].id, ...snap.docs[0].data() });
            setShowSetup(false);
          } else {
            // Check partner challenges
            const unsubPartner = onSnapshot(partnerQuery, (pSnap) => {
              if (!pSnap.empty) {
                setActiveChallenge({ id: pSnap.docs[0].id, ...pSnap.docs[0].data() });
                setShowSetup(false);
              } else {
                setActiveChallenge(null);
                setShowSetup(true);
              }
            }, (error) => {
              handleFirestoreError(error, OperationType.GET, 'challenges');
            });
            // Note: This cleanup is tricky because it's inside another listener.
            // In a real app, we might want to use a more robust state management.
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'challenges');
        });

        setLoading(false);
        return () => unsubChallenges();
      } else {
        setProfile(null);
        setActiveChallenge(null);
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
    return <ChallengeSetup onComplete={() => setShowSetup(false)} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'map':
        return <Map challenge={activeChallenge} profile={profile} />;
      case 'log':
        return <LogActivity challenge={activeChallenge} onLogged={() => setActiveTab('map')} />;
      case 'postcards':
        return <Postcards challenge={activeChallenge} />;
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
      </div>
    </ErrorBoundary>
  );
}
