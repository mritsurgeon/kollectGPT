package azure

import (
	"context"
	"fmt"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore/policy"
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
)

// CheckCredentials validates Azure credentials and returns the config and any error
func CheckCredentials(ctx context.Context, tenantID, clientID, clientSecret string) (interface{}, error) {
	if tenantID == "" || clientID == "" || clientSecret == "" {
		return nil, fmt.Errorf("azure tenant ID, client ID, and client secret are required")
	}

	cred, err := azidentity.NewClientSecretCredential(
		tenantID,
		clientID,
		clientSecret,
		nil,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create Azure credentials: %v", err)
	}

	scope := policy.TokenRequestOptions{
		Scopes: []string{"https://management.azure.com/.default"},
	}

	_, err = cred.GetToken(ctx, scope)
	if err != nil {
		return nil, fmt.Errorf("failed to validate Azure credentials: %v", err)
	}

	return cred, nil
}

// ConfigureCredentials sets up Azure credentials for the session
func ConfigureCredentials(tenantID, clientID, clientSecret string) error {
	ctx := context.Background()
	_, err := CheckCredentials(ctx, tenantID, clientID, clientSecret)
	return err
}
