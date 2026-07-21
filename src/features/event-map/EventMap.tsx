'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import { Search, ChevronRight, ChevronDown, MapPin } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

const dummyLocations = [
  { id: 'fnb-1', category: 'FnB', name: 'Ayam Goreng', lat: -6.8910, lng: 107.6110 },
  { id: 'fnb-2', category: 'FnB', name: 'Martabak', lat: -6.8912, lng: 107.6115 },
  { id: 'fnb-3', category: 'FnB', name: 'Ayam Penyet Cabe Ijo', lat: -6.8914, lng: 107.6108 },
  { id: 'fnb-4', category: 'FnB', name: 'Seblak', lat: -6.8916, lng: 107.6102 },
  { id: 'mp-1', category: 'Megaprop', name: 'Instalasi Robot Raksasa', lat: -6.8925, lng: 107.6100 },
  { id: 'booth-1', category: 'Booth', name: 'Booth Nusantara Teknologi', lat: -6.8918, lng: 107.6118 },
  { id: 'pb-1', category: 'Photobooth', name: 'Photobooth Utama', lat: -6.8905, lng: 107.6105 },
  { id: 'parkir-1', category: 'Parkir', name: 'Parkir Timur', lat: -6.8895, lng: 107.6120 },
  { id: 'toilet-1', category: 'Toilet', name: 'Toilet CC Barat', lat: -6.8918, lng: 107.6104 },
];

const areaData: any = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Main Stage Area' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[107.6095, -6.8925], [107.6105, -6.8925], [107.6105, -6.8910], [107.6095, -6.8910], [107.6095, -6.8925]]],
      },
    }
  ],
};

