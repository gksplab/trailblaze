import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, MarkerF, InfoWindow } from '@react-google-maps/api';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { routes, Route, Waypoint } from '../lib/routes';
import { cn, formatDistance } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, TrendingUp, Calendar, ChevronUp, ChevronDown, Check, X, Plus } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Props {
  challenge: any;
  profile: any;
  allChallenges?: any[];
  onSelectChallenge?: (challenge: any) => void;
  onNewChallenge?: () => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const mapOptions = {
  disableDefaultUI: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#1a2535" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a2535" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
  ]
};

export function Map({ challenge, profile, allChallenges = [], onSelectChallenge, onNewChallenge }: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    if (loadError) {
      console.error('Google Maps Load Error:', loadError);
    }
    console.log('Google Maps isLoaded:', isLoaded);
  }, [isLoaded, loadError]);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [partnerLogs, setPartnerLogs] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const route = useMemo(() => routes.find(r => r.id === challenge?.routeId), [challenge]);
  
  const totalUserDistance = useMemo(() => userLogs.reduce((acc, log) => acc + log.distanceKm, 0), [userLogs]);
  const totalPartnerDistance = useMemo(() => partnerLogs.reduce((acc, log) => acc + log.distanceKm, 0), [partnerLogs]);

  useEffect(() => {
    if (!challenge || !auth.currentUser) return;

    const userLogsQuery = query(
      collection(db, 'logs'),
      where('challengeId', '==', challenge.id),
      where('userId', '==', auth.currentUser.uid)
      // Removed orderBy to avoid index requirement for now
    );

    const unsubUserLogs = onSnapshot(userLogsQuery, (snap) => {
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory
      logs.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setUserLogs(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'logs');
    });

    let unsubPartnerLogs = () => {};
    if (challenge.mode === 'partner' && (challenge.partnerId || challenge.creatorId)) {
      const partnerId = challenge.creatorId === auth.currentUser.uid ? challenge.partnerId : challenge.creatorId;
      if (partnerId) {
        const partnerLogsQuery = query(
          collection(db, 'logs'),
          where('challengeId', '==', challenge.id),
          where('userId', '==', partnerId)
          // Removed orderBy to avoid index requirement for now
        );
        unsubPartnerLogs = onSnapshot(partnerLogsQuery, (snap) => {
          const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort in memory
          logs.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setPartnerLogs(logs);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'logs');
        });
      }
    }

    return () => {
      unsubUserLogs();
      unsubPartnerLogs();
    };
  }, [challenge]);

  const getPositionOnRoute = (distance: number) => {
    if (!route) return null;
    const waypoints = route.waypoints;
    if (distance <= 0) return waypoints[0];
    if (distance >= route.totalDistance) return waypoints[waypoints.length - 1];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      if (distance >= start.distanceFromStart && distance <= end.distanceFromStart) {
        const ratio = (distance - start.distanceFromStart) / (end.distanceFromStart - start.distanceFromStart);
        return {
          lat: start.lat + (end.lat - start.lat) * ratio,
          lng: start.lng + (end.lng - start.lng) * ratio
        };
      }
    }
    return waypoints[waypoints.length - 1];
  };

  const userPos = useMemo(() => getPositionOnRoute(totalUserDistance), [totalUserDistance, route]);
  const partnerPos = useMemo(() => getPositionOnRoute(totalPartnerDistance), [totalPartnerDistance, route]);

  const calculateBearing = (a: {lat: number, lng: number}, b: {lat: number, lng: number}) => {
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  };

  const streetViewData = useMemo(() => {
    if (!route) return null;
    const pos = userPos || route.waypoints[0];
    const wps = route.waypoints;

    // Find which segment the user is on for heading
    let heading = 90;
    for (let i = 0; i < wps.length - 1; i++) {
      if (totalUserDistance >= wps[i].distanceFromStart && totalUserDistance <= wps[i + 1].distanceFromStart) {
        heading = calculateBearing(wps[i], wps[i + 1]);
        break;
      }
    }
    if (totalUserDistance >= route.totalDistance && wps.length >= 2) {
      heading = calculateBearing(wps[wps.length - 2], wps[wps.length - 1]);
    }

    // Nearest passed waypoint name
    let nearestWp = wps[0];
    for (const wp of wps) {
      if (wp.distanceFromStart <= totalUserDistance) nearestWp = wp;
    }

    return { pos, heading, nearestWp };
  }, [route, userPos, totalUserDistance]);

  // Interactive 360° Street View panorama
  useEffect(() => {
    if (!streetViewRef.current || !isLoaded || !streetViewData) return;

    const pos = { lat: streetViewData.pos.lat, lng: streetViewData.pos.lng };
    const pov = { heading: streetViewData.heading, pitch: 5 };

    if (!panoramaRef.current) {
      panoramaRef.current = new google.maps.StreetViewPanorama(streetViewRef.current, {
        position: pos,
        pov,
        disableDefaultUI: true,
        linksControl: false,
        zoomControl: false,
        addressControl: false,
        fullscreenControl: false,
        motionTracking: false,
        motionTrackingControl: false,
        enableCloseButton: false,
        clickToGo: false,
      });
    } else {
      panoramaRef.current.setPosition(pos);
      panoramaRef.current.setPov(pov);
    }
  }, [isLoaded, streetViewData]);

  const onLoad = (map: google.maps.Map) => {
    setMap(map);
    if (route) {
      const bounds = new google.maps.LatLngBounds();
      route.waypoints.forEach(wp => bounds.extend(wp));
      map.fitBounds(bounds);
    }
  };


  if (loadError) {
    return (
      <div className="h-full bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4">
          <MapPin size={32} />
        </div>
        <h3 className="text-lg font-bold mb-2">Map Load Error</h3>
        <p className="text-sm text-text-secondary mb-4">
          {loadError.message.includes('ApiNotActivatedMapError') 
            ? 'The Maps JavaScript API is not enabled in your Google Cloud Console.' 
            : 'There was an error loading the map. Please check your API key and connection.'}
        </p>
        <a 
          href="https://console.cloud.google.com/google/maps-apis/api-list" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-primary py-2 px-4 text-xs"
        >
          Enable API in Console
        </a>
      </div>
    );
  }

  if (!isLoaded) return <div className="h-full bg-background animate-pulse" />;

  return (
    <div className="h-full flex flex-col relative">

      {/* ── Interactive 360° Street View (top 1/3) ── */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: '33%' }}>
        <div ref={streetViewRef} className="w-full h-full" />

        {/* gradient overlays — pointer-events-none so drag still works on panorama */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50 pointer-events-none" />

        {/* Challenge pill */}
        {challenge && (
          <div className="absolute top-3 left-0 right-0 flex justify-center z-10">
            <button
              onClick={() => setIsSwitcherOpen(true)}
              className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 shadow-lg active:scale-95 transition-transform"
            >
              <span className="text-sm font-bold text-white truncate max-w-[180px]">{route?.name}</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/80 text-black">
                {challenge?.mode || 'solo'}
              </span>
              <ChevronDown size={14} className="text-white/70 shrink-0" />
            </button>
          </div>
        )}

        {/* Location label */}
        {streetViewData?.nearestWp && (
          <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
              {formatDistance(totalUserDistance, profile?.units || 'km')} along the route
            </p>
            <p className="text-white text-sm font-bold truncate">{streetViewData.nearestWp.name}</p>
          </div>
        )}
      </div>

      {/* ── Google Map (bottom 2/3) ── */}
      <div className="relative flex-1 overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={userPos || { lat: 0, lng: 0 }}
          zoom={12}
          onLoad={onLoad}
          options={mapOptions}
        >
          {route && route.path && route.path.length > 0 && (
            <>
              <Polyline path={route.path} options={{ strokeColor: "#4ade80", strokeOpacity: 0.2, strokeWeight: 10 }} />
              <Polyline path={route.path} options={{ strokeColor: "#4ade80", strokeOpacity: 1, strokeWeight: 4 }} />

              {route.waypoints.map((wp, idx) => (
                <MarkerF
                  key={idx}
                  position={wp}
                  onClick={() => setSelectedWaypoint(wp)}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: totalUserDistance >= wp.distanceFromStart ? "#4ade80" : "#94a3b8",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                    scale: 6,
                  }}
                />
              ))}

              {userPos && (
                <MarkerF
                  position={userPos}
                  icon={{
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
                        <circle cx="22" cy="22" r="20" fill="#4ade80" stroke="#ffffff" stroke-width="2"/>
                        <text x="22" y="30" text-anchor="middle" font-size="24">🐱</text>
                      </svg>
                    `)}`,
                    scaledSize: new google.maps.Size(44, 44),
                    anchor: new google.maps.Point(22, 22),
                  }}
                />
              )}

              {partnerPos && challenge.mode === 'partner' && (
                <MarkerF
                  position={partnerPos}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: "#f97316",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3,
                    scale: 10,
                  }}
                />
              )}

              {selectedWaypoint && (
                <InfoWindow position={selectedWaypoint} onCloseClick={() => setSelectedWaypoint(null)}>
                  <div className="p-2 max-w-[200px]">
                    <h3 className="font-bold text-primary mb-1">{selectedWaypoint.name}</h3>
                    <p className="text-xs text-text-primary">{selectedWaypoint.funFact}</p>
                  </div>
                </InfoWindow>
              )}
            </>
          )}
        </GoogleMap>

        {/* Bottom Sheet Drawer */}
        <motion.div
          initial={{ y: '70%' }}
          animate={{ y: isDrawerOpen ? '0%' : '70%' }}
          transition={{ type: 'spring', damping: 20 }}
          className="absolute bottom-0 left-0 w-full bg-surface/95 backdrop-blur-xl rounded-t-3xl border-t border-outline/30 z-40 p-6 shadow-2xl"
        >
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-12 h-12 bg-surface/80 backdrop-blur-md rounded-full border border-outline/30 flex items-center justify-center text-primary shadow-lg"
          >
            {isDrawerOpen ? <ChevronDown /> : <ChevronUp />}
          </button>

          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-headline font-bold">{route?.name} {route?.country}</h2>
                <p className="text-text-secondary text-sm">
                  {formatDistance(totalUserDistance, profile?.units || 'km')} done of {formatDistance(route?.totalDistance || 0, profile?.units || 'km')}
                </p>
              </div>
              <span className="text-3xl font-headline font-bold text-primary">
                {Math.round((totalUserDistance / (route?.totalDistance || 1)) * 100)}%
              </span>
            </div>

            <div className="h-3 w-full bg-outline/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(totalUserDistance / (route?.totalDistance || 1)) * 100}%` }}
                className="h-full bg-gradient-to-r from-primary to-[#3baf65]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4 flex items-center gap-3">
                <Calendar className="text-text-secondary" size={20} />
                <div>
                  <p className="text-[10px] font-bold uppercase text-text-secondary">Est. Finish</p>
                  <p className="text-sm font-bold">{challenge?.targetEndDate ? format(new Date(challenge.targetEndDate), 'MMM d, yyyy') : 'N/A'}</p>
                </div>
              </div>
              <div className="card p-4 flex items-center gap-3">
                <TrendingUp className="text-text-secondary" size={20} />
                <div>
                  <p className="text-[10px] font-bold uppercase text-text-secondary">Remaining</p>
                  <p className="text-sm font-bold">{challenge?.targetEndDate ? differenceInDays(new Date(challenge.targetEndDate), new Date()) : 0} Days</p>
                </div>
              </div>
            </div>

            {userLogs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-text-secondary">Last Activity</h3>
                <div className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <Navigation size={20} />
                    </div>
                    <div>
                      <p className="font-bold capitalize">{userLogs[0].activityType}</p>
                      <p className="text-xs text-text-secondary">{format(new Date(userLogs[0].date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary">{formatDistance(userLogs[0].distanceKm, profile?.units || 'km')}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Challenge picker sheet — overlays the full screen */}
      <AnimatePresence>
        {isSwitcherOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsSwitcherOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="absolute bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl border-t border-outline/30 p-6 pb-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-headline font-bold">Your Challenges</h3>
                <button onClick={() => setIsSwitcherOpen(false)} className="p-1 text-text-secondary">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                {allChallenges.map((c) => {
                  const r = routes.find(r => r.id === c.routeId);
                  const progress = Math.round(((c.totalDistanceLogged || 0) / (c.totalDistanceKm || 1)) * 100);
                  const isActive = c.id === challenge?.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { onSelectChallenge?.(c); setIsSwitcherOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                        isActive ? "border-primary/50 bg-primary/10" : "border-outline/20 bg-surface-low active:bg-outline/10"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm truncate">{r?.name || c.routeName}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-surface border border-outline/30 text-text-secondary shrink-0">
                            {c.mode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-outline/20 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-text-secondary shrink-0">{progress}%</span>
                        </div>
                      </div>
                      {isActive && <Check size={18} className="text-primary shrink-0" />}
                    </button>
                  );
                })}
                <button
                  onClick={() => { setIsSwitcherOpen(false); onNewChallenge?.(); }}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-outline/40 text-text-secondary transition-colors"
                >
                  <Plus size={16} />
                  <span className="text-sm font-bold">Start New Challenge</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
