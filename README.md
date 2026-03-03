# Multiple Choice Study Tool

This application is an AI-powered study tool designed to transform raw text and PDF documents into interactive, multiple-choice quizzes. It utilizes the Claude (Anthropic) API to automatically extract questions, options, and answer keys from provided materials. Because I'm banned off quizlet this is my only option!

---

## Features

* **AI Question Extraction**: Uses the Claude API to intelligently parse content and generate structured multiple-choice questions.
* **Flexible Import Options**:
    * **Paste Text**: Directly paste study notes or review sheets into the interface.
    * **PDF Upload**: Extracts text from PDF documents for processing.
* **Comprehensive Study Modes**:
    * **Learn Mode**: A focused mode with a submit button that tracks mastery levels as questions are answered.
    * **Test Mode**: Simulates a formal exam environment and provides a grade upon completion.
    * **Review Mode**: Browse all questions with search and filters (starred, frequently wrong, unseen, mastered).
    * **Flashcard Mode**: Quizlet-style flashcards — click to reveal the answer, navigate with Previous/Next.
* **Quizlet-Style Question Display**: Extracted and saved questions appear in a two-panel layout (question on the left, answer on the right).
* **Persistent Data**: Question sets and extracted questions persist across page refreshes via localStorage.
* **Progress Tracking**: Tracks mastery levels (New, Learning, Familiar, Mastered), accuracy percentages, and study streaks.
* **Dark Mode**: Full dark mode support with a toggle in the header.

---

## Tech Stack

* **Frontend**: HTML5, CSS3, and Vanilla JavaScript (single-page app).
* **CSS Variables**: Used for theme switching and consistent UI styling.
* **Backend**: Node.js and Express.
* **Integrations**: Anthropic Claude API and `pdf-parse` for document processing.

---

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd studying-tool
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables**:
    Create a `.env` file in the root directory:
    ```bash
    ANTHROPIC_API_KEY=your_anthropic_api_key

    # Optional
    PORT=3000
    CLAUDE_MODEL=claude-sonnet-4-20250514
    ```
4. **Start the application**:
    ```bash
    npm start
    ```
    The tool will be accessible at `http://localhost:3000`.

---

## Usage

1. **Import Content**: Go to the Home tab, choose Paste Text or Upload PDF, and click "Extract Questions".
2. **Save Question Set**: Review the extracted questions in the Quizlet-style preview and save them with a custom name.
3. **Start Studying**: Switch to the Study tab, select a set, and choose Learn, Test, Review, or Flashcards mode.
4. **Monitor Progress**: Visit the Progress tab to view accuracy stats and question breakdowns.
