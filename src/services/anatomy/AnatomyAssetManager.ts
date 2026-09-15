/**
 * AnatomyAssetManager.ts
 * 
 * Reusable asset manager for the Human Atlas dataset.
 * Handles loading metadata, binary chunks (.bin / .bin.gz), decompressing,
 * decoding vertex/normal/index buffers, and caching geometries outside React state.
 * 
 * Source: Human Atlas (https://github.com/slorksmo/Human-Atlas)
 */

import * as THREE from 'three';
import { HumanAtlasSystemId, SITE_DEFINITIONS } from './AnatomyStructureRegistry';

export interface AtlasPart {
  id: string;
  name: string;
  conceptId: string;
  system: HumanAtlasSystemId;
  chunk: number;
  positions: number;
  normals: number;
  indices: number;
  vertexCount: number;
  indexCount: number;
  bounds: [number[], number[]];
}

export interface AtlasChunk {
  url: string;
  bytes: number;
  gzip?: string;
  gzipBytes?: number;
}

export interface AtlasMetadata {
  version: string;
  sex?: 'male' | 'female';
  parts: AtlasPart[];
  chunks: AtlasChunk[];
  triangles: number;
}

export interface LoadedPart {
  part: AtlasPart;
  geometry: THREE.BufferGeometry;
}

class AnatomyAssetManager {
  private static instance: AnatomyAssetManager;

  // Cached metadata
  private metadataCache = new Map<'male' | 'female', AtlasMetadata>();
  // Cached chunk ArrayBuffers
  private chunkCache = new Map<string, ArrayBuffer>();

  private constructor() {}

  public static getInstance(): AnatomyAssetManager {
    if (!AnatomyAssetManager.instance) {
      AnatomyAssetManager.instance = new AnatomyAssetManager();
    }
    return AnatomyAssetManager.instance;
  }

