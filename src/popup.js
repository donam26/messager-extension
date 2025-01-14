document.addEventListener("DOMContentLoaded", () => {
  const messagesContainer = document.getElementById("messages-container");
  const form = document.getElementById("feedback-form");

  // Lấy tin nhắn từ storage và hiển thị
  chrome.storage.local.get("messages", (result) => {
    if (result.messages && Array.isArray(result.messages)) {
      displayMessages(result.messages);
    }
  });

  // Lắng nghe tin nhắn mới từ content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showMessages") {
      displayMessages(request.messages);
      chrome.storage.local.set({ messages: request.messages });
    }
  });

  function displayMessages(messages) {
    messagesContainer.innerHTML = "";
    messages.forEach((message, index) => {
      const messageDiv = document.createElement("div");
      messageDiv.className = "message-item";
      
      // Tạo container cho nội dung tin nhắn
      const contentContainer = document.createElement("div");
      contentContainer.style.marginBottom = "8px";
      
      // Thêm người gửi với style
      const senderSpan = document.createElement("span");
      senderSpan.style.fontWeight = "bold";
      senderSpan.style.color = message.sender === "assistant" ? "#4CAF50" : "#2196F3";
      senderSpan.textContent = message.sender === "assistant" ? "Assistant" : "User";
      contentContainer.appendChild(senderSpan);

      // Thêm nội dung tin nhắn
      if (message.content) {
        const contentP = document.createElement("p");
        contentP.style.margin = "4px 0";
        contentP.style.wordBreak = "break-word";
        contentP.textContent = message.content;
        contentContainer.appendChild(contentP);
      }

      // Thêm nội dung reply nếu có
      if (message.contentReply) {
        const replyDiv = document.createElement("div");
        replyDiv.style.borderLeft = "3px solid #ccc";
        replyDiv.style.paddingLeft = "8px";
        replyDiv.style.margin = "4px 0";
        replyDiv.style.color = "#666";
        replyDiv.textContent = `Reply to: ${message.contentReply}`;
        contentContainer.appendChild(replyDiv);
      }

      messageDiv.appendChild(contentContainer);

      // Thêm ảnh nếu có
      if (message.imageUrl) {
        const img = document.createElement("img");
        img.src = message.imageUrl;
        img.style.maxWidth = "100%";
        img.style.borderRadius = "4px";
        img.style.marginTop = "8px";
        messageDiv.appendChild(img);
      }

      // Thêm divider
      if (index < messages.length - 1) {
        const divider = document.createElement("hr");
        divider.style.margin = "10px 0";
        divider.style.border = "none";
        divider.style.borderTop = "1px solid #eee";
        messageDiv.appendChild(divider);
      }

      messagesContainer.appendChild(messageDiv);
    });
  }

  // Xử lý submit form
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const formData = new FormData(form);
    const surveyData = {
      message: await chrome.storage.local.get("messages").then(result => result.messages),
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
        body: JSON.stringify(surveyData)
      });

      if (response.ok) {
        alert('Đã gửi dữ liệu thành công!');
        form.reset();
        // Xóa tin nhắn sau khi gửi thành công
        chrome.storage.local.remove("messages");
        messagesContainer.innerHTML = "";
      } else {
        throw new Error('Failed to submit survey');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Có lỗi xảy ra khi gửi dữ liệu!');
    }
  });
});
