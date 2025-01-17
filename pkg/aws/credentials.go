package aws

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
)

// GetCredentials validates AWS credentials and returns the config and any error
func GetCredentials(ctx context.Context, accessKey, secretKey string) (interface{}, error) {
	if accessKey == "" || secretKey == "" {
		return nil, fmt.Errorf("AWS access key and secret key are required")
	}

	provider := credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithCredentialsProvider(provider),
		config.WithRegion("us-east-1"),
	)

	if err != nil {
		return nil, fmt.Errorf("failed to validate AWS credentials: %v", err)
	}

	return cfg, nil
}

// ConfigureCredentials sets up AWS credentials for the session
func ConfigureCredentials(accessKey, secretKey string) error {
	ctx := context.Background()
	_, err := GetCredentials(ctx, accessKey, secretKey)
	return err
}
