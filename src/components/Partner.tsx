import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { cn, formatDistance, getInitials } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Bell, MessageSquare, TrendingUp, History, Copy, Check, UserPlus } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Props {
  challenge: any;
  profile: any;
}

export function Partner({ challenge, profile }: Props) {
  const [partnerProfile, setPartnerProfile] = useState<any | null>(null);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [nudged, setNudged] = useState(false);

  const partnerId = useMemo(() => {
    if (!challenge || !auth.currentUser) return null;
    return challenge.creatorId === auth.currentUser.uid ? challenge.partnerId : challenge.creatorId;
  }, [challenge]);

  useEffect(() => {
    if (!partnerId) return;

    const unsub = onSnapshot(doc(db, 'users', partnerId), (snap) => {
      if (snap.exists()) {
        setPartnerProfile({ id: snap.id, ...snap.data() });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${partnerId}`);
    });

    return () => unsub();
  }, [partnerId]);

  useEffect(() => {
    if (!challenge) return;

    const q = query(
      collection(db, 'logs'),
      where('challengeId', '==', challenge.id)
      // Removed orderBy to avoid index requirement for now
    );

    const unsub = onSnapshot(q, (snap) => {
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory and limit to 20
      logs.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds * 1000 || 0);
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds * 1000 || 0);
        return bTime - aTime;
      });
      setActivityFeed(logs.slice(0, 20));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'logs');
    });

    return () => unsub();
  }, [challenge]);

  const handleCopyInvite = () => {
    if (challenge?.inviteCode) {
      navigator.clipboard.writeText(challenge.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNudge = async () => {
    if (!challenge || nudged) return;
    try {
      await updateDoc(doc(db, 'challenges', challenge.id), {
        nudgePartner: true
      });
      setNudged(true);
      setTimeout(() => setNudged(false), 5000);
    } catch (err) {
      console.error('Nudge failed:', err);
    }
  };

  if (challenge?.mode === 'solo') {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center space-y-6 pb-24">
        <div className="w-20 h-20 rounded-full bg-surface-low flex items-center justify-center text-text-secondary">
          <Users size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-bold">Solo Trail</h2>
          <p className="text-text-secondary text-sm max-w-[250px]">
            You're blazing this trail alone! Complete this challenge to unlock Partner Mode for your next adventure.
          </p>
        </div>
      </div>
    );
  }

  if (!partnerId) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center space-y-8 pb-24">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary relative">
          <UserPlus size={48} />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full border-4 border-background"
          />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-headline font-bold">Invite a Partner</h2>
          <p className="text-text-secondary text-sm max-w-[280px]">
            Share your invite code with a friend to blaze this trail together!
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <div className="card p-6 flex flex-col items-center gap-4 bg-surface-low border-dashed border-2">
            <p className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Your Invite Code</p>
            <p className="text-4xl font-headline font-bold tracking-[0.2em] text-primary">{challenge?.inviteCode}</p>
            <button
              onClick={handleCopyInvite}
              className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-light transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pb-24 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-headline font-bold">Partner</h1>
        <button
          onClick={handleNudge}
          disabled={nudged}
          className={cn(
            "p-3 rounded-full transition-all",
            nudged ? "bg-primary text-background" : "bg-surface-low text-primary border border-outline/30"
          )}
        >
          <Bell size={20} className={nudged ? "animate-bounce" : ""} />
        </button>
      </header>

      {/* Partner Card */}
      <div className="card p-6 flex items-center gap-4 bg-gradient-to-br from-surface to-surface-low">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-xl"
          style={{ backgroundColor: partnerProfile?.avatarColor || '#4ade80' }}
        >
          {getInitials(partnerProfile?.name || 'P')}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-headline font-bold">{partnerProfile?.name || 'Partner'}</h2>
          <p className="text-xs text-text-secondary">
            {partnerProfile?.lastActive ? `Active ${formatDistanceToNow(new Date(partnerProfile.lastActive))} ago` : 'Offline'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Total</p>
          <p className="text-lg font-headline font-bold text-primary">
            {formatDistance(activityFeed.filter(l => l.userId === partnerId).reduce((acc, l) => acc + l.distanceKm, 0), profile?.units || 'km')}
          </p>
        </div>
      </div>

      {/* Stats Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Your Pace</span>
          </div>
          <p className="text-xl font-headline font-bold">
            {formatDistance(activityFeed.filter(l => l.userId === auth.currentUser?.uid).reduce((acc, l) => acc + l.distanceKm, 0), profile?.units || 'km')}
          </p>
        </div>
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2 text-text-secondary">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Partner Pace</span>
          </div>
          <p className="text-xl font-headline font-bold">
            {formatDistance(activityFeed.filter(l => l.userId === partnerId).reduce((acc, l) => acc + l.distanceKm, 0), profile?.units || 'km')}
          </p>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-text-secondary">
          <History size={16} />
          <h3 className="text-xs font-bold uppercase tracking-widest">Trail Activity</h3>
        </div>
        
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {activityFeed.map((log) => {
              const isMe = log.userId === auth.currentUser?.uid;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "flex gap-3 items-start",
                    isMe ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: isMe ? profile?.avatarColor : partnerProfile?.avatarColor }}
                  >
                    {getInitials(isMe ? profile?.name : partnerProfile?.name)}
                  </div>
                  <div className={cn(
                    "card p-3 max-w-[80%] space-y-1",
                    isMe ? "bg-primary/10 border-primary/20" : "bg-surface-low"
                  )}>
                    <div className="flex justify-between items-center gap-4">
                      <p className="text-[10px] font-bold uppercase text-text-secondary">
                        {isMe ? 'You' : partnerProfile?.name} logged
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {formatDistanceToNow(new Date(log.createdAt))} ago
                      </p>
                    </div>
                    <p className="text-sm font-bold">
                      {log.activityType === 'walk' ? '🚶' : log.activityType === 'run' ? '🏃' : log.activityType === 'cycle' ? '🚴' : '⚡'}{' '}
                      {formatDistance(log.distanceKm, profile?.units || 'km')}
                    </p>
                    {log.notes && (
                      <p className="text-xs text-text-secondary italic">"{log.notes}"</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
