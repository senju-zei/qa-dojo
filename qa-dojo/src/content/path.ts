import type { LearningPath, Room } from '../engine/types';

const edgeLab: Room = {
  id: 'edge-lab',
  title: 'Edge Lab',
  tagline: 'Design test cases that catch bugs where they hide: at the edges.',
  source: 'Part 1 · §1 QA basics · §2 Test case design',
  glyph: '⟦⟧',
  tasks: [
    {
      id: 'qa-qc-testing',
      title: 'QA, QC and Testing',
      visual: 'qa-rings',
      brief: [
        '**Quality Assurance** is the whole process that *prevents* defects: planning, standards, reviews and testing. "Making sure we build it right."',
        '**Quality Control** checks the finished product for defects. **Testing** is actually running the software to find bugs.',
        'Hover the rings on the stage to see how they fit together.',
      ],
      check: {
        kind: 'choice',
        prompt: 'Which statement is correct?',
        options: [
          'Testing is part of QC, and QC is part of QA.',
          'QA is part of testing, and testing is part of QC.',
          'QA and QC are the same thing; testing is separate.',
          'QA only starts after development is finished.',
        ],
        answer: 0,
      },
      hints: [
        'Picture three nested circles: one is a whole process, one is a kind of checking, one is the hands-on act.',
        'The widest circle prevents defects end to end. The smallest is the act of running the app to find bugs.',
        'QA (whole prevention process) contains QC (checking the finished product), which contains Testing (running it). Testing ⊂ QC ⊂ QA → the first option.',
      ],
      xp: 40,
      explain: 'Testing ⊂ QC ⊂ QA: the rings widen as you move from doing to preventing.',
    },
    {
      id: 'stlc-order',
      title: 'The testing life cycle',
      visual: 'stlc',
      brief: [
        'The **STLC** zooms into the Testing stage of the SDLC (Requirements → Design → Development → Testing → Deployment → Maintenance).',
        'It has six phases, from understanding the feature to summarising lessons learned. The stage on the right redraws the pipeline as you reorder.',
      ],
      check: {
        kind: 'order',
        prompt: 'Put the six STLC phases in order.',
        steps: [
          'Requirement analysis',
          'Test planning',
          'Test case design',
          'Environment setup',
          'Test execution',
          'Test closure',
        ],
      },
      hints: [
        "You can't plan a test until you understand what the feature should do.",
        'Understand → plan → write → prepare → run → wrap up.',
        'Requirement analysis → Test planning → Test case design → Environment setup → Test execution → Test closure.',
      ],
      xp: 60,
      explain: 'Requirements → plan → design cases → set up → execute → close. The expected result is written before you run anything.',
    },
    {
      id: 'testing-types',
      title: 'Name that testing type',
      brief: [
        'Interviewers love asking you to tell testing types apart. The trick is to ask **how wide** the check is and **who** is doing it.',
        'Sort each real scenario into the testing type it describes.',
      ],
      check: {
        kind: 'classify',
        prompt: 'Match each scenario to its testing type.',
        buckets: ['Smoke', 'Regression', 'Sanity', 'Exploratory', 'UAT'],
        items: [
          { label: 'New build lands: app opens, login works, home loads.', bucket: 'Smoke' },
          { label: 'After fixing search, re-test posting and claiming.', bucket: 'Regression' },
          { label: 'Confirm the one bug that was just fixed no longer happens.', bucket: 'Sanity' },
          { label: 'Click around like a curious user, with no script.', bucket: 'Exploratory' },
          { label: 'Clerks try the staff dashboard before launch.', bucket: 'UAT' },
        ],
      },
      hints: [
        'For each card ask: is this broad or narrow? Scripted or free? Done by QA or by real users?',
        'Smoke = broad and shallow on a fresh build. Sanity = narrow, one fix. Regression = did a change break *other* things. UAT = real users sign off.',
        'Build lands → Smoke · Re-test posting after search fix → Regression · One fixed bug → Sanity · No script → Exploratory · Clerks before launch → UAT.',
      ],
      xp: 60,
      explain: 'Smoke is wide-and-shallow, sanity is narrow-and-deep, regression guards old features, UAT is the users\' sign-off.',
    },
    {
      id: 'four-groups',
      title: 'The four groups',
      brief: [
        'Good test cases come in four groups. **Positive**: valid input works. **Negative**: invalid input fails gracefully with a clear message.',
        '**Edge**: limits and unusual input (very long text, extra spaces). **Security**: someone trying to abuse it.',
        'Here are test ideas for a login page. Sort them.',
      ],
      check: {
        kind: 'classify',
        prompt: 'Sort each login test into its group.',
        buckets: ['Positive', 'Negative', 'Edge', 'Security'],
        items: [
          { label: 'Correct email + correct password', bucket: 'Positive' },
          { label: 'Correct email + wrong password', bucket: 'Negative' },
          { label: 'Unregistered email address', bucket: 'Negative' },
          { label: 'Email typed with extra spaces around it', bucket: 'Edge' },
          { label: 'A 500-character email address', bucket: 'Edge' },
          { label: '20 failed logins in a row', bucket: 'Security' },
          { label: "' OR '1'='1 typed into the email field", bucket: 'Security' },
        ],
      },
      hints: [
        'Ask: is the input valid, invalid, unusual, or malicious?',
        'Two cards are plain wrong input (Negative), two are odd-but-plausible input (Edge), two are someone attacking (Security).',
        'Positive: correct details. Negative: wrong password, unregistered email. Edge: extra spaces, 500 chars. Security: 20 failed logins (brute force), \' OR \'1\'=\'1 (SQL injection).',
      ],
      xp: 60,
      explain: 'Positive, Negative, Edge and Security together are your answer to "How would you test a login page?"',
    },
    {
      id: 'bva-password',
      title: 'Boundary value analysis',
      visual: 'bva-line',
      brief: [
        '**Bugs love the edges.** Boundary value analysis tests exactly *at* and *just past* each limit.',
        'For an Age field from 18 to 60, you test 17, 18, 60 and 61. Drag the limits on the stage and watch the boundary points move.',
      ],
      check: {
        kind: 'value',
        prompt: 'A password must be 8 to 20 characters. Which four lengths are the boundary tests?',
        mode: 'numberSet',
        accept: ['7, 8, 20, 21'],
        placeholder: 'e.g. 1, 2, 3, 4',
      },
      hints: [
        'Set the stage limits to 8 and 20 and look at which points light up.',
        'Two limits × two values each: one exactly on the limit, one a single step outside it.',
        '7 (just below), 8 (exactly the minimum), 20 (exactly the maximum), 21 (just above) → 7, 8, 20, 21.',
      ],
      xp: 60,
      explain: 'Matches answer key TC-P3 to TC-P6: 7 rejected, 8 accepted, 20 accepted, 21 rejected.',
    },
    {
      id: 'partitions',
      title: 'Equivalence partitioning',
      visual: 'partitions',
      brief: [
        '**Equivalence partitioning** splits inputs into groups the app should treat the same way, then tests one value per group instead of every value.',
        'Age accepts whole numbers from 18 to 60. Your picks light up on the stage.',
      ],
      check: {
        kind: 'multi',
        prompt: 'Select every value in the SAME partition as 25.',
        options: ['18', '42', '60', '17', '61', '25.5', 'abc'],
        answers: [0, 1, 2],
      },
      hints: [
        '25 is accepted. Which other values would the app also accept, for the same reason?',
        'Partitions here: below range, valid range, above range, not a whole number, not a number at all.',
        '18, 42 and 60 are valid whole numbers in range, the same partition as 25. 17 and 61 are out of range; 25.5 and abc are invalid types.',
      ],
      xp: 60,
      explain: 'One valid partition, two out-of-range partitions, plus wrong-type partitions. Boundaries are still worth testing on their own.',
    },
    {
      id: 'mutant-hunt',
      title: 'Mutant hunt',
      brief: [
        'A developer wrote five versions of the Age check (whole numbers 18–60). Each hides an off-by-one or a missing limit: a **mutant**.',
        'Add test ages, then **Run suite**. A mutant is *killed* when it gives a different answer than the spec. Kill all five with **6 tests or fewer**.',
        'This is why `age > 18` instead of `age >= 18` is caught only by testing exactly 18.',
      ],
      check: { kind: 'sandbox', prompt: 'Kill every mutant with ≤ 6 tests.', sandbox: 'mutant-lab' },
      hints: [
        'Values in the middle like 25 or 40 pass in every version. Mutants hide at the edges.',
        'Test exactly on each limit and one step outside it. Two limits, two values each.',
        'Run 17, 18, 60, 61. 18 kills `age > 18`, 60 kills `age < 60`, 17 kills `age >= 17`, 61 kills both `age <= 61` and the no-upper-limit `age >= 18`.',
      ],
      xp: 100,
      explain: 'Four boundary tests caught five different bugs. Boundary value analysis is the most efficient set of tests here.',
    },
  ],
};

