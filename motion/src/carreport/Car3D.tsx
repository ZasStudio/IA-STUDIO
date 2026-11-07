import React, {useEffect, useMemo, useState} from 'react';
import {continueRender, delayRender, staticFile, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {ContactShadows} from '@react-three/drei';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

/* Auto 3D real (GLB generado con Magnific a partir de una imagen) renderizado con three.js. */

const MODEL = 'carreport/car/car.glb';
// Orientación del modelo generado: rota para que el frente apunte a +X.
const BASE_ROT_Y = 0;
const LENGTH = 4.6; // largo normalizado del auto en unidades de escena

let cached: Promise<THREE.Group> | null = null;
const loadCar = () => {
  if (!cached) {
    cached = new Promise((res, rej) => new GLTFLoader().load(staticFile(MODEL), (g) => res(g.scene), undefined, rej));
  }
  return cached;
};

/** Normaliza el modelo: centrado, apoyado en el suelo y escalado a LENGTH de largo. */
const useCar = () => {
  const [car, setCar] = useState<THREE.Group | null>(null);
  const [handle] = useState(() => delayRender('Cargando auto 3D'));
  useEffect(() => {
    loadCar()
      .then((g) => {
        const root = g.clone(true);
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const s = LENGTH / Math.max(size.x, size.z);
        root.position.set(-center.x * s, -box.min.y * s, -center.z * s);
        root.scale.setScalar(s);
        root.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            m.castShadow = true;
            const mat = m.material as THREE.MeshStandardMaterial;
            if (mat && 'envMapIntensity' in mat) {
              mat.envMapIntensity = 1.4;
              mat.roughness = Math.min(mat.roughness ?? 0.5, 0.35); // pintura más brillante
              mat.metalness = Math.max(mat.metalness ?? 0, 0.55);
              mat.transparent = true;
            }
          }
        });
        const wrap = new THREE.Group();
        wrap.add(root);
        setCar(wrap);
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);
  return car;
};

const Env: React.FC = () => {
  const {gl, scene} = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => env.dispose();
  }, [gl, scene]);
  return null;
};

const Cam: React.FC<{pos: [number, number, number]; target: [number, number, number]; fov: number}> = ({pos, target, fov}) => {
  const {camera} = useThree();
  camera.position.set(...pos);
  (camera as THREE.PerspectiveCamera).fov = fov;
  (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  camera.lookAt(...target);
  return null;
};

export type Car3DProps = {
  /** giro del auto en grados (0 = de perfil mirando a la derecha) */
  rotY: number;
  cam?: [number, number, number];
  target?: [number, number, number];
  fov?: number;
  /** 0..1: modo radiografía (malla cian) */
  wire?: number;
  wireColor?: string;
  /** -1..1 posición del haz de escaneo a lo largo del auto (null = sin haz) */
  scan?: number | null;
  /** desplazamiento del auto en X (entrada en escena) */
  x?: number;
  rim?: string;
  floor?: boolean;
};

const CarScene: React.FC<Car3DProps & {car: THREE.Group}> = ({car, rotY, cam = [0, 2.4, 15], target = [0, 0.7, 0], fov = 30, wire = 0, wireColor = '#2be4ff', scan = null, x = 0, rim = '#2be4ff', floor = true}) => {
  const wireMat = useMemo(() => new THREE.MeshBasicMaterial({color: wireColor, wireframe: true, transparent: true, opacity: 0}), [wireColor]);
  const wireClone = useMemo(() => {
    if (!car) return null;
    const c = car.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.material = wireMat;
    });
    return c;
  }, [car, wireMat]);
  if (car) {
    car.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) (m.material as THREE.Material).opacity = 1 - wire * 0.85;
    });
  }
  wireMat.opacity = wire * 0.35;
  const ry = THREE.MathUtils.degToRad(rotY + BASE_ROT_Y);
  return (
    <>
      <Cam pos={cam} target={target} fov={fov} />
      <Env />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} castShadow />
      <directionalLight position={[-6, 2.5, -4]} intensity={3.5} color={rim} />
      <directionalLight position={[6, 1.5, -5]} intensity={2} color="#7aa8ff" />
      <pointLight position={[0, 4, 3]} intensity={8} distance={12} color="#ffffff" />
      <group position={[x, 0, 0]} rotation={[0, ry, 0]}>
        {car && <primitive object={car} />}
        {wireClone && wire > 0.01 && <primitive object={wireClone} />}
        {scan !== null && (
          <mesh position={[scan * (LENGTH / 2 + 0.2), 0.75, 0]}>
            <boxGeometry args={[0.02, 1.6, 2.3]} />
            <meshBasicMaterial color={wireColor} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        )}
      </group>
      {floor && (
        <>
          <ContactShadows position={[x, 0.001, 0]} opacity={0.75} scale={10} blur={2.4} far={2.5} resolution={512} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
            <circleGeometry args={[4.2, 64]} />
            <meshStandardMaterial color="#0b1424" metalness={0.6} roughness={0.35} transparent opacity={0.85} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]}>
            <ringGeometry args={[3.9, 3.96, 96]} />
            <meshBasicMaterial color={rim} transparent opacity={0.8} />
          </mesh>
        </>
      )}
    </>
  );
};

/** Lienzo 3D del auto. Se compone sobre el fondo del video (transparente). */
export const Car3D: React.FC<Car3DProps & {style?: React.CSSProperties}> = ({style, ...p}) => {
  const {width, height} = useVideoConfig();
  // el modelo se carga ANTES de montar el lienzo: así el primer frame ya lo dibuja
  const car = useCar();
  return (
    <div style={{position: 'absolute', inset: 0, ...style}}>
      {car && (
        <ThreeCanvas width={width} height={height} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}} shadows dpr={1}>
          <CarScene {...p} car={car} />
        </ThreeCanvas>
      )}
    </div>
  );
};
