"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import useDronePerf from "@/lib/analytics/hooks/useDronePerf"
import useImpression from "@/lib/analytics/hooks/useImpression"
import styles from "./DroneCube.module.css"

interface DroneCubeProps {
  /** Distinguishes multiple instances in the perf data. */
  componentId?: string
  label?: string
}

/**
 * Minimal WebGL cube standing in for the 'drone' component.
 *
 * Kept deliberately small: the point is to have a real GPU-bound thing to
 * instrument, so the Engagement dashboard's load-time numbers reflect actual
 * WebGL behaviour on low-end devices rather than a guess.
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
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    camera.position.set(2.6, 2.0, 3.2)
    camera.lookAt(0, 0, 0)

    const geometry = new THREE.BoxGeometry(1.6, 1.6, 1.6)
    const material = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      metalness: 0.1,
      roughness: 0.55,
    })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    // Edge lines keep the shape legible against the dark greyscale background,
    // where a flat-lit cube face can otherwise vanish.
    const edges = new THREE.EdgesGeometry(geometry)
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x0f0f0f })
    const outline = new THREE.LineSegments(edges, edgeMaterial)
    cube.add(outline)

    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(3, 4, 5)
    scene.add(key)
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let frameId = 0
    let reportedFirstFrame = false

    function renderFrame() {
      if (!reduceMotion) {
        cube.rotation.x += 0.004
        cube.rotation.y += 0.007
      }

      renderer.render(scene, camera)

      if (!reportedFirstFrame) {
        reportedFirstFrame = true
        onFirstFrame()
      }

      // A static cube needs exactly one frame; only animate when we should.
      if (!reduceMotion) frameId = requestAnimationFrame(renderFrame)
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

    canvas.addEventListener("webglcontextlost", handleContextLost)
    window.addEventListener("resize", handleResize)
    renderFrame()

    return () => {
      cancelAnimationFrame(frameId)
      canvas.removeEventListener("webglcontextlost", handleContextLost)
      window.removeEventListener("resize", handleResize)

      // Dispose everything: geometry, materials AND the renderer. Skipping the
      // renderer leaks GPU memory across route changes.
      geometry.dispose()
      material.dispose()
      edges.dispose()
      edgeMaterial.dispose()
      renderer.dispose()
    }
  }, [onFirstFrame, onContextLost])

  return (
    <div ref={impressionRef} className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.canvas} aria-label={`${label} 3D preview`} role="img" />
    </div>
  )
}
