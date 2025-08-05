export function getFilenameFromURL(url: string) {
  const cleanURL = url.split('?')[0].split('#')[0];

  return cleanURL.substring(cleanURL.lastIndexOf('/') + 1);
}

/** Removes all invisble Unicode format characters from string. */
export function stripFormatCharacters(str: string) {
  return str.replace(/[\p{Cf}]/gu, '');
}
