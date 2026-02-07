import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── TYPES ───────────────────────────────────────────────────────────
interface Clinic {
  id: string;
  name: string;
  category: 'hospital' | 'optical' | 'specialist' | 'community';
  address: string;
  lat: number;
  lng: number;
  distance?: number;
  phone?: string;
  hours?: string;
  services: string[];
}

// ─── HELPERS ─────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_RESULTS = 10;

/** Haversine distance in km */
const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
};

const getCategoryInfo = (cat: Clinic['category']): { label: string; color: string; bg: string; icon: string } => {
  switch (cat) {
    case 'hospital':
      return { label: 'Hospital', color: '#1565C0', bg: '#E3F2FD', icon: '🏥' };
    case 'optical':
      return { label: 'Optical', color: '#6A1B9A', bg: '#F3E5F5', icon: '👓' };
    case 'specialist':
      return { label: 'Eye Clinic', color: '#00838F', bg: '#E0F7FA', icon: '👁️' };
    case 'community':
      return { label: 'Health Centre', color: '#2E7D32', bg: '#E8F5E9', icon: '🏨' };
  }
};

const openDirections = (clinic: Clinic) => {
  const label = encodeURIComponent(clinic.name);
  const url = Platform.select({
    ios: `comgooglemaps://?daddr=${clinic.lat},${clinic.lng}&directionsmode=driving&q=${label}`,
    android: `google.navigation:q=${clinic.lat},${clinic.lng}&title=${label}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`,
  });
  const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`;
  Linking.canOpenURL(url!).then((ok) => Linking.openURL(ok ? url! : webFallback));
};

const openGoogleMapsSearch = (lat: number, lng: number, query: string) => {
  const q = encodeURIComponent(query);
  Linking.openURL(`https://www.google.com/maps/search/${q}/@${lat},${lng},14z`);
};

const callPhone = (phone: string) => {
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
};

// ─── OVERPASS API (OpenStreetMap) ─────────────────────────────────────
// Fetches real healthcare places near the user's coordinates.
// Free, no API key required — queries the public Overpass API.

const classifyPlace = (tags: Record<string, string>): Clinic['category'] => {
  const hc = (tags['healthcare'] ?? '').toLowerCase();
  const amenity = (tags['amenity'] ?? '').toLowerCase();
  const shop = (tags['shop'] ?? '').toLowerCase();
  const spec = (tags['healthcare:speciality'] ?? '').toLowerCase();
  const name = (tags['name'] ?? '').toLowerCase();

  if (shop === 'optician' || name.includes('optica') || name.includes('optician') || name.includes('optical'))
    return 'optical';
  if (hc === 'hospital' || amenity === 'hospital') return 'hospital';
  if (
    hc === 'clinic' || hc === 'doctor' || amenity === 'clinic' || amenity === 'doctors' ||
    spec.includes('ophthalmology') || spec.includes('optometry') || name.includes('eye')
  )
    return 'specialist';
  return 'community';
};

const inferServices = (tags: Record<string, string>, category: Clinic['category']): string[] => {
  const services: string[] = [];
  const name = (tags['name'] ?? '').toLowerCase();

  switch (category) {
    case 'hospital':
      services.push('Eye exams', 'Emergency eye care');
      if (name.includes('teaching') || name.includes('referral')) services.push('Specialist referrals');
      break;
    case 'optical':
      services.push('Prescription glasses', 'Contact lenses', 'Eye exams');
      break;
    case 'specialist':
      services.push('Eye exams', 'Vision screening');
      if (name.includes('laser') || name.includes('lasik')) services.push('LASIK surgery');
      break;
    case 'community':
      services.push('General health', 'Basic eye screening');
      break;
  }

  if (tags['healthcare:speciality']?.includes('ophthalmology')) services.push('Ophthalmology');
  if (tags['healthcare:speciality']?.includes('optometry')) services.push('Optometry');

  return [...new Set(services)];
};

/** Reverse-geocode a single coordinate into a human-readable place name */
const reverseGeocodeAddress = async (lat: number, lng: number): Promise<string> => {
  try {
    const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (geo) {
      const parts: string[] = [];
      if (geo.street) parts.push(geo.street);
      if (geo.district) parts.push(geo.district);
      else if (geo.subregion) parts.push(geo.subregion);
      if (geo.city) parts.push(geo.city);
      else if (geo.region) parts.push(geo.region);
      if (parts.length > 0) return parts.join(', ');
    }
  } catch { /* fall through */ }
  return 'Location available on map';
};

