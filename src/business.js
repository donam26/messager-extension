// Helper to store messages and processed IDs in memory
let allMessages = [];
let processedMessageIds = new Set();

// Helper functions for loading spinner
function showLoadingSpinner() {
  const overlay = document.createElement("div");
  overlay.id = "loading-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "rgba(128, 128, 128, 0.5)";
  overlay.style.zIndex = "9998";
  document.body.appendChild(overlay);

  const spinner = document.createElement("div");
  spinner.id = "loading-spinner";
  spinner.style.position = "fixed";
  spinner.style.top = "50%";
  spinner.style.left = "50%";
  spinner.style.transform = "translate(-50%, -50%)";
  spinner.style.width = "50px";
  spinner.style.height = "50px";
  spinner.style.border = "6px solid #ccc";
  spinner.style.borderTop = "6px solid #000";
  spinner.style.borderRadius = "50%";
  spinner.style.animation = "spin 1s linear infinite";
  document.body.appendChild(spinner);

  const style = document.createElement("style");
  style.type = "text/css";
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

function hideLoadingSpinner() {
  document.getElementById("loading-overlay")?.remove();
  document.getElementById("loading-spinner")?.remove();
}

// Filter duplicate messages
function removeDuplicateMessages(messages) {
  const seen = new Set();
  return messages.filter(message => {
    const messageString = JSON.stringify(message);
    if (!seen.has(messageString)) {
      seen.add(messageString);
      return true;
    }
    return false;
  });
}

// Process and log messages
function saveMessages() {
  const messageContainers = document.querySelector(
    ".message-container-selector div:nth-child(2)"
  );
  if (!messageContainers) return;

  const allChildDivs = Array.from(messageContainers.children).filter(child =>
    child.classList.contains("message-class-selector")
  );

  let newMessages = [];
  let previousSender = "";

  allChildDivs.forEach((messageEl, index) => {
    const uniqueId = `${index}-${messageEl.textContent.trim()}`;
    if (processedMessageIds.has(uniqueId)) return;

    let sender = messageEl.querySelector(".assistant-selector") ? "assistant" : "user";
    let content = messageEl.textContent.trim();
    let imageUrl = messageEl.querySelector(".image-selector")?.src || "";

    const messageObject = { sender, content, imageUrl };
    newMessages.push(messageObject);
    processedMessageIds.add(uniqueId);
  });

  if (newMessages.length > 0) {
    allMessages = [...newMessages, ...allMessages];
  }
}

// Scroll and save
function scrollAndSave() {
  const targetNode = document.querySelector(".scroll-container-selector");
  if (!targetNode) return;

  showLoadingSpinner();

  let previousMessageCount = 0;
  let noNewMessagesTimeout;
  const interval = setInterval(() => {
    if (targetNode.scrollTop > 0) {
      targetNode.scrollTop -= 150;
    } else {
      const currentMessageCount = document.querySelectorAll(
        ".message-container-selector div"
      ).length;
      if (currentMessageCount > previousMessageCount) {
        previousMessageCount = currentMessageCount;
        saveMessages();
        clearTimeout(noNewMessagesTimeout);
        noNewMessagesTimeout = setTimeout(() => {
          clearInterval(interval);
          hideLoadingSpinner();
        }, 6000);
      }
    }
  }, 100);
}

// Log and filter messages to console
function sendMessages() {
  let filteredMessages = allMessages.filter(
    message => message.content || message.imageUrl
  );

  filteredMessages = removeDuplicateMessages(filteredMessages);
  console.log(filteredMessages);

  allMessages = [];
  processedMessageIds = new Set();
}

// Simulate message sending to a user
function sendMessageToUser(message) {
  const el = document.querySelector('[placeholder="Type a message…"]');
  if (el) {
    el.value = message;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector('div[aria-label="Send"]')?.click();
  } else {
    console.error("Message input not found.");
  }
}

// Create buttons
const buttonContainer = document.createElement("div");
buttonContainer.style.display = "flex";

const scanButton = document.createElement("button");
scanButton.textContent = "Scan Message";
scanButton.onclick = scrollAndSave;
buttonContainer.appendChild(scanButton);

const sendButton = document.createElement("button");
sendButton.textContent = "Send";
sendButton.onclick = sendMessages;
buttonContainer.appendChild(sendButton);

document.body.appendChild(buttonContainer);
