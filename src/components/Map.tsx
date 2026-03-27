import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, MarkerF, InfoWindow } from '@react-google-maps/api';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { routes, Route, Waypoint } from '../lib/routes';
import { cn, formatDistance } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, TrendingUp, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Props {
  challenge: any;
  profile: any;
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

export function Map({ challenge, profile }: Props) {
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
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [partnerLogs, setPartnerLogs] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    <div className="h-full relative overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={userPos || { lat: 0, lng: 0 }}
        zoom={12}
        onLoad={onLoad}
        options={mapOptions}
      >
        {route && route.waypoints && route.waypoints.length > 0 && (
          <>
            {/* Polyline Glow */}
            <Polyline
              path={route.waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }))}
              options={{
                strokeColor: "#4ade80",
                strokeOpacity: 0.2,
                strokeWeight: 10,
              }}
            />
            <Polyline
              path={route.waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }))}
              options={{
                strokeColor: "#4ade80",
                strokeOpacity: 1,
                strokeWeight: 4,
              }}
            />

            {/* Waypoint Markers */}
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

            {/* User Marker */}
            {userPos && (
              <MarkerF
                position={userPos}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: "#4ade80",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 3,
                  scale: 10,
                }}
              />
            )}

            {/* Partner Marker */}
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
              <InfoWindow
                position={selectedWaypoint}
                onCloseClick={() => setSelectedWaypoint(null)}
              >
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
            <div className="text-right">
              <span className="text-3xl font-headline font-bold text-primary">
                {Math.round((totalUserDistance / (route?.totalDistance || 1)) * 100)}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
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
  );
}
