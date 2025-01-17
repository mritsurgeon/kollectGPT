# Product Requirements Document (PRD): KollectGPT Code Analysis Tool

## 1. Core Purpose
KollectGPT is a code analysis and data collection tool designed to gather and display infrastructure data from multiple platforms including:
- Kubernetes clusters
- AWS
- Azure
- Veeam backup systems

The tool provides a unified interface for infrastructure administrators and DevOps engineers to streamline the collection and analysis of configuration and infrastructure data.

---

## 2. Main Features

### 2.1 Command Line Interface (CLI)
#### Key Commands:
- **Basic Data Collection:**
  ```bash
  ./kollect
  ```
- **Targeted Platform Collection:**
  ```bash
  ./kollect -inventory aws -browser
  ./kollect -inventory veeam -output data.json
  ```
- **Flags:**
  - `-storage`: Collect only storage-related data.
  - `-kubeconfig`: Specify a kubeconfig file.
  - `-browser`: Launch the web interface.
  
#### Functionality:
- Commands allow flexible and targeted data collection.
- Uses secure password handling and environment variables for credentials.

### 2.2 Web Interface
#### Functionality:
- **Static File Serving:**
  Serves a web-based UI for visualizing collected data.
- **API Endpoints:**
  - `/api/data`: Returns collected data.
  - `/api/import`: Allows data import from external sources.
  - `/api/switch`: Switches between data sources dynamically.
- **Interactive Features:**
  - Prompts users for missing credentials.
  - Displays data visualization interactively.

### 2.3 Output Handling
#### Flexible Output Methods:
- **File Output:** Saves formatted JSON data to a specified file.
- **Console Output:** Displays formatted JSON data in the terminal.
- **Web Interface:** Provides a web-based visualization of the collected data.

### 2.4 Security Features
- Secure password input handling.
- Environment variable support for sensitive credentials.
- Mutex-protected data access to ensure thread safety in the web server.

---

## 3. Architecture Notes
### Modular Design:
- Separate packages for each data source (e.g., `aws`, `azure`, `veeam`).
- Clear separation of concerns:
  - Data collection.
  - Output handling.
  - Web serving.

### Extensibility:
- Adding new platforms is straightforward due to the modular structure.
- Flexible data structures using `interface{}`.
- API-first approach ensures easy integration with external tools.

### Error Handling:
- Comprehensive error checking with clear, user-friendly error messages.
- Graceful failure handling to ensure stability.

---

## 4. Key Scenarios
1. **Basic Kubernetes Data Collection:**
   ```bash
   ./kollect
   ```
2. **AWS Data Collection with Web Interface:**
   ```bash
   ./kollect -inventory aws -browser
   ```
3. **Veeam Data Export:**
   ```bash
   ./kollect -inventory veeam -output veeam-data.json
   ```

---

# Rules and Guidelines for AI Code Generation

## 1. Code Structure Rules
- **Modular Code:** Each platform (e.g., `aws`, `azure`, `veeam`) must have its own package.
- **API Endpoints:** Should follow RESTful principles and be documented clearly.
- **Thread Safety:** All web server components must use mutex locks for shared resources.

## 2. Data Handling
- **Interfaces:** Use Go interfaces to maintain flexibility.
- **Error Handling:** Always check and handle errors gracefully.
- **Output Formatting:** Ensure JSON output is always properly formatted and validated.

## 3. Security Guidelines
- **Credential Handling:**
  - Always use secure password input or environment variables.
  - Never hardcode credentials.
- **Concurrency Safety:**
  - Use mutex locks for shared resources in the web server.

## 4. Web Interface Guidelines
- **Static File Serving:** All files should be served from a predefined `web` directory.
- **Dynamic API:** All dynamic data interactions must go through the `/api/*` endpoints.
- **Data Visualization:** Use a lightweight JavaScript library for visualizations.

## 5. CLI Guidelines
- **Flags and Options:**
  - Must follow the standard Go `flag` package conventions.
  - Provide meaningful help messages for each flag.
- **Interactive Prompts:** Prompt for missing credentials or configuration values dynamically.

## 6. Error Handling Rules
- **User-Friendly Errors:** Ensure all errors are clear and actionable.
- **Graceful Recovery:** The application must not crash on unhandled exceptions; log errors and continue running wherever possible.

---

