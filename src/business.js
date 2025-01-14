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
        stopButton.innerText = "Send2";
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
  let messagesForAPI = [];
  let messagesForPopup = [];

  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;

    for (const message of allMessages) {
      // Clone message để tránh ảnh hưởng lẫn nhau
      const messageForAPI = { ...message };
      const messageForPopup = { ...message };

      if(message.imageUrl) {
        // Convert sang vector cho API
        const vector = await convert2Vector(message.imageUrl);
        messageForAPI.imageUrl = vector.data;
        messagesForAPI.push(messageForAPI);

        // Convert sang base64 cho popup
        const base64Image = await convertImageToBase64(message.imageUrl);
        messageForPopup.imageUrl = base64Image;
        messagesForPopup.push(messageForPopup);
      } else {
        messagesForAPI.push(messageForAPI);
        messagesForPopup.push(messageForPopup);
      }
    }

    try {
      // Gửi tin nhắn với vector tới API
      await sendMessages(messagesForAPI);
      
      // Hiển thị popup với base64
      chrome.runtime.sendMessage({ 
        action: "showMessages", 
        messages: messagesForPopup 
      });
    } catch (error) {
      console.error("Error in stopScroll:", error);
      alert("Có lỗi xảy ra khi xử lý tin nhắn!");
    }
  }
}

async function convertImageToBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
}

async function sendMessages(context) {
  const formattedMessages = { message: context };
  try {
    const response = await fetch(
      "https://gnogowcgogdreviondmu.supabase.co/rest/v1/craw_mess",
      {
        method: "POST",
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdub2dvd2Nnb2dkcmV2aW9uZG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NjAyODcsImV4cCI6MjA1MTAzNjI4N30.yz1uLK8j82CkKhPP6l0E8KNU8uLwSti_sBQEvtRCbw0',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdub2dvd2Nnb2dkcmV2aW9uZG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NjAyODcsImV4cCI6MjA1MTAzNjI4N30.yz1uLK8j82CkKhPP6l0E8KNU8uLwSti_sBQEvtRCbw0',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(formattedMessages),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.response) {
        await sendMessageToUser(data.response);
      }
    } else {
      throw new Error('Failed to send messages to API');
    }
  } catch (error) {
    console.error("Error:", error);
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
    const senderSpan = messageElement.querySelector(".xuk3077.x78zum5.x1q0g3np.x1nhvcw1.x2lwn1j.xeuugli.x1jchvi3.xlxfd2w.x1gslohp.x126k92a");
    console.log('senderSpan')
    console.log(senderSpan)
    if (senderSpan) {
      sender = "user";
    } else {
      sender = "assistant";
    }
    const childElements = Array.from(messageElement.childNodes);
    childElements.forEach((child) => {
      let content = ""; // Nội dung chính của thẻ
      let contentReply = ""; // Nội dung trả lời (nếu có)
      let imageUrl = ""; // URL hình ảnh (nếu có)

      if (child.nodeType === Node.ELEMENT_NODE) {
      
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


async function sendMessageToUser(message) {
  function send_text(text) {
    const el = document.querySelector('[placeholder="Reply in Messenger…"], [placeholder="Trả lời trong Messenger…"]');

    if (!el) {
      console.error("Không thể tìm thấy hộp thoại nhập tin nhắn.");
      return;
    }
  
    el.click(); // Kích hoạt thẻ
    el.focus(); // Focus vào thẻ
  
    // Gõ từng ký tự
    for (const char of text) {
      const event = new KeyboardEvent("keypress", { bubbles: true, key: char });
      el.dispatchEvent(event);
      el.value += char; // Gán từng ký tự vào giá trị
    }
  
    // Kích hoạt sự kiện 'input' sau khi hoàn tất
    const inputEvent = new Event("input", { bubbles: true });
    el.dispatchEvent(inputEvent);
  
    console.log("Tin nhắn đã được nhập thành công.");
  }
  
  send_text(message);

  setTimeout(() => {
    const sendButton = document.querySelector(
      'div[aria-label="Send"]'
    );
    if (sendButton) {
      sendButton.click();
    } else {
      console.error("Không thể tìm thấy nút gửi.");
    }
  }, 100);
};