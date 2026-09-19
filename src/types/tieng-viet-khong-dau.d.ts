//tieng-viet-khong-dau 1.0.1 ships no type declarations; it exports plain string helpers
declare module 'tieng-viet-khong-dau' {
  //strip Vietnamese diacritics
  export function c(text: string): string;
  //strip diacritics and lower-case
  export function cLowerCase(text: string): string;
  //strip diacritics and upper-case
  export function cUpperCase(text: string): string;
  //strip diacritics and turn into a URL slug
  export function cFriendlyURI(text: string): string;
}
