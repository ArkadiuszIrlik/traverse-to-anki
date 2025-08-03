export function getFilenameFromURL(url: string) {
  const cleanURL = url.split('?')[0].split('#')[0];

  return cleanURL.substring(cleanURL.lastIndexOf('/') + 1);
}
