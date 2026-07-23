"use client";

import { AdaptiveDpr, Html, Line, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import {
  LoaderCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import {
  Component,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { SiderealTime } from "astronomy-engine";

import { calculatePerspectiveFrameDistance } from "@/components/3d/camera-framing";
import Nakshatras3D from "@/components/3d/Nakshatras3D";
import Planets3D, { PLANET_VISUALS } from "@/components/3d/Planets3D";
import {
  probeWebGLCapability,
  type WebGLCapability,
  type WebGLFailureReason,
} from "@/components/3d/webgl-capability";
import {
  useAppPreferences,
  useScopedTranslations,
} from "@/components/providers/AppPreferencesProvider";
import {
  RASIS,
  calculateGrahaTrajectories,
  type GrahaId,
  type GrahaPosition,
  type GrahaTrajectory,
  type VedicChart,
} from "@/lib/astro/ephemeris";
import {
  getLocalizedGrahaName,
  getLocalizedNakshatraName,
  getLocalizedRasiName,
} from "@/lib/astro/localizedNames";
import {
  defineMessages,
  type AppLocale,
  type TranslationValues,
} from "@/lib/i18n";

export interface CelestialSphereProps {
  chart: VedicChart;
  /** Omit to let the visualizer manage selection internally. */
  selectedPlanetId?: GrahaId | null;
  onSelectPlanet?: (planet: GrahaPosition | null) => void;
  className?: string;
  showNakshatraLabels?: boolean;
  showPlanetTrajectories?: boolean;
  autoRotate?: boolean;
}

const DEG_TO_RAD = Math.PI / 180;
const TAU = Math.PI * 2;
const SCENE_OUTER_RADIUS = 8;
const ZODIAC_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"] as const;
const ZODIAC_COLORS = [
  "#d46a55",
  "#b89c5c",
  "#68a99b",
  "#668ac5",
  "#d0954d",
  "#7ea775",
  "#b57d9f",
  "#875d91",
  "#b97952",
  "#667fa6",
  "#668fa1",
  "#7485b9",
] as const;

const COSMOS_MESSAGES = defineMessages({
  en: {
    sectionAria: "Interactive geocentric celestial sphere",
    lagna: "Lagna",
    bhava: "Bhava",
    pada: "Pada",
    retrogradeShort: "R",
    retrogradeAriaSuffix: ", retrograde",
    geocentricSky: "Geocentric sidereal sky",
    lahiriAyanamsa: "Lahiri ayanamsa {value}°",
    nakshatraLabels: "Nakshatra labels",
    ephemerisTrails: "Ephemeris trails",
    asterismNote:
      "Nakshatra asterisms are illustrative; trails use sampled ephemeris positions.",
    fullscreenUnsupportedError:
      "Fullscreen is not supported by this browser.",
    fullscreenFailedError:
      "The browser could not enter fullscreen. Check its site permissions and try again.",
    fullscreenExitAria: "Exit fullscreen celestial sphere",
    fullscreenOpenAria: "Open celestial sphere in fullscreen",
    fullscreenUnavailableAria: "Fullscreen is unavailable in this browser",
    exitFullscreenTitle: "Exit fullscreen",
    openFullscreenTitle: "Open fullscreen",
    fullscreenUnavailableTitle: "Fullscreen unavailable",
    minimize: "Minimize",
    fullscreen: "Fullscreen",
    unavailable: "Unavailable",
    webglUnavailable:
      "WebGL is unavailable in this browser. The chart and analysis remain accessible below.",
    webglCheckingTitle: "Checking 3D graphics support",
    webglCheckingBody:
      "The celestial renderer will start only after the browser confirms a usable WebGL context.",
    webglUnavailableTitle: "The 3D cosmos is unavailable",
    webglUnavailableBody:
      "This browser could not create a usable WebGL graphics context.",
    webglDisabledBody:
      "The browser reports that WebGL or its graphics provider is disabled.",
    webglLostBody:
      "The browser lost the WebGL graphics context while the cosmos was running.",
    webglRuntimeBody:
      "The 3D renderer stopped safely after an unexpected graphics error.",
    webglHelpTitle: "To restore the 3D view",
    webglHardwareStep:
      "Enable hardware acceleration in your browser settings, then fully restart the browser.",
    webglBrowserStep:
      "Use a current WebGL-capable browser such as Chrome, Edge, Firefox, or Safari.",
    webglDriverStep:
      "If it remains disabled, update the graphics driver or ask the device administrator to allow WebGL.",
    webglRestAvailable:
      "Your Rasi chart, Dashas, transit calculations, and Jyotish analysis remain available.",
    webglRetry: "Retry WebGL",
    webglRetryAria: "Check WebGL support again",
    webglReason: "Technical reason: {reason}",
    webglReasonApi: "WebGL API unavailable",
    webglReasonContext: "graphics context unavailable",
    webglReasonDisabled: "graphics provider disabled",
    webglReasonLost: "graphics context lost",
    webglReasonRuntime: "renderer initialization failed",
    dragZoom: "Drag to orbit · Scroll to zoom",
    selectGraha: "Select a graha",
    toolbarAria: "Select a planet in the celestial sphere",
    showGrahaAria:
      "Show {planet}: {rasi}, Bhava {house}{retrograde}",
  },
  hi: {
    sectionAria: "इंटरैक्टिव भूकेंद्रीय खगोलीय गोला",
    lagna: "लग्न",
    bhava: "भाव",
    pada: "पाद",
    retrogradeShort: "वक्री",
    retrogradeAriaSuffix: ", वक्री",
    geocentricSky: "भूकेंद्रीय निरयन आकाश",
    lahiriAyanamsa: "लाहिरी अयनांश {value}°",
    nakshatraLabels: "नक्षत्र नाम",
    ephemerisTrails: "ग्रह-पथ",
    asterismNote:
      "नक्षत्र-तारक समूह सांकेतिक हैं; पथ नमूना पंचांग स्थितियों से बने हैं।",
    fullscreenUnsupportedError:
      "यह ब्राउज़र पूर्णस्क्रीन का समर्थन नहीं करता।",
    fullscreenFailedError:
      "ब्राउज़र पूर्णस्क्रीन नहीं खोल सका। साइट अनुमतियाँ जाँचकर फिर प्रयास करें।",
    fullscreenExitAria: "खगोलीय गोले की पूर्णस्क्रीन बंद करें",
    fullscreenOpenAria: "खगोलीय गोला पूर्णस्क्रीन में खोलें",
    fullscreenUnavailableAria:
      "इस ब्राउज़र में पूर्णस्क्रीन उपलब्ध नहीं है",
    exitFullscreenTitle: "पूर्णस्क्रीन बंद करें",
    openFullscreenTitle: "पूर्णस्क्रीन खोलें",
    fullscreenUnavailableTitle: "पूर्णस्क्रीन उपलब्ध नहीं",
    minimize: "छोटा करें",
    fullscreen: "पूर्णस्क्रीन",
    unavailable: "अनुपलब्ध",
    webglUnavailable:
      "इस ब्राउज़र में WebGL उपलब्ध नहीं है। नीचे कुंडली और विश्लेषण उपलब्ध हैं।",
    webglCheckingTitle: "3D ग्राफ़िक्स समर्थन की जाँच",
    webglCheckingBody:
      "उपयोगी WebGL संदर्भ की पुष्टि होने के बाद ही खगोलीय रेंडरर शुरू होगा।",
    webglUnavailableTitle: "3D ब्रह्मांड उपलब्ध नहीं है",
    webglUnavailableBody:
      "यह ब्राउज़र उपयोगी WebGL ग्राफ़िक्स संदर्भ नहीं बना सका।",
    webglDisabledBody:
      "ब्राउज़र बता रहा है कि WebGL या उसका ग्राफ़िक्स प्रदाता बंद है।",
    webglLostBody:
      "3D ब्रह्मांड चलते समय ब्राउज़र ने WebGL ग्राफ़िक्स संदर्भ खो दिया।",
    webglRuntimeBody:
      "अप्रत्याशित ग्राफ़िक्स त्रुटि के बाद 3D रेंडरर सुरक्षित रूप से रुक गया।",
    webglHelpTitle: "3D दृश्य पुनः चालू करने के लिए",
    webglHardwareStep:
      "ब्राउज़र सेटिंग में हार्डवेयर एक्सेलेरेशन चालू करें और ब्राउज़र पूरी तरह पुनः आरंभ करें।",
    webglBrowserStep:
      "Chrome, Edge, Firefox या Safari जैसे वर्तमान WebGL-सक्षम ब्राउज़र का उपयोग करें।",
    webglDriverStep:
      "यदि यह फिर भी बंद रहे, ग्राफ़िक्स ड्राइवर अपडेट करें या डिवाइस प्रशासक से WebGL की अनुमति माँगें।",
    webglRestAvailable:
      "आपकी राशि कुंडली, दशाएँ, गोचर गणना और ज्योतिष विश्लेषण उपलब्ध रहेंगे।",
    webglRetry: "WebGL फिर जाँचें",
    webglRetryAria: "WebGL समर्थन की फिर जाँच करें",
    webglReason: "तकनीकी कारण: {reason}",
    webglReasonApi: "WebGL API उपलब्ध नहीं",
    webglReasonContext: "ग्राफ़िक्स संदर्भ उपलब्ध नहीं",
    webglReasonDisabled: "ग्राफ़िक्स प्रदाता बंद है",
    webglReasonLost: "ग्राफ़िक्स संदर्भ खो गया",
    webglReasonRuntime: "रेंडरर आरंभ नहीं हो सका",
    dragZoom: "कक्षा घुमाने के लिए खींचें · ज़ूम के लिए स्क्रोल करें",
    selectGraha: "ग्रह चुनें",
    toolbarAria: "खगोलीय गोले में ग्रह चुनें",
    showGrahaAria:
      "{planet} दिखाएँ: {rasi}, भाव {house}{retrograde}",
  },
  mr: {
    sectionAria: "परस्परसंवादी भूकेंद्रीय खगोलीय गोल",
    lagna: "लग्न",
    bhava: "भाव",
    pada: "पाद",
    retrogradeShort: "वक्री",
    retrogradeAriaSuffix: ", वक्री",
    geocentricSky: "भूकेंद्रीय निरयन आकाश",
    lahiriAyanamsa: "लाहिरी अयनांश {value}°",
    nakshatraLabels: "नक्षत्र नावे",
    ephemerisTrails: "ग्रहांचे मार्ग",
    asterismNote:
      "नक्षत्र-तारकसमूह सूचक आहेत; मार्ग नमुना पंचांग स्थानांवर आधारित आहेत.",
    fullscreenUnsupportedError:
      "हा ब्राउझर पूर्णपटलाला समर्थन देत नाही.",
    fullscreenFailedError:
      "ब्राउझर पूर्णपटल उघडू शकला नाही. साइट परवानग्या तपासून पुन्हा प्रयत्न करा.",
    fullscreenExitAria: "खगोलीय गोलाचे पूर्णपटल बंद करा",
    fullscreenOpenAria: "खगोलीय गोल पूर्णपटलात उघडा",
    fullscreenUnavailableAria:
      "या ब्राउझरमध्ये पूर्णपटल उपलब्ध नाही",
    exitFullscreenTitle: "पूर्णपटल बंद करा",
    openFullscreenTitle: "पूर्णपटल उघडा",
    fullscreenUnavailableTitle: "पूर्णपटल उपलब्ध नाही",
    minimize: "लहान करा",
    fullscreen: "पूर्णपटल",
    unavailable: "अनुपलब्ध",
    webglUnavailable:
      "या ब्राउझरमध्ये WebGL उपलब्ध नाही. खाली कुंडली आणि विश्लेषण उपलब्ध आहेत.",
    webglCheckingTitle: "3D ग्राफिक्स समर्थन तपासत आहे",
    webglCheckingBody:
      "वापरण्यायोग्य WebGL संदर्भाची खात्री झाल्यानंतरच खगोलीय रेंडरर सुरू होईल.",
    webglUnavailableTitle: "3D ब्रह्मांड उपलब्ध नाही",
    webglUnavailableBody:
      "हा ब्राउझर वापरण्यायोग्य WebGL ग्राफिक्स संदर्भ तयार करू शकला नाही.",
    webglDisabledBody:
      "ब्राउझरनुसार WebGL किंवा त्याचा ग्राफिक्स प्रदाता बंद आहे.",
    webglLostBody:
      "3D ब्रह्मांड चालू असताना ब्राउझरने WebGL ग्राफिक्स संदर्भ गमावला.",
    webglRuntimeBody:
      "अनपेक्षित ग्राफिक्स त्रुटीनंतर 3D रेंडरर सुरक्षितपणे थांबला.",
    webglHelpTitle: "3D दृश्य पुन्हा सुरू करण्यासाठी",
    webglHardwareStep:
      "ब्राउझर सेटिंगमध्ये हार्डवेअर अॅक्सेलरेशन सुरू करा आणि ब्राउझर पूर्णपणे पुन्हा सुरू करा.",
    webglBrowserStep:
      "Chrome, Edge, Firefox किंवा Safari यांसारखा अद्ययावत WebGL-सक्षम ब्राउझर वापरा.",
    webglDriverStep:
      "तरीही ते बंद असल्यास ग्राफिक्स ड्रायव्हर अद्ययावत करा किंवा डिव्हाइस प्रशासकाकडून WebGL ची परवानगी घ्या.",
    webglRestAvailable:
      "तुमची राशी कुंडली, दशा, गोचर गणना आणि ज्योतिष विश्लेषण उपलब्ध राहतील.",
    webglRetry: "WebGL पुन्हा तपासा",
    webglRetryAria: "WebGL समर्थन पुन्हा तपासा",
    webglReason: "तांत्रिक कारण: {reason}",
    webglReasonApi: "WebGL API उपलब्ध नाही",
    webglReasonContext: "ग्राफिक्स संदर्भ उपलब्ध नाही",
    webglReasonDisabled: "ग्राफिक्स प्रदाता बंद आहे",
    webglReasonLost: "ग्राफिक्स संदर्भ गमावला",
    webglReasonRuntime: "रेंडरर सुरू होऊ शकला नाही",
    dragZoom: "कक्षा फिरवण्यासाठी ड्रॅग करा · झूमसाठी स्क्रोल करा",
    selectGraha: "ग्रह निवडा",
    toolbarAria: "खगोलीय गोलातील ग्रह निवडा",
    showGrahaAria:
      "{planet} दाखवा: {rasi}, भाव {house}{retrograde}",
  },
});

type CosmosTranslate = (
  key: keyof typeof COSMOS_MESSAGES.en,
  values?: TranslationValues,
) => string;

function webglReasonLabel(
  reason: WebGLFailureReason,
  t: CosmosTranslate,
): string {
  switch (reason) {
    case "api-unavailable":
      return t("webglReasonApi");
    case "context-unavailable":
      return t("webglReasonContext");
    case "disabled":
      return t("webglReasonDisabled");
    case "context-lost":
      return t("webglReasonLost");
    case "runtime-error":
      return t("webglReasonRuntime");
  }
}

function WebGLUnavailableView({
  capability,
  onRetry,
  t,
}: {
  capability: WebGLCapability;
  onRetry: () => void;
  t: CosmosTranslate;
}) {
  const checking = capability.status === "checking";
  const reason =
    capability.status === "unsupported" ? capability.reason : undefined;
  const explanation =
    reason === "disabled"
      ? t("webglDisabledBody")
      : reason === "context-lost"
        ? t("webglLostBody")
        : reason === "runtime-error"
          ? t("webglRuntimeBody")
          : t("webglUnavailableBody");

  return (
    <div
      className="absolute inset-0 z-50 grid place-items-center overflow-y-auto bg-[radial-gradient(circle_at_50%_35%,rgba(76,56,130,0.2),transparent_42%),#050611] p-4 sm:p-8"
      role={checking ? "status" : "alert"}
      aria-live="polite"
    >
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#080a15]/92 p-5 text-left shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-violet-300/15 bg-violet-400/10 text-violet-200">
            {checking ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <TriangleAlert aria-hidden="true" className="size-5" />
            )}
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white">
              {checking
                ? t("webglCheckingTitle")
                : t("webglUnavailableTitle")}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {checking ? t("webglCheckingBody") : explanation}
            </p>
          </div>
        </div>

        {!checking && reason ? (
          <>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                {t("webglHelpTitle")}
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-5 text-slate-300">
                <li>{t("webglHardwareStep")}</li>
                <li>{t("webglBrowserStep")}</li>
                <li>{t("webglDriverStep")}</li>
              </ol>
            </div>
            <p className="mt-4 text-xs leading-5 text-emerald-200">
              {t("webglRestAvailable")}
            </p>
            <p className="mt-2 break-words font-mono text-[10px] text-slate-500">
              {t("webglReason", {
                reason: webglReasonLabel(reason, t),
              })}
            </p>
            <button
              type="button"
              onClick={onRetry}
              aria-label={t("webglRetryAria")}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/15 px-4 text-xs font-semibold text-violet-100 transition hover:border-violet-200/35 hover:bg-violet-400/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              {t("webglRetry")}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

class WebGLRuntimeBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function circlePoints(radius: number, y = 0, segments = 160): THREE.Vector3[] {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = (index / segments) * TAU;
    return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  });
}

function scenePoint(angleDeg: number, radius: number, y = 0): THREE.Vector3 {
  const angle = angleDeg * DEG_TO_RAD;
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
}

function Earth({
  latitude,
  longitude,
  instant,
  ayanamsaDeg,
  animate,
}: {
  latitude: number;
  longitude: number;
  instant: string;
  ayanamsaDeg: number;
  animate: boolean;
}) {
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const location = useMemo(() => {
    const latitudeRad = latitude * DEG_TO_RAD;
    // Greenwich sidereal time rotates the terrestrial location against the
    // celestial frame. Subtracting ayanamsa aligns it with the sidereal zodiac
    // used everywhere else in this scene.
    const celestialLongitudeDeg =
      SiderealTime(new Date(instant)) * 15 + longitude - ayanamsaDeg;
    const longitudeRad = celestialLongitudeDeg * DEG_TO_RAD;
    const radius = 0.77;
    return new THREE.Vector3(
      Math.cos(latitudeRad) * Math.cos(longitudeRad) * radius,
      Math.sin(latitudeRad) * radius,
      Math.cos(latitudeRad) * Math.sin(longitudeRad) * radius,
    );
  }, [ayanamsaDeg, instant, latitude, longitude]);

  useFrame(({ clock }) => {
    if (!atmosphereRef.current || !animate) return;
    const pulse = 1.035 + Math.sin(clock.elapsedTime * 0.85) * 0.008;
    atmosphereRef.current.scale.setScalar(pulse);
  });

  return (
    <group name="geocentric-earth" rotation={[0, 0, -23.4393 * DEG_TO_RAD]}>
      <mesh>
        <sphereGeometry args={[0.72, 48, 32]} />
        <meshStandardMaterial
          color="#123b62"
          emissive="#071b33"
          emissiveIntensity={0.7}
          roughness={0.72}
          metalness={0.06}
        />
      </mesh>

      <mesh renderOrder={2}>
        <sphereGeometry args={[0.728, 24, 16]} />
        <meshBasicMaterial
          color="#7ac9df"
          wireframe
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={atmosphereRef} renderOrder={1}>
        <sphereGeometry args={[0.78, 32, 20]} />
        <meshBasicMaterial
          color="#5bc8ff"
          side={THREE.DoubleSide}
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <Line
        points={circlePoints(0.735)}
        color="#8be4eb"
        lineWidth={0.7}
        transparent
        opacity={0.45}
      />

      <group position={location}>
        <mesh>
          <sphereGeometry args={[0.035, 12, 8]} />
          <meshBasicMaterial color="#ffd76d" />
        </mesh>
        <pointLight color="#ffd76d" intensity={0.8} distance={0.7} />
      </group>
    </group>
  );
}

function ZodiacBand({ locale }: { locale: AppLocale }) {
  const innerRadius = 6.3;
  const outerRadius = 6.74;
  const segmentAngle = TAU / RASIS.length;

  return (
    <group name="sidereal-zodiac">
      {RASIS.map((sign, index) => {
        const midpointDeg = index * 30 + 15;
        const boundary = [
          scenePoint(index * 30, innerRadius),
          scenePoint(index * 30, outerRadius),
        ];
        const labelPosition = scenePoint(midpointDeg, (innerRadius + outerRadius) / 2, 0.04);

        return (
          <group key={sign}>
            <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={0}>
              <ringGeometry
                args={[
                  innerRadius,
                  outerRadius,
                  24,
                  1,
                  index * segmentAngle,
                  segmentAngle,
                ]}
              />
              <meshBasicMaterial
                color={ZODIAC_COLORS[index]}
                side={THREE.DoubleSide}
                transparent
                opacity={index % 2 === 0 ? 0.12 : 0.075}
                depthWrite={false}
              />
            </mesh>
            <Line
              points={boundary}
              color="#dbe4f5"
              lineWidth={0.65}
              transparent
              opacity={0.26}
              depthWrite={false}
            />
            <Html
              position={labelPosition}
              center
              distanceFactor={9}
              zIndexRange={[12, 1]}
              style={{ pointerEvents: "none" }}
            >
              <span className="flex w-max items-center gap-1 rounded-full border border-white/10 bg-[#080a15]/75 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.1em] text-slate-300 backdrop-blur-sm sm:text-[9px]">
                <span className="text-[11px] text-amber-200">{ZODIAC_SYMBOLS[index]}</span>
                {getLocalizedRasiName(sign, locale)}
              </span>
            </Html>
          </group>
        );
      })}
      <Line
        points={circlePoints(innerRadius)}
        color="#d4c27e"
        lineWidth={0.9}
        transparent
        opacity={0.35}
      />
      <Line
        points={circlePoints(outerRadius)}
        color="#d4c27e"
        lineWidth={0.9}
        transparent
        opacity={0.35}
      />
    </group>
  );
}

function AscendantMarker({
  chart,
  locale,
  lagnaLabel,
}: {
  chart: VedicChart;
  locale: AppLocale;
  lagnaLabel: string;
}) {
  const longitude = chart.ascendant.siderealLongitudeDeg;
  const line = [scenePoint(longitude, 6.18, 0.025), scenePoint(longitude, 7.34, 0.025)];
  const labelPosition = scenePoint(longitude, 7.62, 0.08);

  return (
    <group name="ascendant-marker">
      <Line points={line} color="#ffe08a" lineWidth={2} transparent opacity={0.9} />
      <mesh position={line[0]}>
        <sphereGeometry args={[0.065, 12, 8]} />
        <meshBasicMaterial color="#ffe08a" />
      </mesh>
      <Html
        position={labelPosition}
        center
        distanceFactor={10}
        zIndexRange={[18, 4]}
        style={{ pointerEvents: "none" }}
      >
        <span className="block w-max rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-amber-100 backdrop-blur-md">
          {lagnaLabel} ·{" "}
          {getLocalizedRasiName(chart.ascendant.sign.name, locale)}
        </span>
      </Html>
    </group>
  );
}

interface SceneProps {
  chart: VedicChart;
  locale: AppLocale;
  text: Readonly<{
    lagna: string;
    bhava: string;
    pada: string;
    retrogradeShort: string;
  }>;
  selectedPlanetId: GrahaId | null;
  onSelectPlanet: (planet: GrahaPosition | null) => void;
  showNakshatraLabels: boolean;
  showPlanetTrajectories: boolean;
  autoRotate: boolean;
  reduceMotion: boolean;
  trajectories: readonly GrahaTrajectory[];
}

/**
 * R3F normally observes its own percentage-sized wrapper. A definite absolute
 * host plus this synchronization closes the mount-time race where that wrapper
 * can retain the canvas element's short intrinsic height while the surrounding
 * celestial panel has already grown to its responsive height.
 */
function CanvasHostResizeSync() {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const setSize = useThree((state) => state.setSize);

  useLayoutEffect(() => {
    const host = gl.domElement.closest<HTMLElement>(
      "[data-celestial-canvas-host]",
    );
    if (!host) return;

    let animationFrame = 0;
    const synchronize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setSize(rect.width, rect.height, rect.top, rect.left);
      invalidate();
    };
    const schedule = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(synchronize);
    };
    const observer = new ResizeObserver(schedule);

    observer.observe(host);
    synchronize();
    animationFrame = requestAnimationFrame(synchronize);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [gl, invalidate, setSize]);

  return null;
}

/**
 * Reframes when the synchronized drawing surface changes size. The bounding
 * sphere occupies 72% of the limiting viewport dimension, leaving room for
 * the explanatory and selection overlays without wasting the lower canvas.
 */
function ResponsiveCameraFraming() {
  const camera = useThree((state) => state.camera);
  const height = useThree((state) => state.size.height);
  const invalidate = useThree((state) => state.invalidate);
  const width = useThree((state) => state.size.width);

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || width === 0 || height === 0) {
      return;
    }

    const distance = calculatePerspectiveFrameDistance({
      width,
      height,
      verticalFovDeg: camera.fov,
      radius: SCENE_OUTER_RADIUS,
    });

    // A steeper view opens the ecliptic into a generous ellipse instead of
    // compressing the entire zodiac into a shallow strip across the top.
    const elevation = THREE.MathUtils.degToRad(43);
    camera.position.set(
      0,
      Math.sin(elevation) * distance,
      Math.cos(elevation) * distance,
    );
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, height, invalidate, width]);

  return null;
}