export default function EventMap() {
  const mapRef = useRef<any>(null);

  const [viewState, setViewState] = useState({
    longitude: 107.6106,
    latitude: -6.8915,
    zoom: 16.5,
    pitch: 0,
  });

  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);

  const toggleAccordion = (menu: string) => {
    setActiveAccordion(activeAccordion === menu ? null : menu);
  };

  const handleLocationClick = (lat: number, lng: number, id: string) => {
    setActiveLocationId(id);
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 18.5, duration: 1500, essential: true });
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    const location = dummyLocations.find(loc => loc.category === filter);
    if (location) handleLocationClick(location.lat, location.lng, location.id);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .map-wrapper {
          display: flex;
          flex-direction: row;
          width: 100vw;
          height: 100vh;
          background-color: #ffffff;
          overflow: hidden;
          font-family: "Roboto Mono", monospace;
        }
        .sidebar {
          width: 320px;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e5e5e5;
          z-index: 10;
          overflow-y: auto;
          background-color: #ffffff;
          /* Trik sikat bersih scrollbar bawaan */
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .sidebar::-webkit-scrollbar {
          display: none;
        }
        .map-container {
          flex: 1;
          position: relative;
          background-color: #f5f5f5;
          display: flex;
          flex-direction: column;
        }
        .floating-logo {
          display: none;
        }
        .sidebar-logo-container {
          display: flex;
        }

        /* TAMPILAN HP (Lebar layar maksimal 768px) */
        @media (max-width: 768px) {
          .map-wrapper {
            /* Membalik urutan agar Peta di atas, Sidebar di bawah */
            flex-direction: column-reverse;
          }
          .sidebar {
            width: 100%;
            height: 50vh;
            border-right: none !important;
            border-top: 1px solid #e5e5e5;
            border-top-left-radius: 24px;
            border-top-right-radius: 24px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
            z-index: 20;
          }
          .map-container {
            width: 100%;
            height: 50vh;
            flex: none;
          }
          .sidebar-logo-container {
            display: none;
          }
          .floating-logo {
            display: flex;
            position: absolute;
            top: 16px;
            left: 16px;
            z-index: 30;
            background-color: white;
            border-radius: 8px;
            border: 1px solid #e5e5e5;
            padding: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            align-items: center;
            justify-content: center;
          }
        }
      `}} />

      <div className="map-wrapper">
        
        {/* KOLOM KIRI (Desktop) / BAWAH (Mobile): SIDEBAR */}
        <div className="sidebar">
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="sidebar-logo-container" style={{ width: '48px', height: '48px', alignItems: 'center', justifyItems: 'center', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '8px' }}>
              <Link href="/" style={{ display: 'flex', width: '100%', height: '100%' }}>
                <Image src="/images/logoinsight.png" alt="ITB Insight Logo" width={48} height={48} style={{ objectFit: 'contain' }} />
              </Link>
            </div>

            <div style={{ position: 'relative', width: '100%' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                  <Search size={16} color="#a3a3a3" />
              </div>
              <input 
                type="text" 
                placeholder="Where do you want to go?" 
                style={{ 
                  boxSizing: 'border-box',
                  width: '100%', padding: '12px 16px 12px 36px', border: '1px solid #d4d4d4', 
                  borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' 
                }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Photobooth', 'Parkir', 'Toilet'].map((filter) => (
                <button 
                  key={filter}
                  onClick={() => handleFilterClick(filter)}
                  style={{
                      padding: '8px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                      border: '1px solid', borderColor: activeFilter === filter ? '#22c55e' : '#d4d4d4',
                      backgroundColor: activeFilter === filter ? '#f0fdf4' : 'transparent',
                      color: activeFilter === filter ? '#15803d' : '#262626', fontFamily: 'inherit'
                  }}
                >
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: activeFilter === filter ? '#22c55e' : '#d4d4d4' }} />
                  {filter}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {['Megaprop', 'FnB', 'Booth'].map((category) => (
                <div key={category} style={{ borderBottom: '1px solid #d4d4d4', backgroundColor: 'transparent' }}>
                  <button 
                    onClick={() => toggleAccordion(category)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', fontSize: '15px', fontWeight: 600, color: '#000000', fontFamily: 'inherit', cursor: 'pointer', backgroundColor: 'transparent', border: 'none' }}
                  >
                    {category}
                    {activeAccordion === category ? <ChevronDown size={20} color="#000000" /> : <ChevronRight size={20} color="#000000" />}
                  </button>
                  
                  {activeAccordion === category && (
                    <div style={{ paddingBottom: '20px', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', color: '#525252' }}>
                      {dummyLocations
                        .filter(loc => loc.category === category)
                        .map(loc => (
                          <p 
                            key={loc.id} 
                            onClick={() => handleLocationClick(loc.lat, loc.lng, loc.id)}
                            style={{ cursor: 'pointer', color: activeLocationId === loc.id ? '#16a34a' : 'inherit', fontWeight: activeLocationId === loc.id ? 'bold' : 'normal', transition: 'color 0.2s', margin: 0 }}
                          >
                            {loc.name}
                          </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* KOLOM KANAN / ATAS: KANVAS PETA */}
        <div className="map-container">
          <div className="floating-logo">
            <Link href="/" style={{ display: 'flex' }}>
              <Image src="/images/logoinsight.png" alt="ITB Insight Logo" width={32} height={32} style={{ objectFit: 'contain' }} />
            </Link>
          </div>

          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          >
            <NavigationControl position="bottom-right" />

            <Source id="event-areas" type="geojson" data={areaData}>
              <Layer id="area-fill" type="fill" paint={{ 'fill-color': '#000000', 'fill-opacity': 0.15 }} />
              <Layer id="area-outline" type="line" paint={{ 'line-color': '#000000', 'line-width': 1, 'line-opacity': 0.3 }} />
              <Layer id="area-labels" type="symbol" layout={{ 'text-field': ['get', 'name'], 'text-size': 14, 'text-anchor': 'center' }} paint={{ 'text-color': '#000000' }} />
            </Source>

            {dummyLocations.map(loc => (
              <Marker key={loc.id} longitude={loc.lng} latitude={loc.lat} anchor="bottom">
                <div 
                  onClick={() => handleLocationClick(loc.lat, loc.lng, loc.id)}
                  style={{ 
                    position: 'relative', display: 'flex', alignItems: 'center', justifyItems: 'center', cursor: 'pointer',
                    transform: activeLocationId === loc.id ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.3s ease-in-out'
                  }}
                >
                  <MapPin size={activeLocationId === loc.id ? 48 : 32} color={activeLocationId === loc.id ? "#16a34a" : "#000000"} fill={activeLocationId === loc.id ? "#16a34a" : "#000000"} />
                </div>
              </Marker>
            ))}
          </Map>
        </div>

      </div>
    </>
  );
}