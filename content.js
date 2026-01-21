// Recebe o texto do popup e insere no elemento focado
chrome.runtime.onMessage.addListener((request) => {
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
    activeEl.value = request.text;
    // Dispara um evento de 'input' para garantir que o site perceba a mudança
    activeEl.dispatchEvent(new Event('input', { bubbles: true }));
  }
});