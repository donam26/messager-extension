// Lắng nghe tin nhắn để mở popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openPopup") {
    // Tạo cửa sổ popup mới
    chrome.windows.create({
      url: chrome.runtime.getURL("popup.html"),
      type: "popup",
      width: 750,
      height: 700,
      left: Math.round((screen.width - 550) / 2),
      top: Math.round((screen.height - 700) / 2)
    });
  }
});
