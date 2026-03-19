'use client';

import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

interface Airport { iata: string; lat: number; lng: number; }
interface LivePos  { lat: number; lng: number; altitude: number; heading: number; isGround: boolean; }

interface GlobeMapProps {
  origin:      Airport | null;
  destination: Airport | null;
  livePos:     LivePos | null;
  turbAreas?:  object[];  // GeoJSON Feature polygons from /api/turb-areas
}

// ── 3D aircraft silhouette ───────────────────────────────────────────────────
function createAircraftMesh(): THREE.Group {
  const grp = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({
    color:     0x00ffaa,
    emissive:  0x007744,
    shininess: 100,
    specular:  new THREE.Color(0x88ffcc),
  });
  // Fuselage — cylinder, axis along +Z (nose forward)
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 1.2, 8), mat);
  fuselage.rotation.x = Math.PI / 2;
  grp.add(fuselage);
  // Main wings
  const wings = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.55), mat);
  wings.position.z = 0.05;
  grp.add(wings);
  // Horizontal tail stabiliser
  const hTail = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.05, 0.38), mat);
  hTail.position.z = -0.52;
  grp.add(hTail);
  // Vertical tail fin
  const vTail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.30, 0.32), mat);
  vTail.position.set(0, 0.17, -0.52);
  grp.add(vTail);
  // Glow ring halo — always horizontal regardless of heading rotation
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.08, 6, 28),
    new THREE.MeshBasicMaterial({ color: 0x00ffaa, transparent: true, opacity: 0.35 }),
  );
  halo.rotation.x = Math.PI / 2;
  grp.add(halo);
  grp.scale.setScalar(1.2);
  return grp;
}

