# Visual Learning

## 1.0 Introduction
Visual Learning is an open source, universal AI driven engine designed to revolutionize the comprehension of complex topics. By combining traditional text based explanations with dynamic, AI generated visual and interactive simulations, this project bridges the gap between theoretical reading and practical understanding.

## 2.0 The Problem Statement
Traditional learning, especially in the era of AI, heavily indexes on text. While Large Language Models excel at generating detailed textual explanations, complex fields like engineering, chemistry, architecture, and mathematics require interactive visualizations to build intuition.

### 2.1 The Evolution of Learning
1. Text Only: Beneficial for theory, but limited for spatial or temporal understanding.
2. Text and Visuals: Improved, but often static and generalized.
3. Text, Visuals, and Interaction: The optimal standard. Users can modify parameters, step through algorithms, and explore system variables in real time.

Visual Learning seamlessly blends these three paradigms, introducing interactive learning natively into specific modules (Playground / DSA, Science and Math Simulations, and Charts).

### 2.2 Limitations of Native Image Generation
While native image generation models are advanced for artistic endeavors, they present fundamental flaws for rigorous academic or technical purposes.

<table>
  <tr>
    <th>Limitation</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>Hallucinations and Mislabeling</td>
    <td>Models frequently place incorrect labels on diagrams or invent non existent components.</td>
  </tr>
  <tr>
    <td>Spelling Inaccuracies</td>
    <td>Text rendering within generated images is notoriously unreliable, making labels and formulas illegible or factually incorrect.</td>
  </tr>
  <tr>
    <td>Lack of Precision</td>
    <td>Models operate on pixels, not underlying structured data. Static pixel grids cannot be interacted with or mathematically verified.</td>
  </tr>
  <tr>
    <td>Non Interactive Nature</td>
    <td>A generated image cannot be stepped through frame by frame or have its parameters tweaked dynamically.</td>
  </tr>
</table>

Visual Learning solves this by using AI to generate structured code (LaTeX, Mermaid, JSON, JS Classes) which is deterministically rendered into precise, interactive, and academically accurate visualizations.

## 3.0 System Architecture and Processing Workflow
This section details the intricate architecture of how the environment setup and model code processing effectively render visuals for various educational environments.

### 3.1 Core Processing Pipeline
The system operates on a specialized pipeline designed to maintain academic rigor and rendering precision.

1. Prompt Ingestion: The user inputs a natural language request for a specific concept or simulation.
2. Contextual System Prompting: The backend wraps the user query in a strict system prompt tailored to the active module. This enforces syntax rules, coordinate grids, and library constraints.
3. Model Generation: The AI processes the prompt and outputs a strictly formatted JSON object. This object contains the explanatory text and the raw rendering code.
4. Code Extraction and Sanitization: The backend extracts the target code string from the JSON response and performs server side sanitization.
5. Deterministic Rendering: The sanitized code is passed to the respective rendering engine to generate the final visual output.

### 3.2 Module Specific Architecture

<table>
  <tr>
    <th>Module</th>
    <th>Objective</th>
    <th>AI Output Format</th>
    <th>Rendering Engine</th>
    <th>Key Features</th>
  </tr>
  <tr>
    <td>Electrical and Electronics</td>
    <td>Visualize circuit diagrams</td>
    <td>Circuitikz (LaTeX)</td>
    <td>Backend LaTeX Pipeline</td>
    <td>None</td>
  </tr>
  <tr>
    <td>Chemistry</td>
    <td>Represent molecular bonds</td>
    <td>Chemfig (LaTeX)</td>
    <td>Backend LaTeX Pipeline</td>
    <td>None</td>
  </tr>
  <tr>
    <td>Data Structures</td>
    <td>Step by step execution</td>
    <td>Structured State JSON</td>
    <td>Custom HTML Canvas reader</td>
    <td>Deep interactivity with forward backward stepping along with trying various inputs</td>
  </tr>
  <tr>
    <td>Science and Math</td>
    <td>Dynamic modeling of physics</td>
    <td>JavaScript Classes</td>
    <td>Browser JavaScript Engine</td>
    <td>Sliders for interactive variables tweaks</td>
  </tr>
  <tr>
    <td>Architecture Flow</td>
    <td>System design mapping</td>
    <td>Mermaid syntax</td>
    <td>Browser Mermaid Renderer</td>
    <td>Cleanly laid out SVG flowcharts and sequence diagrams</td>
  </tr>
  <tr>
    <td>Interactive Charts</td>
    <td>Visualizing raw data</td>
    <td>JSON Configurations</td>
    <td>ChartJS or Plotly</td>
    <td>Interactive tooltips, zooming, and dynamic legends</td>
  </tr>
</table>

### 3.3 The Structured Output Requirement
At the heart of Visual Learning is the ability to reliably marshal Large Language Models into outputting dense, structural code without breaking application logic.

By leveraging strict JSON schema enforcement and system prompting, the architecture guarantees the following.
1. Predictable formats containing distinct keys for explanations, equations, and code.
2. Elimination of conversational filler that corrupts rendering pipelines.
3. Flawless deserialization of complex algorithmic step states for frame by frame playback.

## 4.0 Prerequisites and Installation
To execute Visual Learning locally, standard developer tools are required.

### 4.1 System Requirements
1. Node.js v18.0.0 or higher: Serves the backend API routes and handles file operations.
2. npm or yarn: Manages project dependencies.

### 4.2 Local Environment Setup
1. Clone the repository.
```bash
git clone https://github.com/realprudhvi/visual-learning.git
cd visual-learning
```

2. Install dependencies.
```bash
npm install
```

3. Configure API Keys.
API keys can be inserted directly in the browser UI, or securely added to a `.env` file in the root directory for local backend testing. When configured in the `.env` file, UI input fields can be left blank for automatic fallback.
```env
GEMINI_API_KEY=insert_google_gemini_key_here
GROQ_API_KEY=insert_groq_llama3_key_here
```

## 5.0 Running the Application
Once dependencies are installed, initialize the application backend.

1. Start the server.
```bash
npm start
```

2. The terminal will confirm that the server is active on `http://localhost:3000`.
3. Open a web browser and navigate to `http://localhost:3000` to access the main landing page.
4. Select any educational module to begin generating visual materials.

## 6.0 The Vision for the Unified AI Tutor
The overarching goal of Visual Learning is to combine these disparate rendering engines into a single, cohesive AI Tutor.

1. The user asks the Tutor to explain a Low Pass RC Filter.
2. The Tutor explains the theory dynamically in text using MathJax formulas.
3. The interface spawns an Electrical engineering window showing the schematic visually mapped to the text.
4. The interface spawns an Interactive Charts window showing the frequency response plot.
5. The interface spawns a Science Simulation allowing the user to adjust the resistor value and observe the cutoff frequency shift in real time.

By merging traditional text based learning with precise, academically rigorous, and highly interactive visual rendering across disciplines, this project creates an omni capable learning engine that scales infinitely beyond traditional textbooks.
