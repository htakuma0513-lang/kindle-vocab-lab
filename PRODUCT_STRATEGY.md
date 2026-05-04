# Product Strategy

This app should not clone Distinction's proprietary UI, wording, content, or assets. It should learn from the product category and build an original Kindle-first vocabulary trainer.

## Design Direction

- Premium learning app rather than colorful casual flashcards.
- High contrast, strong typography, restrained accent colors.
- Review screens should reduce clutter and force recall.
- Library screens can expose full linguistic detail, but only behind clear disclosure controls.

## Learning Logic To Keep Adding

1. Active recall first
   - During review, show a sentence with the target word hidden.
   - Show the word, meaning, and usage only after the learner commits to recall.

2. Example-first vocabulary
   - Prefer the user's Kindle sentence.
   - If unavailable, use saved dictionary/app examples.
   - Keep the source label visible so the learner knows where the sentence came from.

3. Spaced repetition with confidence
   - Continue using `知らない / 微妙 / 覚えた`.
   - Add future controls for `完璧`, `例文では分かる`, and `自分では使えない`.

4. Word knowledge beyond translation
   - Track meaning, definition, patterns, collocations, examples, learner-produced sentence, and caution notes.
   - A word should not be considered strong just because a Japanese gloss is known.

5. Production practice
   - Prompt the user to create their own sentence.
   - Later, add self-check prompts: grammar, naturalness, collocation, and register.

## Near-Term Feature Backlog

- Study session screen with daily goal and progress.
- Cloze review variants using saved examples.
- Listen-first review mode.
- Mastered toggle and reactivation.
- Weakness tags: meaning, pronunciation, spelling, collocation, production.
- Import Kindle highlights / clippings when available.
- Optional server-side dictionary proxy for API keys before public sharing.
