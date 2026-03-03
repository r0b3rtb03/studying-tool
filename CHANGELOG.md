# Changelog

All notable changes to this project will be documented in this file.

---

## [3.0.0] - 2026-03-03

### Added
- **Short Answer / Fill-in-the-Blank Questions**:
    - New question type alongside multiple choice — questions with `_____` blanks or single-answer format are now extracted as short answer.
    - Text input field instead of MC buttons in Learn, Test, and Flashcard modes.
    - Answers with `**answer1** or **answer2**` format are parsed as multiple acceptable answers.
    - Punctuation-insensitive grading — periods, commas, hyphens, etc. are ignored when checking answers.
- **Add to Existing Set**:
    - "Add to [Set Name]" button appears when extracting new questions while an active set exists.
    - Appends new questions to the current set without losing existing progress.
- **Shuffle Controls for Learn Mode**:
    - "Shuffle Questions" — randomizes question order.
    - "Shuffle Options" — randomizes MC option order (A/B/C/D positions).
    - "Put in Order" — restores original question and option order.
    - Controls appear between the mode tabs and progress bar.
- **Cloud Sync (Cross-Device)**:
    - Optional `SYNC_KEY` in `.env` enables syncing progress across devices.
    - Cloud icon in header to connect/disconnect sync.
    - Smart merge: keeps higher correct/wrong counts, merges question sets, preserves starred items.
    - Falls back to localStorage-only if no `SYNC_KEY` is configured.
- **Docs Tab**:
    - New tab on the website to view README and Changelog.
    - Toggle between documents with rendered Markdown.

### Changed
- **Renamed app title** from "Multiple Choice Study Tool" to "Study Tool" (now supports short answer too).
- **Mastery badge colors on flashcards** — brighter, lighter colors for visibility on the dark blue card background.
- **Save button renamed** from "Save Question Set" to "Save as New Set" for clarity alongside the new "Add to" option.
- **Notification messages** updated — "Found X questions" instead of "Found X multiple choice questions".

### Fixed
- **Short answer grading** ignores punctuation (periods, commas, hyphens, quotes, etc.) and is case-insensitive.
- **Academic format parsing** — questions with `a. **answer**` sub-item format (common in study guides) are now correctly extracted as short answer, not rejected as malformed MC.

---

## [2.0.0] - 2026-03-02

### Added
- **Learn Mode Enhancements**:
    - New summary screen upon completion showing categorized results (Still Learning, Familiar, Mastered).
    - Randomized encouraging messages (e.g., "Nice work, you're crushing it!").
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
- **Review mode moved into Study tab**: Consolidated Review, Learn, Test, and Flashcards into a single Study hub.
- **Increased API limits**: JSON body limit raised from 1MB to 5MB; Claude `max_tokens` raised from 8,000 to 16,000 to handle larger question sets.
- **Refined PDF Parsing**: Switched to native `fetch` API to resolve Windows `ECONNRESET` errors and improved error logging.

### Fixed
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
