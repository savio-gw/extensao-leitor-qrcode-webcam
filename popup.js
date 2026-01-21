const video = document.getElementById('preview');
const canvasElement = document.getElementById('canvas');
const canvas = canvasElement.getContext('2d', { willReadFrequently: true });
const statusMsg = document.getElementById('status');

// 1. Inicia a webcam
const isFullPage = !chrome.extension.getViews({ type: "popup" }).length;

navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
  .then((stream) => {
    if (isFullPage) {
      document.body.innerHTML = "<h1>Câmera Ativada!</h1><p>Você já pode fechar esta aba e usar a extensão pelo ícone.</p>";
      // Opcional: fechar a aba automaticamente após 2 segundos
      setTimeout(() => window.close(), 2000);
    } else {
      video.srcObject = stream;
      video.play();
      requestAnimationFrame(tick);
    }
  })
  .catch((err) => {
    console.error("Erro:", err);
    statusMsg.innerHTML = "Erro ao acessar câmera. Clique no ícone de cadeado na barra de endereços e permita o acesso.";
  });

function tick() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    
    // Desenha o frame atual no canvas para análise
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
    
    const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
    
    // Tenta decodificar o QR Code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code) {
      statusMsg.innerText = "Lido com sucesso!";
      statusMsg.style.color = "green";
      
      // Envia o texto para o content.js na aba ativa
      sendToContentScript(code.data);
      
      // Feedback visual e pausa para evitar múltiplas leituras
      setTimeout(() => window.close(), 500); 
      return; 
    }
  }
  requestAnimationFrame(tick);
}

async function sendToContentScript(text) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (textToPaste) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        // Insere o texto
        activeEl.value = textToPaste;
        if(activeEl.isContentEditable) activeEl.innerText = textToPaste;
        
        // Dispara eventos para o site entender que houve mudança
        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        activeEl.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Opcional: Simula a tecla "Enter" após preencher
        activeEl.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'Enter', bubbles: true }));
      } else {
        alert("Clique em um campo de texto antes de escanear!");
      }
    },
    args: [text]
  });
}