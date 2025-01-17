package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"

	"github.com/michaelcade/kollect/pkg/aws"
	"github.com/michaelcade/kollect/pkg/azure"
	"github.com/michaelcade/kollect/pkg/kollect"
	"github.com/michaelcade/kollect/pkg/veeam"
)

var (
	dataMutex sync.Mutex
	data      interface{}
)

func main() {
	storageOnly := flag.Bool("storage", false, "Collect only storage-related objects (Kubernetes Only)")
	kubeconfig := flag.String("kubeconfig", filepath.Join(os.Getenv("HOME"), ".kube", "config"), "Path to the kubeconfig file")
	browser := flag.Bool("browser", false, "Open the web interface in a browser")
	output := flag.String("output", "", "Output file to save the collected data")
	inventoryType := flag.String("inventory", "kubernetes", "Type of inventory to collect (kubernetes/aws/azure/veeam)")
	baseURL := flag.String("veeam-url", "", "Veeam server URL")
	username := flag.String("veeam-username", "", "Veeam username")
	password := flag.String("veeam-password", "", "Veeam password")
	help := flag.Bool("help", false, "Show help message")
	flag.Parse()
	if *help {
		fmt.Println("Usage: kollect [flags]")
		fmt.Println("Flags:")
		flag.PrintDefaults()
		fmt.Println("\nTo pretty-print JSON output, you can use `jq`:")
		fmt.Println("  ./kollect | jq")
		return
	}

	ctx := context.Background()

	// Don't fail if kubeconfig is missing
	if *kubeconfig == "" {
		*kubeconfig = os.Getenv("KUBECONFIG")
	}

	// Collect data based on inventory type
	var err error
	switch *inventoryType {
	case "aws":
		data, err = aws.CollectAWSData(ctx)
	case "azure":
		data, err = azure.CollectAzureData(ctx)
	case "kubernetes":
		data, err = collectData(ctx, *storageOnly, *kubeconfig)
	case "veeam":
		if *baseURL == "" || *username == "" || *password == "" {
			log.Fatal("Veeam URL, username, and password must be provided for Veeam inventory")
		}
		data, err = veeam.CollectVeeamData(ctx, *baseURL, *username, *password)
	default:
		log.Fatalf("Unsupported inventory type: %s", *inventoryType)
	}

	if err != nil {
		log.Printf("Warning: Error collecting data: %v", err)
		data = struct{}{}
	}

	if *output != "" {
		err = saveToFile(data, *output)
		if err != nil {
			log.Printf("Warning: Error saving data to file: %v", err)
		} else {
			fmt.Printf("Data saved to %s\n", *output)
		}
	}

	if *browser {
		startWebServer(data, *baseURL, *username, *password)
	} else {
		printData(data)
	}
}

func collectData(ctx context.Context, storageOnly bool, kubeconfig string) (interface{}, error) {
	data := struct {
		Kubernetes interface{} `json:"kubernetes,omitempty"`
		AWS        interface{} `json:"aws,omitempty"`
		Azure      interface{} `json:"azure,omitempty"`
		Veeam      interface{} `json:"veeam,omitempty"`
	}{}

	// Even if kubeconfig is empty, return the empty structure
	if kubeconfig != "" {
		if storageOnly {
			k8sData, err := kollect.CollectStorageData(ctx, kubeconfig)
			if err == nil {
				data.Kubernetes = k8sData
			} else {
				log.Printf("Warning: Could not collect Kubernetes data: %v", err)
			}
		} else {
			k8sData, err := kollect.CollectData(ctx, kubeconfig)
			if err == nil {
				data.Kubernetes = k8sData
			} else {
				log.Printf("Warning: Could not collect Kubernetes data: %v", err)
			}
		}
	}

	return data, nil
}

func saveToFile(data interface{}, filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	prettyData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}

	_, err = file.Write(prettyData)
	return err
}

func printData(data interface{}) {
	prettyData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		log.Fatalf("Error formatting data: %v", err)
	}
	fmt.Println(string(prettyData))
}

