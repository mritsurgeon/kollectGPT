# Rules for AI Code Suggestions and Completions

## 1. UI Development Rules

### 1.1 Design Consistency
- **Framework Restriction:** All UI components must strictly use Material-UI (MUI) for consistency with the current design.
- **Modern Look:** Maintain a modern design aesthetic that aligns with the Material-UI design philosophy.
- **No Overwriting:** Existing UI design and structure must not be removed or replaced during suggestions or completions. Additions must integrate seamlessly with the current UI.

### 1.2 Icon States
- **Infrastructure Icons:** Ensure that each infrastructure icon (AWS, Azure, Kubernetes, Veeam) adheres to the following states:
  - **Connected:** Green glow.
  - **Disconnected:** Red glow.
  - **Not Configured:** Plain (no glow).
- **Interactivity:** Clicking an icon must open a configuration panel tailored to the respective platform.

### 1.3 Configuration Panels
- **AWS, Azure, GCP:**
  - Use SDKs for connection handling.
  - Azure must support CLI browser authentication if the Azure client is installed.
  - Prompt for required credentials (e.g., access keys for AWS).
- **Kubernetes:**
  - Allow the user to provide a path to the kubeconfig file.
  - Provide an option to upload a kubeconfig file directly.
- **AI (GPT):**
  - Ensure lightweight integration by using free external AI services.
  - Avoid local AI model deployment to keep the app lightweight.

---

## 2. AI Chatbot Rules

### 2.1 Integration Guidelines
- **Language Chain Agents:** The AI chatbot must use LangChain agents with tools for infrastructure queries.
- **Expandable Design:**
  - The chatbot must be collapsible/minimizable within the UI.
  - Responses from the chatbot must update the UI inventory area dynamically.

### 2.2 Functionality
- **Data Fetching:** The chatbot must fetch data from all connected infrastructures based on user prompts.
- **Reports:** Enable the user to generate and download reports directly from chatbot interactions.
- **Lightweight Implementation:** Always leverage free external AI services for processing to ensure minimal impact on application performance.

---

## 3. General Development Rules

### 3.1 Code Modification
- **Strict Additions:** The AI must only add code during completions or feature additions. Existing code must remain untouched unless explicitly requested for modification.
- **No Rewrites:** Avoid rewriting or restructuring existing application logic unless explicitly requested.

### 3.2 Free AI Services
- Only integrate with freely available external AI services (e.g., OpenAI free-tier APIs) to maintain a lightweight application.

### 3.3 Security and Performance
- Ensure all added code adheres to best practices for security and performance.
- New integrations or features must not degrade the app’s responsiveness or increase its resource footprint unnecessarily.

---

## 4. Error Handling

### 4.1 Robustness
- All new additions must include proper error handling.
- Ensure that failures in AI or SDK integrations are gracefully managed, with clear error messages displayed to the user.

---

## 5. Documentation
- Document all added code to ensure maintainability.
- Include clear comments for any new feature or integration to explain its purpose and functionality.

---

