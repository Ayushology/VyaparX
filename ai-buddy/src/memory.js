const { HumanMessage, AIMessage } = require("@langchain/core/messages");

const conversations = new Map();
const MAX_MESSAGES = 10;

/**
 * Save a message for a user.
 * @param {string} userId
 * @param {HumanMessage | AIMessage} message
 */
function saveMessage(userId, message) {
  if (!conversations.has(userId)) {
    conversations.set(userId, []);
  }

  const history = conversations.get(userId);

  history.push(message);

  // Keep only the last MAX_MESSAGES
  if (history.length > MAX_MESSAGES) {
    history.shift();
  }
}

/**
 * Get conversation history for a user.
 * @param {string} userId
 * @returns {Array<HumanMessage | AIMessage>}
 */
function getMessages(userId) {
  return conversations.get(userId) || [];
}

/**
 * Clear a user's conversation history.
 * @param {string} userId
 */
function clearMessages(userId) {
  conversations.delete(userId);
}

module.exports = {
  saveMessage,
  getMessages,
  clearMessages,
};