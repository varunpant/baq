package main

//https://github.com/GoogleCloudPlatform/google-cloud-go/blob/master/bigquery/examples_test.go
//https://github.com/GoogleCloudPlatform/golang-samples/blob/master/bigquery/snippets/snippet.go
import (
	"context"
	"fmt"

	"cloud.google.com/go/bigquery"
	"google.golang.org/api/iterator"
)

const (
	projectID = "broguruengine"
)

func main() {
	getStations()
	getAQData()
}
func getStations() {
	ctx := context.Background()
	client, err := getBQClient(ctx)
	if err != nil {
		panic(err)
	}

	query := "select * from `bigquery-public-data.openaq.global_air_quality` where country = 'IN'"
	it, err := getQueryResults(ctx, query, client)

	for {
		var values []bigquery.Value
		err := it.Next(&values)
		if err == iterator.Done {
			break
		}
		if err != nil {
			// TODO: Handle error.
		}
		fmt.Println(values)
	}
}
func getAQData() {
	ctx := context.Background()
	client, err := getBQClient(ctx)
	if err != nil {
		panic(err)
	}

	query := "select * from `bigquery-public-data.openaq.global_air_quality` where country = 'IN'"
	it, err := getQueryResults(ctx, query, client)

	for {
		var values []bigquery.Value
		err := it.Next(&values)
		if err == iterator.Done {
			break
		}
		if err != nil {
			// TODO: Handle error.
		}
		fmt.Println(values)
	}
}

func getBQClient(ctx context.Context) (*bigquery.Client, error) {

	client, err := bigquery.NewClient(ctx, projectID)
	if err != nil {
		return nil, err
	}
	return client, nil
}

func getQueryResults(ctx context.Context, query string, client *bigquery.Client) (*bigquery.RowIterator, error) {
	q := client.Query(query)
	it, err := q.Read(ctx)
	if err != nil {
		return nil, err
	}
	return it, nil
}
