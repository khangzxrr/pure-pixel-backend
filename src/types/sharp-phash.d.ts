//sharp-phash 2.1.0 ships no type declarations; both entry points export a single function

declare module 'sharp-phash' {
  //perceptual hash of an image as a binary string
  function phash(
    image: Buffer | string,
    options?: Record<string, unknown>,
  ): Promise<string>;
  export = phash;
}

declare module 'sharp-phash/distance' {
  //hamming distance between two binary hash strings
  function distance(a: string, b: string): number;
  export = distance;
}
