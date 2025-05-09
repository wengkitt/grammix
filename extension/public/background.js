// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "grammarCorrect",
    title: "Grammar Correct with Grammix",
    contexts: ["selection"],
  });
});

// Handle context menu click events
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "grammarCorrect") {
    const selectedText = info.selectionText;
    if (selectedText) {
      callGrammixAPI(selectedText)
        .then((corrected) => {
          chrome.storage.local.set({ correctedText: corrected }, () => {
            // Open the popup to display corrected text
            chrome.action.openPopup();
          });
        })
        .catch((err) => {
          console.error("Error correcting grammar:", err);
        });
    }
  }
});

// Call Grammix Proxy API for grammar correction
async function callGrammixAPI(text) {
  const url = "https://grammix-proxy.wengkitt10-616.workers.dev/correct";

  const body = {
    text: text,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Grammix API error (${response.status}): ${response.statusText}`
      );
    }

    const data = await response.text();
    console.log(data);
    return data.trim() || ""; // Trim to remove any extra whitespace
  } catch (error) {
    console.error("Error calling Grammix API:", error);
    return ""; // Or handle the error as appropriate for your application
  }
}
