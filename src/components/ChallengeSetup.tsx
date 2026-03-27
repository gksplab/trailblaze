import React, { useState } from 'react';
import { routes, Route } from '../lib/routes';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Check, ChevronRight, Users, User, Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, addDays } from 'date-fns';

interface Props {
  onComplete: () => void;
  onCancel?: () => void;
  existingChallenges?: any[];
  onResumeChallenge?: (challenge: any) => void;
}

export function ChallengeSetup({ onComplete, onCancel, existingChallenges = [], onResumeChallenge }: Props) {
  const [step, setStep] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [mode, setMode] = useState<'solo' | 'partner' | null>(null);
  const [partnerAction, setPartnerAction] = useState<'create' | 'join' | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [targetDate, setTargetDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [noDeadline, setNoDeadline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateChallenge = async () => {
    if (!selectedRoute || !mode || !auth.currentUser) return;
    setLoading(true);
    setError('');

    try {
      const challengeData: any = {
        routeId: selectedRoute.id,
        routeName: selectedRoute.name,
        totalDistanceKm: selectedRoute.totalDistance,
        mode,
        creatorId: auth.currentUser.uid,
        partnerId: null,
        startDate: new Date().toISOString(),
        targetEndDate: noDeadline ? null : new Date(targetDate).toISOString(),
        status: 'active',
        nudgePartner: false
      };

      if (mode === 'partner') {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        challengeData.inviteCode = code;
      }

      await addDoc(collection(db, 'challenges'), challengeData);
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async () => {
    if (!inviteCode || !auth.currentUser) return;
    setLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'challenges'), where('inviteCode', '==', inviteCode), where('status', '==', 'active'));
      const snap = await getDocs(q);

      if (snap.empty) {
        throw new Error('Invalid invite code');
      }

      const challengeDoc = snap.docs[0];
      await updateDoc(doc(db, 'challenges', challengeDoc.id), {
        partnerId: auth.currentUser.uid
      });
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex gap-2 flex-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  step >= s ? "bg-primary" : "bg-outline/30"
                )}
              />
            ))}
          </div>
          {onCancel && (
            <button onClick={onCancel} className="p-1 text-text-secondary shrink-0">
              <X size={20} />
            </button>
          )}
        </div>
        <h1 className="text-3xl font-headline font-bold">
          {step === 1 && "Pick a Route"}
          {step === 2 && "Choose Mode"}
          {step === 3 && "Set Deadline"}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {step === 1 && (
          <div className="space-y-5">
            {routes.map((route) => {
              const existing = existingChallenges.find(c => c.routeId === route.id);
              const progress = existing
                ? Math.round(((existing.totalDistanceLogged || 0) / (existing.totalDistanceKm || 1)) * 100)
                : null;
              const isSelected = selectedRoute?.id === route.id;

              return (
                <button
                  key={route.id}
                  onClick={() => {
                    if (existing && onResumeChallenge) {
                      onResumeChallenge(existing);
                    } else {
                      setSelectedRoute(route);
                    }
                  }}
                  className={cn(
                    "w-full text-left rounded-3xl overflow-hidden transition-all border-2",
                    isSelected ? "border-primary shadow-lg shadow-primary/20" : "border-transparent"
                  )}
                >
                  {/* Cover image — tall and immersive */}
                  <div className="relative aspect-[16/9]">
                    <img
                      src={route.coverImage}
                      alt={route.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${route.id}/800/450`; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Badges on the image */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase">
                        {route.difficulty}
                      </span>
                      <span className="bg-primary/90 text-background px-2.5 py-1 rounded-lg text-[10px] font-bold">
                        {route.totalDistance} km
                      </span>
                    </div>

                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                        <Check size={16} className="text-background" />
                      </div>
                    )}

                    {/* In-progress overlay */}
                    {existing && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                        <span className="text-primary font-bold text-lg">In Progress — {progress}%</span>
                        <div className="w-2/3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-white/80 text-xs font-bold uppercase tracking-widest mt-1">Tap to Resume</span>
                      </div>
                    )}

                    {/* Route name on image */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-xl font-headline font-bold text-white">{route.name}</h3>
                      <p className="text-white/70 text-sm">{route.country}</p>
                    </div>
                  </div>

                  {/* Details below image */}
                  <div className="bg-surface p-4 space-y-3">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {route.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-text-secondary">
                      <span className="flex items-center gap-1">🗺 {route.postcardsCount} postcards</span>
                      <span className="w-1 h-1 rounded-full bg-outline/50" />
                      <span>{route.estimatedDays}</span>
                      <span className="w-1 h-1 rounded-full bg-outline/50" />
                      <span>{route.waypoints.length} stops</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setMode('solo'); setPartnerAction(null); }}
                className={cn(
                  "card p-6 flex flex-col items-center gap-3 transition-all",
                  mode === 'solo' ? "border-primary ring-1 ring-primary" : "border-outline/30"
                )}
              >
                <User size={32} className={mode === 'solo' ? "text-primary" : "text-text-secondary"} />
                <span className="font-bold">Solo</span>
              </button>
              <button
                onClick={() => setMode('partner')}
                className={cn(
                  "card p-6 flex flex-col items-center gap-3 transition-all",
                  mode === 'partner' ? "border-primary ring-1 ring-primary" : "border-outline/30"
                )}
              >
                <Users size={32} className={mode === 'partner' ? "text-primary" : "text-text-secondary"} />
                <span className="font-bold">Partner</span>
              </button>
            </div>

            {mode === 'partner' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <button
                  onClick={() => setPartnerAction('create')}
                  className={cn(
                    "w-full p-4 rounded-xl border flex items-center justify-between",
                    partnerAction === 'create' ? "border-primary bg-primary/10" : "border-outline/30"
                  )}
                >
                  <span className="font-medium">Create & Invite</span>
                  {partnerAction === 'create' && <Check size={20} className="text-primary" />}
                </button>
                <button
                  onClick={() => setPartnerAction('join')}
                  className={cn(
                    "w-full p-4 rounded-xl border flex items-center justify-between",
                    partnerAction === 'join' ? "border-primary bg-primary/10" : "border-outline/30"
                  )}
                >
                  <span className="font-medium">Join with Code</span>
                  {partnerAction === 'join' && <Check size={20} className="text-primary" />}
                </button>

                {partnerAction === 'join' && (
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full bg-surface-low border-outline/30 rounded-lg p-3 text-center text-xl font-bold tracking-widest outline-none focus:border-primary"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {/* No deadline toggle */}
            <button
              type="button"
              onClick={() => setNoDeadline(!noDeadline)}
              className={cn(
                "w-full p-4 rounded-xl border flex items-center justify-between transition-all",
                noDeadline ? "border-primary bg-primary/10" : "border-outline/30"
              )}
            >
              <span className="font-medium">Go at my own pace</span>
              <div className={cn(
                "w-10 h-6 rounded-full transition-colors flex items-center px-0.5",
                noDeadline ? "bg-primary" : "bg-outline/30"
              )}>
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full transition-transform shadow",
                  noDeadline && "translate-x-4"
                )} />
              </div>
            </button>

            {!noDeadline && (
              <div className="card p-6 space-y-4">
                <label className="text-xs font-bold uppercase text-text-secondary flex items-center gap-2">
                  <CalendarIcon size={14} /> Target End Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full bg-surface-low border-outline/30 rounded-lg p-3 text-lg font-bold outline-none focus:border-primary"
                />

                {selectedRoute && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm">
                      To finish by <strong>{format(new Date(targetDate), 'MMM d, yyyy')}</strong>, you'll need to average:
                    </p>
                    <p className="text-2xl font-headline font-bold text-primary mt-1">
                      {(selectedRoute.totalDistance / Math.max(1, (new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))).toFixed(1)} km / day
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="fixed bottom-0 left-0 w-full p-6 bg-background/80 backdrop-blur-md">
        <button
          disabled={loading || (step === 1 && !selectedRoute) || (step === 2 && !mode) || (step === 2 && mode === 'partner' && !partnerAction)}
          onClick={() => {
            if (step < 3) {
              if (step === 2 && partnerAction === 'join') {
                handleJoinChallenge();
              } else {
                setStep(step + 1);
              }
            } else {
              handleCreateChallenge();
            }
          }}
          className="w-full btn-primary"
        >
          {loading ? 'Processing...' : step === 3 ? 'Start Adventure 🚀' : 'Continue'}
          {!loading && <ChevronRight size={20} />}
        </button>
      </footer>
    </div>
  );
}
