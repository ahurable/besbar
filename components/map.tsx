"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

interface MapProps {
  center: [number, number]
  zoom: number
  onMapClick?: (lat: number, lng: number) => void
  sourceLocation?: [number, number] | null
  destinationLocation?: [number, number] | null
  className?: string
  onSourceMarkerClick?: () => void
  onDestinationMarkerClick?: () => void
}

export default function Map({
  center,
  zoom,
  onMapClick,
  sourceLocation,
  destinationLocation,
  className = "h-96 w-full",
  onSourceMarkerClick,
  onDestinationMarkerClick,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const sourceMarkerRef = useRef<L.Marker | null>(null)
  const destinationMarkerRef = useRef<L.Marker | null>(null)
  const routeLineRef = useRef<L.Polyline | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    console.log("Initializing map...")

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom)

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapInstanceRef.current)

    // Add click handler
    if (onMapClick) {
      mapInstanceRef.current.on("click", (e) => {
        console.log(`Map click detected: ${e.latlng.lat}, ${e.latlng.lng}`)
        onMapClick(e.latlng.lat, e.latlng.lng)
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [center, zoom, onMapClick])

  // Update source marker
  useEffect(() => {
    if (!mapInstanceRef.current) return

    console.log("Updating source marker:", sourceLocation)

    if (sourceMarkerRef.current) {
      mapInstanceRef.current.removeLayer(sourceMarkerRef.current)
      sourceMarkerRef.current = null
    }

    if (sourceLocation) {
      const greenIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background-color: #22c55e; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            border: 3px solid white; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold; 
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">A</div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      sourceMarkerRef.current = L.marker(sourceLocation, { icon: greenIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup("مبدا - برای حذف کلیک کنید")

      // Add click handler to marker for removal
      if (onSourceMarkerClick) {
        sourceMarkerRef.current.on("click", (e) => {
          console.log("Source marker clicked")
          L.DomEvent.stopPropagation(e) // Prevent map click
          onSourceMarkerClick()
        })
      }
    }
  }, [sourceLocation, onSourceMarkerClick])

  // Update destination marker
  useEffect(() => {
    if (!mapInstanceRef.current) return

    console.log("Updating destination marker:", destinationLocation)

    if (destinationMarkerRef.current) {
      mapInstanceRef.current.removeLayer(destinationMarkerRef.current)
      destinationMarkerRef.current = null
    }

    if (destinationLocation) {
      const redIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background-color: #ef4444; 
            width: 30px; 
            height: 30px; 
            border-radius: 50%; 
            border: 3px solid white; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold; 
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">B</div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      destinationMarkerRef.current = L.marker(destinationLocation, { icon: redIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup("مقصد - برای حذف کلیک کنید")

      // Add click handler to marker for removal
      if (onDestinationMarkerClick) {
        destinationMarkerRef.current.on("click", (e) => {
          console.log("Destination marker clicked")
          L.DomEvent.stopPropagation(e) // Prevent map click
          onDestinationMarkerClick()
        })
      }
    }
  }, [destinationLocation, onDestinationMarkerClick])

  // Update route line
  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (routeLineRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current)
      routeLineRef.current = null
    }

    if (sourceLocation && destinationLocation) {
      console.log("Drawing route line")
      routeLineRef.current = L.polyline([sourceLocation, destinationLocation], {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 5",
      }).addTo(mapInstanceRef.current)

      // Fit map to show both markers
      const group = L.featureGroup([L.marker(sourceLocation), L.marker(destinationLocation)])
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }
  }, [sourceLocation, destinationLocation])

  return <div ref={mapRef} className={className} />
}
