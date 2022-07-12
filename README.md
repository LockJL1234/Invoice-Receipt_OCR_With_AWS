# Invoice/Receipt OCR with AWS

### This is a simple React web application with an Invoice/Receipt OCR feature built into the web application.

The Invoice/Receipt OCR feature is developed using Amazon Web Services (AWS). There are a total of **4** services that are used in order to developed the Invoice/Receipt OCR feature.

Below are the services that are involved in developing the Invoice/Receipt OCR feature:-
- **Amazon S3**: It is responsible for storing the image file of the invoice/receipt as well as the generated CSV files which contain the extracted information in key-value pair form. AWS S3 service stores files as objects in a container that is called a bucket.
- **Amazon Textract**: It is the machine learning (ML) service that is responsible for extracting text, handwritten text, and data from a scanned document.
- **Amazon Lambda**: It is a serverless, event-driven compute service that lets you run code for virtually any type of application or backend service without provisioning or managing servers. There will be 2 different functions hosted by Amazon Lambda which are the function to upload the image to Amazon S3 bucket and the function to analyze the invoice/receipt file and extracts information from it using AWS Textract.
- **Amazon API Gateway**: A REST API was created using Amazon API Gateway to create a communication link with the Lambda functions to upload the invoice/receipt file to the S3 bucket and retrieve the processed JSON object that contains the extracted information from the invoice/receipt file. 

The Invoice/Receipt file (JPG, PNG, PDF filetype) will first be uploaded to the website. Then, the image will then be uploaded to the Amazon S3 bucket by calling the upload function from Amazon Lambda through the API. After the Invoice/Receipt file is successfully uploaded, the textract function from Amazon Lambda will be called through the API to analyze the Invoice/Receipt file and extract  information from the file. Lastly, the extracted information will be send back to the web application and the extracted information will be displayed on the web application.

**NOTE: Cross-Origin Resource Sharing (CORS)** must be enabled in order for the application to request the resource which is the Lambda function that returns the JSON object with the extracted information and uploads the CSV files to the S3 bucket.
