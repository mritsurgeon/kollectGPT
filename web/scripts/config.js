// Configuration panel handling
function showConfigPanel(panelId) {
    // Close any open panels first
    document.querySelectorAll('.config-panel').forEach(panel => {
        panel.style.display = 'none';
    });
    
    // Show the selected panel
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'block';
        // Prevent panel from auto-closing
        panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

function closeConfigPanel(id) {
    const panel = document.getElementById(id);
    if (panel) {
        panel.style.display = 'none';
    }
}

function updateIconStatus(iconId, isConnected) {
    const icon = document.getElementById(iconId);
    if (!icon) return;

    // Remove existing states
    icon.classList.remove('connected', 'disconnected', 'not-configured');
    
    if (isConnected) {
        icon.classList.add('connected');
        icon.onclick = () => confirmDisconnect(iconId.split('-')[0]);
    } else {
        icon.classList.add('disconnected');
        icon.onclick = () => showConfigPanel(`${iconId.split('-')[0]}-config`);
    }
}

// Configuration handlers
async function configureAWS() {
    const accessKey = document.getElementById('aws-access-key').value;
    const secretKey = document.getElementById('aws-secret-key').value;
    
    try {
        const response = await fetch('/api/configure/aws', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accessKey, secretKey })
        });
        
        if (response.ok) {
            updateIconStatus('aws-button', 'connected');
            closeConfigPanel('aws-config');
        } else {
            updateIconStatus('aws-button', 'disconnected');
            alert('Failed to configure AWS');
        }
    } catch (error) {
        console.error('Error configuring AWS:', error);
        updateIconStatus('aws-button', 'disconnected');
    }
}

