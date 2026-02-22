Slide 1:
Title: Visual Learning - DevOps Review 2

Slide 2:
Recap of DevOps Strategy
- Our project ("Visual Learning") relies on an automated pipeline to ensure consistency and reliability.
- Focus is on preventing new code changes from breaking complex visualizations.
- CI/CD allows for continuous, fast delivery of educational features.

Slide 3:
Pipeline Tech Stack: Version Control & CI/CD
- Version Control: Git & GitHub 
  - Used for source code management, tracking history, and collaboration.
- CI/CD Server/Runner: GitHub Actions
  - Selected for its seamless, native integration with our GitHub repository.
  - Automates builds and tests using defined YAML workflows upon Git events.

Slide 4:
Pipeline Tech Stack: Testing & Code Quality
- Code Quality & Formatting: Prettier / ESLint
  - Enforces uniform styling across HTML, CSS, and modern JavaScript structures.
- Testing Framework (Unit Tests): Jest / Mocha
  - Responsible for verifying the logic of step controllers, algorithm execution, and data structures (HashMaps, Graphs, etc.).
- UI Testing: Puppeteer / Cypress
  - Simulates interactions to verify canvas renderings and DOM manipulations.

Slide 5:
Pipeline Tech Stack: Deployment
- Hosting / Deployment Platform: Vercel / GitHub Pages / Netlify
  - Fully optimized for building and deploying vanilla web applications and static sites.
  - Generates automatic preview deployments for Pull Requests.
  - Offers fast content delivery, crucial for interactive platform performance.

Slide 6:
Demo: Complete Till Testing Phase (Overview)
- Our current CI pipeline is active up to the automated testing stage. 
- The pipeline correctly handles integration, but staging/production deployment automation is still ongoing.
- We will demonstrate how a code change is automatically analyzed and tested.

Slide 7:
Demo: Execution of the Pipeline (Step 1 - Code Push)
- The developer commits a new feature (e.g., "Updating HashMap UI Visualization") to a new branch.
- The new branch is pushed to GitHub, and a Pull Request to 'main' is opened.

Slide 8:
Demo: Execution of the Pipeline (Step 2 - Build & Lint)
- GitHub Actions detects the Pull Request and triggers the workflow.
- A virtual environment is instantly provisioned.
- The repository source code is cloned, and necessary Node dependencies are installed.
- Linters run automatically to enforce the project's JavaScript syntax standards.

Slide 9:
Demo: Execution of the Pipeline (Step 3 - Automated Testing)
- Once linting passes, the automated test suite executes.
- Unit tests run against core logic (verifying visual auto-stepper, monotonic queue queues, Hash structures, etc.).
- Live test results and coverage reports are pushed to the console output.
- The Pull Request is either approved (all tests pass) or actively blocked (issues detected) natively within GitHub.