const triageBay: Room = {
  id: 'triage-bay',
  title: 'Triage Bay',
  tagline: 'Write bug reports a developer can reproduce, then rank and route them.',
  source: 'Part 1 · §3 Bug reporting · §4 Web security basics',
  glyph: '◇',
  tasks: [
    {
      id: 'report-anatomy',
      title: 'Anatomy of a bug report',
      visual: 'report-anatomy',
      brief: [
        'A bug report must let a developer **see the bug happen themselves**. If they can\'t reproduce it, they can\'t fix it.',
        'Reorder the sections. The stage assembles the real "submits twice" report in the order you choose.',
      ],
      check: {
        kind: 'order',
        prompt: 'Order the sections of a bug report.',
        steps: ['Title', 'Steps to reproduce', 'Expected vs actual', 'Environment', 'Severity & priority', 'Evidence'],
      },
      hints: [
        'Start with what is wrong, then how to make it happen.',
        'Shape: what → how → should vs did → where → how bad / how soon → proof.',
        'Title → Steps → Expected vs actual → Environment → Severity & priority → Evidence.',
      ],
      xp: 60,
      explain: 'title → steps → expected vs actual → environment → severity & priority → evidence.',
    },
    {
      id: 'good-titles',
      title: 'Titles that work',
      brief: [
        'A good report has **one bug**, a title that says **what is wrong and where**, and sticks to **facts, never blame**.',
        '"The form submits twice", not "The developer forgot…".',
      ],
      check: {
        kind: 'multi',
        prompt: 'Select every title that follows the guide.',
        options: [
          'Form submits twice when "Submit" is double-clicked',
          'Login broken',
          'Pickup code visible to other students on the Claims page',
          'Developer forgot to disable the Submit button',
          'Profile photo shows old image after update (Chrome)',
          'Several issues on checkout and search',
        ],
        answers: [0, 2, 4],
      },
      hints: [
        'Check each title for both *what* is wrong and *where* it happens.',
        'Three traps: too vague, blaming a person, bundling more than one bug.',
        '"Login broken" is vague, "Developer forgot…" blames, "Several issues…" bundles bugs. The other three are specific, factual and single.',
      ],
      xp: 60,
      explain: 'Specific, factual, one bug per report. Your portfolio caching bug makes a great title.',
    },
    {
      id: 'who-decides',
      title: 'Severity vs priority',
      brief: [
        '**Severity** is how badly the bug breaks the software. Usually QA sets it.',
        '**Priority** is how soon it must be fixed. That is a business call.',
      ],
      check: {
        kind: 'choice',
        prompt: "Who usually decides a bug's priority?",
        options: ['QA', 'The product owner or lead', 'The developer assigned to fix it', 'The user who reported it'],
        answer: 1,
      },
      hints: [
        'Priority is about *when*, which depends on business plans, not just how broken it is.',
        'QA judges impact (severity). Someone who owns the roadmap judges urgency.',
        'Priority is usually set by the product owner or lead.',
      ],
      xp: 40,
      explain: 'QA → severity (how bad). Product owner or lead → priority (how soon).',
    },
    {
      id: 'triage-matrix',
      title: 'The triage matrix',
      visual: 'sev-matrix',
      brief: [
        'Severity and priority are independent, so every bug lands in one of four quadrants.',
        'Sort each bug and watch it drop into the matrix.',
      ],
      check: {
        kind: 'classify',
        prompt: 'Place each bug in its quadrant.',
        buckets: ['High sev · High pri', 'High sev · Low pri', 'Low sev · High pri', 'Low sev · Low pri'],
        items: [
          { label: 'Checkout crashes for every user', bucket: 'High sev · High pri' },
          { label: 'App crashes on a rare, old phone model almost nobody uses', bucket: 'High sev · Low pri' },
          { label: 'Company name misspelled on the home page', bucket: 'Low sev · High pri' },
          { label: 'A button is 2 px out of line on one settings page', bucket: 'Low sev · Low pri' },
        ],
      },
      hints: [
        'Judge each bug twice: how broken is the software (severity), and how soon does the business need it fixed (priority)?',
        'A crash is high severity; who it affects sets the priority. A typo breaks nothing, but where it is matters.',
        'Checkout crash → High/High. Rare phone crash → High sev, Low pri. Misspelled company name → Low sev, High pri. 2 px button → Low/Low.',
      ],
      xp: 80,
      explain: 'The misspelled company name is the classic interview example: low severity, high priority.',
    },
    {
      id: 'security-match',
      title: 'Security quick-match',
      brief: [
        'You don\'t need to be a security expert, but you should name these in a sentence. Each one has a matching QA test.',
        'Only security-test systems you own or have permission to test.',
      ],
      check: {
        kind: 'classify',
        prompt: 'Match each QA test to the risk it checks.',
        buckets: ['Brute force', 'XSS', 'SQL injection', 'Access control', 'Secure errors'],
        items: [
          { label: 'Try many wrong logins quickly: does it lock or slow down?', bucket: 'Brute force' },
          { label: 'Type <script>alert(1)</script> into a comment box', bucket: 'XSS' },
          { label: "Type ' OR '1'='1 into the login fields", bucket: 'SQL injection' },
          { label: "Log in as a student and try to view another student's pickup code", bucket: 'Access control' },
          { label: 'Check whether "wrong password" reveals that the email exists', bucket: 'Secure errors' },
        ],
      },
      hints: [
        'Look at *what* is being typed or tried in each test: a script, a database trick, many guesses, another role.',
        'Script tags → page runs attacker code. Quote tricks → the database. Other people\'s data → roles.',
        'Many logins → Brute force · <script> → XSS · \' OR \'1\'=\'1 → SQL injection · pickup code → Access control (your CampusFind test) · "wrong password" hint → Secure errors.',
      ],
      xp: 60,
      explain: 'Your CampusFind pickup-code test was an access-control test. Use it as your example in the interview.',
    },
    {
      id: 'not-a-bug',
      title: '"That\'s not a bug."',
      brief: [
        'A developer says your bug is not a bug. It\'s about the product, not winning the argument.',
        'Put a calm, professional response in order.',
      ],
      check: {
        kind: 'order',
        prompt: 'Order your response.',
        steps: [
          'Re-check the requirement',
          'Reproduce the bug again',
          'Show the steps and evidence calmly',
          'Explain the impact on users',
          'Still disagree? Ask the product owner or lead to decide',
        ],
      },
      hints: [
        'Before convincing anyone else, make sure you are right.',
        'Verify yourself (two steps) → share (two steps) → escalate (one step).',
        'Re-check requirement → reproduce → show evidence → explain user impact → escalate to product owner/lead.',
      ],
      xp: 60,
      explain: 'Verify, show, explain, escalate. The same order works for a bug found right before release.',
    },
    {
      id: 'lifecycle',
      title: 'Drive the bug life cycle',
      brief: [
        'Bug life cycle: **New → Assigned → Open → Fixed → Retest → Closed**. A failed retest goes to **Reopened**. Other endings: Duplicate, Rejected, Deferred.',
        'Scenario: the first fix **fails retest**. Drive this bug from New all the way to **Closed** by choosing each transition.',
      ],
      check: { kind: 'sandbox', prompt: 'Close the bug after one failed retest.', sandbox: 'lifecycle' },
      hints: [
        'Before anyone can retest, the bug has to be assigned, worked on and fixed.',
        'At Retest, take the failing branch once. Reopened goes back into work, so loop round again.',
        'New → Assigned → Open → Fixed → Retest → Reopened → Open → Fixed → Retest → Closed.',
      ],
      xp: 100,
      explain: 'Retest is QA\'s gate: nothing is Closed until QA confirms the fix.',
    },
  ],
};

export const PATH: LearningPath = {
  id: 'qa-trainee',
  title: 'QA Trainee Path',
  rooms: [edgeLab, triageBay],
  planned: [
    { id: 'js-readout', title: 'JS Readout', tagline: 'Read JavaScript like a tester: let vs const, "5" + 1, ===.', source: 'Part 1 · §5' },
    { id: 'playwright-pilot', title: 'Playwright Pilot', tagline: 'Turn a manual test case into goto → fill → click → expect.', source: 'Part 1 · §6' },
    { id: 'interview-drill', title: 'Interview Drill', tagline: 'STAR stories and timed answers from your own projects.', source: 'Part 2' },
  ],
};

export const ALL_TASKS = PATH.rooms.flatMap((room) => room.tasks.map((task, index) => ({ room, task, index })));

export const findTask = (taskId: string) => ALL_TASKS.find((t) => t.task.id === taskId);