func startWebServer(data interface{}, baseURL, username, password string) {
	// Initialize empty data structure if nil
	if data == nil {
		data = struct {
			Kubernetes interface{} `json:"kubernetes,omitempty"`
			AWS        interface{} `json:"aws,omitempty"`
			Azure      interface{} `json:"azure,omitempty"`
			Veeam      interface{} `json:"veeam,omitempty"`
		}{
			Kubernetes: nil,
			AWS:        nil,
			Azure:      nil,
			Veeam:      nil,
		}
	}

	// Check if web directory exists
	webDir := "web"
	if _, err := os.Stat(webDir); os.IsNotExist(err) {
		log.Fatalf("Error: Web directory '%s' not found", webDir)
	}

	// Create a file server with proper redirect handling
	fs := http.FileServer(http.Dir(webDir))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Request: %s %s", r.Method, r.URL.Path)

		// Handle root path directly
		if r.URL.Path == "/" {
			http.ServeFile(w, r, filepath.Join(webDir, "index.html"))
			return
		}

		// Remove potential redirect loops by cleaning the path
		r.URL.Path = filepath.Clean(r.URL.Path)
		fs.ServeHTTP(w, r)
	})

	http.HandleFunc("/api/data", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		dataMutex.Lock()
		defer dataMutex.Unlock()

		log.Printf("Serving data: %+v", data)
		err := json.NewEncoder(w).Encode(data)
		if err != nil {
			log.Printf("Error encoding data: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})

	http.HandleFunc("/api/import", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}
		var importedData interface{}
		err := json.NewDecoder(r.Body).Decode(&importedData)
		if err != nil {
			log.Printf("Error decoding imported data: %v", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		dataMutex.Lock()
		data = importedData
		dataMutex.Unlock()
		w.WriteHeader(http.StatusOK)
		err = json.NewEncoder(w).Encode(map[string]string{"status": "success"})
		if err != nil {
			log.Printf("Error encoding response: %v", err)
		}
	})

	http.HandleFunc("/api/switch", func(w http.ResponseWriter, r *http.Request) {
		inventoryType := r.URL.Query().Get("type")
		ctx := context.Background()
		var err error
		switch inventoryType {
		case "aws":
			data, err = aws.CollectAWSData(ctx)
		case "azure":
			data, err = azure.CollectAzureData(ctx)
		case "kubernetes":
			data, err = collectData(ctx, false, filepath.Join(os.Getenv("HOME"), ".kube", "config"))
		case "google":
			// Placeholder for Google Cloud data collection
			data = map[string]string{"message": "Google Cloud data collection not implemented yet"}
		case "veeam":
			if baseURL == "" || username == "" || password == "" {
				http.Error(w, "Veeam URL, username, and password must be provided", http.StatusBadRequest)
				return
			}
			data, err = veeam.CollectVeeamData(ctx, baseURL, username, password)
		default:
			http.Error(w, "Invalid inventory type", http.StatusBadRequest)
			return
		}
		if err != nil {
			log.Printf("Error collecting data: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		err = json.NewEncoder(w).Encode(map[string]string{"status": "success"})
		if err != nil {
			log.Printf("Error encoding response: %v", err)
		}
	})

	http.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		status := struct {
			AWS        bool `json:"aws"`
			Azure      bool `json:"azure"`
			Kubernetes bool `json:"kubernetes"`
			Veeam      bool `json:"veeam"`
		}{
			AWS:        checkAWSConnection(),
			Azure:      checkAzureConnection(),
			Kubernetes: checkKubernetesConnection(),
			Veeam:      checkVeeamConnection(),
		}

		json.NewEncoder(w).Encode(status)
	})

	http.HandleFunc("/api/configure/aws", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var creds struct {
			AccessKeyID     string `json:"accessKeyId"`
			SecretAccessKey string `json:"secretAccessKey"`
		}

		if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Set AWS credentials
		if err := aws.ConfigureCredentials(creds.AccessKeyID, creds.SecretAccessKey); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "AWS credentials configured successfully",
			"status":  "success",
		})
	})

	http.HandleFunc("/api/configure/azure", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var creds struct {
			TenantID     string `json:"tenantId"`
			ClientID     string `json:"clientId"`
			ClientSecret string `json:"clientSecret"`
		}

		if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
			http.Error(w, "Invalid credential format", http.StatusBadRequest)
			return
		}

		if err := azure.ConfigureCredentials(creds.TenantID, creds.ClientID, creds.ClientSecret); err != nil {
			http.Error(w, fmt.Sprintf("Failed to configure Azure: %v", err), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Azure credentials configured successfully",
			"status":  "success",
		})
	})

	http.HandleFunc("/api/check-azure-cli", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		cmd := exec.Command("az", "--version")
		if err := cmd.Run(); err != nil {
			json.NewEncoder(w).Encode(map[string]bool{"installed": false})
			return
		}

		json.NewEncoder(w).Encode(map[string]bool{"installed": true})
	})

	http.HandleFunc("/api/configure/azure-cli", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		cmd := exec.Command("az", "login")
		output, err := cmd.CombinedOutput()

		if err != nil {
			log.Printf("Azure CLI login error: %v\nOutput: %s", err, string(output))
			http.Error(w, "Failed to login with Azure CLI", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Azure CLI login successful",
			"status":  "success",
		})
	})

	log.Printf("Starting web server on http://localhost:8080")
	log.Printf("Serving files from directory: %s", webDir)

	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func checkAWSConnection() bool {
	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")
	_, err := aws.GetCredentials(context.Background(), accessKey, secretKey)
	return err == nil
}

func checkAzureConnection() bool {
	tenantID := os.Getenv("AZURE_TENANT_ID")
	clientID := os.Getenv("AZURE_CLIENT_ID")
	clientSecret := os.Getenv("AZURE_CLIENT_SECRET")
	_, err := azure.CheckCredentials(context.Background(), tenantID, clientID, clientSecret)
	return err == nil
}

func checkKubernetesConnection() bool {
	kubeconfig := filepath.Join(os.Getenv("HOME"), ".kube", "config")
	_, err := kollect.CollectData(context.Background(), kubeconfig)
	return err == nil
}

func checkVeeamConnection() bool {
	baseURL := os.Getenv("VEEAM_URL")
	username := os.Getenv("VEEAM_USERNAME")
	password := os.Getenv("VEEAM_PASSWORD")
	_, err := veeam.CollectVeeamData(context.Background(), baseURL, username, password)
	return err == nil
}
