"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import useDronePerf from "@/lib/analytics/hooks/useDronePerf"
import useImpression from "@/lib/analytics/hooks/useImpression"
import styles from "./DroneCube.module.css"

interface DroneCubeProps {
  /** Distinguishes multiple instances in the perf data. */
  componentId?: string
  label?: string
}

// --- Tweakable params -------------------------------------------------
// Path to the .glb under /public.
const MODEL_URL = "/models/drone.glb"
// World-unit size the model is normalized to (its longest dimension becomes
// this many units), so the fixed camera framing works regardless of the
// scale the model was authored at.
const TARGET_SIZE = 0.8
// Fixed pitch, in degrees, applied once so the whole body is visible instead
// of a flat top-down silhouette. Not touched by drag.
const TILT_DEGREES = 6
// How much a drag pixel turns into yaw (radians per px of horizontal drag).
const DRAG_SPEED = 0.01
// Per-frame multiplier applied to yaw velocity after release (momentum decay).
const DAMPING = 0.94
// Idle auto-spin speed (radians/frame) once no drag momentum remains.
const IDLE_SPIN_SPEED = 0.006
// Camera framing.
const CAMERA_FOV = 13
const CAMERA_POSITION: [number, number, number] = [2.2, 1.2, 2.8]
// -----------------------------------------------------------------------

/**
 * WebGL drone model standing in for the 'drone' component.
 *
 * Loaded async (the .glb is multiple MB), so `onFirstFrame` intentionally
 * waits for the model's first rendered frame rather than the first empty
 * scene frame — that's the number the Engagement dashboard cares about, per
 * useDronePerf's docstring on distinguishing "not interested" from "never
 * finished loading".
 */
