# Feature Additions for KollectGPT

## 1. UI Enhancements

### 1.1 Infrastructure Icons
Each supported infrastructure platform (AWS, Azure, Kubernetes, Veeam) will have a corresponding icon displayed on the web interface.

#### Icon States:
- **Green Glow:** Platform is connected successfully.
- **Red Glow:** Platform connection failed (disconnected).
- **Plain Icon:** Platform is not configured.

#### Interaction:
- **Click on Icon:** Opens a configuration panel for the respective platform.

---

## 2. Platform Configuration Panels

### 2.1 AWS
#### Configuration:
- Prompt for:
  - Access Key ID
  - Secret Access Key
- Validation:
  - Use AWS SDK to validate credentials.
- Integration:
  - Directly connect using SDK after validation.

### 2.2 Azure
#### Configuration:
- Check for Azure CLI installation:
  - If CLI is installed, initiate browser-based Azure login.
  - If CLI is not installed, prompt for:
    - Subscription ID
    - Tenant ID
    - Client ID
    - Client Secret
- Integration:
  - Use Azure SDK for connection.

### 2.3 Kubernetes
#### Configuration:
- Provide two options:
  1. Enter path to kubeconfig file.
  2. Upload kubeconfig file via web interface.
- Validation:
  - Parse the kubeconfig file to ensure it is valid.
- Integration:
  - Use the path or uploaded file to initialize a connection.

### 2.4 Veeam
#### Configuration:
- Prompt for:
  - Veeam Backup Server URL
  - Username
  - Password
- Validation:
  - Test the connection with provided credentials.
- Integration:
  - Connect to the Veeam Backup system upon validation.

---

## 3. AI Chatbot Integration

### 3.1 Overview
Add an AI-powered chatbot integrated with the web interface, powered by LangChain agents with tools. The chatbot will:
- Fetch data dynamically from connected infrastructures based on user prompts.
- Display information directly in the UI or provide downloadable reports.

### 3.2 Features
- **Expandable/Minimizable:** The chatbot will have a UI element to expand or minimize its view.
- **Contextual Inventory Updates:** The chatbot will update the UI's inventory area with responses received from the AI.

### 3.3 Technical Requirements
- **LangChain Integration:**
  - Utilize LangChain agents with tools specific to each platform (e.g., AWS, Azure, Kubernetes, Veeam).
- **Prompt Handling:**
  - Ensure chatbot can interpret natural language queries.
- **Data Retrieval:**
  - Query infrastructure data via platform SDKs or APIs.
  - Format results as JSON or structured tables for UI presentation.
- **Report Generation:**
  - Provide options to download query results as a report.

---

## 4. Miscellaneous Enhancements

### 4.1 UI Improvements
- **Dynamic Updates:**
  - Ensure UI dynamically reflects infrastructure connection status.
- **Error Indicators:**
  - Display error messages or warnings directly on the respective platform's icon if configuration fails.

### 4.2 Security Enhancements
- **Credential Management:**
  - Securely store all credentials using environment variables or encrypted storage.
  - Ensure credentials are never exposed in logs or UI.

---

