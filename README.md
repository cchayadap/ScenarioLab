ScenarioLab: learn the theory, practice the workflow

Every student asks, "Why do I need to learn this?" Most never find out, and the doubt drains attention and interest. Knowing a subject isn't the same as knowing how to use it at work, where the skill is the thought process: reading a brief, weighing trade-offs, designing a solution, and explaining it so others can build it.

What ScenarioLab does ?
Paste a lecture, syllabus or slides. ScenarioLab turns them into a simulated workplace situation:
1. AI splits the material into tasks.
2. Each task becomes a realistic scenario with a role, stakes, constraints and a rubric, tailored to the student's career goal (big tech, startup or research lab).
3. The student designs the solution and describes the workflow step by step, in words, as a drag-and-drop flowchart, or both. There's no code and no real build, so the time goes into thinking and explaining.
4. An AI "senior" reviews the design against the rubric, with scored feedback on what's strong and what's missing. The student gets up to 3 rounds to improve, then sees a suggested answer compared with their own. (Confirm this matches how your rounds end.)
5. If they're stuck, they can ask for a hint, a simpler version of the question, or a chat with one of two mentors (Casey, who is kind, or Morgan, who is busy), each with their own tone.
Over time, a lightweight mastery view shows recurring weak spots and pass rate across tasks.

The AI is prompted to evaluate, not to reveal. The reviewer points at gaps without giving the answer, and the mentor refuses requests to hand over the solution, including "ignore your instructions" style attempts. Course material and user input are filtered before they reach the model. No system can fully stop a student from copying elsewhere. The design goal is to make thinking the easiest path: answers must be structured designs, and each round pushes back on specifics.

How we built it:
- Next.js 14 (App Router), React 18, TypeScript, Tailwind (custom "workstation" theme)
- Google Gemini via @google/genai, powering task breakdown, scenario writing, grading, hints and mentor chat through small API routes, each with a tightly scoped prompt
- Mermaid.js for AI-generated diagrams and React Flow for student-built flowcharts
- unpdf and jszip to parse PDF and PPTX lectures
- Browser local Storage only: no accounts and no database, so the app is private and zero-setup
- Deployed on Vercel

Who it's for and what's next ?
ScenarioLab currently fits computer science best, where we know the professional workflow well. The pattern of role, constraints, design, senior review and revision applies to any field with a professional practice. To further improve, we'll need more insights and research on other fields actually work, so each subject's scenarios and feedback match how that field really operates.
