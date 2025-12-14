document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const urlDisplay = document.getElementById('url-display');
    const statusDiv = document.getElementById('status');
    const btn = document.getElementById('scrape-btn');

    if (tab.url) {
        urlDisplay.textContent = tab.url;
    }

    btn.addEventListener('click', async () => {
        if (!tab.url.includes("magicbricks.com")) {
            statusDiv.textContent = "Only MagicBricks URLs are supported.";
            statusDiv.className = "error";
            return;
        }

        statusDiv.textContent = "Scraping... Please wait.";
        statusDiv.className = "";
        btn.disabled = true;

        try {
            const response = await fetch('http://localhost:5000/api/scrape/url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: tab.url })
            });

            const data = await response.json();

            if (response.ok) {
                statusDiv.textContent = "✅ Saved successfully!";
                statusDiv.className = "success";
            } else {
                statusDiv.textContent = "❌ Error: " + (data.message || "Unknown error");
                statusDiv.className = "error";
            }
        } catch (error) {
            statusDiv.textContent = "❌ Network Error. Is backend running?";
            statusDiv.className = "error";
            console.error(error);
        } finally {
            btn.disabled = false;
        }
    });
});
