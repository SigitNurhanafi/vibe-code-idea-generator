const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');

let conversationHistory = [];

function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    if (role === 'ai') {
        contentDiv.innerHTML = marked.parse(content);
    } else {
        contentDiv.innerText = content;
    }

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.classList.add('message', 'ai');
    indicator.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to UI
    addMessage('user', message);
    userInput.value = '';

    // Update history
    conversationHistory.push({ role: 'user', content: message });

    // Show typing indicator
    showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversation: conversationHistory
            }),
        });

        const data = await response.json();

        removeTypingIndicator();

        if (data.result) {
            addMessage('ai', data.result);
            conversationHistory.push({ role: 'model', content: data.result });
        } else {
            addMessage('ai', 'Maaf, saya tidak menerima respons yang valid.');
        }
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        addMessage('ai', 'Terjadi kesalahan saat menghubungi server. Pastikan server sudah berjalan.');
    }
});

// Handle suggestion buttons
document.querySelectorAll('.suggestion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        userInput.value = btn.getAttribute('data-prompt');
        chatForm.dispatchEvent(new Event('submit'));
        // Optional: Hide suggestions after use
        document.getElementById('suggestions').style.display = 'none';
    });
});

