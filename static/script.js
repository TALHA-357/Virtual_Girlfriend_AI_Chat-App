// Global state
let currentConversationId = null;

// ==============================
// HELPER: Send user message + get reply
// ==============================
async function sendMessage() {
    const inputField = document.getElementById("user-input");
    const message = inputField.value.trim();
    if (!message) return;

    if (!currentConversationId) {
        alert("Please create or select a chat first.");
        return;
    }

    const chatBox = document.getElementById("chat-box");

    // Show user message
    const userContainer = document.createElement("div");
    userContainer.className = "chat-row user-row";
    userContainer.innerHTML = `
        <div class="avatar user-avatar">🧑</div>
        <div class="message user">${escapeHtml(message)}</div>
    `;
    chatBox.appendChild(userContainer);

    inputField.value = "";
    inputField.focus();

    // Show typing indicator
    const botContainer = document.createElement("div");
    botContainer.className = "chat-row bot-row typing-row";
    botContainer.innerHTML = `
        <div class="avatar bot-avatar">💖</div>
        <div class="message bot typing">She is typing...</div>
    `;
    chatBox.appendChild(botContainer);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                conversation_id: currentConversationId
            })
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();

        // Replace typing with real message
        botContainer.querySelector(".message").classList.remove("typing");
        botContainer.querySelector(".message").innerText = data.reply || "(no reply received)";

        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
        console.error(err);
        botContainer.querySelector(".message").classList.remove("typing");
        botContainer.querySelector(".message").innerText = "💔 Sorry... something went wrong.";
        botContainer.querySelector(".message").style.color = "#ff6b6b";
    }
}

// ==============================
// Create new conversation
// ==============================
async function createNewChat() {
    // No prompt anymore — we use a temporary placeholder
    // The real title will be set automatically after the first message (in backend)
    const temporaryTitle = "New Chat";

    try {
        const res = await fetch("/create_conversation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: temporaryTitle })
        });

        if (!res.ok) {
            throw new Error("Failed to create conversation");
        }

        const data = await res.json();

        if (data.conversation_id) {
            currentConversationId = data.conversation_id;
            
            // Refresh sidebar (shows "New Chat" for now)
            await loadConversationList();
            
            // Load the empty chat
            await loadMessages(currentConversationId);
        }
    } catch (err) {
        console.error("Create new chat failed:", err);
        alert("Couldn't start new chat 😔 Please try again.");
    }
}

// ==============================
// Load list of conversations (sidebar)
// ==============================
async function loadConversationList() {
    try {
        const res = await fetch("/get_conversations");
        if (!res.ok) throw new Error("Failed to load conversations");

        const conversations = await res.json();

        const listEl = document.getElementById("conversation-list");
        listEl.innerHTML = "";

        if (conversations.length === 0) {
            const hint = document.createElement("div");
            hint.style.padding = "16px";
            hint.style.color = "#888";
            hint.style.fontStyle = "italic";
            hint.textContent = "Create your first chat 💕";
            listEl.appendChild(hint);
            return;
        }

        conversations.forEach(conv => {
            const item = document.createElement("div");
            item.className = "history-item";
            if (conv.id === currentConversationId) {
                item.classList.add("active");
            }
            item.dataset.conversationId = conv.id;

            // Title part
            const titleSpan = document.createElement("span");
            titleSpan.textContent = conv.title || `Chat #${conv.id}`;
            titleSpan.style.flex = "1";
            titleSpan.style.whiteSpace = "nowrap";
            titleSpan.style.overflow = "hidden";
            titleSpan.style.textOverflow = "ellipsis";

            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.innerHTML = "×";  // or use "🗑️" or font-awesome trash icon later
            deleteBtn.title = "Delete this chat";
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); // prevent triggering item click (open chat)
                if (confirm(`Delete "${conv.title || 'this chat'}"?`)) {
                    deleteConversation(conv.id);
                }
            };

            item.appendChild(titleSpan);
            item.appendChild(deleteBtn);

            // Click anywhere else on item → open chat
            item.addEventListener("click", (e) => {
                if (e.target !== deleteBtn) {
                    currentConversationId = conv.id;
                    loadMessages(conv.id);
                    loadConversationList(); // refresh active style
                }
            });

            listEl.appendChild(item);
        });

    } catch (err) {
        console.error("Load conversations failed", err);
        listEl.innerHTML = '<div style="padding:16px;color:#ff6b6b;">Could not load chats</div>';
    }
}
// ==============================
// Load messages of selected conversation
// ==============================
async function loadMessages(conversationId) {
    if (!conversationId) return;

    try {
        const res = await fetch(`/get_messages/${conversationId}`);
        if (!res.ok) throw new Error("Failed to load messages");

        const messages = await res.json();

        const chatBox = document.getElementById("chat-box");
        chatBox.innerHTML = "";   // clear previous content

        messages.forEach(msg => {
            const isUser = msg.role === "user";
            const row = document.createElement("div");
            row.className = `chat-row ${isUser ? "user-row" : "bot-row"}`;

            row.innerHTML = `
                <div class="avatar ${isUser ? "user-avatar" : "bot-avatar"}">
                    ${isUser ? "🧑" : "💖"}
                </div>
                <div class="message ${isUser ? "user" : "bot"}">
                    ${escapeHtml(msg.content)}
                </div>
            `;

            chatBox.appendChild(row);
        });

        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (err) {
        console.error("Load messages failed", err);
        const chatBox = document.getElementById("chat-box");
        chatBox.innerHTML = '<div style="color:#ff6b6b; padding:20px;">Could not load messages 💔</div>';
    }
}

async function deleteConversation(conversationId) {
    if (conversationId === currentConversationId) {
        currentConversationId = null;
        document.getElementById("chat-box").innerHTML = "";
    }

    try {
        const res = await fetch(`/delete_conversation/${conversationId}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            throw new Error("Delete failed");
        }

        // Refresh sidebar
        await loadConversationList();

        // If we deleted the active one → maybe auto-select another
        if (!currentConversationId && document.querySelector(".history-item")) {
            const firstItem = document.querySelector(".history-item");
            currentConversationId = parseInt(firstItem.dataset.conversationId);
            loadMessages(currentConversationId);
        }

    } catch (err) {
        console.error("Delete conversation failed", err);
        alert("Could not delete chat 😔 Please try again.");
    }
}

// Basic HTML escape to prevent XSS from messages
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==============================
// Enter key + initial load
// ==============================
document.getElementById("user-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// Page load
window.addEventListener("load", async () => {
    await loadConversationList();

    // Optional: auto-open the most recent conversation if exists
    const listEl = document.getElementById("conversation-list");
    const firstItem = listEl.querySelector(".history-item");
    if (firstItem) {
        const id = parseInt(firstItem.dataset.conversationId);
        currentConversationId = id;
        loadMessages(id);
    }
});

// ==============================
// Floating hearts (kept from original)
// ==============================
function createHeart() {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.style.left = Math.random() * window.innerWidth + "px";
    heart.style.width = 10 + Math.random() * 15 + "px";
    heart.style.height = heart.style.width;
    heart.style.animationDuration = 3 + Math.random() * 5 + "s";
    document.body.appendChild(heart);

    setTimeout(() => heart.remove(), 8000);
}

setInterval(createHeart, 300);