const fetchNearbyClinics = async (lat: number, lng: number, radiusKm: number = 30): Promise<Clinic[]> => {
  const radiusM = radiusKm * 1000;

  // Overpass QL — hospitals, clinics, doctors, opticians near the coords
  const query = `
[out:json][timeout:15];
(
  node["amenity"="hospital"](around:${radiusM},${lat},${lng});
  node["amenity"="clinic"](around:${radiusM},${lat},${lng});
  node["amenity"="doctors"](around:${radiusM},${lat},${lng});
  node["healthcare"="hospital"](around:${radiusM},${lat},${lng});
  node["healthcare"="clinic"](around:${radiusM},${lat},${lng});
  node["healthcare"="doctor"](around:${radiusM},${lat},${lng});
  node["healthcare"="optometrist"](around:${radiusM},${lat},${lng});
  node["shop"="optician"](around:${radiusM},${lat},${lng});
  way["amenity"="hospital"](around:${radiusM},${lat},${lng});
  way["amenity"="clinic"](around:${radiusM},${lat},${lng});
  way["healthcare"="hospital"](around:${radiusM},${lat},${lng});
  way["healthcare"="clinic"](around:${radiusM},${lat},${lng});
  way["shop"="optician"](around:${radiusM},${lat},${lng});
);
out center body;
`.trim();

  const url = 'https://overpass-api.de/api/interpreter';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
  const data = await res.json();

  const seen = new Set<string>();
  const clinics: Clinic[] = [];

  for (const el of data.elements ?? []) {
    const tags = el.tags ?? {};
    const name = tags['name'];
    if (!name) continue;

    // Deduplicate by normalised name
    const key = name.toLowerCase().replace(/\s+/g, '');
    if (seen.has(key)) continue;
    seen.add(key);

    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (!elLat || !elLng) continue;

    const category = classifyPlace(tags);
    const dist = haversineKm(lat, lng, elLat, elLng);

    const addrParts: string[] = [];
    if (tags['addr:street']) addrParts.push(tags['addr:street']);
    if (tags['addr:suburb']) addrParts.push(tags['addr:suburb']);
    if (tags['addr:city']) addrParts.push(tags['addr:city']);
    const address = addrParts.length > 0 ? addrParts.join(', ') : '';  // resolve later

    clinics.push({
      id: `osm-${el.id}`,
      name,
      category,
      address,
      lat: elLat,
      lng: elLng,
      distance: dist,
      phone: tags['phone'] || tags['contact:phone'] || undefined,
      hours: tags['opening_hours'] || undefined,
      services: inferServices(tags, category),
    });
  }

  clinics.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  const top = clinics.slice(0, MAX_RESULTS);

  // Reverse-geocode clinics that have no OSM address (resolve in parallel)
  const needsGeocode = top.filter(c => !c.address);
  if (needsGeocode.length > 0) {
    const resolved = await Promise.all(
      needsGeocode.map(c => reverseGeocodeAddress(c.lat, c.lng))
    );
    needsGeocode.forEach((c, i) => { c.address = resolved[i]; });
  }

  return top;
};

// ─── FILTER OPTIONS ──────────────────────────────────────────────────
type FilterCategory = 'all' | 'hospital' | 'optical' | 'specialist' | 'community';

const FILTER_OPTIONS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hospital', label: '🏥 Hospitals' },
  { key: 'optical', label: '👓 Optical' },
  { key: 'specialist', label: '👁️ Eye Clinics' },
  { key: 'community', label: '🏨 Health Centres' },
];

