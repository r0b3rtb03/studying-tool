# Changelog

All notable changes to this project will be documented in this file.

---

## [2.0.0] - 2026-03-02

### Added
- **Submit Button in Learn Mode**: Clicking an option now only selects it. A "Submit Answer" button must be clicked to reveal the result. Previously answered questions show their results when navigating back.
- **Flashcard Study Mode**: New mode in the Study tab. Shows one question at a time as a large card — click to reveal/hide the answer. Navigate with Previous/Next.
- **Quizlet-Style Question Layout**: Extracted questions and saved sets on the Home tab display in a two-panel layout (question + options on the left, correct answer on the right).
- **Persistent Extracted Questions**: Parsed questions are stored in localStorage and survive page refreshes. They only clear when discarded or replaced by a new extraction.
- **Saved Set Viewer on Home Tab**: Clicking a saved question set chip on the Home tab shows its questions in the Quizlet-style layout.
- **Learn Mode Enhancements**:
    - New summary screen upon completion showing categorized results (Still Learning, Familiar, Mastered).
    - Randomized encouraging messages (e.g., "Nice work, you’re crushing it!").
    - Session persistence: switching tabs no longer resets your current Learn session.
    - Sticky navigation bar to prevent UI jumping.
- **Flashcard Mode**:
    - Added "Shuffle" and "Order" buttons to randomize or reset card sequence.
    - Improved card layout and navigation.
- **Home Tab**:
    - Added a search bar to filter saved question sets.
    - Added a delete button with a custom confirmation modal for saved sets.
    - Quizlet-style viewer for saved sets.
- **Progress & Data**:
    - **CSV Export**: Ability to export question sets to CSV format from the Progress tab.
    - **Clear Progress**: Added a safe confirmation modal before clearing all data.
- **UI/UX**:
    - Custom styled modals for confirmations (Delete, Save, Clear Progress) replacing native browser alerts.
    - Loading spinners added to "Save" and "Extract" buttons for better feedback.
    - Improved dark mode contrast for answer text.
    - Bolded "Question #" labels for better readability.

### Changed
- **Renamed "Import" tab to "Home"**.
- **Color scheme**: Switched from green (#5a7a4a) to a subtle steel blue (#4a6fa5 light / #3a5f85 dark) that works well in both light and dark themes.
- **Review mode moved into Study tab**: The standalone Review tab has been removed. Review mode with search and filter controls now lives inside the Study tab alongside Learn, Test, and Flashcards.
- **Review mode moved into Study tab**: Consolidated Review, Learn, Test, and Flashcards into a single Study hub.
- **Increased API limits**: JSON body limit raised from 1MB to 5MB; Claude `max_tokens` raised from 8,000 to 16,000 to handle larger question sets.
- **Improved system prompt**: Updated Claude instructions to explicitly recognize `**bold**` markers as correct answer indicators in PDF-extracted text.
- **Refined PDF Parsing**: Switched to native `fetch` API to resolve Windows `ECONNRESET` errors and improved error logging.

### Fixed
- **PDF Upload 500 Error**: Root cause was Node.js `https.request` module on Windows causing `ECONNRESET` errors. Replaced with native `fetch` API which resolves the connection issue entirely. Also added proper error logging and descriptive error messages.
- **Fast-Click Question Skip Bug**: Removed auto-advance on correct answers. Users must now explicitly click "Next" to proceed, preventing the issue where rapidly answering would skip multiple questions.
                            
- **Fast-Click Question Skip**: Removed auto-advance on correct answers to prevent skipping.
- **PDF Upload Errors**: Fixed generic "fetch failed" errors by implementing robust server-side error handling and client-side feedback.

### Removed
- **Google Docs Integration**: Removed Google OAuth, Google Drive search, and Google Docs import. Dependencies `googleapis` and `express-session` removed from package.json.
- **Standalone Review Tab**: Consolidated into the Study tab's Review mode.

---

## [1.0.0] - Initial Release

### Added
- AI-powered question extraction using Claude API.
- Three import methods: Paste Text, PDF Upload, Google Docs.
- Three study modes: Learn, Test, Review.
- Progress tracking with mastery levels (New, Learning, Familiar, Mastered).
- Accuracy and streak statistics.
- Dark mode toggle.
- Question starring for difficult items.
- LocalStorage persistence for question sets and progress.
