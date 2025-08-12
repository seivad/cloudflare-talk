# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go files
COPY main.go .

# Initialize module and build
RUN go mod init vote-exporter && \
    go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o vote-exporter .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/vote-exporter .

# Environment variables
ENV R2_ENDPOINT=""
ENV R2_ACCESS_KEY=""
ENV R2_SECRET_KEY=""
ENV R2_BUCKET="tech-talk-assets"
ENV STATUS_WEBHOOK=""

# Run the binary
CMD ["./vote-exporter"]