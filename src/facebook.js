import {
  AutoProcessor,
  CLIPVisionModelWithProjection,
  RawImage,
} from "@xenova/transformers";
let scrollInterval;
let allMessages = [];
let seenMessages = new Set();

const processor = await AutoProcessor.from_pretrained(
  "Xenova/clip-vit-base-patch16"
);
const vision_model = await CLIPVisionModelWithProjection.from_pretrained(
  "Xenova/clip-vit-base-patch16"
);

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      let parentEle = document.querySelector(
        ".x6s0dn4.xfpmyvw.xgqcy7u.x1lq5wgf.x78zum5.x2lah0s.x10w6t97.x1qughib.x6ikm8r.x10wlt62.x1y1aw1k.x1sxyh0.xwib8y2.xurb0ha.x1n2onr6.xhtitgo.x7m3og9 "
      );
      let renderEle = parentEle.lastElementChild;
      console.log(renderEle);
      if (renderEle && !document.getElementById("myla-root-btn")) {
        let rootEle = document.createElement("div");
        rootEle.id = "myla-root-btn";
        rootEle.style.display = "flex";
        rootEle.style.gap = "10px";
        rootEle.style.marginTop = "10px";

        let startButton = document.createElement("button");
        startButton.innerText = "Start";
        startButton.style.padding = "6px 14px";
        startButton.style.fontSize = "14px";
        startButton.style.backgroundColor = "#4CAF50";
        startButton.style.color = "white";
        startButton.style.border = "none";
        startButton.style.borderRadius = "5px";
        startButton.style.cursor = "pointer";

        startButton.addEventListener("click", scrollMax);
        rootEle.appendChild(startButton);
        renderEle.appendChild(rootEle);
      }
    }
  });
});

// Bắt đầu theo dõi các thay đổi trong document.body
observer.observe(document.body, { childList: true, subtree: true });

let scrollIntervalTop;
function scrollMax() {
  const messageContainer = document.querySelector(
    ".x78zum5.xdt5ytf.x1iyjqo2.x6ikm8r.x1odjw0f.x16o0dkt"
  );
  if (!messageContainer) return;

  scrollIntervalTop = setInterval(() => {
    const divTop = document.querySelector(
      ".html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1h91t0o.xkh2ocl.x78zum5.xdt5ytf.x193iq5w.x1iyjqo2.x1eb86dx.x1nhvcw1"
    );
    messageContainer.scrollTop -= 1000;
    if (divTop && isElementInViewport(divTop)) {
      console.log("divTop found in viewport. Stopping scroll.");
      clearInterval(scrollIntervalTop);
      setTimeout(() => {
        getMessage();
      }, 3000);
      return;
    }
    messageContainer.scrollTop -= 1000;
  }, 300);
}

function getMessage() {
  const messageContainer = document.querySelector(
    ".x78zum5.xdt5ytf.x1iyjqo2.x6ikm8r.x1odjw0f.x16o0dkt"
  );

  if (!messageContainer) return;
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  scrollInterval = setInterval(async () => {
    const messageElements = Array.from(
      document.querySelectorAll(
        ".x78zum5.xdt5ytf.x1iyjqo2.x2lah0s.xl56j7k.x121v3j4 > div"
      )
    );

    for (const messageElement of messageElements) {
      // Skip processing if the element is already marked as processed
      if (messageElement.getAttribute("data-processed") === "true") continue;

      const uniqueMessageId =
        messageElement.getAttribute("data-message-id") ||
        messageElement.outerHTML;
      const messageData = await extractMessageContent(messageElement);
      if (
        (messageData.imageUrl || messageData.content) &&
        !seenMessages.has(uniqueMessageId)
      ) {
        allMessages.push({
          sender: messageData.sender,
          content: messageData.content,
          contentReply: messageData.contentReply,
          imageUrl: messageData.imageUrl,
        });

        seenMessages.add(uniqueMessageId);
        messageElement.setAttribute("data-processed", "true"); // Mark as processed
      }
    }

    const previousScrollTop = messageContainer.scrollTop;
    messageContainer.scrollTop += viewportHeight;

    if (messageContainer.scrollTop === previousScrollTop) {
      stopScroll();
      console.log("Reached the top of the conversation.");
    }
  }, 300);
}

async function convert2Vector(imgUrl) {
  try {
    const image = await RawImage.read(imgUrl);
    const image_inputs = await processor(image);

    const { image_embeds } = await vision_model(image_inputs);
    return image_embeds;
  } catch (error) {
    console.error(error);
  }
}

async function stopScroll() {
  console.log("after filter:", allMessages);
  let messages = [];

  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;

    for (const message of allMessages) {
      if (message.imageUrl) {
        const vector = await convert2Vector(message.imageUrl);
        console.log(vector.data);
        message.imageUrl = vector.data;
        messages.push(message);
      } else {
        messages.push(message);
      }
    }

    sendMessages(messages);
    console.log("Processed messages:", messages);
    chrome.runtime.sendMessage({ action: "showMessages", messages: messages });
  }
}

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= windowHeight &&
    rect.right <= windowWidth
  );
}

async function extractMessageContent(messageElement) {
  console.log(messageElement);
  const replyElement = messageElement.querySelector(
    ".x1mzt3pk.x1l90r2v.x1iorvi4"
  );
  const messageElements = messageElement.querySelectorAll(
    ".html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x6ikm8r.x10wlt62"
  );
  const imageElement = messageElement.querySelector(
    "img.xz74otr.xmz0i5r.x193iq5w"
  );

  let content = "";
  let contentReply = "";
  let imageUrl = "";
  let sender = "";

  if (messageElements.length > 0) {
    content = Array.from(messageElements)
      .map((el) => el.innerText.trim())
      .join(" ");
  }

  if (imageElement) {
    imageUrl = imageElement.src;
    console.log(imageElement);
  }

  const spanElement = messageElement.querySelector(
    ".html-span.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1hl2dhg.x16tdsg8.x1vvkbs.xzpqnlu.x1hyvwdk.xjm9jq1.x6ikm8r.x10wlt62.x10l6tqk.x1i1rx1s"
  );

  if (spanElement && spanElement.innerText.trim() === "Bạn đã gửi") {
    sender = "assistant";
  } else {
    sender = "user";
  }

  if (replyElement) {
    const contentReplyDiv = replyElement.querySelector("div");
    contentReply = contentReplyDiv ? contentReplyDiv.innerText.trim() : "";
  }

  return {
    sender,
    content,
    contentReply,
    imageUrl,
  };
}

async function sendMessages(context) {
  const formattedMessages = { context: context };
  try {
    const response = await fetch(
      "https://api-ext.bookdee.vn/cs/get-confirm",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedMessages),
      }
    );

    const data = await response.json();
    sendMessageToUser(data.response);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function sendMessageToUser(message) {
  function send_text(text) {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text/plain", text);
    const event = new ClipboardEvent("paste", {
      clipboardData: dataTransfer,
      bubbles: true,
    });

    const el = document.querySelector(
      '[contenteditable="true"][role="textbox"]'
    );

    if (!el) {
      console.error("Không thể tìm thấy hộp thoại nhập tin nhắn.");
      return;
    }

    el.focus();
    el.dispatchEvent(event);
  }

  send_text(message);

  setTimeout(() => {
    const sendButton = document.querySelector(
      'div[aria-label="Nhấn Enter để gửi"], div[aria-label="Press Enter to send"]'
    );
    if (sendButton) {
      sendButton.click();
    } else {
      console.error("Không thể tìm thấy nút gửi.");
    }
  }, 100);
}
