/**
 * Helper to download base64 encoded audio as a file in browser
 */
export function downloadAudioFile(
  base64Data: string,
  filename: string,
  format: 'mp3' | 'wav'
) {
  try {
    const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanName = filename.trim().replace(/[/\\?%*:|"<>]/g, '_').slice(0, 40) || 'khmervoice-ai';
    a.download = `${cleanName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (err) {
    console.error('Failed to download audio file:', err);
  }
}

export function formatSeconds(secs: number): string {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
