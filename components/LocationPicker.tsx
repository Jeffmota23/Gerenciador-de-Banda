
import React, { useState } from 'react';
import { LocationData } from '../types';
import { MapPin, Search, Crosshair, Map as MapIcon, X } from 'lucide-react';

interface Props {
  onSelect: (loc: LocationData) => void;
  onCancel: () => void;
}

export const LocationPicker: React.FC<Props> = ({ onSelect, onCancel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Simulated Locations
  const MOCK_LOCATIONS: LocationData[] = [
    { address: 'Teatro Municipal de São Paulo', lat: -23.545, lng: -46.638 },
    { address: 'Sede da Banda (Centro Cultural)', lat: -23.550, lng: -46.633 },
    { address: 'Praça da Matriz (Coreto)', lat: -23.555, lng: -46.640 },
    { address: 'Auditório Ibirapuera', lat: -23.585, lng: -46.660 },
  ];

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 800);
  };

  const handleMapClick = () => {
    // Simulate clicking on the map to pick a random spot if search is empty
    const randomLoc = {
        address: `Coordenada ${(-23.5 - Math.random()/10).toFixed(4)}, ${(-46.6 - Math.random()/10).toFixed(4)}`,
        lat: -23.5 - Math.random()/10,
        lng: -46.6 - Math.random()/10
    };
    onSelect(randomLoc);
  };

  return (
    <div className="fixed inset-0 bg-navy-900/95 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-navy-950 w-full max-w-3xl rounded-xl border border-ocre-600/50 shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="p-4 bg-navy-900 border-b border-navy-700 flex justify-between items-center">
            <div className="flex items-center gap-2 text-ocre-500">
                <MapIcon className="w-5 h-5" />
                <span className="font-bold tracking-widest uppercase text-sm">Satélite Tático</span>
            </div>
            <button onClick={onCancel} className="text-bege-200 hover:text-white"><X className="w-6 h-6"/></button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-navy-800/50 border-b border-navy-700 relative">
            <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar endereço ou coordenadas..."
                className="w-full bg-navy-900 border border-navy-600 rounded-lg py-3 pl-10 pr-4 text-bege-100 outline-none focus:border-ocre-500 font-mono"
            />
            <Search className="w-5 h-5 text-navy-500 absolute left-7 top-1/2 -translate-y-1/2" />
        </div>

        {/* Map Viewport (Simulation) */}
        <div className="flex-1 relative bg-black cursor-crosshair group overflow-hidden" onClick={handleMapClick}>
            {/* Fake Satellite Image Background */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/-46.6333,-23.5505,13,0/600x400?access_token=pk.eyJ1IjoiZGVtbyIsImEiOiJja2V5bzk2c2MwYjF3MnJ0MDBzZm52Z2JmIn0.M9s0s2V9zN1r1r1r1r1r1r')] bg-cover bg-center grayscale hover:grayscale-0 transition-all duration-700"></div>
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            {/* Crosshair Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-ocre-500 pointer-events-none opacity-50">
                <Crosshair className="w-12 h-12" />
            </div>

            {/* Mock Search Results */}
            {searchQuery && (
                <div className="absolute top-4 left-4 right-4 bg-navy-900/90 rounded-lg border border-navy-600 p-2 space-y-1 z-10" onClick={(e) => e.stopPropagation()}>
                    {MOCK_LOCATIONS.filter(l => l.address.toLowerCase().includes(searchQuery.toLowerCase())).map((loc, i) => (
                        <button 
                            key={i}
                            onClick={() => onSelect(loc)}
                            className="w-full text-left p-3 hover:bg-navy-800 rounded flex items-center gap-3 text-bege-100"
                        >
                            <MapPin className="w-4 h-4 text-ocre-500" />
                            <div>
                                <p className="font-bold text-sm">{loc.address}</p>
                                <p className="text-[10px] font-mono text-bege-200/50">{loc.lat}, {loc.lng}</p>
                            </div>
                        </button>
                    ))}
                    {MOCK_LOCATIONS.filter(l => l.address.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <p className="p-2 text-sm text-bege-200/50 text-center">Nenhum local encontrado. Clique no mapa para marcar.</p>
                    )}
                </div>
            )}
            
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-[10px] font-mono text-green-500 border border-green-900">
                LAT: -23.5505 | LNG: -46.6333 | ALT: 760m
            </div>
        </div>
      </div>
    </div>
  );
};
