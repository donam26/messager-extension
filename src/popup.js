// Khi popup được mở, lấy tin nhắn từ storage
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['messages'], function(result) {
    if (result.messages && result.messages.length > 0) {
      displayMessages(result.messages);
    } else {
      const container = document.getElementById("messages-container");
      if (container) {
        container.innerHTML = `
          <div class="empty-message">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4ZM26 34H22V30H26V34ZM26 26H22V14H26V26Z" fill="#65676b"/>
            </svg>
            <p style="margin-top: 12px;">Chưa có tin nhắn nào được thu thập</p>
          </div>
        `;
      }
    }
  });
});

// Hàm hiển thị tin nhắn trong popup
function displayMessages(messages) {
  const container = document.getElementById("messages-container");
  if (!container) return;

  // Xóa nội dung cũ
  container.innerHTML = "";

  // Hiển thị từng tin nhắn
  messages.forEach(message => {
    const messageItem = document.createElement("div");
    messageItem.className = `message-item ${message.sender}`;

    const sender = document.createElement("div");
    sender.className = "message-sender";
    sender.textContent = message.sender === "user" ? "Người dùng" : "Trợ lý";
    messageItem.appendChild(sender);

    if (message.content) {
      const content = document.createElement("div");
      content.className = "message-content";
      content.textContent = message.content;
      messageItem.appendChild(content);
    }

    if (message.contentReply) {
      const reply = document.createElement("div");
      reply.className = "message-reply";
      reply.textContent = `Trả lời cho: ${message.contentReply}`;
      messageItem.appendChild(reply);
    }

    if (message.originalImageUrl || (message.imageUrl && typeof message.imageUrl === 'string')) {
      const image = document.createElement("img");
      image.className = "message-image";
      image.src = message.originalImageUrl || message.imageUrl;
      image.alt = "Hình ảnh tin nhắn";
      messageItem.appendChild(image);
    }

    container.appendChild(messageItem);
  });
}

// Xử lý form feedback
document.getElementById("feedback-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  // Lấy tin nhắn từ storage
  const messages = await new Promise(resolve => {
    chrome.storage.local.get(['messages'], result => {
      resolve(result.messages || {});
    });
  });

  const feedback = {
    message: messages,
    is_skewed: formData.get("is_misaligned") === "Có",
    skewed_impact: formData.get("impact_level"),
    is_missing: formData.get("is_missing") === "Có",
    other_feedback: formData.get("additional_comments")
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
      body: JSON.stringify(feedback)
    });

    if (!response.ok) {
      throw new Error('Gửi feedback thất bại');
    }

    alert('Cảm ơn bạn đã gửi đánh giá!');
    window.close();
  } catch (error) {
    console.error('Lỗi khi gửi feedback:', error);
    alert('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại sau.');
  }
});
