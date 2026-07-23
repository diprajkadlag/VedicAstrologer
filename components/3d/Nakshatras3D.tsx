"use client";

import { Html, Line } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { NAKSHATRAS } from "@/lib/astro/ephemeris";
import { getLocalizedNakshatraName } from "@/lib/astro/localizedNames";
import type { AppLocale } from "@/lib/i18n";

export interface Nakshatras3DProps {
  showLabels?: boolean;
  radius?: number;
  locale?: AppLocale;
}

const TAU = Math.PI * 2;
const SEGMENT_ANGLE = TAU / NAKSHATRAS.length;
const ARC_STEPS = 7;

function pointOnEcliptic(angle: number, radius: number, y = 0): THREE.Vector3 {
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
}

interface NakshatraSegment {
  index: number;
  name: (typeof NAKSHATRAS)[number];
  midpoint: number;
  arc: THREE.Vector3[];
  boundary: THREE.Vector3[];
  constellation: THREE.Vector3[];
}

function buildSegments(radius: number): NakshatraSegment[] {
  return NAKSHATRAS.map((name, index) => {
    const start = index * SEGMENT_ANGLE;
    const midpoint = start + SEGMENT_ANGLE / 2;
    const arc = Array.from({ length: ARC_STEPS + 1 }, (_, step) =>
      pointOnEcliptic(start + (step / ARC_STEPS) * SEGMENT_ANGLE, radius),
    );
    const boundary = [
      pointOnEcliptic(start, radius - 0.15),
      pointOnEcliptic(start, radius + 0.15),
    ];

    // A deterministic three-star asterism gives every mansion its own marker
    // without pretending to be an IAU constellation boundary.
    const constellation = [-0.27, 0.03, 0.3].map((offset, starIndex) => {
      const angle = midpoint + offset * SEGMENT_ANGLE;
      const radialOffset = ((index * 7 + starIndex * 3) % 7 - 3) * 0.035;
      const verticalOffset = ((index * 5 + starIndex * 2) % 5 - 2) * 0.025;
      return pointOnEcliptic(angle, radius - 0.27 + radialOffset, verticalOffset);
    });

    return { index, name, midpoint, arc, boundary, constellation };
  });
}

function NakshatraStars({ segments }: { segments: NakshatraSegment[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const marker = new THREE.Object3D();

    segments.flatMap((segment) => segment.constellation).forEach((position, index) => {
      const size = 0.72 + ((index * 11) % 5) * 0.08;
      marker.position.copy(position);
      marker.scale.setScalar(size);
      marker.updateMatrix();
      meshRef.current?.setMatrixAt(index, marker.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [segments]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, segments.length * 3]}
      frustumCulled={false}
      renderOrder={2}
    >
      <sphereGeometry args={[0.026, 8, 6]} />
      <meshBasicMaterial
        color="#d9e8ff"
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export default function Nakshatras3D({
  showLabels = true,
  radius = 7.08,
  locale = "en",
}: Nakshatras3DProps) {
  const segments = useMemo(() => buildSegments(radius), [radius]);

  return (
    <group name="nakshatra-mansions">
      <NakshatraStars segments={segments} />

      {segments.map((segment) => {
        const accent = segment.index % 3 === 0 ? "#bda7ff" : segment.index % 3 === 1 ? "#79cbea" : "#e6c77a";
        const labelPosition = pointOnEcliptic(
          segment.midpoint,
          radius + 0.42,
          segment.index % 2 === 0 ? 0.08 : -0.08,
        );

        return (
          <group key={segment.name}>
            <Line
              points={segment.arc}
              color={accent}
              lineWidth={1.1}
              transparent
              opacity={0.48}
              depthWrite={false}
            />
            <Line
              points={segment.boundary}
              color="#aebbd5"
              lineWidth={0.65}
              transparent
              opacity={0.3}
              depthWrite={false}
            />
            <Line
              points={segment.constellation}
              color={accent}
              lineWidth={0.7}
              transparent
              opacity={0.5}
              depthWrite={false}
            />

            {showLabels && (
              <Html
                position={labelPosition}
                center
                distanceFactor={10}
                zIndexRange={[8, 0]}
                style={{ pointerEvents: "none" }}
              >
                <span className="block w-max rounded bg-[#080a16]/65 px-1 py-0.5 text-[7px] font-medium uppercase tracking-[0.08em] text-slate-400 backdrop-blur-sm sm:text-[8px]">
                  <span className="mr-1 text-slate-600">{String(segment.index + 1).padStart(2, "0")}</span>
                  {getLocalizedNakshatraName(segment.name, locale)}
                </span>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