async function configureKubernetes() {
    const configPath = document.getElementById('kube-config-path').value;
    const configFile = document.getElementById('kube-config-file').files[0];
    
    try {
        let formData = new FormData();
        if (configFile) {
            formData.append('kubeconfig', configFile);
        } else if (configPath) {
            formData.append('configPath', configPath);
        } else {
            alert('Please provide either a kubeconfig file or path');
            return;
        }

        const response = await fetch('/api/configure/kubernetes', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            updateIconStatus('kubernetes-button', 'connected');
            closeConfigPanel('kubernetes-config');
            // Refresh the data display
            location.reload();
        } else {
            const errorData = await response.json();
            updateIconStatus('kubernetes-button', 'disconnected');
            alert(`Failed to configure Kubernetes: ${errorData.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error configuring Kubernetes:', error);
        updateIconStatus('kubernetes-button', 'disconnected');
        alert('Error configuring Kubernetes connection');
    }
}

// Add this function to check connection status on page load
async function checkConnectionStatus() {
    try {
        // Get data from existing endpoint
        const response = await fetch('/api/data');
        const data = await response.json();
        console.log('Data response:', data);

        // Azure check - using AzureVMs and AzureStorageAccounts
        const azureIcon = document.getElementById('azure-button');
        if (data.AzureVMs?.length > 0 || data.AzureStorageAccounts?.length > 0) {
            console.log('Azure is connected - found VMs or Storage Accounts');
            azureIcon.classList.remove('disconnected', 'not-configured');
            azureIcon.classList.add('connected');
            azureIcon.onclick = () => confirmDisconnect('azure');
        } else {
            console.log('Azure is disconnected - no data');
            azureIcon.classList.remove('connected', 'not-configured');
            azureIcon.classList.add('disconnected');
            azureIcon.onclick = () => showConfigPanel('azure-config');
        }

        // AWS check - using EC2Instances and S3Buckets
        const awsIcon = document.getElementById('aws-button');
        if (data.EC2Instances?.length > 0 || data.S3Buckets?.length > 0) {
            console.log('AWS is connected - found EC2 or S3 data');
            awsIcon.classList.remove('disconnected', 'not-configured');
            awsIcon.classList.add('connected');
            awsIcon.onclick = () => confirmDisconnect('aws');
        } else {
            console.log('AWS is disconnected - no data');
            awsIcon.classList.remove('connected', 'not-configured');
            awsIcon.classList.add('disconnected');
            awsIcon.onclick = () => showConfigPanel('aws-config');
        }

        // Kubernetes check - using kubernetes data structure
        const k8sIcon = document.getElementById('kubernetes-button');
        if (data.kubernetes?.pods?.length > 0 || data.kubernetes?.nodes?.length > 0) {
            console.log('Kubernetes is connected - found pods or nodes');
            k8sIcon.classList.remove('disconnected', 'not-configured');
            k8sIcon.classList.add('connected');
            k8sIcon.onclick = () => confirmDisconnect('kubernetes');
        } else {
            console.log('Kubernetes is disconnected - no data');
            k8sIcon.classList.remove('connected', 'not-configured');
            k8sIcon.classList.add('disconnected');
            k8sIcon.onclick = () => showConfigPanel('kubernetes-config');
        }

        // Veeam check - using ServerInfo or BackupJobs
        const veeamIcon = document.getElementById('veeam-button');
        if (data.ServerInfo || data.BackupJobs?.length > 0) {
            console.log('Veeam is connected - found server info or backup jobs');
            veeamIcon.classList.remove('disconnected', 'not-configured');
            veeamIcon.classList.add('connected');
            veeamIcon.onclick = () => confirmDisconnect('veeam');
        } else {
            console.log('Veeam is disconnected - no data');
            veeamIcon.classList.remove('connected', 'not-configured');
            veeamIcon.classList.add('disconnected');
            veeamIcon.onclick = () => showConfigPanel('veeam-config');
        }

    } catch (error) {
        console.error('Error checking connections:', error);
        ['azure', 'aws', 'kubernetes', 'veeam'].forEach(platform => {
            const icon = document.getElementById(`${platform}-button`);
            if (icon) {
                icon.classList.remove('connected', 'not-configured');
                icon.classList.add('disconnected');
                icon.onclick = () => showConfigPanel(`${platform}-config`);
            }
        });
    }
}

async function checkAzureConnection() {
    try {
        const response = await fetch('/api/azure/status');
        const data = await response.json();
        updateIconStatus('azure-button', data.isConnected && data.hasData);
    } catch (error) {
        console.error('Azure check failed:', error);
        updateIconStatus('azure-button', false);
    }
}

async function checkAWSConnection() {
    try {
        const response = await fetch('/api/aws/status');
        const data = await response.json();
        updateIconStatus('aws-button', data.isConnected && data.hasData);
    } catch (error) {
        console.error('AWS check failed:', error);
        updateIconStatus('aws-button', false);
    }
}

async function checkKubernetesConnection() {
    try {
        const response = await fetch('/api/kubernetes/status');
        const data = await response.json();
        updateIconStatus('kubernetes-button', data.isConnected && data.hasData);
    } catch (error) {
        console.error('Kubernetes check failed:', error);
        updateIconStatus('kubernetes-button', false);
    }
}

async function checkVeeamConnection() {
    try {
        const response = await fetch('/api/veeam/status');
        const data = await response.json();
        updateIconStatus('veeam-button', data.isConnected && data.hasData);
    } catch (error) {
        console.error('Veeam check failed:', error);
        updateIconStatus('veeam-button', false);
    }
}

function showDisconnectPanel(platform) {
    if (confirm(`Do you want to disconnect from ${platform}?`)) {
        disconnectPlatform(platform);
    }
}

async function disconnectPlatform(platform) {
    try {
        const response = await fetch(`/api/disconnect/${platform}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const button = document.getElementById(`${platform}-button`);
            button.classList.remove('connected');
            button.classList.add('disconnected');
            button.onclick = () => showConfigPanel(`${platform}-config`);
        }
    } catch (error) {
        console.error(`Error disconnecting ${platform}:`, error);
    }
}

// Call status check on page load
document.addEventListener('DOMContentLoaded', () => {
    checkConnectionStatus();
    // Poll every 30 seconds
    setInterval(checkConnectionStatus, 30000);
});

// Similar functions for Azure, Kubernetes, and Veeam...

// Chatbot functionality
let chatbotMinimized = true;

function toggleChatbot() {
    const chatbot = document.querySelector('.chatbot-container');
    chatbotMinimized = !chatbotMinimized;
    chatbot.classList.toggle('chatbot-minimized', chatbotMinimized);
}

async function sendChatMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    if (!message) return;
    
    input.value = '';
    appendMessage('user', message);
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        appendMessage('assistant', data.response);
        
        if (data.updateUI) {
            // Update the main UI with any new data
            location.reload();
        }
    } catch (error) {
        console.error('Error sending message:', error);
        appendMessage('assistant', 'Sorry, I encountered an error processing your request.');
    }
}

