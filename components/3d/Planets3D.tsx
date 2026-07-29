"use client";

import { Html, Line, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type {
  GrahaId,
  GrahaPosition,
  GrahaTrajectory,
  VedicChart,
} from "@/lib/astro/ephemeris";
import {
  getLocalizedGrahaName,
  getLocalizedNakshatraName,
  getLocalizedRasiName,
} from "@/lib/astro/localizedNames";
import type { AppLocale, AppTheme } from "@/lib/i18n";

export interface PlanetVisualStyle {
  color: string;
  emissive: string;
  size: number;
  orbitRadius: number;
}

const CELESTIAL_SHELL_RADIUS = 5.4;

export const PLANET_VISUALS: Record<GrahaId, PlanetVisualStyle> = {
  sun: { color: "#ffd66b", emissive: "#ff8a00", size: 0.34, orbitRadius: CELESTIAL_SHELL_RADIUS },
  moon: { color: "#e9f2ff", emissive: "#8fb9ff", size: 0.27, orbitRadius: CELESTIAL_SHELL_RADIUS },
  mercury: { color: "#8de8bd", emissive: "#188e68", size: 0.17, orbitRadius: CELESTIAL_SHELL_RADIUS },
  venus: { color: "#f6b8dc", emissive: "#9e467d", size: 0.21, orbitRadius: CELESTIAL_SHELL_RADIUS },
  mars: { color: "#ff766c", emissive: "#a32320", size: 0.2, orbitRadius: CELESTIAL_SHELL_RADIUS },
  jupiter: { color: "#ffc85c", emissive: "#a86412", size: 0.29, orbitRadius: CELESTIAL_SHELL_RADIUS },
  saturn: { color: "#88a9e8", emissive: "#294e9c", size: 0.25, orbitRadius: CELESTIAL_SHELL_RADIUS },
  rahu: { color: "#b394ff", emissive: "#5c32b0", size: 0.22, orbitRadius: CELESTIAL_SHELL_RADIUS },
  ketu: { color: "#62d9e6", emissive: "#167c8c", size: 0.22, orbitRadius: CELESTIAL_SHELL_RADIUS },
};

const LIGHT_PLANET_COLORS: Readonly<Record<GrahaId, string>> = {
  sun: "#d89b18",
  moon: "#8da2ba",
  mercury: "#26916a",
  venus: "#ca6fa4",
  mars: "#d94a43",
  jupiter: "#c88713",
  saturn: "#5277bb",
  rahu: "#7654c5",
  ketu: "#268b98",
};

export interface Planets3DProps {
  planets: VedicChart["planets"];
  selectedPlanetId?: GrahaId | null;
  onSelectPlanet?: (planet: GrahaPosition | null) => void;
  showTrajectories?: boolean;
  trajectories?: readonly GrahaTrajectory[];
  locale?: AppLocale;
  theme?: AppTheme;
  text?: Readonly<{
    bhava: string;
    pada: string;
    retrogradeShort: string;
  }>;
}

const DEG_TO_RAD = Math.PI / 180;
const DEFAULT_TEXT = {
  bhava: "Bhava",
  pada: "Pada",
  retrogradeShort: "R",
} as const;

/** Maps astronomical ecliptic longitude/latitude into Three's Y-up scene. */
function eclipticScenePosition(
  longitudeDeg: number,
  latitudeDeg: number,
  radius: number,
): [number, number, number] {
  const longitude = longitudeDeg * DEG_TO_RAD;
  const latitude = latitudeDeg * DEG_TO_RAD;
  const projectedRadius = Math.cos(latitude) * radius;

  return [
    Math.cos(longitude) * projectedRadius,
    Math.sin(latitude) * radius,
    Math.sin(longitude) * projectedRadius,
  ];
}

function formatSignDegree(value: number): string {
  const degrees = Math.floor(value);
  const minutes = Math.floor((value - degrees) * 60);
  return `${degrees}° ${String(minutes).padStart(2, "0")}′`;
}

function TrajectoryTrail({
  trajectory,
  radius,
  color,
  opacity,
}: {
  trajectory: GrahaTrajectory;
  radius: number;
  color: string;
  opacity: number;
}) {
  const points = useMemo(
    () =>
      trajectory.points.map((point) =>
        eclipticScenePosition(
          point.siderealLongitudeDeg,
          point.eclipticLatitudeDeg,
          radius,
        ),
      ),
    [radius, trajectory],
  );

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1.05}
      transparent
      opacity={opacity}
      depthWrite={false}
    />
  );
}

interface PlanetNodeProps {
  planet: GrahaPosition;
  selected: boolean;
  onSelectPlanet?: (planet: GrahaPosition) => void;
  locale: AppLocale;
  theme: AppTheme;
  text: NonNullable<Planets3DProps["text"]>;
}

