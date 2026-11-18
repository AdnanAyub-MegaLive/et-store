import "server-only";
import path from "node:path";

/** Uploaded product images live outside /public so they work after a production build too. */
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export const UPLOAD_TYPES = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
} as const;
export type UploadExt = keyof typeof UPLOAD_TYPES;

/** Stored file names are always random hex + a known extension. */
export const UPLOAD_NAME = /^[a-f0-9]{32}\.(svg|png|jpg|webp)$/;

/** Work out the real type from the file contents, never from the name the browser sent. */
export function detectType(buf: Buffer): UploadExt | null {
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  const head = buf.subarray(0, 1024).toString("utf8").replace(/^﻿/, "").trimStart().toLowerCase();
  if (head.startsWith("<svg") || ((head.startsWith("<?xml") || head.startsWith("<!--")) && head.includes("<svg"))) return "svg";
  return null;
}

/**
 * SVG can carry scripts. We reject anything active instead of trying to clean it.
 * (Uploaded files are also served with a sandboxing CSP as a second layer.)
 */
export function unsafeSvgReason(svg: string): string | null {
  const s = svg.toLowerCase();
  if (/<script[\s>]/.test(s)) return "SVG contains a script";
  if (/\son[a-z]+\s*=/.test(s)) return "SVG contains event handlers (onload, onclick…)";
  if (/javascript:|vbscript:|data:text\/html/.test(s)) return "SVG contains a script link";
  if (/<(foreignobject|iframe|embed|object|audio|video)[\s>]/.test(s)) return "SVG contains embedded HTML or media";
  if (/<!entity|<!doctype/.test(s)) return "SVG contains a DOCTYPE or entities";
  if (/(href|src)\s*=\s*["']\s*(https?:)?\/\//.test(s)) return "SVG links to an outside file";
  return null;
}