export default function GlobeMap({ origin, destination, livePos, turbAreas = [] }: GlobeMapProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeEl      = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const flightKey    = useRef<string | null>(null);

  const [dims, setDims]         = useState({ w: 0, h: 0 });
  const [arcs, setArcs]         = useState<object[]>([]);   // dim full-route arc
  const [liveArcs, setLiveArcs] = useState<object[]>([]); // bright flown-path arc
  const [labels, setLabels]     = useState<object[]>([]);
  const [points, setPoints]     = useState<object[]>([]);
  const [plane3D, setPlane3D]   = useState<object[]>([]); // 3D aircraft custom layer

  // ResizeObserver reliably fires after first layout paint
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setDims({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Configure controls once, after globe initialises ────────────────────────
  function onGlobeReady() {
    const g = globeEl.current;
    if (!g) return;
    const ctrl = g.controls();
    if (!ctrl) return;
    ctrl.enableZoom        = true;    // scroll to zoom
    ctrl.enablePan         = false;
    ctrl.enableRotate      = true;    // drag to spin
    ctrl.autoRotate        = true;
    ctrl.autoRotateSpeed   = 0.4;
    g.pointOfView({ lat: 20, lng: 10, altitude: 2.5 });
  }

  // ── Update arc data when route changes ──────────────────────────────────────
  useEffect(() => {
    if (!origin || !destination) {
      setArcs([]);
      setLiveArcs([]);
      setLabels([]);
      setPoints([]);
      flightKey.current = null;
      // Re-enable idle spin
      const ctrl = globeEl.current?.controls();
      if (ctrl) { ctrl.autoRotate = true; ctrl.autoRotateSpeed = 0.4; }
      return;
    }
    const key = `${origin.iata}-${destination.iata}`;
    // Dim background arc — full planned route
    setArcs([{
      startLat: origin.lat, startLng: origin.lng,
      endLat:   destination.lat, endLng: destination.lng,
      color: ['rgba(0,212,255,0.35)', 'rgba(0,212,255,0.1)'],
    }]);
    setLiveArcs([]);   // reset until first livePos arrives
    setLabels([
      { lat: origin.lat,      lng: origin.lng,      text: origin.iata,      color: 'rgba(0,212,255,0.95)' },
      { lat: destination.lat, lng: destination.lng, text: destination.iata, color: 'rgba(245,158,11,0.95)' },
    ]);
    if (flightKey.current !== key) {
      flightKey.current = key;
      // Stop idle spin and fly to route midpoint
      const ctrl = globeEl.current?.controls();
      if (ctrl) { ctrl.autoRotate = false; ctrl.autoRotateSpeed = 0; }
      const midLat = (origin.lat + destination.lat) / 2;
      const midLng = (origin.lng + destination.lng) / 2;
      globeEl.current?.pointOfView({ lat: midLat, lng: midLng, altitude: 2.2 }, 900);
    }
  }, [origin?.iata, destination?.iata]);

  // ── Follow live position every animation tick ────────────────────────────────
  useEffect(() => {
    const pts: object[] = [];
    if (origin)      pts.push({ lat: origin.lat,      lng: origin.lng,      color: '#00d4ff', radius: 0.55 });
    if (destination) pts.push({ lat: destination.lat, lng: destination.lng, color: '#f59e0b', radius: 0.55 });
    if (livePos && origin && !livePos.isGround) {
      // Bright flown-path arc: origin → current position (the "beam")
      setLiveArcs([{
        startLat: origin.lat, startLng: origin.lng,
        endLat:   livePos.lat, endLng: livePos.lng,
        color: ['rgba(0,212,255,1)', 'rgba(0,255,136,0.85)'],
      }]);
      // 3D plane at current position
      setPlane3D([{ lat: livePos.lat, lng: livePos.lng, altitude: livePos.altitude, heading: livePos.heading }]);
    } else {
      setLiveArcs([]);
      setPlane3D([]);
    }
    setPoints(pts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePos?.lat, livePos?.lng, origin?.iata, destination?.iata]);

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ background: '#000005' }}>
      {dims.w > 0 && (
        <Globe
          ref={globeEl}
          width={dims.w}
          height={dims.h}
          onGlobeReady={onGlobeReady}
          animateIn={false}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="#000005"
          atmosphereColor="rgba(0,212,255,0.22)"
          atmosphereAltitude={0.18}
          arcsData={[...arcs, ...liveArcs]}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcAltitude={0.15}
          arcStroke={2}
          arcDashLength={1}
          arcDashGap={0}
          arcDashAnimateTime={0}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.02}
          pointRadius="radius"
          pointsMerge={false}
          labelsData={labels}
          labelLat="lat"
          labelLng="lng"
          labelText="text"
          labelColor="color"
          labelSize={1.1}
          labelDotRadius={0}
          labelAltitude={0.01}
          labelResolution={2}
          // ── 3D aircraft ────────────────────────────────────────────
          customLayerData={plane3D}
          customThreeObject={() => createAircraftMesh()}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          customThreeObjectUpdate={(obj: object, d: object) => {
            const { lat, lng, altitude, heading } = d as { lat: number; lng: number; altitude: number; heading: number };
            const g = globeEl.current;
            if (!g) return;
            // Place just above the surface
            const coords = g.getCoords(lat, lng, 0.05) as { x: number; y: number; z: number } | undefined;
            if (!coords) return;
            const { x, y, z } = coords;
            const o3d = obj as THREE.Object3D;
            o3d.position.set(x, y, z);
            // Orient: +Y = away from globe, +Z = nose faces heading direction
            const upVec = new THREE.Vector3(x, y, z).normalize();
            const yAxis = new THREE.Vector3(0, 1, 0);
            const poleDot = upVec.dot(yAxis);
            const eastVec = Math.abs(poleDot) > 0.98
              ? new THREE.Vector3(1, 0, 0)
              : new THREE.Vector3().crossVectors(yAxis, upVec).normalize();
            const northVec = new THREE.Vector3().crossVectors(upVec, eastVec).normalize();
            const hr = (heading * Math.PI) / 180;
            const fwd = new THREE.Vector3()
              .addScaledVector(northVec, Math.cos(hr))
              .addScaledVector(eastVec, Math.sin(hr))
              .normalize();
            const right = new THREE.Vector3().crossVectors(fwd, upVec).normalize();
            o3d.setRotationFromMatrix(new THREE.Matrix4().makeBasis(right, upVec, fwd));
            // Kill the unused `altitude` lint warning
            void altitude;
          }}
          // ── Turbulence SIGMET polygons ──────────────────────────────
          polygonsData={turbAreas}
          polygonAltitude={0.008}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          polygonCapColor={(d: object) => (d as any).properties.capColor}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          polygonSideColor={(d: object) => (d as any).properties.capColor.replace(/[\d.]+\)$/, '0.05)')}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          polygonStrokeColor={(d: object) => (d as any).properties.strokeColor}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          polygonLabel={(d: object) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p = (d as any).properties;
            const flLow  = Math.round(p.altLow  / 100);
            const flHigh = Math.round(p.altHigh / 100);
            return `<div style="font:11px/1.5 monospace;color:#fff;background:rgba(0,0,0,0.85);padding:5px 9px;border-radius:5px;border:1px solid rgba(255,255,255,0.15);white-space:nowrap">⚠️&nbsp;${p.sigmetType} &middot; TURB <b>${p.severity}</b><br/>FL${flLow}&ndash;FL${flHigh}</div>`;
          }}
        />
      )}


    </div>
  );
}