function PlanetNodeComponent({
  planet,
  selected,
  onSelectPlanet,
  locale,
  theme,
  text,
}: PlanetNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const visual = PLANET_VISUALS[planet.id];
  const displayColor =
    theme === "light" ? LIGHT_PLANET_COLORS[planet.id] : visual.color;
  const position = useMemo(
    () =>
      eclipticScenePosition(
        planet.siderealLongitudeDeg,
        planet.eclipticLatitudeDeg,
        visual.orbitRadius,
      ),
    [planet.eclipticLatitudeDeg, planet.siderealLongitudeDeg, visual.orbitRadius],
  );

  useCursor(hovered, "pointer", "auto");

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const pulse = selected ? 1.12 + Math.sin(clock.elapsedTime * 3.2) * 0.05 : hovered ? 1.08 : 1;
    const scale = THREE.MathUtils.damp(groupRef.current.scale.x, pulse, 8, delta);
    groupRef.current.scale.setScalar(scale);
  });

  const showTooltip = selected || hovered;

  return (
    <group ref={groupRef} position={position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelectPlanet?.(planet);
        }}
        onPointerEnter={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        renderOrder={4}
      >
        <sphereGeometry args={[visual.size, 24, 16]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={visual.emissive}
          emissiveIntensity={
            theme === "light"
              ? selected
                ? 0.9
                : 0.35
              : selected
                ? 1.8
                : 0.9
          }
          roughness={planet.id === "moon" ? 0.88 : 0.48}
          metalness={planet.id === "saturn" ? 0.28 : 0.08}
        />
      </mesh>

      {(planet.id === "sun" || planet.id === "moon") && (
        <>
          <mesh scale={planet.id === "sun" ? 1.9 : 1.55} renderOrder={2}>
            <sphereGeometry args={[visual.size, 20, 12]} />
            <meshBasicMaterial
              color={visual.color}
              transparent
              opacity={
                theme === "light"
                  ? planet.id === "sun"
                    ? 0.08
                    : 0.055
                  : planet.id === "sun"
                    ? 0.13
                    : 0.09
              }
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <pointLight
            color={visual.color}
            intensity={
              theme === "light"
                ? planet.id === "sun"
                  ? 1.8
                  : 0.55
                : planet.id === "sun"
                  ? 4
                  : 1.2
            }
            distance={planet.id === "sun" ? 3.5 : 1.8}
            decay={2}
          />
        </>
      )}

      {planet.id === "saturn" && (
        <mesh rotation={[Math.PI / 2.7, 0.15, 0]}>
          <torusGeometry args={[visual.size * 1.45, visual.size * 0.18, 8, 36]} />
          <meshBasicMaterial color="#c5d5f2" transparent opacity={0.72} />
        </mesh>
      )}

      {(planet.id === "rahu" || planet.id === "ketu") && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[visual.size * 0.92, visual.size * 0.18, 8, 28]} />
          <meshBasicMaterial color="#f0eaff" transparent opacity={0.85} />
        </mesh>
      )}

      {showTooltip && (
        <Html
          position={[0, visual.size + 0.34, 0]}
          center
          distanceFactor={8}
          zIndexRange={[40, 10]}
          style={{ pointerEvents: "none" }}
        >
          <div className="w-max max-w-56 rounded-xl border border-white/15 bg-[#080a15]/95 px-3 py-2 text-left text-[11px] leading-4 text-slate-300 shadow-2xl shadow-black/60 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: visual.color, boxShadow: `0 0 10px ${visual.color}` }}
              />
              {getLocalizedGrahaName(planet.id, locale)}
              {planet.retrograde ? ` · ${text.retrogradeShort}` : ""}
            </div>
            <div className="mt-1 text-slate-400">
              {getLocalizedRasiName(planet.sign.name, locale)}{" "}
              {formatSignDegree(planet.sign.degreeDeg)} · {text.bhava}{" "}
              {planet.house}
            </div>
            <div className="text-slate-500">
              {getLocalizedNakshatraName(planet.nakshatra.name, locale)} ·{" "}
              {text.pada} {planet.nakshatra.pada}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

const PlanetNode = memo(PlanetNodeComponent);

export default function Planets3D({
  planets,
  selectedPlanetId = null,
  onSelectPlanet,
  showTrajectories = true,
  trajectories = [],
  locale = "en",
  theme = "dark",
  text = DEFAULT_TEXT,
}: Planets3DProps) {
  return (
    <group>
      {showTrajectories &&
        planets.map((planet) => {
          const visual = PLANET_VISUALS[planet.id];
          const trajectory = trajectories.find((item) => item.id === planet.id);
          return trajectory ? (
            <TrajectoryTrail
              key={`track-${planet.id}`}
              trajectory={trajectory}
              radius={visual.orbitRadius}
              color={
                theme === "light"
                  ? LIGHT_PLANET_COLORS[planet.id]
                  : visual.color
              }
              opacity={theme === "light" ? 0.52 : 0.34}
            />
          ) : null;
        })}

      {planets.map((planet) => (
        <PlanetNode
          key={planet.id}
          planet={planet}
          selected={planet.id === selectedPlanetId}
          onSelectPlanet={onSelectPlanet}
          locale={locale}
          theme={theme}
          text={text}
        />
      ))}
    </group>
  );
}
