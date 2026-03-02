# Multiple Choice Study Tool

This application is an AI-powered study tool designed to transform raw text, PDF documents, and Google Docs into interactive, multiple-choice quizzes. It utilizes the Claude (Anthropic) API to automatically extract questions, options, and answer keys from provided materials. Because I'm banned off quizlet this is my only option!

---

## Features

* **AI Question Extraction**: Uses the Claude API to intelligently parse content and generate structured multiple-choice questions.
* **Flexible Import Options**:
    * **Paste Text**: Users can directly paste study notes or review sheets into the interface.
    * **PDF Upload**: Extracts text from PDF documents for processing.
    * **Google Docs Integration**: Connects to Google Drive to search and import documents directly.
* **Comprehensive Study Modes**:
    * **Learn Mode**: A focused mode that tracks mastery levels as questions are answered.
    * **Test Mode**: Simulates a formal exam environment and provides a grade upon completion.
    * **Review Mode**: Allows users to browse all questions and filter by "starred" items or frequently missed content.
* **Progress Tracking**: Tracks mastery levels (New, Learning, Familiar, Mastered), accuracy percentages, and study streaks.
* **User Interface Customization**: Includes a native Dark Mode and the ability to star difficult questions for later review.

---

## Tech Stack

* **Frontend**: Built with HTML5, CSS3, and Vanilla JavaScript.
* **CSS Variables**: Used for theme switching and consistent UI styling.
* **Backend**: Node.js and Express server.
* **Integrations**: Google Drive/Docs API, Anthropic SDK, and `pdf-parse` for document processing.

---

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd studying-tool
   ```
2. **Install dependencies:**:
   ```bash
   npm install
   ```
3. **Configure environment variables:**
    Create a `.env` file in the root directory and add the following credentials:
    ```bash
    PORT=3000
    ANTHROPIC_API_KEY=your_anthropic_api_key
    CLAUDE_MODEL=claude-3-5-sonnet-20240620
    SESSION_SECRET=your_random_secret

    # Optional: Google Docs Integration
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
    ```
4. **Start the application:**
    ```bash
    npm start
    ```
    The tool will be accessible at `http://localhost:3000.`

## Usage
1. **Import Content:** Navigate to the Import tab and choose a method to extract questions from your study materials.
2. **Save Question Set:** Review the AI-extracted questions in the preview area and save them to your library with a custom name.
3. **Start Studying:** Switch to the Study tab to select an active set and choose between Learn, Test, or Review modes.
4. **Monitor Progress:** Visit the Progress tab to view accuracy stats and question breakdowns.