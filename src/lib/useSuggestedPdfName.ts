// src/lib/useSuggestedPdfName.ts
"use client"

function slugify(input: string) {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export function useSuggestedPdfName(title?: string) {
  const base = slugify(title || "estimate") || "estimate"
  return `${base}.pdf`
}