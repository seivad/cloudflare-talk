package main

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

// Status represents the current processing status
type Status struct {
	Step    string `json:"step"`
	Message string `json:"message"`
	Progress int   `json:"progress"`
}

// VoteExport represents exported vote data
type VoteExport struct {
	PollID    string    `json:"pollId"`
	OptionID  string    `json:"optionId"`
	UserID    string    `json:"userId"`
	Timestamp time.Time `json:"timestamp"`
}

func main() {
	// Get configuration from environment
	r2Endpoint := os.Getenv("R2_ENDPOINT")
	r2AccessKey := os.Getenv("R2_ACCESS_KEY")
	r2SecretKey := os.Getenv("R2_SECRET_KEY")
	r2Bucket := os.Getenv("R2_BUCKET")
	statusWebhook := os.Getenv("STATUS_WEBHOOK")

	// Default values for local testing
	if r2Endpoint == "" {
		r2Endpoint = "http://localhost:8787/r2"
	}
	if statusWebhook == "" {
		statusWebhook = "http://localhost:8787/container/status"
	}

	log.Println("Starting vote export container...")

	// Step 1: Finding files
	updateStatus(statusWebhook, Status{
		Step:     "finding",
		Message:  "Searching for vote data files...",
		Progress: 10,
	})
	time.Sleep(1 * time.Second)

	// Simulate finding vote files
	voteFiles := findVoteFiles()
	log.Printf("Found %d vote files\n", len(voteFiles))

	// Step 2: Zipping
	updateStatus(statusWebhook, Status{
		Step:     "zipping",
		Message:  fmt.Sprintf("Compressing %d files...", len(voteFiles)),
		Progress: 40,
	})
	time.Sleep(2 * time.Second)

	// Create ZIP file
	zipData, err := createZipFile(voteFiles)
	if err != nil {
		updateStatus(statusWebhook, Status{
			Step:     "error",
			Message:  fmt.Sprintf("Error creating zip: %v", err),
			Progress: 0,
		})
		log.Fatal(err)
	}
	log.Printf("Created ZIP file: %d bytes\n", len(zipData))

	// Step 3: Uploading
	updateStatus(statusWebhook, Status{
		Step:     "uploading",
		Message:  "Uploading to R2 storage...",
		Progress: 70,
	})
	time.Sleep(1 * time.Second)

	// Upload to R2 (simulated)
	if err := uploadToR2(r2Endpoint, r2Bucket, zipData); err != nil {
		updateStatus(statusWebhook, Status{
			Step:     "error",
			Message:  fmt.Sprintf("Error uploading: %v", err),
			Progress: 0,
		})
		log.Fatal(err)
	}

	// Step 4: Done
	updateStatus(statusWebhook, Status{
		Step:     "done",
		Message:  "Export complete!",
		Progress: 100,
	})

	log.Println("Vote export completed successfully!")
}

func findVoteFiles() []VoteExport {
	// Simulate finding vote data
	// In production, this would query the database or scan R2
	votes := []VoteExport{}
	
	for i := 0; i < 100; i++ {
		votes = append(votes, VoteExport{
			PollID:    fmt.Sprintf("poll-%d", i/10),
			OptionID:  fmt.Sprintf("option-%d", i%3),
			UserID:    fmt.Sprintf("user-%d", i),
			Timestamp: time.Now().Add(-time.Duration(i) * time.Minute),
		})
	}
	
	return votes
}

func createZipFile(votes []VoteExport) ([]byte, error) {
	buf := new(bytes.Buffer)
	w := zip.NewWriter(buf)

	// Add summary file
	summaryFile, err := w.Create("summary.json")
	if err != nil {
		return nil, err
	}
	
	summary := map[string]interface{}{
		"exportDate": time.Now(),
		"totalVotes": len(votes),
		"format":     "json",
	}
	
	if err := json.NewEncoder(summaryFile).Encode(summary); err != nil {
		return nil, err
	}

	// Add votes data
	votesFile, err := w.Create("votes.json")
	if err != nil {
		return nil, err
	}
	
	if err := json.NewEncoder(votesFile).Encode(votes); err != nil {
		return nil, err
	}

	// Add CSV version
	csvFile, err := w.Create("votes.csv")
	if err != nil {
		return nil, err
	}
	
	csvContent := "PollID,OptionID,UserID,Timestamp\n"
	for _, vote := range votes {
		csvContent += fmt.Sprintf("%s,%s,%s,%s\n",
			vote.PollID, vote.OptionID, vote.UserID, vote.Timestamp.Format(time.RFC3339))
	}
	
	if _, err := io.WriteString(csvFile, csvContent); err != nil {
		return nil, err
	}

	if err := w.Close(); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func uploadToR2(endpoint, bucket string, data []byte) error {
	// Simulate R2 upload
	// In production, use AWS SDK with R2 credentials
	
	filename := fmt.Sprintf("exports/votes-%s.zip", time.Now().Format("20060102-150405"))
	url := fmt.Sprintf("%s/%s/%s", endpoint, bucket, filename)
	
	log.Printf("Uploading to: %s\n", url)
	
	// For demo purposes, just simulate the upload
	// In production:
	// - Use AWS SDK v2 with R2 credentials
	// - Or use HTTP PUT with presigned URL
	
	return nil
}

func updateStatus(webhook string, status Status) {
	if webhook == "" {
		log.Printf("Status update: %+v\n", status)
		return
	}

	body, err := json.Marshal(status)
	if err != nil {
		log.Printf("Error marshaling status: %v\n", err)
		return
	}

	resp, err := http.Post(webhook, "application/json", bytes.NewReader(body))
	if err != nil {
		log.Printf("Error sending status update: %v\n", err)
		return
	}
	defer resp.Body.Close()

	log.Printf("Status updated: %s (progress: %d%%)\n", status.Step, status.Progress)
}