// Utility functions for rich text content processing

/**
 * Clean up HTML content from Word documents and other sources
 * Removes problematic inline styles and classes that cause display issues
 */
export const cleanRichTextContent = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }

  return htmlContent
    // Remove problematic inline styles
    .replace(/style="[^"]*"/g, '')
    // Remove problematic classes
    .replace(/class="[^"]*"/g, '')
    // Remove empty paragraphs
    .replace(/<p><br><\/p>/g, '')
    .replace(/<p><\/p>/g, '')
    // Clean up paragraph tags
    .replace(/<p>\s*<\/p>/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extract text content from HTML for preview purposes
 */
export const extractTextFromHTML = (htmlContent) => {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }

  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Extract text content
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up extra whitespace
  return textContent.replace(/\s+/g, ' ').trim();
};

/**
 * Check if content contains Arabic text
 */
export const containsArabicText = (text) => {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  // Arabic Unicode range: U+0600 to U+06FF
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
};

/**
 * Determine text direction based on content
 */
export const getTextDirection = (text) => {
  if (!text || typeof text !== 'string') {
    return 'ltr';
  }
  
  return containsArabicText(text) ? 'rtl' : 'ltr';
};

/**
 * Process rich text content for display
 * Handles cleaning, direction detection, and formatting
 */
export const processRichTextForDisplay = (htmlContent) => {
  const cleanedContent = cleanRichTextContent(htmlContent);
  const textDirection = getTextDirection(cleanedContent);
  
  return {
    content: cleanedContent,
    direction: textDirection,
    hasArabicText: containsArabicText(cleanedContent)
  };
};

/**
 * Convert Word document content to clean HTML
 * This function can be extended to handle more Word-specific formatting
 */
export const convertWordContentToHTML = (wordContent) => {
  if (!wordContent || typeof wordContent !== 'string') {
    return '';
  }

  return wordContent
    // Convert Word-specific formatting
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Clean up extra line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Wrap paragraphs
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
    .map(paragraph => `<p>${paragraph}</p>`)
    .join('\n');
};
