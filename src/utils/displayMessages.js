import '../styles/messages.css';

export function displayMessages(messages) {
  // Gửi tin nhắn đến popup.html thông qua chrome.runtime.sendMessage
  chrome.runtime.sendMessage({
    action: "displayMessages",
    messages: messages
  });
} 