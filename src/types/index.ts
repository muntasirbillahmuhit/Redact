/**
 * Redact - SECURE ENGINE
 * Type definitions for file processing and navigation
 */

export interface AppFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  dataUrl?: string;
  isImage: boolean;
  isPdf: boolean;
  isText: boolean;
  contentPreview?: string;
  fileObject: File;
}

export type CoreEngineId = 'merge' | 'compress' | 'split' | 'protect';

export type NavTabId = 'home' | 'tools' | 'favourite' | 'settings';

export interface SecuritySession {
  isActive: boolean;
  sessionId: string;
  startedAt: number | null;
  encryptionKeyFingerprint: string;
  memoryBufferBytes: number;
  autoWipeMinutes: number;
  zeroTraceMode: boolean;
}
