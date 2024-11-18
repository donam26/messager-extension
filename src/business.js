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
      let renderEle = document.querySelector(
        ".x78zum5.x1qughib.xeuugli.x12peec7.xso031l.xrua2ca.x1q0q8m5.xyamay9.x4uap5.x1l90r2v.xkhd6sd.xbktkl8 div"
      );
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

        let stopButton = document.createElement("button");
        stopButton.innerText = "Send";
        stopButton.style.padding = "6px 14px";
        stopButton.style.fontSize = "14px";
        stopButton.style.backgroundColor = "#f44336";
        stopButton.style.color = "white";
        stopButton.style.border = "none";
        stopButton.style.borderRadius = "5px";
        stopButton.style.cursor = "pointer";

        stopButton.addEventListener("click", stopScroll);

        rootEle.appendChild(startButton);
        rootEle.appendChild(stopButton);

        renderEle.appendChild(rootEle);
      }
    }
  });
});

// Bắt đầu theo dõi các thay đổi trong document.body
observer.observe(document.body, { childList: true, subtree: true });
let scrollIntervalTop; // Khai báo biến toàn cục
let scrollTimeout; // Biến để theo dõi thời gian không có tin nhắn mới
let lastMessageCount = 0; // Số lượng tin nhắn được render lần cuối

function scrollMax() {
  const messageContainer = document.querySelector(
    ".x2atdfe.xb57i2i.x1q594ok.x5lxg6s.x78zum5.xdt5ytf.x1n2onr6.x1ja2u2z.xw2csxc.x7p5m3t.x1odjw0f.x1e4zzel.xh8yej3.x5yr21d"
  );

  if (!messageContainer) return;

  // Xóa timeout cũ nếu tồn tại
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  scrollIntervalTop = setInterval(() => {
    // Cuộn lên trên
    messageContainer.scrollTop -= 1000;

    // Kiểm tra nếu số lượng tin nhắn không thay đổi
    const currentMessageCount = document.querySelectorAll(
      ".x78zum5.xdt5ytf.x1iyjqo2.x2lah0s.xl56j7k.x121v3j4 > div"
    ).length;

    if (currentMessageCount === lastMessageCount) {
      if (!scrollTimeout) {
        // Nếu không có thay đổi, thiết lập thời gian chờ 5 giây
        scrollTimeout = setTimeout(() => {
          clearInterval(scrollIntervalTop);
          getMessage(); // Lấy tin nhắn sau khi dừng cuộn
        }, 5000);
      }
    } else {
      // Reset thời gian chờ nếu có sự thay đổi
      clearTimeout(scrollTimeout);
      scrollTimeout = null;
      lastMessageCount = currentMessageCount; // Cập nhật số lượng tin nhắn
    }
  }, 300);
}


