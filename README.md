# Study Tool

An AI-powered study tool that transforms raw text and PDF documents into interactive quizzes — both multiple choice and short answer. It uses the Claude (Anthropic) API to automatically extract questions, options, and answer keys from provided materials. Because I'm banned off Quizlet this is my only option!

---

## Features

* **AI Question Extraction**: Uses the Claude API to intelligently parse content and generate structured questions.
    * **Multiple Choice**: Questions with lettered options (A, B, C, D).
    * **Short Answer / Fill-in-the-Blank**: Questions with blanks (`_____`) or typed answers. Supports multiple acceptable answers (`**answer1** or **answer2**`).
* **Flexible Import Options**:
    * **Paste Text**: Directly paste study notes or review sheets into the interface.
    * **PDF Upload**: Extracts text from PDF documents for processing.
    * **Add to Existing Set**: Append new questions to an existing set without losing progress.
* **Comprehensive Study Modes**:
    * **Learn Mode**: Focused mode with mastery tracking, shuffle controls (questions, options, restore order), and a summary screen with categorized results.
    * **Test Mode**: Simulates a formal exam with grading for both MC and short answer.
    * **Review Mode**: Browse all questions with search and filters (starred, frequently wrong, unseen, mastered).
    * **Flashcard Mode**: Click-to-flip flashcards with shuffle/order controls.
* **Cloud Sync**: Optional cross-device sync via a shared key — progress, question sets, and streaks stay in sync.
* **Progress Tracking**: Mastery levels (New, Learning, Familiar, Mastered), accuracy percentages, study streaks, and CSV export.
* **Dark Mode**: Full dark mode support with a toggle in the header.
* **Docs Tab**: View README and Changelog directly in the app with rendered Markdown.

---

## Tech Stack

* **Frontend**: HTML5, CSS3, and Vanilla JavaScript (single-page app).
* **Backend**: Node.js and Express.
* **Integrations**: Anthropic Claude API, `pdf-parse` for document processing, `marked` for Markdown rendering.

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
    SYNC_KEY=your_secret_sync_key   # enables cross-device cloud sync
    ```
4. **Start the application**:
    ```bash
    npm start
    ```
    The tool will be accessible at `http://localhost:3000`.

---

## Cloud Sync Setup

Cloud sync is **optional**. To enable it:

1. Add `SYNC_KEY=yoursecretkey` to your `.env` file on the server.
2. Restart the server.
3. In the app, click the cloud icon in the header and enter the same key.
4. Your progress will sync across any device that connects to the same server with the same key.

If no `SYNC_KEY` is set, the app works entirely with localStorage (no cloud features shown).

---

## Usage

1. **Import Content**: Go to the Home tab, paste text or upload a PDF, and click "Extract Questions".
2. **Save or Add**: Save as a new set, or add to your current set with the "Add to [Set Name]" button.
3. **Study**: Switch to the Study tab, select a set, and choose Learn, Test, Review, or Flashcards mode.
4. **Shuffle**: In Learn mode, use the shuffle controls to randomize questions and options.
5. **Track Progress**: Visit the Progress tab to view accuracy stats, mastery levels, and export to CSV.
6. **Sync**: Click the cloud icon to enable cross-device sync (requires `SYNC_KEY` in `.env`).
7. **Docs**: Check the Docs tab for README and Changelog.
