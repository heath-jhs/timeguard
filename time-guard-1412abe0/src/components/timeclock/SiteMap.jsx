import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const siteIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapBoundsUpdater({ sites, userLocation }) {
  const map = useMap();

  useEffect(() => {
    const bounds = [];
    
    if (userLocation?.latitude && userLocation?.longitude) {
      bounds.push([userLocation.latitude, userLocation.longitude]);
    }
    
    sites.forEach(site => {
      if (site.latitude && site.longitude) {
        bounds.push([site.latitude, site.longitude]);
      }
    });

    if (bounds.length > 0) {
      const latLngBounds = L.latLngBounds(bounds);
      map.fitBounds(latLngBounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [sites, userLocation, map]);

  return null;
}

export default function SiteMap({ 
  sites = [], 
  userLocation = null, 
  selectedSite = null,
  onSiteClick = null,
  height = '400px',
  showGeofence = true 
}) {
  const defaultCenter = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : sites.length > 0 && sites[0].latitude 
      ? [sites[0].latitude, sites[0].longitude]
      : [40.7128, -74.0060]; // Default to NYC

  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBoundsUpdater sites={sites} userLocation={userLocation} />

        {/* User location marker */}
        {userLocation?.latitude && userLocation?.longitude && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>Your Location</strong>
                <br />
                {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Site markers */}
        {sites.map(site => (
          site.latitude && site.longitude && (
            <React.Fragment key={site.id}>
              <Marker
                position={[site.latitude, site.longitude]}
                icon={siteIcon}
                eventHandlers={{
                  click: () => onSiteClick?.(site)
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{site.name}</strong>
                    <br />
                    {site.address}
                    <br />
                    <span className="text-slate-500">
                      Geofence: {site.geofence_radius || 100}m
                    </span>
                  </div>
                </Popup>
              </Marker>
              
              {showGeofence && (
                <Circle
                  center={[site.latitude, site.longitude]}
                  radius={site.geofence_radius || 100}
                  pathOptions={{
                    color: selectedSite?.id === site.id ? '#3b82f6' : '#22c55e',
                    fillColor: selectedSite?.id === site.id ? '#3b82f6' : '#22c55e',
                    fillOpacity: 0.15,
                    weight: 2
                  }}
                />
              )}
            </React.Fragment>
          )
        ))}
      </MapContainer>
    </div>
  );
}