function CelestialOrbitControls({
  autoRotate,
  reduceMotion,
}: {
  autoRotate: boolean;
  reduceMotion: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const height = useThree((state) => state.size.height);
  const width = useThree((state) => state.size.width);
  const fittedDistance =
    camera instanceof THREE.PerspectiveCamera && width > 0 && height > 0
      ? calculatePerspectiveFrameDistance({
          width,
          height,
          verticalFovDeg: camera.fov,
          radius: SCENE_OUTER_RADIUS,
        })
      : 27.4;

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.075}
      enablePan
      panSpeed={0.55}
      rotateSpeed={0.55}
      zoomSpeed={0.75}
      minDistance={7.8}
      // Keep deliberate zoom-out useful without allowing an accidental wheel
      // gesture to reduce the cosmos to a small island in a black panel.
      maxDistance={fittedDistance * 1.18}
      autoRotate={autoRotate && !reduceMotion}
      autoRotateSpeed={0.24}
      target={[0, 0, 0]}
    />
  );
}

function Scene({
  chart,
  locale,
  text,
  selectedPlanetId,
  onSelectPlanet,
  showNakshatraLabels,
  showPlanetTrajectories,
  autoRotate,
  reduceMotion,
  trajectories,
}: SceneProps) {
  return (
    <>
      <color attach="background" args={["#050611"]} />
      <fog attach="fog" args={["#050611", 18, 62]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[5, 8, 6]} intensity={1.65} color="#d7e5ff" />
      <pointLight position={[-5, -2, -4]} intensity={12} distance={16} color="#6747be" />

      <Stars radius={62} depth={36} count={1500} factor={3} saturation={0.3} fade speed={reduceMotion ? 0 : 0.2} />

      <mesh renderOrder={-2}>
        <sphereGeometry args={[7.75, 32, 18]} />
        <meshBasicMaterial
          color="#6c79ad"
          wireframe
          side={THREE.DoubleSide}
          transparent
          opacity={0.035}
          depthWrite={false}
        />
      </mesh>

      <Earth
        latitude={chart.location.latitude}
        longitude={chart.location.longitude}
        instant={chart.instant}
        ayanamsaDeg={chart.ayanamsa.trueDegrees}
        animate={!reduceMotion}
      />
      <ZodiacBand locale={locale} />
      <Nakshatras3D showLabels={showNakshatraLabels} locale={locale} />
      <AscendantMarker
        chart={chart}
        locale={locale}
        lagnaLabel={text.lagna}
      />
      <Planets3D
        planets={chart.planets}
        selectedPlanetId={selectedPlanetId}
        onSelectPlanet={onSelectPlanet}
        showTrajectories={showPlanetTrajectories}
        trajectories={trajectories}
        locale={locale}
        text={text}
      />

      <CanvasHostResizeSync />
      <ResponsiveCameraFraming />

      <CelestialOrbitControls
        autoRotate={autoRotate}
        reduceMotion={reduceMotion}
      />
      <AdaptiveDpr pixelated />
    </>
  );
}