function getMessage() {
  const messageContainer = document.querySelector(
    ".x2atdfe.xb57i2i.x1q594ok.x5lxg6s.x78zum5.xdt5ytf.x1n2onr6.x1ja2u2z.xw2csxc.x7p5m3t.x1odjw0f.x1e4zzel.xh8yej3.x5yr21d"
  );

  if (!messageContainer) return;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  scrollInterval = setInterval(async () => {
    const messageElements = Array.from(document.querySelectorAll(
      ".x1yrsyyn.x6x52a7.x10b6aqq.x1egjynq > div"
    ));

    for (const messageElement of messageElements) {
      // Skip processing if the element is already marked as processed
      if (messageElement.getAttribute('data-processed') === "true") continue;

      const messageData = await extractMessageContent(messageElement);
      if (messageData && Array.isArray(messageData)) {
        messageData.forEach((data) => {
          const uniqueMessageId = generateHash(data);

          console.log('Adding message:', data);
          allMessages.push(data); // Thêm toàn bộ đối tượng vào mảng allMessages
          seenMessages.add(uniqueMessageId);
        });

        messageElement.setAttribute('data-processed', 'true'); // Đánh dấu đã xử lý
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
function generateHash(message) {
  const str = JSON.stringify(message);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Chuyển sang 32-bit integer
  }
  return hash.toString();
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
  let messages = []

  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;

    for (const message of allMessages) {
      if (message.imageUrl) {
        const vector = await convert2Vector(message.imageUrl);
        console.log(vector.data)
        message.imageUrl = vector.data;
        messages.push(message)
      } else {
        messages.push(message)
      }
    }

    sendMessages(messages)
    console.log("Processed messages:", messages);
    chrome.runtime.sendMessage({ action: "showMessages", messages: messages });
  }
}

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= windowHeight &&
    rect.right <= windowWidth
  );
}

async function extractMessageContent(messageElement) {
  let extractedMessages = []; // Mảng lưu trữ các đối tượng tin nhắn
  let sender = ""; // Người gửi tin nhắn: user hoặc assistant

  try {
    const senderSpan = messageElement.querySelector(".html-span.xdj266r");
    if (senderSpan && senderSpan.innerText.trim() === "Bạn đã gửi") {
      sender = "assistant";
    } else {
      sender = "user";
    }
    const childElements = Array.from(messageElement.childNodes);
    childElements.forEach((child) => {
      let content = ""; // Nội dung chính của thẻ
      let contentReply = ""; // Nội dung trả lời (nếu có)
      let imageUrl = ""; // URL hình ảnh (nếu có)

      if (child.nodeType === Node.ELEMENT_NODE) {
        console.log("child", child);
      
        // Kiểm tra nếu là thẻ chứa reply
        if (
          child.querySelector(
            ".x10wlt62.x1x4tb0q.x1k70j0n.x11i5rnm.xzueoph.x1mh8g0r.x1y1aw1k.xn6708d.xx6bls6.x1ye3gou.x1n2onr6"
          )
        ) {
          const replyDiv = child.querySelector("span");
          if (replyDiv) {
            contentReply = replyDiv.innerText.trim(); // Lấy nội dung reply
          }
        }
      
        // Xử lý nội dung chính
        const spansContent = extractAllSpans(child);
        if (spansContent.length > 0) {
          content += spansContent.join(" ");
        }
      
        // Cắt bỏ nội dung reply khỏi nội dung chính (nếu có)
        if (contentReply && content.includes(contentReply)) {
          content = content.replace(contentReply, "").trim(); // Loại bỏ reply khỏi content
        }
      
        // Kiểm tra hình ảnh
        const image = child.querySelector("img");
        if (image && image.src) {
          imageUrl = image.src;
        }
      }
      


      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent.trim();
        if (text) {
          content = text;
        }
      }

      // Tạo đối tượng tin nhắn và thêm vào mảng
      if (content || imageUrl || contentReply) {
        extractedMessages.push({
          sender,       // Người gửi
          content,      // Nội dung chính
          contentReply, // Nội dung trả lời (nếu có)
          imageUrl,     // URL hình ảnh (nếu có)
        });
      }
    });

    return extractedMessages;
  } catch (error) {
    console.error("Error extracting message content:", error);
    return [];
  }
}

function extractAllSpans(parentElement) {
  if (!parentElement) {
    console.error("Parent element không tồn tại!");
    return [];
  }

  console.log(parentElement);

  const spans = parentElement.querySelectorAll("span");
  const spanContents = [];

  spans.forEach((span) => {
    const text = span.innerText.trim(); // Lấy nội dung văn bản
    if (text && span.childElementCount === 0) { // Chỉ lấy span không có phần tử con
      spanContents.push(text);
    }
  });

  return spanContents; // Trả về mảng các nội dung
}


async function sendMessages(context) {
  const formattedMessages = { context: context };
  try {
    const response = await fetch(
      "https://api-ext.bookdee.vn/services/generate-confirm",
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
};

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
      'div[aria-label="Nhấn Enter để gửi"]'
    );
    if (sendButton) {
      sendButton.click();
    } else {
      console.error("Không thể tìm thấy nút gửi.");
    }
  }, 100);
};