export default function DroneCube({ componentId = "drone-cube", label = "drone" }: DroneCubeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { onFirstFrame, onContextLost } = useDronePerf({ componentId })
  const impressionRef = useImpression({ sectionId: componentId, division: "CB" })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // A browser without WebGL should degrade quietly, not throw.
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    } catch {
      onContextLost()
      return
    }

    const parent = canvas.parentElement
    const width = parent?.clientWidth ?? 320
    const height = parent?.clientHeight ?? 240

    // Cap DPR: retina phones are exactly the low-end devices we do not want to
    // hand a 3x framebuffer to.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height, false)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, 0.1, 100)
    camera.position.set(...CAMERA_POSITION)
    camera.lookAt(0, 0, 0)

    // yawGroup rotates purely around the world vertical axis (horizontal
    // plane only) — that's what drag/momentum drive. tiltGroup carries the
    // fixed pitch so the drone's body is visible, nested *inside* yawGroup so
    // the tilt doesn't tip the yaw axis into a cone.
    const yawGroup = new THREE.Group()
    const tiltGroup = new THREE.Group()
    tiltGroup.rotation.x = THREE.MathUtils.degToRad(TILT_DEGREES)
    yawGroup.add(tiltGroup)
    scene.add(yawGroup)

    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(3, 4, 5)
    scene.add(key)
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let frameId = 0
    let reportedFirstFrame = false
    let modelReady = false
    let disposed = false
    let loadedModel: THREE.Object3D | null = null

    // Drag state: while the pointer is down, user input drives yaw instead
    // of the idle auto-spin. Velocity carries over on release so a flick
    // keeps spinning and gently decays back to nothing.
    let dragging = false
    let pointerId: number | null = null
    let lastX = 0
    let velocity = 0

    function renderFrame() {
      if (dragging) {
        // No auto-rotate while the user is actively steering the model.
      } else if (!reduceMotion || velocity !== 0) {
        yawGroup.rotation.y += velocity || IDLE_SPIN_SPEED
        velocity *= DAMPING
        if (Math.abs(velocity) < 0.0001) velocity = 0
      }

      renderer.render(scene, camera)

      if (!reportedFirstFrame && modelReady) {
        reportedFirstFrame = true
        onFirstFrame()
      }

      // Keep animating whenever the model hasn't arrived yet (so it shows up
      // the instant it does), while dragging, spinning from momentum, or
      // idle-spinning.
      if (!modelReady || dragging || !reduceMotion || velocity !== 0) {
        frameId = requestAnimationFrame(renderFrame)
      }
    }

    function handlePointerDown(event: PointerEvent) {
      dragging = true
      pointerId = event.pointerId
      lastX = event.clientX
      velocity = 0
      canvas?.setPointerCapture(event.pointerId)
      if (frameId === 0) renderFrame()
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragging || event.pointerId !== pointerId) return
      const dx = event.clientX - lastX
      lastX = event.clientX
      velocity = dx * DRAG_SPEED
      yawGroup.rotation.y += velocity
    }

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerId !== pointerId) return
      dragging = false
      pointerId = null
      if (frameId === 0) renderFrame()
    }

    function handleResize() {
      const nextWidth = parent?.clientWidth ?? width
      const nextHeight = parent?.clientHeight ?? height
      camera.aspect = nextWidth / nextHeight
      camera.updateProjectionMatrix()
      renderer.setSize(nextWidth, nextHeight, false)
      if (reduceMotion) renderer.render(scene, camera)
    }

    function handleContextLost(event: Event) {
      event.preventDefault()
      cancelAnimationFrame(frameId)
      onContextLost()
    }

    function disposeObject3D(root: THREE.Object3D) {
      root.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        child.geometry.dispose()
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        for (const mat of materials) {
          for (const key of Object.keys(mat)) {
            const value = (mat as unknown as Record<string, unknown>)[key]
            if (value instanceof THREE.Texture) value.dispose()
          }
          mat.dispose()
        }
      })
    }

    canvas.addEventListener("webglcontextlost", handleContextLost)
    canvas.addEventListener("pointerdown", handlePointerDown)
    canvas.addEventListener("pointermove", handlePointerMove)
    canvas.addEventListener("pointerup", handlePointerUp)
    canvas.addEventListener("pointercancel", handlePointerUp)
    window.addEventListener("resize", handleResize)
    renderFrame()

    const loader = new GLTFLoader()
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) {
          disposeObject3D(gltf.scene)
          return
        }

        const model = gltf.scene

        // Normalize scale first, then recenter — Box3 accounts for the
        // model's current world matrix, so computing it twice (before/after
        // scaling) keeps the centering math simple regardless of how the
        // source file was authored.
        const rawSize = new THREE.Vector3()
        new THREE.Box3().setFromObject(model).getSize(rawSize)
        const maxDimension = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1
        model.scale.setScalar(TARGET_SIZE / maxDimension)

        const center = new THREE.Vector3()
        new THREE.Box3().setFromObject(model).getCenter(center)
        model.position.sub(center)

        tiltGroup.add(model)
        loadedModel = model
        modelReady = true
      },
      undefined,
      () => {
        // Missing/broken model file: stop waiting and surface it the same
        // way a lost WebGL context is surfaced, since there's no dedicated
        // asset-load-failure metric.
        modelReady = true
        onContextLost()
      },
    )

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      canvas.removeEventListener("webglcontextlost", handleContextLost)
      canvas.removeEventListener("pointerdown", handlePointerDown)
      canvas.removeEventListener("pointermove", handlePointerMove)
      canvas.removeEventListener("pointerup", handlePointerUp)
      canvas.removeEventListener("pointercancel", handlePointerUp)
      window.removeEventListener("resize", handleResize)

      // Dispose everything: model resources AND the renderer. Skipping the
      // renderer leaks GPU memory across route changes.
      if (loadedModel) disposeObject3D(loadedModel)
      renderer.dispose()
    }
  }, [onFirstFrame, onContextLost])

  return (
    <div ref={impressionRef} className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.canvas} aria-label={`${label} 3D preview`} role="img" />
    </div>
  )
}
