export function getSectionCallStackPretty(deck: string, section: string) {
  return `${deck} -> ${section}`;
}

export function getLessonCallStackPretty(
  deck: string,
  section: string,
  lesson: string,
) {
  return `${deck} -> ${section} -> ${lesson}`;
}
