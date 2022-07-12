import React, { Component } from "react";
import FileBase64 from "react-file-base64";
import { Button, Form, FormGroup, Label, FormText, Input } from "reactstrap";

import "./Upload.css";

class Upload extends Component {
  constructor(props) {
    super(props);

    this.state = {
      confirmation: "",
      isLoading: "",
      files: "",
      invoiceNo: "",
      totalAmount: "",
      invoiceDate: "",
      vendor: "",
      description: "",
      fileURL: "",
      tax: "",
      currency: "",
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    event.preventDefault();
    this.setState({
      name: event.target.value,
    });
  }

  async handleSubmit(event) {
    event.preventDefault();
    this.setState({ confirmation: "Uploading..." });
  }

  async getFiles(files) {
    const img_base64 = files[0];
    this.setState(
      {
        isLoading: "Extracting data",
        files: files,
        fileURL: URL.createObjectURL(files[0].file),
      }
    );

    var fileName = files[0].name;
    const UID = Math.round(1 + Math.random() * (1000000 - 1));

    var date = {
      fileExt: fileName.slice(fileName.lastIndexOf(".") + 1, fileName.length),
      imageName:
        fileName.slice(0, fileName.lastIndexOf(".")) + "_" + UID.toString(),
      folder: "upload/",
      img: img_base64,
    };

    this.setState({ confirmation: "Processing..." });
    console.log("Status: Processing...")
    await fetch(
      "YOUR_AMAZON_S3_FILE_UPLOAD_LAMBDA_API",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application.json",
        },
        body: JSON.stringify(date),
      }
    );

    let targetImage = [
      fileName.slice(0, fileName.lastIndexOf(".")),
      "_",
      UID,
      fileName.slice(fileName.lastIndexOf("."), fileName.length),
    ].join("");

    console.log("File name: ", targetImage);

    
    const response = await fetch(
      "YOUR_TEXTRACT_LAMBDA_API",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application.json",
        },
        body: JSON.stringify(targetImage),
      }
    );

    this.setState({ confirmation: "Complete" });
    console.log("Status: Complete!")

    const OCRBody = await response.json();
    console.log("OCRBody: ", OCRBody);

    let totalAmt = OCRBody.body["summary"]["TOTAL"];
    const curr = totalAmt.replace(/[\d\s.,]/g, "");

    this.setState({
      vendor: OCRBody.body["summary"]["VENDOR_NAME"],
      totalAmount: totalAmt,
      invoiceNo: OCRBody.body["summary"]["INVOICE_RECEIPT_ID"],
      invoiceDate: OCRBody.body["summary"]["INVOICE_RECEIPT_DATE"],
      tax: OCRBody.body["summary"]["TAX"],
      currency: curr,
    });
  }

  render() {
    const processing = "Pocessing Document...";
    return (
      <div className="row">
        <div className="col-6 offset-3">
          <Form onSubmit={this.handleSubmit}>
            <FormGroup>
              <h3 className="text-danger">{processing}</h3>
              <h6>Upload Invoice</h6>
              <FormText color="muted">PNG, JPG, PDF</FormText>

              <div className="form-group files color">
                <FileBase64
                  type="file"
                  multiple={true}
                  onDone={this.getFiles.bind(this)}
                />
                <img src={this.state.fileURL} alt="" width="400" height="500" />
              </div>
            </FormGroup>

            <FormGroup>
              <Label>
                <h6>Receipt/Invoice No.</h6>
              </Label>
              <Input
                type="text"
                name="Invoice"
                id="Invoice"
                required
                defaultValue={this.state.invoiceNo}
                onChange={this.handleChange}
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <h6>Invoice Date</h6>
              </Label>
              <Input
                type="text"
                name="Date"
                id="Date"
                required
                defaultValue={this.state.invoiceDate}
                onChange={this.handleChange}
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <h6>Total Amount ({this.state.currency})</h6>
              </Label>
              <Input
                type="text"
                name="totalAmount"
                id="totalAmount"
                required
                defaultValue={this.state.totalAmount}
                onChange={this.handleChange}
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <h6>Currency</h6>
              </Label>
              <Input
                type="text"
                name="totalAmount"
                id="totalAmount"
                required
                defaultValue={this.state.currency}
                onChange={this.handleChange}
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <h6>Tax (GST) ({this.state.currency})</h6>
              </Label>
              <Input
                type="text"
                name="Vendor"
                id="Vendor"
                required
                defaultValue={this.state.tax}
                onChange={this.handleChange}
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <h6>Vendor Name</h6>
              </Label>
              <Input
                type="text"
                name="Vendor"
                id="Vendor"
                required
                defaultValue={this.state.vendor}
                onChange={this.handleChange}
              />
            </FormGroup>

            <Button className="btn btn-lg btn-block  btn-success">
              Submit
            </Button>
          </Form>
        </div>
      </div>
    );
  }
}

export default Upload;