"use client";

import { useMemo } from "react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

/**
 * Simple QR Code display component using SVG
 * This generates a basic QR-like visual pattern from the input string
 * For production, consider using a proper QR code library like 'qrcode'
 */
export function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
  const qrPattern = useMemo(() => {
    // Generate a deterministic pattern based on the value
    const hash = simpleHash(value);
    const gridSize = 21; // Standard QR code size
    const moduleSize = size / gridSize;
    const pattern: boolean[][] = [];

    // Generate pattern
    for (let y = 0; y < gridSize; y++) {
      pattern[y] = [];
      for (let x = 0; x < gridSize; x++) {
        // Position detection patterns (corners)
        if (isPositionPattern(x, y, gridSize)) {
          pattern[y][x] = true;
        }
        // Timing patterns
        else if (x === 6 || y === 6) {
          pattern[y][x] = (x + y) % 2 === 0;
        }
        // Data area - use hash to generate pattern
        else {
          const index = y * gridSize + x;
          const bit = (hash >> (index % 32)) & 1;
          pattern[y][x] = bit === 1 || Math.random() > 0.5;
        }
      }
    }

    return { pattern, gridSize, moduleSize };
  }, [value, size]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
    >
      {/* White background */}
      <rect x={0} y={0} width={size} height={size} fill="white" />

      {/* QR modules */}
      {qrPattern.pattern.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * qrPattern.moduleSize}
              y={y * qrPattern.moduleSize}
              width={qrPattern.moduleSize}
              height={qrPattern.moduleSize}
              fill="black"
            />
          ) : null
        )
      )}

      {/* Position detection patterns with proper styling */}
      {[
        [0, 0],
        [qrPattern.gridSize - 7, 0],
        [0, qrPattern.gridSize - 7],
      ].map(([px, py], i) => (
        <g key={i}>
          {/* Outer square */}
          <rect
            x={px * qrPattern.moduleSize}
            y={py * qrPattern.moduleSize}
            width={7 * qrPattern.moduleSize}
            height={7 * qrPattern.moduleSize}
            fill="black"
          />
          {/* White inner */}
          <rect
            x={(px + 1) * qrPattern.moduleSize}
            y={(py + 1) * qrPattern.moduleSize}
            width={5 * qrPattern.moduleSize}
            height={5 * qrPattern.moduleSize}
            fill="white"
          />
          {/* Black center */}
          <rect
            x={(px + 2) * qrPattern.moduleSize}
            y={(py + 2) * qrPattern.moduleSize}
            width={3 * qrPattern.moduleSize}
            height={3 * qrPattern.moduleSize}
            fill="black"
          />
        </g>
      ))}
    </svg>
  );
}

// Helper function to check if position is part of a position detection pattern
function isPositionPattern(x: number, y: number, gridSize: number): boolean {
  // Top-left
  if (x < 7 && y < 7) return true;
  // Top-right
  if (x >= gridSize - 7 && y < 7) return true;
  // Bottom-left
  if (x < 7 && y >= gridSize - 7) return true;
  return false;
}

// Simple hash function for generating deterministic patterns
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