function appendMessage(sender, message) {
    const messagesDiv = document.getElementById('chatbot-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('aws-button').addEventListener('click', () => showConfigPanel('aws-config'));
    document.getElementById('azure-button').addEventListener('click', () => showConfigPanel('azure-config'));
    document.getElementById('kubernetes-button').addEventListener('click', () => showConfigPanel('kubernetes-config'));
    document.getElementById('veeam-button').addEventListener('click', () => showConfigPanel('veeam-config'));
    
    // Check connection status on page load
    checkConnectionStatus();
    
    // Add drag and drop support for kubeconfig file
    const kubeConfigFile = document.getElementById('kube-config-file');
    const dropZone = document.getElementById('kubernetes-config');
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            kubeConfigFile.files = files;
        }
    });
}); 

async function authenticateAzureCLI() {
    try {
        const response = await fetch('/api/check-azure-cli');
        const data = await response.json();
        
        if (!data.installed) {
            alert('Azure CLI is not installed. Please install Azure CLI or use manual authentication.');
            document.getElementById('azure-manual-auth').style.display = 'block';
            return;
        }

        const loginResponse = await fetch('/api/configure/azure-cli', {
            method: 'POST'
        });

        if (loginResponse.ok) {
            updateIconStatus('azure-button', 'connected');
            closeConfigPanel('azure-config');
            await refreshData();
        } else {
            const errorData = await loginResponse.json();
            alert(`Azure CLI login failed: ${errorData.message}`);
            updateIconStatus('azure-button', 'disconnected');
        }
    } catch (error) {
        console.error('Error during Azure CLI authentication:', error);
        alert('Error during Azure CLI authentication. Please try manual authentication.');
        document.getElementById('azure-manual-auth').style.display = 'block';
    }
}

async function configureAzure() {
    const subscriptionId = document.getElementById('azure-subscription').value;
    const tenantId = document.getElementById('azure-tenant').value;
    const clientId = document.getElementById('azure-client').value;
    const clientSecret = document.getElementById('azure-secret').value;

    if (!subscriptionId || !tenantId || !clientId || !clientSecret) {
        alert('Please fill in all Azure credentials');
        return;
    }

    try {
        const response = await fetch('/api/configure/azure', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subscriptionId,
                tenantId,
                clientId,
                clientSecret
            })
        });

        if (response.ok) {
            updateIconStatus('azure-button', 'connected');
            closeConfigPanel('azure-config');
            await refreshData();
        } else {
            const errorData = await response.json();
            alert(`Failed to configure Azure: ${errorData.message}`);
            updateIconStatus('azure-button', 'disconnected');
        }
    } catch (error) {
        console.error('Error configuring Azure:', error);
        alert('Error configuring Azure connection');
        updateIconStatus('azure-button', 'disconnected');
    }
} 

// Add event listener to close panel only when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.config-panel') && !e.target.closest('[id$="-button"]')) {
        closeConfigPanel();
    }
}); 

// Add automatic status checking on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        
        // Update each icon based on status
        updateIconStatus('kubernetes-button', status.kubernetes ? 'connected' : 'disconnected');
        updateIconStatus('aws-button', status.aws ? 'connected' : 'disconnected');
        updateIconStatus('azure-button', status.azure ? 'connected' : 'disconnected');
        updateIconStatus('veeam-button', status.veeam ? 'connected' : 'disconnected');
        
        // Set up periodic status checks
        setInterval(checkConnectionStatus, 30000); // Check every 30 seconds
    } catch (error) {
        console.error('Error checking connection status:', error);
    }
}); 

// Initial check on page load
document.addEventListener('DOMContentLoaded', () => {
    checkConnectionStatus();
    // Poll every 30 seconds
    setInterval(checkConnectionStatus, 30000);
});

