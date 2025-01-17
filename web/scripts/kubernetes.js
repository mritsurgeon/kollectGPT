// kubernetes.js

document.addEventListener('htmx:afterSwap', (event) => {
    if (event.detail.target.id === 'hidden-content') {
        try {
            const data = JSON.parse(event.detail.xhr.responseText);
            console.log("Fetched Data:", data); // Debug log
            const content = document.getElementById('content');
            content.innerHTML = ''; // Clear existing content
            
            function createTable(headerText, data, rowTemplate, headers) {
                if (!data || data.length === 0) return;
                const template = document.getElementById('table-template').content.cloneNode(true);
                const table = template.querySelector('table');
                const thead = table.querySelector('thead');
                const headerRow = document.createElement('tr');
                
                headers.forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header;
                    headerRow.appendChild(th);
                });
                
                thead.innerHTML = '';
                thead.appendChild(headerRow);
                
                const tbody = table.querySelector('tbody');
                data.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = rowTemplate(item);
                    tbody.appendChild(row);
                });
                
                content.appendChild(table);
            }
            
            // Process Kubernetes data if it exists
            if (data.kubernetes) {
                console.log("Processing Kubernetes data:", data.kubernetes);
                // Add your table creation calls here
            }
        } catch (error) {
            console.error("Error processing data:", error);
        }
    }
});

function nodeRowTemplate(item) {
    return `<td>${item.Name}</td><td>${item.Roles}</td><td>${item.Age}</td><td>${item.Version}</td><td>${item.OSImage}</td>`;
}

function defaultRowTemplate(item) {
    return `<td>${item}</td>`;
}

function podRowTemplate(item) {
    return `<td>${item.Name}</td><td>${item.Namespace}</td><td>${item.Status}</td>`;
}

function deploymentRowTemplate(item) {
    return `<td>${item.Name}</td><td>${item.Namespace}</td><td>${item.Containers.join(', ')}</td><td>${item.Images.join(', ')}</td>`;
}

function stsRowTemplate(item) {
    return `<td>${item.Name}</td><td>${item.Namespace}</td><td>${item.ReadyReplicas}</td><td>${item.Image}</td>`;
}

function serviceRowTemplate(item) {
    return `<td>${item.Name}</td><td>${item.Namespace}</td><td>${item.Type}</td><td>${item.ClusterIP}</td><td>${item.Ports}</td>`;
}

function perVolRowTemplate(item) {
    return `<td>${item.Name}</td><td>${item.Capacity}</td><td>${item.AccessModes}</td><td>${item.Status}</td><td>${item.AssociatedClaim}</td><td>${item.StorageClass}</td><td>${item.VolumeMode}</td>`;
}

function perVolClaimRowTemplate(item) {
    return `<td>${item.Name}</td><td>${item.Namespace}</td><td>${item.Status}</td><td>${item.Volume}</td><td>${item.Capacity}</td><td>${item.AccessMode}</td><td>${item.StorageClass}</td>`;
}

function storageClassRowTemplate(item) {
    return `<td>${item.Name}</td><td>${item.Provisioner}</td><td>${item.VolumeExpansion}</td>`;
}

function volSnapshotClassRowTemplate(item) {
    return `<td>${item.Name}</td><td>${item.Driver}</td>`;
}

function volumeSnapshotRowTemplate(item) {
    return `<td>${item.Name}</td><td>${item.Namespace}</td><td>${item.Volume}</td><td>${item.CreationTimestamp}</td><td>${item.RestoreSize}</td><td>${item.Status}</td>`;
}