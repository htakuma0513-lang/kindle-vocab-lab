# Learning Design Notes

This app is designed around a few evidence-based principles for second-language vocabulary learning.

## Principles

1. Retrieval beats rereading.
   - Review cards should require recall before showing the answer.
   - The app keeps `知らない / 微妙 / 覚えた` grading rather than passive reading.
   - New words start in comprehension mode before cloze recall. Active recall is most useful after at least minimal encoding and feedback.

2. Spacing matters.
   - Each review updates `nextReview` so words return after a delay.
   - Easy words are delayed more, weak words come back sooner.

3. Knowing a word is more than knowing a translation.
   - A useful card stores form, meaning, use, collocation, context, examples, and the learner's own sentence.
   - A single Japanese gloss such as `収容する` is treated as only a starting hint.

4. Deeper processing improves retention.
   - The app encourages search, comparison, and evaluation: dictionary definitions, examples, usage patterns, collocations, and a user-generated sentence.

5. Retrieval difficulty should be desirable, not discouraging.
   - If a learner has no initial representation of the word, forced recall can become noise.
   - The first exposure should show the word, sentence, meaning, and usage. Later reviews can hide the target word.

## Sources

- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving Students' Learning With Effective Learning Techniques.
  https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html
- Karpicke, J. D., & Roediger, H. L. (2008). The Critical Importance of Retrieval for Learning.
  https://web.mit.edu/educationgroup/HHMIEducationGroup/wp-content/uploads/2011/04/14-Karpicke-Roediger-2008.pdf
- Laufer, B., & Hulstijn, J. (2001). Incidental vocabulary acquisition in a second language: The construct of task-induced involvement.
  https://academic.oup.com/applij/article/22/1/1/165145
- Schmitt, N. (2008). Instructed second language vocabulary learning.
  https://journals.sagepub.com/doi/10.1177/1362168808089921
- Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way: Creating desirable difficulties to enhance learning.
  https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/07/EBjork_RBjork_2011.pdf
- Rowland, C. A. (2014). The effect of testing versus restudy on retention: A meta-analytic review of the testing effect.
  https://psycnet.apa.org/record/2014-05355-001
