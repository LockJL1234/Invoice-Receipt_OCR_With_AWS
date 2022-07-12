import io
import json
import csv
import pandas as pd

#function to upload file to S3 bucket
def upload_to_s3(s3_client, csv_buffer, BUCKET_NAME, key):
    s3_client.put_object(Body=csv_buffer.getvalue(), Bucket=BUCKET_NAME, Key=key)
    
#function to retrieve data from Textract result/response
def retrieve_data(response):
    extractedText = {'summary': {}, 'lineItem' : []}

    for expense_doc in response["ExpenseDocuments"]:
        for summary_field in expense_doc["SummaryFields"]:
            #get key-value pair of summary item
            if summary_field.get("Type")["Text"] == 'OTHER':
                extractedText['summary'][summary_field.get("LabelDetection")["Text"]] = summary_field.get("ValueDetection")["Text"]
            else:
                extractedText['summary'][summary_field.get("Type")["Text"]] = summary_field.get("ValueDetection")["Text"]
        
        for line_item_group in expense_doc["LineItemGroups"]:
            for line_items in line_item_group["LineItems"]:
                lineItemRow = {}  
                for expense_fields in line_items["LineItemExpenseFields"]:
                    if expense_fields.get("Type")["Text"] != 'EXPENSE_ROW':
                        #get key-value pair of line item
                        if expense_fields.get("Type")["Text"] != 'OTHER':
                            lineItemRow[expense_fields.get("Type")["Text"]] = expense_fields.get("ValueDetection")["Text"]
                        else:
                            lineItemRow[expense_fields.get(
                                "LabelDetection")["Text"]] = expense_fields.get("ValueDetection")["Text"]
                extractedText['lineItem'].append(lineItemRow)
    
    return extractedText

#function to extract information from image (sync )
def image_extract(textract_client, s3BucketName, documentName):
    # Call Amazon Textract
    response = textract_client.analyze_expense(
        Document={
            'S3Object': {
                'Bucket': s3BucketName,
                'Name': documentName
            }
        })
    
    extractedText = retrieve_data(response)
    return extractedText
    
#function to upload csv files with summary item and line item data to S3 bucket
def save_to_csv_file(extractedText, s3_client, BUCKET_NAME, key):
    #convert JSON(dict) type to datafarme
    lineItem_df = pd.DataFrame.from_dict(extractedText['lineItem']) 
    summary_df = pd.DataFrame.from_dict(extractedText['summary'], orient='index') 
    
    #write dataframe to string input/output stream
    csv_buffer = io.StringIO()
    summary_df.to_csv(csv_buffer, header=False)
    #upload string input/output stream as csv file to S3 bucket
    upload_to_s3(s3_client, csv_buffer, BUCKET_NAME, f'{key}_summary.csv')
    
    csv_buffer = io.StringIO()
    lineItem_df.to_csv(csv_buffer, index = False, header=True)
    upload_to_s3(s3_client, csv_buffer, BUCKET_NAME, f'{key}_lineItem.csv')
    
"""
function below is AWS textract asynchronous operations (only for PDF file)

"start_expense_analysis" method to start async Textract job; "get_expense_analysis" to get result
"""

#function to start asynchronous Textract job
def start_job(client, s3_bucket_name, object_name):
    response = None
    response = client.start_expense_analysis(
        DocumentLocation={
            'S3Object': {
                'Bucket': s3_bucket_name,
                'Name': object_name
            }})

    return response["JobId"]

#function to check if async Textract job is done
def is_job_complete(client, job_id):
    response = client.get_expense_analysis(JobId=job_id)
    status = response["JobStatus"]  

    while(status == "IN_PROGRESS"):
        response = client.get_expense_analysis(JobId=job_id)
        status = response["JobStatus"]
    return status

#function to get Textract result (pdf file)
def get_job_results(client, job_id):
    pages = []
    response = client.get_expense_analysis(JobId=job_id)
    pages.append(response)
    next_token = None
    # "NextToken" represents ID of next page (will be "None" if there is only a single page)
    if 'NextToken' in response:
        next_token = response['NextToken']

    while next_token:
        response = client.get_expense_analysis(JobId=job_id, NextToken=next_token)
        pages.append(response)
        next_token = None
        if 'NextToken' in response:
            next_token = response['NextToken']
    return pages

#function of extract information from PDF file    
def pdf_extract(textract_client, s3BucketName, documentName):
    job_id = start_job(textract_client, s3BucketName, documentName)
    if is_job_complete(textract_client, job_id):
        response = get_job_results(textract_client, job_id)
    
    for pages in response:
        extractedText = retrieve_data(pages)
    return extractedText