async function checkConnectionStatus() {
    try {
        // Get data from existing endpoint
        const response = await fetch('/api/data');
        const data = await response.json();
        console.log('Data response:', data);

        // Azure check - using AzureVMs and AzureStorageAccounts
        const azureIcon = document.getElementById('azure-button');
        if (data.AzureVMs?.length > 0 || data.AzureStorageAccounts?.length > 0) {
            console.log('Azure is connected - found VMs or Storage Accounts');
            azureIcon.classList.remove('disconnected', 'not-configured');
            azureIcon.classList.add('connected');
            azureIcon.onclick = () => confirmDisconnect('azure');
        } else {
            console.log('Azure is disconnected - no data');
            azureIcon.classList.remove('connected', 'not-configured');
            azureIcon.classList.add('disconnected');
            azureIcon.onclick = () => showConfigPanel('azure-config');
        }

        // AWS check - using EC2Instances and S3Buckets
        const awsIcon = document.getElementById('aws-button');
        if (data.EC2Instances?.length > 0 || data.S3Buckets?.length > 0) {
            console.log('AWS is connected - found EC2 or S3 data');
            awsIcon.classList.remove('disconnected', 'not-configured');
            awsIcon.classList.add('connected');
            awsIcon.onclick = () => confirmDisconnect('aws');
        } else {
            console.log('AWS is disconnected - no data');
            awsIcon.classList.remove('connected', 'not-configured');
            awsIcon.classList.add('disconnected');
            awsIcon.onclick = () => showConfigPanel('aws-config');
        }

        // Kubernetes check - using kubernetes data structure
        const k8sIcon = document.getElementById('kubernetes-button');
        if (data.kubernetes?.pods?.length > 0 || data.kubernetes?.nodes?.length > 0) {
            console.log('Kubernetes is connected - found pods or nodes');
            k8sIcon.classList.remove('disconnected', 'not-configured');
            k8sIcon.classList.add('connected');
            k8sIcon.onclick = () => confirmDisconnect('kubernetes');
        } else {
            console.log('Kubernetes is disconnected - no data');
            k8sIcon.classList.remove('connected', 'not-configured');
            k8sIcon.classList.add('disconnected');
            k8sIcon.onclick = () => showConfigPanel('kubernetes-config');
        }

        // Veeam check - using ServerInfo or BackupJobs
        const veeamIcon = document.getElementById('veeam-button');
        if (data.ServerInfo || data.BackupJobs?.length > 0) {
            console.log('Veeam is connected - found server info or backup jobs');
            veeamIcon.classList.remove('disconnected', 'not-configured');
            veeamIcon.classList.add('connected');
            veeamIcon.onclick = () => confirmDisconnect('veeam');
        } else {
            console.log('Veeam is disconnected - no data');
            veeamIcon.classList.remove('connected', 'not-configured');
            veeamIcon.classList.add('disconnected');
            veeamIcon.onclick = () => showConfigPanel('veeam-config');
        }

    } catch (error) {
        console.error('Error checking connections:', error);
        ['azure', 'aws', 'kubernetes', 'veeam'].forEach(platform => {
            const icon = document.getElementById(`${platform}-button`);
            if (icon) {
                icon.classList.remove('connected', 'not-configured');
                icon.classList.add('disconnected');
                icon.onclick = () => showConfigPanel(`${platform}-config`);
            }
        });
    }
}

async function checkAzureConnection() {
    try {
        const response = await fetch('/api/azure/status');
        const data = await response.json();
        updateIconStatus('azure-button', data.isConnected && data.hasData);
    } catch (error) {
        console.error('Azure check failed:', error);
        updateIconStatus('azure-button', false);
    }
}

async function checkAWSConnection() {
    try {
        const response = await fetch('/api/aws/status');
        const data = await response.json();
        updateIconStatus('aws-button', data.isConnected && data.hasData);
    } catch (error) {
        console.error('AWS check failed:', error);
        updateIconStatus('aws-button', false);
    }
}

async function checkKubernetesConnection() {
    try {
        const response = await fetch('/api/kubernetes/status');
        const data = await response.json();
        updateIconStatus('kubernetes-button', data.isConnected && data.hasData);
    } catch (error) {
        console.error('Kubernetes check failed:', error);
        updateIconStatus('kubernetes-button', false);
    }
}

async function checkVeeamConnection() {
    try {
        const response = await fetch('/api/veeam/status');
        const data = await response.json();
        updateIconStatus('veeam-button', data.isConnected && data.hasData);
    } catch (error) {
        console.error('Veeam check failed:', error);
        updateIconStatus('veeam-button', false);
    }
}

function confirmDisconnect(platform) {
    if (confirm(`Do you want to disconnect from ${platform}?`)) {
        disconnectPlatform(platform);
    }
}

async function disconnectPlatform(platform) {
    try {
        const response = await fetch(`/api/disconnect/${platform}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const button = document.getElementById(`${platform}-button`);
            button.classList.remove('connected');
            button.classList.add('disconnected');
            button.onclick = () => showConfigPanel(`${platform}-config`);
        }
    } catch (error) {
        console.error(`Error disconnecting ${platform}:`, error);
    }
} 