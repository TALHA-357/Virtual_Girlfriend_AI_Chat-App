# 💖 Virtual Girlfriend AI Chat App

A warm, affectionate AI chatbot web application built with **Flask**, **SQLite**, and **OpenAI's API**. Users can register, log in, and chat with a caring virtual companion across multiple saved conversations — complete with a chat history sidebar, auto-generated chat titles, and a soft, romantic UI theme.
<img width="925" height="781" alt="image" src="https://github.com/user-attachments/assets/1ec81301-824f-4453-8a41-bbfcd5d031fb" />

---

## ✨ Features

- 🔐 **User Authentication** — Register and log in with secure password hashing (`werkzeug.security`)
- 💬 **Persistent Conversations** — Create, view, and delete multiple chat threads per user
- 🧠 **Context-Aware Replies** — Full conversation history is sent to the model on every request for coherent, in-character responses
- 🏷️ **Auto-Generated Chat Titles** — The first user message in a conversation automatically becomes its sidebar title
- 🎨 **Custom Themed UI** — Glassmorphism login/register cards, floating hearts animation, and a pink-gradient chat interface
- ⌨️ **Quality-of-Life UX** — Typing indicator, Enter-to-send, auto-scroll, and basic XSS protection via HTML escaping
- 🗑️ **Conversation Management** — Delete old chats with a single click (with confirmation)

<img width="795" height="694" alt="image" src="https://github.com/user-attachments/assets/ccb5ff2c-a276-42f6-9c26-25ee3bfbc21d" />
<img width="1813" height="906" alt="image" src="https://github.com/user-attachments/assets/5b070d7e-cde0-4f26-97f3-16e2a21e1d3c" />

---

## 🛠️ Tech Stack

| Layer        | Technology                                  |
|--------------|----------------------------------------------|
| Backend      | Python, Flask                                |
| Database     | SQLite3                                      |
| AI Provider  | OpenAI API (`gpt-5-mini`)                    |
| Auth         | Flask sessions + Werkzeug password hashing   |
| Frontend     | HTML, CSS (vanilla), JavaScript (vanilla)    |
| Templating   | Jinja2 (Flask's built-in templating engine)  |

---

## 📁 Project Structure

```
virtual-girlfriend/
├── app.py                  # Main Flask application (routes, DB logic, AI calls)
├── chat.db                 # SQLite database (auto-created on first run)
├── .env                    # Environment variables (OpenAI API key, etc.)
├── requirements.txt        # Python dependencies
│
├── templates/
│   ├── index.html          # Main chat interface
│   ├── login.html          # Login page
│   └── register.html       # Registration page
│
└── static/
    ├── style.css            # Main chat UI styling
    ├── sidebar.css          # Chat history sidebar styling
    ├── login.css            # Login page styling
    ├── register.css         # Register page styling
    └── script.js            # Frontend logic (fetch calls, DOM updates)
```

> **Note:** Place `app.py`, the `templates/` folder, and `static/` folder in the structure above — Flask expects HTML files in `templates/` and CSS/JS in `static/` by default.

---

## 🗄️ Database Schema

The app uses three SQLite tables, created automatically on first run via `init_db()`:

**`users`**
| Column         | Type    | Notes                  |
|-----------------|---------|--------------------------|
| id              | INTEGER | Primary key             |
| username        | TEXT    | Unique, required        |
| password_hash   | TEXT    | Hashed via Werkzeug     |

**`conversations`**
| Column      | Type     | Notes                          |
|-------------|----------|----------------------------------|
| id          | INTEGER  | Primary key                    |
| user_id     | INTEGER  | Foreign key → `users.id`       |
| title       | TEXT     | Auto-set from first message    |
| created_at  | DATETIME | Defaults to current timestamp  |

**`messages`**
| Column           | Type     | Notes                              |
|------------------|----------|--------------------------------------|
| id               | INTEGER  | Primary key                        |
| conversation_id  | INTEGER  | Foreign key → `conversations.id`   |
| role             | TEXT     | `"user"` or `"assistant"`          |
| content          | TEXT     | Message text                       |
| timestamp        | DATETIME | Defaults to current timestamp      |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/virtual-girlfriend.git
cd virtual-girlfriend
```

### 2. Create a virtual environment (recommended)

```bash
python -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install flask openai python-dotenv werkzeug
```

Or, if you create a `requirements.txt`:

```
flask
openai
python-dotenv
werkzeug
```

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

> The app uses `openai.OpenAI()`, which automatically reads `OPENAI_API_KEY` from the environment via `python-dotenv`.

### 5. Run the application

```bash
python app.py
```

The app will start in debug mode at:

```
http://127.0.0.1:5000
```

### 6. Use the app

1. Go to `/register` to create an account.
2. Log in at `/login`.
3. Click **+ New Chat** to start a conversation.
4. Type a message and press **Enter** or click **Send 💌**.

---

## 🔌 API Routes

| Method | Route                              | Description                              |
|--------|-------------------------------------|--------------------------------------------|
| GET/POST | `/register`                      | User registration                        |
| GET/POST | `/login`                         | User login                               |
| GET    | `/logout`                          | Clears session, logs out                 |
| GET    | `/`                                 | Main chat page (requires login)          |
| POST   | `/create_conversation`             | Creates a new conversation               |
| GET    | `/get_conversations`               | Returns all conversations for the user   |
| GET    | `/get_messages/<conversation_id>`  | Returns all messages in a conversation   |
| DELETE | `/delete_conversation/<id>`        | Deletes a conversation and its messages  |
| POST   | `/chat`                             | Sends a message, returns AI's reply      |

---

## 🤖 Customizing the AI Personality

The chatbot's tone and behavior are controlled entirely by the `system_prompt` string near the top of `app.py`. You can adjust:

- Tone (sweet, playful, formal, supportive, etc.)
- Response length and style
- Safety boundaries
- Memory/recall behavior

Simply edit the `system_prompt` variable and restart the app — no other code changes needed.

---

## ⚠️ Security Notes & Recommendations

This project is set up for **local development and learning purposes**. Before deploying publicly, consider the following:

- 🔑 Replace the hardcoded `app.secret_key = "supersecretkey"` with a securely generated random key stored in an environment variable.
- 🛡️ Add CSRF protection to forms (e.g., via `Flask-WTF`).
- 🚫 Add per-user authorization checks on `/get_messages/<id>` and `/delete_conversation/<id>` — currently these don't verify that the requesting user owns the conversation.
- 🐛 Disable `debug=True` in production.
- 🗄️ Consider migrating from SQLite to PostgreSQL/MySQL for production-scale use.
- 🔒 Use HTTPS and secure cookie settings (`SESSION_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`) in production.

---

## 📋 Requirements

- Python 3.9+
- An OpenAI API key with access to the model specified in `app.py` (default: `gpt-5-mini`)

---

## 📜 License

This project is open source. Add your preferred license (MIT, Apache 2.0, etc.) here.

---

## 🙋 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

Made with 💖 using Flask and OpenAI.
