chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Abre o popup.html em uma aba inteira para solicitar permissão de forma persistente
    chrome.tabs.create({ url: "popup.html" });
  }
});