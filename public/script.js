const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const langButtons = document.querySelectorAll('.lang-btn');

let conversationHistory = [];
let currentLang = getCookie('preferred_lang') || 'id';

// Cookie Helpers
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Language Switching Logic
function updateLanguage(lang) {
    currentLang = lang;
    setCookie('preferred_lang', lang, 30);

    // Update buttons UI
    langButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Update static UI elements
    document.querySelectorAll('[data-id]').forEach(el => {
        el.innerHTML = el.getAttribute(`data-${lang}`);
    });

    // Update placeholders
    const input = document.getElementById('user-input');
    if (input) {
        input.placeholder = input.getAttribute(`data-${lang}-placeholder`);
    }

    // Special case for system message as it might be complex
    const systemMsg = document.querySelector('.message.system .message-content');
    if (systemMsg) {
        systemMsg.innerHTML = systemMsg.getAttribute(`data-${lang}`);
    }
}

// Initialize language switcher
langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        updateLanguage(lang);
    });
});

// Run on load
updateLanguage(currentLang);

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
                conversation: conversationHistory,
                language: currentLang
            }),
        });

        const data = await response.json();

        removeTypingIndicator();

        if (data.result) {
            addMessage('ai', data.result);
            conversationHistory.push({ role: 'model', content: data.result });
        } else {
            const errorMsg = currentLang === 'en'
                ? 'Sorry, I did not receive a valid response.'
                : 'Maaf, saya tidak menerima respons yang valid.';
            addMessage('ai', errorMsg);
        }
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        const errorMsg = currentLang === 'en'
            ? 'An error occurred while contacting the server. Make sure the server is running.'
            : 'Terjadi kesalahan saat menghubungi server. Pastikan server sudah berjalan.';
        addMessage('ai', errorMsg);
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