// ─── COMPONENT ───────────────────────────────────────────────────────
export default function ClinicsScreen() {
  const router = useRouter();

  // Location state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'requesting-permission' | 'acquiring-gps' | 'reverse-geocoding' | 'granted' | 'denied' | 'unavailable' | 'timeout' | 'error'
  >('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationTimestamp, setLocationTimestamp] = useState<number | null>(null);

  // Clinics state
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinicsStatus, setClinicsStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [clinicsError, setClinicsError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(30);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [expandedClinic, setExpandedClinic] = useState<string | null>(null);

  // Pulse animation
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  const isLocating =
    locationStatus === 'requesting-permission' ||
    locationStatus === 'acquiring-gps' ||
    locationStatus === 'reverse-geocoding';

  const isLoading = isLocating || clinicsStatus === 'loading';

  useEffect(() => {
    if (isLoading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isLoading]);

  // Request location on mount
  useEffect(() => { requestLocation(); }, []);

  // Fetch clinics once location arrives
  useEffect(() => {
    if (location && clinicsStatus === 'idle') {
      loadClinics(location.lat, location.lng);
    }
  }, [location]);

  const requestLocation = async () => {
    setLocationError(null);
    setLocationStatus('requesting-permission');

    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setLocationStatus('unavailable');
        setLocationError('Location services are turned off on your device.');
        return;
      }
    } catch { /* continue */ }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        setLocationError('Location permission was denied.');
        return;
      }
    } catch {
      setLocationStatus('error');
      setLocationError('Could not request location permission.');
      return;
    }

    setLocationStatus('acquiring-gps');
    try {
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ]);

      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocation(coords);
      setLocationTimestamp(Date.now());

      setLocationStatus('reverse-geocoding');
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
        if (geo) {
          const parts: string[] = [];
          if (geo.name && geo.name !== geo.city) parts.push(geo.name);
          if (geo.district) parts.push(geo.district);
          else if (geo.subregion) parts.push(geo.subregion);
          if (geo.city) parts.push(geo.city);
          else if (geo.region) parts.push(geo.region);
          setLocationName(parts.length > 0 ? parts.join(', ') : 'Your current location');
        } else {
          setLocationName('Your current location');
        }
      } catch {
        setLocationName('Your current location');
      }

      setLocationStatus('granted');
    } catch (e: any) {
      if (e?.message === 'timeout') {
        setLocationStatus('timeout');
        setLocationError('GPS took too long. You may be indoors or have weak signal.');
      } else {
        setLocationStatus('error');
        setLocationError('Could not determine your location.');
      }
    }
  };

  const loadClinics = async (lat: number, lng: number, radius: number = searchRadius) => {
    setClinicsStatus('loading');
    setClinicsError(null);
    try {
      let results = await fetchNearbyClinics(lat, lng, radius);

      // Auto-expand radius if too few results
      if (results.length < 3 && radius < 80) {
        const expanded = radius + 30;
        setSearchRadius(expanded);
        results = await fetchNearbyClinics(lat, lng, expanded);
      }

      setClinics(results);
      setClinicsStatus('done');
    } catch {
      setClinicsStatus('error');
      setClinicsError('Could not fetch nearby clinics. Check your internet connection.');
    }
  };

  const openDeviceSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings?.() ?? Linking.openURL('android.settings.LOCATION_SOURCE_SETTINGS');
    }
  };

  const getTimeSinceLocation = (): string => {
    if (!locationTimestamp) return '';
    const secs = Math.floor((Date.now() - locationTimestamp) / 1000);
    if (secs < 60) return 'just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  };

  const hasLocationError =
    locationStatus === 'denied' ||
    locationStatus === 'unavailable' ||
    locationStatus === 'timeout' ||
    locationStatus === 'error';

  // Local filter on already-fetched results
  const visibleClinics = useCallback((): Clinic[] => {
    let filtered = [...clinics];
    if (activeFilter !== 'all') filtered = filtered.filter(c => c.category === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.services.some(s => s.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [clinics, searchQuery, activeFilter])();

  // ─── Clinic card ────────────────────────────
  const renderClinicCard = ({ item, index }: { item: Clinic; index: number }) => {
    const cat = getCategoryInfo(item.category);
    const isExpanded = expandedClinic === item.id;

    return (
      <TouchableOpacity
        style={styles.clinicCard}
        onPress={() => setExpandedClinic(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>{index + 1}</Text>
        </View>

        <View style={styles.clinicHeader}>
          <View style={styles.clinicHeaderLeft}>
            <Text style={styles.clinicIcon}>{cat.icon}</Text>
            <View style={styles.clinicTitleBlock}>
              <Text style={styles.clinicName} numberOfLines={2}>{item.name}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: cat.bg }]}>
                <Text style={[styles.categoryBadgeText, { color: cat.color }]}>{cat.label}</Text>
              </View>
            </View>
          </View>
          {item.distance !== undefined && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.clinicAddress}>📍 {item.address}</Text>

        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.servicesContainer}>
              <Text style={styles.servicesTitle}>Services</Text>
              <View style={styles.servicesTags}>
                {item.services.map((s, i) => (
                  <View key={i} style={styles.serviceTag}>
                    <Text style={styles.serviceTagText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {item.hours && <Text style={styles.clinicHours}>🕐 {item.hours}</Text>}

            <View style={styles.clinicActions}>
              <TouchableOpacity style={styles.directionsBtn} onPress={() => openDirections(item)}>
                <Text style={styles.directionsBtnText}>🗺️ Directions</Text>
              </TouchableOpacity>
              {item.phone && (
                <TouchableOpacity style={styles.callBtn} onPress={() => callPhone(item.phone!)}>
                  <Text style={styles.callBtnText}>📞 Call</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {!isExpanded && <Text style={styles.tapHint}>Tap for details & directions</Text>}
      </TouchableOpacity>
    );
  };

  // ─── RENDER ────────────────────────────────────
  return (
    <View style={styles.screenFlex}>
      {/* Header */}
      <View style={styles.headerBanner}>
        <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>🏥</Text>
        <Text style={styles.headerTitle}>Find Eye Clinics</Text>
        <Text style={styles.headerSubtitle}>
          {clinicsStatus === 'done' && locationName
            ? `${visibleClinics.length} nearest to ${locationName}`
            : clinicsStatus === 'done'
            ? `${visibleClinics.length} clinics near you`
            : clinicsStatus === 'loading'
            ? 'Searching for nearby clinics…'
            : 'Enable location to find clinics near you'}
        </Text>
      </View>

      {/* Search bar — only when results exist */}
      {clinicsStatus === 'done' && clinics.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Filter results..."
              placeholderTextColor="#9E9E9E"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Category filters — only when results exist */}
      {clinicsStatus === 'done' && clinics.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {FILTER_OPTIONS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Location loading ── */}
      {isLocating && (
        <Animated.View style={[styles.statusCard, { opacity: pulseAnim }]}>
          <View style={styles.statusCardInner}>
            <View style={styles.statusPulseRing}>
              <ActivityIndicator size="small" color="#00ACC1" />
            </View>
            <View style={styles.statusCardText}>
              <Text style={styles.statusCardTitle}>
                {locationStatus === 'requesting-permission'
                  ? 'Requesting location access…'
                  : locationStatus === 'acquiring-gps'
                  ? 'Acquiring GPS signal…'
                  : 'Identifying your area…'}
              </Text>
              <Text style={styles.statusCardDesc}>
                {locationStatus === 'requesting-permission'
                  ? 'Please allow location permission when prompted'
                  : locationStatus === 'acquiring-gps'
                  ? 'Finding your coordinates via satellite'
                  : 'Resolving your address for nearby results'}
              </Text>
            </View>
          </View>
          <View style={styles.stepsRow}>
            <View style={[styles.step, locationStatus !== 'requesting-permission' && styles.stepDone]}>
              <Text style={styles.stepIcon}>{locationStatus === 'requesting-permission' ? '🔄' : '✅'}</Text>
              <Text style={styles.stepLabel}>Permission</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={[styles.step, locationStatus === 'reverse-geocoding' && styles.stepDone]}>
              <Text style={styles.stepIcon}>
                {locationStatus === 'acquiring-gps' ? '🔄' : locationStatus === 'reverse-geocoding' ? '✅' : '⏳'}
              </Text>
              <Text style={styles.stepLabel}>GPS</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.step}>
              <Text style={styles.stepIcon}>{locationStatus === 'reverse-geocoding' ? '🔄' : '⏳'}</Text>
              <Text style={styles.stepLabel}>Address</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ── Clinics loading ── */}
      {clinicsStatus === 'loading' && !isLocating && (
        <Animated.View style={[styles.statusCard, { opacity: pulseAnim }]}>
          <View style={styles.statusCardInner}>
            <View style={styles.statusPulseRing}>
              <ActivityIndicator size="small" color="#00ACC1" />
            </View>
            <View style={styles.statusCardText}>
              <Text style={styles.statusCardTitle}>Searching nearby clinics…</Text>
              <Text style={styles.statusCardDesc}>
                Finding eye care facilities within {searchRadius} km
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ── Location success bar ── */}
      {locationStatus === 'granted' && clinicsStatus === 'done' && location && (
        <View style={styles.locationSuccessBar}>
          <View style={styles.locationSuccessLeft}>
            <Text style={styles.locationSuccessPin}>📍</Text>
            <View>
              <Text style={styles.locationSuccessName} numberOfLines={1}>
                {locationName || 'Your location'}
              </Text>
              <Text style={styles.locationSuccessTime}>
                Updated {getTimeSinceLocation()} · within {searchRadius} km
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.locationRefreshBtn}
            onPress={() => { setClinicsStatus('idle'); setClinics([]); requestLocation(); }}
          >
            <Text style={styles.locationRefreshText}>↻</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Location error ── */}
      {hasLocationError && (
        <View style={styles.errorCard}>
          <View style={styles.errorTop}>
            <Text style={styles.errorIcon}>
              {locationStatus === 'denied' ? '🚫' : locationStatus === 'unavailable' ? '📡' : locationStatus === 'timeout' ? '⏱️' : '⚠️'}
            </Text>
            <View style={styles.errorTextBlock}>
              <Text style={styles.errorTitle}>
                {locationStatus === 'denied' ? 'Location Permission Denied'
                  : locationStatus === 'unavailable' ? 'Location Services Off'
                  : locationStatus === 'timeout' ? 'GPS Signal Timeout'
                  : 'Location Error'}
              </Text>
              <Text style={styles.errorDesc}>{locationError}</Text>
            </View>
          </View>
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setClinicsStatus('idle'); requestLocation(); }}>
              <Text style={styles.retryBtnText}>🔄 Try Again</Text>
            </TouchableOpacity>
            {(locationStatus === 'denied' || locationStatus === 'unavailable') && (
              <TouchableOpacity style={styles.settingsBtn} onPress={openDeviceSettings}>
                <Text style={styles.settingsBtnText}>⚙️ Open Settings</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.errorHint}>Location is required to find clinics near you.</Text>
          <TouchableOpacity
            style={styles.fallbackGoogleBtn}
            onPress={() => openGoogleMapsSearch(-1.2921, 36.8219, 'eye clinic hospital optician')}
          >
            <Text style={styles.fallbackGoogleBtnText}>🗺️ Search Google Maps Instead</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Clinics fetch error ── */}
      {clinicsStatus === 'error' && (
        <View style={styles.errorCard}>
          <View style={styles.errorTop}>
            <Text style={styles.errorIcon}>🌐</Text>
            <View style={styles.errorTextBlock}>
              <Text style={styles.errorTitle}>Network Error</Text>
              <Text style={styles.errorDesc}>{clinicsError}</Text>
            </View>
          </View>
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryBtn} onPress={() => location && loadClinics(location.lat, location.lng)}>
              <Text style={styles.retryBtnText}>🔄 Retry</Text>
            </TouchableOpacity>
            {location && (
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => openGoogleMapsSearch(location.lat, location.lng, 'eye clinic hospital optician')}
              >
                <Text style={styles.settingsBtnText}>🗺️ Google Maps</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── Clinic list ── */}
      <FlatList
        data={visibleClinics}
        renderItem={renderClinicCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          clinicsStatus === 'done' ? (
            <View style={styles.emptyState}>
              {clinics.length === 0 ? (
                <>
                  <Text style={styles.emptyEmoji}>📍</Text>
                  <Text style={styles.emptyTitle}>No clinics found nearby</Text>
                  <Text style={styles.emptyDesc}>
                    We couldn't find eye care facilities within {searchRadius} km.{'\n'}
                    Try expanding the search or use Google Maps.
                  </Text>
                  {location && (
                    <View style={styles.emptyActions}>
                      {searchRadius < 100 && (
                        <TouchableOpacity
                          style={styles.emptyActionBtn}
                          onPress={() => {
                            const r = searchRadius + 30;
                            setSearchRadius(r);
                            loadClinics(location.lat, location.lng, r);
                          }}
                        >
                          <Text style={styles.emptyActionBtnText}>🔍 Search wider ({searchRadius + 30} km)</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.emptyGoogleBtn}
                        onPress={() => openGoogleMapsSearch(location.lat, location.lng, 'eye clinic hospital optician')}
                      >
                        <Text style={styles.emptyGoogleBtnText}>🗺️ Open Google Maps</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.emptyEmoji}>🔍</Text>
                  <Text style={styles.emptyTitle}>No matches</Text>
                  <Text style={styles.emptyDesc}>
                    {searchQuery.trim() ? `No results for "${searchQuery}".` : 'Try changing the filter.'}
                  </Text>
                </>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={
          visibleClinics.length > 0 ? (
            <View style={styles.footer}>
              <View style={styles.resultsContext}>
                <Text style={styles.resultsContextText}>
                  {visibleClinics.length} clinic{visibleClinics.length !== 1 ? 's' : ''} within {searchRadius} km
                </Text>
              </View>

              {location && (
                <TouchableOpacity
                  style={styles.googleMapsBtn}
                  onPress={() => openGoogleMapsSearch(location.lat, location.lng, 'eye clinic hospital optician')}
                >
                  <Text style={styles.googleMapsBtnEmoji}>🗺️</Text>
                  <Text style={styles.googleMapsBtnTitle}>Find More on Google Maps</Text>
                  <Text style={styles.googleMapsBtnDesc}>
                    Search for additional eye clinics, opticians & hospitals near you
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.disclaimer}>
                <Text style={styles.disclaimerText}>
                  ℹ️ Results sourced from OpenStreetMap. Information may be incomplete — always call ahead to confirm.
                </Text>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screenFlex: { flex: 1, backgroundColor: '#F5F5F5' },

  // Header
  headerBanner: {
    backgroundColor: '#00ACC1', paddingTop: 50, paddingBottom: 20,
    paddingHorizontal: 20, alignItems: 'center', position: 'relative',
  },
  backArrow: {
    position: 'absolute', top: 50, left: 16, width: 36, height: 36,
    borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  backArrowText: { fontSize: 20, color: '#FFF', fontWeight: 'bold' },
  headerEmoji: { fontSize: 36, marginBottom: 6 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, textAlign: 'center' },

  // Search
  searchContainer: { backgroundColor: '#00ACC1', paddingHorizontal: 16, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#212121', paddingVertical: 0 },
  searchClear: { fontSize: 16, color: '#9E9E9E', padding: 4, fontWeight: 'bold' },

  // Filters
  filterContainer: { backgroundColor: '#FFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0' },
  filterScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0',
  },
  filterChipActive: { backgroundColor: '#E0F7FA', borderColor: '#00ACC1' },
  filterChipText: { fontSize: 13, color: '#757575', fontWeight: '500' },
  filterChipTextActive: { color: '#00838F', fontWeight: '700' },

  // Status card (loading)
  statusCard: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFF',
    borderRadius: 14, padding: 16,
    shadowColor: '#00ACC1', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: '#B2EBF2',
  },
  statusCardInner: { flexDirection: 'row', alignItems: 'center' },
  statusPulseRing: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0F7FA',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
    borderWidth: 2, borderColor: '#80DEEA',
  },
  statusCardText: { flex: 1 },
  statusCardTitle: { fontSize: 15, fontWeight: '700', color: '#00838F', marginBottom: 3 },
  statusCardDesc: { fontSize: 12, color: '#607D8B', lineHeight: 17 },
  stepsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingTop: 14, marginTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E0E0E0',
  },
  step: { alignItems: 'center', paddingHorizontal: 8 },
  stepDone: { opacity: 1 },
  stepIcon: { fontSize: 16, marginBottom: 2 },
  stepLabel: { fontSize: 10, fontWeight: '600', color: '#78909C', textTransform: 'uppercase', letterSpacing: 0.5 },
  stepLine: { width: 24, height: 2, backgroundColor: '#B2EBF2', borderRadius: 1 },

  // Location success bar
  locationSuccessBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E0F7FA', paddingVertical: 10, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#B2EBF2',
  },
  locationSuccessLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationSuccessPin: { fontSize: 18, marginRight: 10 },
  locationSuccessName: { fontSize: 14, fontWeight: '600', color: '#00838F', maxWidth: SCREEN_WIDTH - 120 },
  locationSuccessTime: { fontSize: 11, color: '#4DB6AC', marginTop: 1 },
  locationRefreshBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#80DEEA',
  },
  locationRefreshText: { fontSize: 18, color: '#00ACC1', fontWeight: 'bold' },

  // Error card
  errorCard: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFF',
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FFCC80',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  errorTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  errorIcon: { fontSize: 28, marginRight: 12, marginTop: 2 },
  errorTextBlock: { flex: 1 },
  errorTitle: { fontSize: 15, fontWeight: '700', color: '#E65100', marginBottom: 3 },
  errorDesc: { fontSize: 13, color: '#795548', lineHeight: 18 },
  errorActions: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  retryBtn: { flex: 1, backgroundColor: '#00ACC1', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  retryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  settingsBtn: {
    flex: 1, backgroundColor: '#FFF', paddingVertical: 10, borderRadius: 10,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#00ACC1',
  },
  settingsBtnText: { color: '#00838F', fontSize: 13, fontWeight: '700' },
  errorHint: { fontSize: 11, color: '#9E9E9E', textAlign: 'center', lineHeight: 16, marginBottom: 10 },
  fallbackGoogleBtn: { backgroundColor: '#E0F7FA', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  fallbackGoogleBtnText: { color: '#00838F', fontSize: 14, fontWeight: '600' },

  // Clinic cards
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  clinicCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, paddingTop: 20,
    marginBottom: 14, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06,
    shadowRadius: 6, elevation: 2, position: 'relative' as const,
  },
  rankBadge: {
    position: 'absolute' as const, top: -6, left: 12, width: 24, height: 24,
    borderRadius: 12, backgroundColor: '#00ACC1',
    alignItems: 'center' as const, justifyContent: 'center' as const, zIndex: 1,
    shadowColor: '#00ACC1', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3, shadowRadius: 2, elevation: 3,
  },
  rankBadgeText: { fontSize: 11, fontWeight: '800' as const, color: '#FFF' },
  clinicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  clinicHeaderLeft: { flexDirection: 'row', flex: 1, marginRight: 8 },
  clinicIcon: { fontSize: 28, marginRight: 12, marginTop: 2 },
  clinicTitleBlock: { flex: 1 },
  clinicName: { fontSize: 16, fontWeight: '600', color: '#212121', lineHeight: 21, marginBottom: 4 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryBadgeText: { fontSize: 11, fontWeight: '600' },
  distanceBadge: { backgroundColor: '#E0F7FA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  distanceText: { fontSize: 13, fontWeight: '700', color: '#00838F' },
  clinicAddress: { fontSize: 13, color: '#616161', marginTop: 10, lineHeight: 18 },
  tapHint: { fontSize: 11, color: '#00ACC1', fontWeight: '600', marginTop: 8, textAlign: 'right' },

  // Expanded
  expandedSection: { marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E0E0E0' },
  servicesContainer: { marginBottom: 12 },
  servicesTitle: { fontSize: 13, fontWeight: '700', color: '#424242', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  servicesTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  serviceTag: { backgroundColor: '#E0F7FA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  serviceTagText: { fontSize: 12, color: '#00838F', fontWeight: '500' },
  clinicHours: { fontSize: 13, color: '#616161', marginBottom: 12, lineHeight: 18 },
  clinicActions: { flexDirection: 'row', gap: 10 },
  directionsBtn: {
    flex: 1, backgroundColor: '#00ACC1', paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', shadowColor: '#00ACC1',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  directionsBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  callBtn: {
    flex: 1, backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#00ACC1',
  },
  callBtnText: { color: '#00838F', fontSize: 14, fontWeight: '700' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#424242', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#757575', textAlign: 'center', lineHeight: 20 },
  emptyActions: { marginTop: 20, gap: 10, width: '100%', alignItems: 'center' },
  emptyActionBtn: { backgroundColor: '#00ACC1', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  emptyActionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  emptyGoogleBtn: {
    backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#00ACC1',
  },
  emptyGoogleBtnText: { color: '#00838F', fontSize: 14, fontWeight: '700' },

  // Footer
  footer: { paddingTop: 8, paddingBottom: 20 },
  resultsContext: { paddingVertical: 10, alignItems: 'center', marginBottom: 12 },
  resultsContextText: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  googleMapsBtn: {
    backgroundColor: '#FFF', paddingVertical: 18, paddingHorizontal: 20,
    borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#00ACC1',
    marginBottom: 16, shadowColor: '#00ACC1',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  googleMapsBtnEmoji: { fontSize: 28, marginBottom: 6 },
  googleMapsBtnTitle: { fontSize: 15, fontWeight: '700', color: '#00838F', marginBottom: 4 },
  googleMapsBtnDesc: { fontSize: 12, color: '#78909C', textAlign: 'center', lineHeight: 17 },
  disclaimer: { padding: 14, backgroundColor: '#E0F7FA', borderRadius: 10 },
  disclaimerText: { fontSize: 12, color: '#00838F', lineHeight: 18, textAlign: 'center' },
});