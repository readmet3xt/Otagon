// src/services/otakonTags.ts

/**
 * Parses a raw AI response string to extract OTAKON tags and clean content.
 * @param rawContent The full string response from the Gemini API.
 * @returns An object containing the clean content and a map of parsed tags.
 */
export const parseOtakonTags = (rawContent: string): { cleanContent: string; tags: Map<string, any> } => {
  const tags = new Map<string, any>();
  const tagRegex = /\[OTAKON_([A-Z_]+):\s*(.*?)\]/g;

  let cleanContent = rawContent;
  let match;

  while ((match = tagRegex.exec(rawContent)) !== null) {
    const tagName = match[1];
    let tagValue: any = match[2].trim();

    // Attempt to parse JSON for complex tags
    try {
      if (tagValue.startsWith('{') && tagValue.endsWith('}')) {
        tagValue = JSON.parse(tagValue);
      }
      if (tagValue.startsWith('[') && tagValue.endsWith(']')) {
         // A bit of a hack to parse the suggestions array correctly
        tagValue = JSON.parse(tagValue.replace(/'/g, '"'));
      }
    } catch (e) {
      // Not valid JSON, keep as string
    }

    tags.set(tagName, tagValue);
    // Remove the tag from the final content
    cleanContent = cleanContent.replace(match[0], '');
  }

  return { cleanContent: cleanContent.trim(), tags };
};
