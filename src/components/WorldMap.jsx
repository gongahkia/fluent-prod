import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from 'react-simple-maps';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Popular destinations with their coordinates
const popularDestinations = [
  { name: "Tokyo", country: "Japan", coordinates: [139.6917, 35.6895], trending: "Anime Culture" },
  { name: "São Paulo", country: "Brazil", coordinates: [-46.6333, -23.5505], trending: "Street Art" },
  { name: "Stockholm", country: "Sweden", coordinates: [18.0686, 59.3293], trending: "Design" },
  { name: "Mexico City", country: "Mexico", coordinates: [-99.1332, 19.4326], trending: "Food Culture" }
];

const WorldMap = ({ onCountryClick, selectedCountry }) => {
  const [hoveredCountry, setHoveredCountry] = useState(null);

  // Map country names to our supported countries
  const countryNameMap = {
    "Japan": "Japan",
    "Brazil": "Brazil", 
    "Sweden": "Sweden",
    "Mexico": "Mexico"
  };

  const handleCountryClick = (geo) => {
    const countryName = geo.properties.name; // Use lowercase 'name' property
    const mappedCountry = countryNameMap[countryName];
    
    if (mappedCountry && onCountryClick) {
      onCountryClick(mappedCountry);
    }
  };

  return (
    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [0, 20]
        }}
        width={800}
        height={500}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onClick={() => handleCountryClick(geo)}
                onMouseEnter={() => setHoveredCountry(geo.properties.NAME)}
                onMouseLeave={() => setHoveredCountry(null)}
                style={{
                  default: {
                    fill: selectedCountry === geo.properties.NAME ? "#FED7AA" : "#E5E7EB",
                    stroke: "#FFFFFF",
                    strokeWidth: 0.5,
                    outline: "none",
                    cursor: countryNameMap[geo.properties.NAME] ? "pointer" : "default"
                  },
                  hover: {
                    fill: countryNameMap[geo.properties.NAME] ? "#FED7AA" : "#D1D5DB",
                    stroke: "#FFFFFF",
                    strokeWidth: 0.5,
                    outline: "none"
                  },
                  pressed: {
                    fill: "#FDBA74",
                    stroke: "#FFFFFF",
                    strokeWidth: 0.5,
                    outline: "none"
                  }
                }}
              />
            ))
          }
        </Geographies>
        
        {/* Popular destination markers */}
        {popularDestinations.map(({ name, coordinates }) => (
          <Marker key={name} coordinates={coordinates}>
            <g>
              <circle
                r={4}
                fill="#EC4899"
                stroke="#FFFFFF"
                strokeWidth={2}
                className="animate-pulse"
              />
              <text
                textAnchor="middle"
                y={-10}
                style={{
                  fontFamily: "system-ui",
                  fontSize: "12px",
                  fill: "#EC4899",
                  fontWeight: "600"
                }}
              >
                {name}
              </text>
            </g>
          </Marker>
        ))}
      </ComposableMap>
      
      {/* Hover tooltip */}
      {hoveredCountry && (
        <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg border">
          <p className="text-sm font-medium text-gray-900">{hoveredCountry}</p>
          {countryNameMap[hoveredCountry] && (
            <p className="text-xs text-gray-500">Click to explore</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WorldMap;

