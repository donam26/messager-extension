chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showMessages") {
    // Lưu trữ tin nhắn vào storage để truy cập từ popup
    chrome.storage.local.set({ messages: request.messages }, () => {
      // Mở popup bằng cách tạo một cửa sổ mới với URL của popup
      chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        width: 400,
        height: 600,
      });
    });
  }
});
