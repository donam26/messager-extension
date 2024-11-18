document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("messages", (result) => {
    const messagesContainer = document.getElementById("messages-container");

    // Xóa các tin nhắn cũ nếu có
    messagesContainer.innerHTML = "";

    if (result.messages && Array.isArray(result.messages)) {
      // Hiển thị tất cả các tin nhắn
      result.messages.forEach((message) => {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message-item");

        let content = `Sender: ${message.sender}\n`;
        content += `Content: ${message.content || "(No content)"}\n`;
        if (message.contentReply) {
          content += `Reply to: ${message.contentReply}\n`;
        }
        if (message.imageUrl) {
          content += `Image URL: ${message.imageUrl}\n`;
        }

        messageDiv.textContent = content;
        messagesContainer.appendChild(messageDiv);
      });
    } else {
      messagesContainer.textContent = "No messages found.";
    }
  });

  // Submit form
  const form = document.getElementById("feedback-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const feedback = {};
    formData.forEach((value, key) => {
      feedback[key] = value;
    });
    console.log("Form Feedback:", feedback);

    // Xử lý form feedback ở đây, ví dụ gửi lên server hoặc lưu trữ
    alert("Đã gửi phản hồi!");
  });
});
