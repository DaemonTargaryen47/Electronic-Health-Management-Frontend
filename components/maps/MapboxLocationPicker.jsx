import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoianViYWlyc2FtaSIsImEiOiJjbTBjMmdoanQwZml2MmtvZHVsOG94dnowIn0.hTL8zltp0H6c8pVfzlzkiA';

const MapboxLocationPicker = ({ value, onChange, error }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [mapError, setMapError] = useState(null);

  // Default map center if no location is provided
  const [center, setCenter] = useState([90.3742, 23.7461]); // Default to Dhaka

  // Helper function to validate longitude and latitude
  const isValidCoordinates = (lng, lat) => {
    return !isNaN(lng) && !isNaN(lat) && 
           lng >= -180 && lng <= 180 && 
           lat >= -90 && lat <= 90;
  };

  // Helper function to parse location values in different formats
  const parseLocationValue = (locationValue) => {
    if (!locationValue) return null;
    
    try {
      // If it's already an object with lat/lng
      if (typeof locationValue === 'object' && locationValue !== null) {
        if (locationValue.lat !== undefined && locationValue.lng !== undefined) {
          const lng = parseFloat(locationValue.lng);
          const lat = parseFloat(locationValue.lat);
          if (isValidCoordinates(lng, lat)) {
            return [lng, lat];
          }
        }
        
        if (Array.isArray(locationValue) && locationValue.length === 2) {
          const lng = parseFloat(locationValue[0]);
          const lat = parseFloat(locationValue[1]);
          if (isValidCoordinates(lng, lat)) {
            return [lng, lat];
          }
        }
      }
      
      // If it's a string but contains JSON
      if (typeof locationValue === 'string') {
        if (locationValue.includes('{') || locationValue.includes('[')) {
          try {
            const parsed = JSON.parse(locationValue);
            if (parsed.lat !== undefined && parsed.lng !== undefined) {
              const lng = parseFloat(parsed.lng);
              const lat = parseFloat(parsed.lat);
              if (isValidCoordinates(lng, lat)) {
                return [lng, lat];
              }
            }
            
            if (Array.isArray(parsed) && parsed.length === 2) {
              const lng = parseFloat(parsed[0]);
              const lat = parseFloat(parsed[1]);
              if (isValidCoordinates(lng, lat)) {
                return [lng, lat];
              }
            }
          } catch (e) {
            // Not valid JSON, proceed to next format check
          }
        }
        
        // If it's a comma-separated string "lng, lat" or "lat, lng"
        if (locationValue.includes(',')) {
          // First try assuming format is "lng, lat"
          let parts = locationValue.split(',').map(coord => parseFloat(coord.trim()));
          if (parts.length === 2) {
            const [lng, lat] = parts;
            if (isValidCoordinates(lng, lat)) {
              return [lng, lat];
            }
            
            // If that's not valid, try swapping (in case format was "lat, lng")
            const [maybeLat, maybeLng] = parts;
            if (isValidCoordinates(maybeLng, maybeLat)) {
              return [maybeLng, maybeLat];
            }
          }
        }
      }
      
      console.warn("Could not parse location value:", locationValue);
      return null;
    } catch (e) {
      console.error("Error parsing location value:", e);
      return null;
    }
  };

  useEffect(() => {
    // Initialize map only once and after container is properly mounted
    if (map.current) return;

    // Parse initial value if provided
    if (value && initialLoad) {
      const coordinates = parseLocationValue(value);
      if (coordinates) {
        setCenter(coordinates);
      }
      setInitialLoad(false);
    }

    // Small delay to ensure the container is fully mounted and styled
    const initializeMap = setTimeout(() => {
      if (!mapContainer.current) {
        console.error("Map container not found");
        setMapError("Map container not available");
        return;
      }

      try {
        // Initialize map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: center,
          zoom: 12,
          attributionControl: true
        });

        // Add load event handler
        map.current.on('load', () => {
          console.log("Map loaded successfully");
          
          // Add marker if initial value exists
          if (value) {
            const coordinates = parseLocationValue(value);
            if (coordinates) {
              try {
                marker.current = new mapboxgl.Marker({ draggable: true })
                  .setLngLat(coordinates)
                  .addTo(map.current);
                
                // Add drag end event to update coordinates
                marker.current.on('dragend', onMarkerDragEnd);
              } catch (err) {
                console.error("Error setting marker:", err, "with coordinates:", coordinates);
              }
            }
          }
        });

        // Add error event handler
        map.current.on('error', (e) => {
          console.error("Mapbox error:", e);
          setMapError("Failed to load map");
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }));

        // Click event to add/move marker
        map.current.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          
          // Remove existing marker if it exists
          if (marker.current) {
            marker.current.remove();
          }
          
          // Create new marker
          marker.current = new mapboxgl.Marker({ draggable: true })
            .setLngLat([lng, lat])
            .addTo(map.current);
          
          // Add drag end event
          marker.current.on('dragend', onMarkerDragEnd);
          
          // Update coordinates
          updateCoordinates(lng, lat);
        });
      } catch (err) {
        console.error("Error initializing map:", err);
        setMapError("Failed to initialize map");
      }
    }, 100);

    return () => {
      clearTimeout(initializeMap);
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Update marker position when value changes externally
  useEffect(() => {
    if (!map.current || !value || initialLoad) return;

    try {
      const coordinates = parseLocationValue(value);
      if (coordinates) {
        try {
          if (marker.current) {
            marker.current.setLngLat(coordinates);
          } else {
            marker.current = new mapboxgl.Marker({ draggable: true })
              .setLngLat(coordinates)
              .addTo(map.current);
            
            marker.current.on('dragend', onMarkerDragEnd);
          }
          
          map.current.flyTo({
            center: coordinates,
            zoom: 14
          });
        } catch (err) {
          console.error("Error updating marker:", err, "with coordinates:", coordinates);
        }
      }
    } catch (e) {
      console.error("Error updating marker from value:", e);
    }
  }, [value]);

  const onMarkerDragEnd = () => {
    const lngLat = marker.current.getLngLat();
    updateCoordinates(lngLat.lng, lngLat.lat);
  };

  const updateCoordinates = (lng, lat) => {
    // Validate coordinates before returning
    if (isValidCoordinates(lng, lat)) {
      // Return coordinates as an object for consistency
      onChange({ lng, lat });
    } else {
      console.error("Invalid coordinates:", lng, lat);
    }
  };

  // Debug function to format coordinates for display
  const formatCoordinates = (coords) => {
    if (!coords) return "No coordinates";
    
    try {
      if (Array.isArray(coords)) {
        return `[${coords[0]}, ${coords[1]}]`;
      } else if (typeof coords === 'object') {
        return `{lng: ${coords.lng}, lat: ${coords.lat}}`;
      } else {
        return String(coords);
      }
    } catch (e) {
      return "Invalid coordinates";
    }
  };

  return (
    <div className="w-full">
      {mapError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 mb-2 rounded">
          {mapError}. Please refresh the page or check your internet connection.
        </div>
      )}
      <div 
        ref={mapContainer} 
        className={`w-full h-64 rounded-md ${error ? 'border-2 border-error' : ''}`}
        style={{ minHeight: "250px" }} // Ensure minimum height
      />
      <div className="text-sm text-gray-500 mt-1">
        Click on the map to set the location or drag the marker to adjust
      </div>
    </div>
  );
};

export default MapboxLocationPicker;
