/**
 * Type declarations for external modules
 */

declare module 'pngjs' {
  export class PNG {
    static sync: {
      read(buffer: Buffer): PNG;
      write(png: PNG): Buffer;
    };
    width: number;
    height: number;
    data: Buffer;
    constructor(options?: { width?: number; height?: number });
  }
}

declare module 'pixelmatch' {
  function pixelmatch(
    img1: Buffer,
    img2: Buffer,
    output: Buffer,
    width: number,
    height: number,
    options?: {
      threshold?: number;
      includeAA?: boolean;
      alpha?: number;
      aaColor?: [number, number, number];
      diffColor?: [number, number, number];
      diffColorAlt?: [number, number, number];
      diffMask?: boolean;
    }
  ): number;
  
  export = pixelmatch;
}
