/**
 * Converts markdown-style text to HTML
 * Supports:
 * - Bold (**text**)
 * - Italic (*text*)
 * - Unordered lists (* text or - text)
 * - Ordered lists (1. text)
 * - Newlines
 * - Headers (# text)
 * 
 * @param {string} markdownText - Text with markdown formatting
 * @returns {string} HTML formatted text
 */
export const markdownToHtml = (markdownText) => {
  if (!markdownText) return '';

  let html = markdownText;

  // Replace multiple newlines with proper paragraph breaks
  html = html.replace(/\n\n+/g, '</p><p>');

  // Convert bold text: **text** to <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert italic text: *text* to <em>text</em> (but not in list items that start with *)
  // This regex looks for * that isn't at the start of a line or after a newline
  html = html.replace(/(^|[^\n])\*([^\*\n]+)\*/g, '$1<em>$2</em>');

  // Handle unordered lists
  const listItemRegex = /^[\s]*[\*\-][\s]+(.*)/gm;
  if (listItemRegex.test(html)) {
    let hasStartedList = false;
    
    html = html.replace(listItemRegex, (match, listItem) => {
      if (!hasStartedList) {
        hasStartedList = true;
        return '<ul><li>' + listItem + '</li>';
      }
      return '<li>' + listItem + '</li>';
    });
    
    // Close the list if we opened one
    if (hasStartedList) {
      html += '</ul>';
    }
  }

  // Handle ordered lists
  const orderedListRegex = /^\s*(\d+)\.[\s]+(.*)/gm;
  if (orderedListRegex.test(html)) {
    let hasStartedOrderedList = false;
    
    html = html.replace(orderedListRegex, (match, number, listItem) => {
      if (!hasStartedOrderedList) {
        hasStartedOrderedList = true;
        return '<ol><li>' + listItem + '</li>';
      }
      return '<li>' + listItem + '</li>';
    });
    
    // Close the list if we opened one
    if (hasStartedOrderedList) {
      html += '</ol>';
    }
  }

  // Convert headers: # Header to <h1>Header</h1>
  html = html.replace(/^#\s+(.*)/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.*)/gm, '<h5>$1</h5>');

  // Wrap the content in paragraphs if it's not wrapped already
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }

  // Final clean-up: convert remaining newlines to <br> tags
  html = html.replace(/\n/g, '<br>');

  return html;
};

/**
 * Format object data as markdown text
 * @param {Object} objectData - Object with data to format
 * @returns {string} - Formatted markdown text
 */
export const objectToMarkdown = (objectData) => {
  if (!objectData || typeof objectData !== 'object') return '';
  
  let markdown = '';
  
  Object.entries(objectData).forEach(([key, value]) => {
    // Skip empty values
    if (value === null || value === undefined || value === '') return;
    
    // Format key with title case
    const formattedKey = key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    
    if (Array.isArray(value)) {
      markdown += `**${formattedKey}:**\n`;
      value.forEach(item => {
        if (typeof item === 'object') {
          const subItems = Object.entries(item)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
          markdown += `* ${subItems}\n`;
        } else {
          markdown += `* ${item}\n`;
        }
      });
      markdown += '\n';
    } else if (typeof value === 'object') {
      markdown += `**${formattedKey}:**\n${objectToMarkdown(value)}\n`;
    } else {
      markdown += `**${formattedKey}:** ${value}\n\n`;
    }
  });
  
  return markdown;
};

/**
 * Applies the markdownToHtml conversion to AI chat messages
 * 
 * @param {Array} messages - Array of chat messages to format
 * @returns {Array} - Array of messages with formatted HTML content
 */
export const formatAiChatMessages = (messages) => {
  if (!messages || !Array.isArray(messages)) return [];
  
  return messages.map(message => {
    // Only format AI responses, leave user messages as-is
    if (message.sender === 'ai' || !message.is_user) {
      return {
        ...message,
        formattedContent: markdownToHtml(message.message || message.message_content)
      };
    }
    return message;
  });
};