type FullscreenState = "active" | "available" | "unsupported";
type FullscreenError = "unsupported" | "failed" | null;

function getFullscreenServerSnapshot(): FullscreenState {
  return "unsupported";
}

function formatSelectedDegree(planet: GrahaPosition): string {
  return `${planet.sign.degreeDeg.toFixed(2)}°`;
}

export default function CelestialSphere({
  chart,
  selectedPlanetId,
  onSelectPlanet,
  className = "",
  showNakshatraLabels = true,
  showPlanetTrajectories = true,
  autoRotate = false,
}: CelestialSphereProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { locale } = useAppPreferences();
  const t = useScopedTranslations(COSMOS_MESSAGES);
  const [webglProbeAttempt, setWebglProbeAttempt] = useState(0);
  const [webglCapability, setWebglCapability] =
    useState<WebGLCapability>({ status: "checking" });
  const [internalSelectedId, setInternalSelectedId] = useState<GrahaId | null>(null);
  const [fullscreenError, setFullscreenError] =
    useState<FullscreenError>(null);
  const [labelsVisible, setLabelsVisible] = useState(() =>
    showNakshatraLabels &&
    (typeof window === "undefined" || window.matchMedia("(min-width: 640px)").matches),
  );
  const [pathsVisible, setPathsVisible] = useState(() =>
    showPlanetTrajectories &&
    (typeof window === "undefined" || window.matchMedia("(min-width: 640px)").matches),
  );
  const reduceMotion = useReducedMotion() ?? false;
  const deferredChart = useDeferredValue(chart);

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      const capability = probeWebGLCapability();
      if (!cancelled) setWebglCapability(capability);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [webglProbeAttempt]);

  const trajectories = useMemo(
    () =>
      webglCapability.status === "supported" && pathsVisible
        ? calculateGrahaTrajectories(
            {
              instant: new Date(deferredChart.instant),
              latitude: deferredChart.location.latitude,
              longitude: deferredChart.location.longitude,
              elevationMeters: deferredChart.location.elevationMeters,
            },
            { samples: 25 },
          )
        : [],
    [deferredChart, pathsVisible, webglCapability.status],
  );
  const isControlled = selectedPlanetId !== undefined;
  const activePlanetId = isControlled ? selectedPlanetId : internalSelectedId;
  const activePlanet = chart.planets.find((planet) => planet.id === activePlanetId) ?? null;
  const sceneText = useMemo(
    () => ({
      lagna: t("lagna"),
      bhava: t("bhava"),
      pada: t("pada"),
      retrogradeShort: t("retrogradeShort"),
    }),
    [t],
  );

  const subscribeToFullscreen = useCallback((notify: () => void) => {
    if (typeof document === "undefined") return () => undefined;
    document.addEventListener("fullscreenchange", notify);
    return () => document.removeEventListener("fullscreenchange", notify);
  }, []);

  const getFullscreenSnapshot = useCallback((): FullscreenState => {
    if (
      typeof document === "undefined" ||
      !document.fullscreenEnabled ||
      typeof containerRef.current?.requestFullscreen !== "function"
    ) {
      return "unsupported";
    }
    return document.fullscreenElement === containerRef.current ? "active" : "available";
  }, []);

  const fullscreenState = useSyncExternalStore(
    subscribeToFullscreen,
    getFullscreenSnapshot,
    getFullscreenServerSnapshot,
  );
  const isFullscreen = fullscreenState === "active";
  const fullscreenSupported = fullscreenState !== "unsupported";

  const selectPlanet = useCallback(
    (planet: GrahaPosition | null) => {
      if (!isControlled) setInternalSelectedId(planet?.id ?? null);
      onSelectPlanet?.(planet);
    },
    [isControlled, onSelectPlanet],
  );

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container || !document.fullscreenEnabled || !container.requestFullscreen) {
      setFullscreenError("unsupported");
      return;
    }

    setFullscreenError(null);
    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch {
      setFullscreenError("failed");
    }
  }, []);

  const retryWebGL = useCallback(() => {
    setWebglCapability({ status: "checking" });
    setWebglProbeAttempt((attempt) => attempt + 1);
  }, []);

  const handleWebGLContextLost = useCallback((event: Event) => {
    event.preventDefault();
    setWebglCapability({ status: "unsupported", reason: "context-lost" });
  }, []);

  return (
    <section
      ref={containerRef}
      data-cosmos-ui
      aria-label={t("sectionAria")}
      className={`relative isolate h-[clamp(620px,78vh,920px)] min-h-[620px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40 ${isFullscreen ? "!h-[100dvh] !min-h-0 !w-screen !max-w-none !rounded-none !border-0" : ""} ${className}`}
      style={{
        backgroundColor: "#050611",
        ...(isFullscreen ? { height: "100dvh", width: "100vw" } : {}),
      }}
    >
      {webglCapability.status !== "supported" ? (
        <WebGLUnavailableView
          capability={webglCapability}
          onRetry={retryWebGL}
          t={t}
        />
      ) : (
        <WebGLRuntimeBoundary
          key={`webgl-runtime-${webglProbeAttempt}`}
          fallback={
            <WebGLUnavailableView
              capability={{ status: "unsupported", reason: "runtime-error" }}
              onRetry={retryWebGL}
              t={t}
            />
          }
        >
          <>
            <div
              data-celestial-canvas-host
              className="absolute inset-0 h-full min-h-0 w-full"
              style={{ height: "100%", width: "100%" }}
            >
              <Canvas
          // The browser Fullscreen API can change the containing block without
          // delivering a usable ResizeObserver entry to R3F. Remounting only at
          // the fullscreen boundary makes the renderer measure the new viewport
          // immediately, including its drawing buffer and responsive camera.
          key={isFullscreen ? "fullscreen-canvas" : "embedded-canvas"}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            height: "100%",
            width: "100%",
          }}
          camera={{ position: [0, 18.8, 20.2], fov: 46, near: 0.1, far: 140 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          frameloop={reduceMotion ? "demand" : "always"}
          onPointerMissed={() => selectPlanet(null)}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener(
              "webglcontextlost",
              handleWebGLContextLost,
              { once: true },
            );
          }}
          fallback={
            <div className="grid h-full min-h-[620px] place-items-center bg-[#050611] p-8 text-center text-sm text-slate-400">
              {t("webglUnavailable")}
            </div>
          }
              >
                <Suspense fallback={null}>
                  <Scene
                    chart={chart}
                    locale={locale}
                    text={sceneText}
                    selectedPlanetId={activePlanetId ?? null}
                    onSelectPlanet={selectPlanet}
                    showNakshatraLabels={labelsVisible}
                    showPlanetTrajectories={pathsVisible}
                    autoRotate={autoRotate}
                    reduceMotion={reduceMotion}
                    trajectories={trajectories}
                  />
                </Suspense>
              </Canvas>
            </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_45%,transparent_35%,rgba(2,3,10,0.62)_100%)]" />

      <div className="absolute left-4 top-4 z-20 max-w-[calc(100%-5.5rem)] rounded-2xl border border-white/10 bg-[#080a15]/75 px-3 py-2 backdrop-blur-md sm:left-5 sm:top-5 sm:max-w-[calc(100%-12rem)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200">
          {t("geocentricSky")}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {t("lahiriAyanamsa", {
            value: chart.ayanamsa.trueDegrees.toFixed(4),
          })}
        </p>
        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => setLabelsVisible((visible) => !visible)}
            aria-pressed={labelsVisible}
            className={`rounded-md border px-2 py-1 text-[9px] font-medium transition ${labelsVisible ? "border-violet-300/25 bg-violet-400/15 text-violet-100" : "border-white/10 text-slate-500 hover:text-slate-200"}`}
          >
            {t("nakshatraLabels")}
          </button>
          <button
            type="button"
            onClick={() => setPathsVisible((visible) => !visible)}
            aria-pressed={pathsVisible}
            className={`rounded-md border px-2 py-1 text-[9px] font-medium transition ${pathsVisible ? "border-violet-300/25 bg-violet-400/15 text-violet-100" : "border-white/10 text-slate-500 hover:text-slate-200"}`}
          >
            {t("ephemerisTrails")}
          </button>
        </div>
        <p className="mt-1.5 text-[8px] text-slate-600">
          {t("asterismNote")}
        </p>
      </div>

      <div className="absolute right-4 top-4 z-30 sm:right-5 sm:top-5">
        <button
          type="button"
          onClick={toggleFullscreen}
          disabled={!fullscreenSupported}
          aria-label={
            fullscreenSupported
              ? isFullscreen
                ? t("fullscreenExitAria")
                : t("fullscreenOpenAria")
              : t("fullscreenUnavailableAria")
          }
          aria-pressed={isFullscreen}
          title={
            fullscreenSupported
              ? isFullscreen
                ? t("exitFullscreenTitle")
                : t("openFullscreenTitle")
              : t("fullscreenUnavailableTitle")
          }
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#080a15]/85 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-200 shadow-xl backdrop-blur-md transition hover:border-violet-300/30 hover:bg-violet-400/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:cursor-not-allowed disabled:text-slate-600 disabled:hover:border-white/10 disabled:hover:bg-[#080a15]/85"
        >
          {isFullscreen ? <Minimize2 aria-hidden="true" className="size-4" /> : <Maximize2 aria-hidden="true" className="size-4" />}
          <span className="hidden sm:inline">
            {fullscreenSupported
              ? isFullscreen
                ? t("minimize")
                : t("fullscreen")
              : t("unavailable")}
          </span>
        </button>
      </div>

      {activePlanet && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute left-4 right-4 top-[10.5rem] z-20 rounded-2xl border border-white/10 bg-[#080a15]/85 px-3 py-2 text-left shadow-xl backdrop-blur-md sm:left-auto sm:right-5 sm:top-[4.75rem] sm:max-w-[15rem] sm:text-right"
        >
          <p className="text-xs font-semibold text-white">
            {getLocalizedGrahaName(activePlanet.id, locale)}
            {activePlanet.retrograde
              ? ` (${t("retrogradeShort")})`
              : ""}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {getLocalizedRasiName(activePlanet.sign.name, locale)}{" "}
            {formatSelectedDegree(activePlanet)} · {t("bhava")}{" "}
            {activePlanet.house}
          </p>
          <p className="text-[10px] text-slate-500">
            {getLocalizedNakshatraName(
              activePlanet.nakshatra.name,
              locale,
            )}
            , {t("pada")} {activePlanet.nakshatra.pada}
          </p>
        </div>
      )}

      <p
        aria-live="polite"
        className={`absolute bottom-28 left-1/2 z-30 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl border border-rose-300/20 bg-rose-950/90 px-3 py-2 text-center text-[11px] text-rose-100 shadow-xl backdrop-blur-md ${fullscreenError ? "block" : "hidden"}`}
      >
        {fullscreenError === "unsupported"
          ? t("fullscreenUnsupportedError")
          : fullscreenError === "failed"
            ? t("fullscreenFailedError")
            : ""}
      </p>

            <div className="absolute inset-x-3 bottom-3 z-20 sm:inset-x-5 sm:bottom-5">
        <div className="mb-2 flex items-center justify-between px-1 text-[9px] uppercase tracking-[0.16em] text-slate-500">
          <span>{t("dragZoom")}</span>
          <span className="hidden sm:inline">{t("selectGraha")}</span>
        </div>
        <div
          aria-label={t("toolbarAria")}
          className="flex max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-[#080a15]/82 p-2 shadow-2xl backdrop-blur-lg"
          role="toolbar"
        >
          {chart.planets.map((planet) => {
            const visual = PLANET_VISUALS[planet.id];
            const selected = planet.id === activePlanetId;
            return (
              <button
                key={planet.id}
                type="button"
                aria-pressed={selected}
                aria-label={t("showGrahaAria", {
                  planet: getLocalizedGrahaName(planet.id, locale),
                  rasi: getLocalizedRasiName(planet.sign.name, locale),
                  house: planet.house,
                  retrograde: planet.retrograde
                    ? t("retrogradeAriaSuffix")
                    : "",
                })}
                onClick={() => selectPlanet(selected ? null : planet)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 sm:text-[11px]"
                style={{
                  borderColor: selected ? visual.color : "rgba(255,255,255,0.08)",
                  backgroundColor: selected ? `${visual.color}1f` : "rgba(255,255,255,0.025)",
                  color: selected ? "#ffffff" : "#aeb5c7",
                }}
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: visual.color, boxShadow: selected ? `0 0 8px ${visual.color}` : "none" }}
                />
                {getLocalizedGrahaName(planet.id, locale)}
              </button>
            );
          })}
        </div>
            </div>
          </>
        </WebGLRuntimeBoundary>
      )}
    </section>
  );
}