  /**
   * Load metadata for either male or female reference body
   */
  public async loadMetadata(sex: 'male' | 'female'): Promise<AtlasMetadata> {
    if (this.metadataCache.has(sex)) {
      return this.metadataCache.get(sex)!;
    }

    const path = sex === 'female' ? '/models/atlas-female.json' : '/models/atlas.json';
    try {
      const res = await fetch(path);
      if (!res.ok) {
        throw new Error(`Failed to load ${path} (status ${res.status})`);
      }
      const data: AtlasMetadata = await res.json();
      this.metadataCache.set(sex, data);
      return data;
    } catch (err) {
      console.error(`[AnatomyAssetManager] Metadata load error (${path}):`, err);
      // Fallback to remote if local fails
      const fallbackUrl = `https://raw.githubusercontent.com/slorksmo/Human-Atlas/main/public${path}`;
      console.warn(`[AnatomyAssetManager] Attempting fallback to remote: ${fallbackUrl}`);
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) {
        throw new Error(`Could not load Human Atlas metadata from ${path} or fallback: ${fallbackRes.statusText}`);
      }
      const data: AtlasMetadata = await fallbackRes.json();
      this.metadataCache.set(sex, data);
      return data;
    }
  }

  /**
   * Load binary chunk ArrayBuffer (cached)
   */
  public async loadChunk(
    sex: 'male' | 'female',
    chunkIndex: number,
    onStatus?: (msg: string) => void
  ): Promise<ArrayBuffer> {
    const key = `${sex}-${chunkIndex}`;
    if (this.chunkCache.has(key)) {
      return this.chunkCache.get(key)!;
    }

    const prefix = sex === 'female' ? 'female' : 'body';
    const binPath = `/models/${prefix}-${chunkIndex}.bin`;
    const gzPath = `/models/${prefix}-${chunkIndex}.bin.gz`;

    if (onStatus) {
      onStatus(`Loading anatomy chunk ${chunkIndex}...`);
    }

    // Try decompressed .bin first (fastest, static)
    try {
      const res = await fetch(binPath);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        this.chunkCache.set(key, buffer);
        return buffer;
      }
    } catch {
      // Continue to next option
    }

    // Try .bin.gz with DecompressionStream
    try {
      const res = await fetch(gzPath);
      if (res.ok) {
        const payload = await res.arrayBuffer();
        const buffer = await this.decompressGzip(payload);
        this.chunkCache.set(key, buffer);
        return buffer;
      }
    } catch {
      // Continue to fallback
    }

    // Remote fallback (atlas.taim.best or github raw)
    const remoteUrls = [
      `https://atlas.taim.best/models/${prefix}-${chunkIndex}.bin.gz`,
      `https://raw.githubusercontent.com/slorksmo/Human-Atlas/main/public/models/${prefix}-${chunkIndex}.bin.gz`,
    ];

    for (const url of remoteUrls) {
      try {
        console.warn(`[AnatomyAssetManager] Fetching remote chunk: ${url}`);
        const res = await fetch(url);
        if (res.ok) {
          const payload = await res.arrayBuffer();
          const buffer = await this.decompressGzip(payload);
          this.chunkCache.set(key, buffer);
          return buffer;
        }
      } catch (err) {
        console.warn(`[AnatomyAssetManager] Remote fetch failed for ${url}:`, err);
      }
    }

    throw new Error(`Failed to load Human Atlas chunk ${chunkIndex} for ${sex}`);
  }

  /**
   * Helper: Decompress gzip payload using browser DecompressionStream if available
   */
  private async decompressGzip(payload: ArrayBuffer): Promise<ArrayBuffer> {
    const signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
    const isGzip = signature[0] === 0x1f && signature[1] === 0x8b;
    if (isGzip && typeof DecompressionStream !== 'undefined') {
      return await new Response(
        new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))
      ).arrayBuffer();
    }
    return payload;
  }

  /**
   * Build Three.js BufferGeometry for a single anatomical part
   */
  public buildGeometry(part: AtlasPart, buffer: ArrayBuffer): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    // 1. Positions: 3 floats per vertex
    const positions = new Float32Array(buffer, part.positions, part.vertexCount * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 2. Normals: signed 16-bit integers normalized to [-1, 1] on the GPU
    const normals = new Int16Array(buffer, part.normals, part.vertexCount * 3);
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3, true));

    // 3. Indices: 32-bit unsigned integers
    const indices = new Uint32Array(buffer, part.indices, part.indexCount);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // 4. Bounding box & bounding sphere
    geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3(part.bounds[0][0], part.bounds[0][1], part.bounds[0][2]),
      new THREE.Vector3(part.bounds[1][0], part.bounds[1][1], part.bounds[1][2])
    );
    geometry.computeBoundingSphere();

    return geometry;
  }

  /**
   * Region-specific loading: Load only the relevant anatomy chunks for the active site
   */
  public async loadRegionAnatomy(
    sex: 'male' | 'female',
    siteKey: 'neck' | 'chest' | 'arm' | 'groin',
    onProgress?: (percent: number, message: string) => void
  ): Promise<{ parts: LoadedPart[]; totalBox: THREE.Box3 }> {
    onProgress?.(10, 'Loading Human Atlas metadata...');
    const metadata = await this.loadMetadata(sex);

    const siteDef = SITE_DEFINITIONS[siteKey];
    const chunksToLoad = siteDef.essentialChunks;

    onProgress?.(25, `Preparing ${siteDef.name} anatomy chunks...`);

    // Load necessary chunks
    const chunkBuffers = new Map<number, ArrayBuffer>();
    for (let i = 0; i < chunksToLoad.length; i++) {
      const c = chunksToLoad[i];
      const percent = Math.round(25 + ((i + 1) / chunksToLoad.length) * 45);
      onProgress?.(percent, `Decoding Human Atlas chunk ${c}/${chunksToLoad.length}...`);
      try {
        const buf = await this.loadChunk(sex, c);
        chunkBuffers.set(c, buf);
      } catch (err) {
        console.warn(`[AnatomyAssetManager] Chunk ${c} skipped:`, err);
      }
    }

    onProgress?.(75, 'Assembling anatomical geometry...');

    // Filter parts:
    // 1. Must be in one of the loaded chunks
    // 2. Must be spatially within or relevant to the insertion region
    const targetCenter = new THREE.Vector3(...siteDef.targetStructure.center);
    const maxDistanceMeters = siteKey === 'neck' ? 0.28 : siteKey === 'chest' ? 0.35 : 0.40;

    const loadedParts: LoadedPart[] = [];
    const totalBox = new THREE.Box3();

    for (const part of metadata.parts) {
      if (!chunkBuffers.has(part.chunk)) continue;

      // Filter: if structure is in our site surrounding list or within maxDistance of target center
      const partCenter = new THREE.Vector3(
        (part.bounds[0][0] + part.bounds[1][0]) * 0.5,
        (part.bounds[0][1] + part.bounds[1][1]) * 0.5,
        (part.bounds[0][2] + part.bounds[1][2]) * 0.5
      );

      const isSurrounding = siteDef.surroundingStructures.some(s => s.id === part.id) ||
        part.id === siteDef.targetStructure.id ||
        part.id === siteDef.dangerStructure.id;

      const dist = partCenter.distanceTo(targetCenter);

      // Keep if explicitly listed, or if within regional proximity
      if (isSurrounding || dist <= maxDistanceMeters) {
        const buffer = chunkBuffers.get(part.chunk)!;
        try {
          const geom = this.buildGeometry(part, buffer);
          loadedParts.push({ part, geometry: geom });
          if (geom.boundingBox) {
            totalBox.union(geom.boundingBox);
          }
        } catch (err) {
          console.warn(`[AnatomyAssetManager] Error building geometry for part ${part.id} (${part.name}):`, err);
        }
      }
    }

    onProgress?.(100, 'Anatomy ready');
    return { parts: loadedParts, totalBox };
  }
}

export const anatomyAssetManager = AnatomyAssetManager.getInstance();
