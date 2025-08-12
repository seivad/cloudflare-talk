# Container Demo for Cloudflare Tech Talk

This container demonstrates how to use Cloudflare Workers with containers for heavy processing tasks.

## What it does

The container simulates a vote export process:
1. **Finding** - Searches for vote data files
2. **Zipping** - Compresses the data into a ZIP archive
3. **Uploading** - Uploads to R2 storage
4. **Done** - Completes the process

## Building the Container

```bash
# Build locally
docker build -t vote-exporter .

# Run locally
docker run --rm \
  -e STATUS_WEBHOOK=http://host.docker.internal:8787/container/status \
  vote-exporter
```

## Deploying to Cloudflare

This container can be deployed to Cloudflare Workers using the Container runtime:

1. Build and push to a registry
2. Configure in your Worker
3. Invoke from your Worker code

## Environment Variables

- `R2_ENDPOINT` - R2 API endpoint
- `R2_ACCESS_KEY` - R2 access key
- `R2_SECRET_KEY` - R2 secret key
- `R2_BUCKET` - R2 bucket name
- `STATUS_WEBHOOK` - Webhook URL for status updates

## Testing

The container includes simulation mode for testing without actual R2 credentials.
Status updates are sent to the webhook URL in real-time, allowing the presentation
to show live progress.