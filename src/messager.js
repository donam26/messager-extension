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
        ".x2lah0s.x1qughib.x6s0dn4.xozqiw3.x1q0g3np.xykv574.xbmpl8g.x4cne27.xifccgj"
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
    ".x1uipg7g.xu3j5b3.xol2nv.xlauuyb.x26u7qi.x19p7ews.x78zum5.xdt5ytf.x1iyjqo2.x6ikm8r.x10wlt62 div div"
  );
  console.log(messageContainer)
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
    ".x1uipg7g.xu3j5b3.xol2nv.xlauuyb.x26u7qi.x19p7ews.x78zum5.xdt5ytf.x1iyjqo2.x6ikm8r.x10wlt62 div div"
  );

  if (!messageContainer) return; 
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  scrollInterval = setInterval(async () => {
    const messageElements = Array.from(document.querySelectorAll(
      ".x78zum5.xdt5ytf.x1iyjqo2.x2lah0s.xl56j7k.x121v3j4 > div"
    ));

    for (const messageElement of messageElements) {
      // Skip processing if the element is already marked as processed
      if (messageElement.getAttribute('data-processed') === "true") continue;

      const uniqueMessageId = messageElement.getAttribute('data-message-id') || messageElement.outerHTML;
      const messageData = await extractMessageContent(messageElement);
      if ((messageData.imageUrl || messageData.content) && !seenMessages.has(uniqueMessageId)) {
        allMessages.push({
          sender: messageData.sender,
          content: messageData.content,
          contentReply: messageData.contentReply,
          imageUrl: messageData.imageUrl
        });

        seenMessages.add(uniqueMessageId);
        messageElement.setAttribute('data-processed', 'true'); // Mark as processed
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
        console.log(vector.data)
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

function showConfirmDialog(messages) {
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 10000;
    width: 400px;
  `;

  dialog.innerHTML = `
    <h3 style="margin-bottom: 15px;">Xác nhận tin nhắn</h3>
    <div style="margin-bottom: 15px;">
      <label>
        <input type="checkbox" id="is_skewed"> Tin nhắn có bị lệch không?
      </label>
    </div>
    <div style="margin-bottom: 15px;">
      <label>Mức độ ảnh hưởng:</label>
      <select id="skewed_impact" style="width: 100%; padding: 5px;">
        <option value="Không ảnh hưởng">Không ảnh hưởng</option>
        <option value="Ảnh hưởng ít">Ảnh hưởng ít</option>
        <option value="Ảnh hưởng nhiều">Ảnh hưởng nhiều</option>
      </select>
    </div>
    <div style="margin-bottom: 15px;">
      <label>
        <input type="checkbox" id="is_missing"> Có tin nhắn bị thiếu không?
      </label>
    </div>
    <div style="margin-bottom: 15px;">
      <label>Phản hồi khác:</label>
      <textarea id="other_feedback" style="width: 100%; height: 60px;"></textarea>
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button id="cancel-btn" style="padding: 8px 16px;">Hủy</button>
      <button id="confirm-btn" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px;">
        Xác nhận
      </button>
    </div>
  `;

  document.body.appendChild(dialog);

  document.getElementById('confirm-btn').addEventListener('click', async () => {
    const surveyData = {
      message: messages,
      is_skewed: document.getElementById('is_skewed').checked,
      skewed_impact: document.getElementById('skewed_impact').value,
      is_missing: document.getElementById('is_missing').checked,
      other_feedback: document.getElementById('other_feedback').value
    };

    try {
      const response = await fetch('https://gnogowcgogdreviondmu.supabase.co/rest/v1/Survey', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdub2dvd2Nnb2dkcmV2aW9uZG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NjAyODcsImV4cCI6MjA1MTAzNjI4N30.yz1uLK8j82CkKhPP6l0E8KNU8uLwSti_sBQEvtRCbw0',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdub2dvd2Nnb2dkcmV2aW9uZG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NjAyODcsImV4cCI6MjA1MTAzNjI4N30.yz1uLK8j82CkKhPP6l0E8KNU8uLwSti_sBQEvtRCbw0',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(surveyData)
      });

      if (response.ok) {
        alert('Đã gửi dữ liệu thành công!');
        dialog.remove();
      } else {
        throw new Error('Failed to submit survey');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Có lỗi xảy ra khi gửi dữ liệu!');
    }
  });

  document.getElementById('cancel-btn').addEventListener('click', () => {
    dialog.remove();
  });
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
  console.log(messageElement);
  const replyElement = messageElement.querySelector(".x1mzt3pk.x1l90r2v.x1iorvi4");
  const messageElements = messageElement.querySelectorAll(".html-div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x6ikm8r.x10wlt62");
  const imageElement = messageElement.querySelector("img.xz74otr.xmz0i5r.x193iq5w");
  
  let content = "";
  let contentReply = "";
  let imageUrl = "";
  let sender = "";
  
  if (messageElements.length > 0) {
    content = Array.from(messageElements).map(el => el.innerText.trim()).join(" ");
  }

  if (imageElement) {
    imageUrl = imageElement.src;
    console.log(imageElement)
  }

  const spanElement = messageElement.querySelector(".html-span.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1hl2dhg.x16tdsg8.x1vvkbs.xzpqnlu.x1hyvwdk.xjm9jq1.x6ikm8r.x10wlt62.x10l6tqk.x1i1rx1s");
  
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
  }
};

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
      // const data = await response.json();
      // if (data && data.response) {
        await sendMessageToUser("data.response");
      // }
    } else {
      throw new Error('Failed to send messages to API');
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function sendMessageToUser(message) {
  try {
    // Tìm input box
    const inputBox = document.querySelector('[contenteditable="true"][role="textbox"]');
    if (!inputBox) {
      throw new Error("Không tìm thấy ô nhập tin nhắn");
    }

    // Focus vào input box
    inputBox.focus();

    // Paste nội dung tin nhắn
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', message);
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    });
    inputBox.dispatchEvent(pasteEvent);

    // Đợi một chút để nội dung được paste
    await new Promise(resolve => setTimeout(resolve, 100));

    
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn:", error);
  }
}