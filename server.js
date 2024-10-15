const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Attendance Report Generator</title>
            </head>
            <body>
                <h1>Attendance Report Generator</h1>
                <form action="/download" method="post">
                    <label for="employeeName">Employee Name:</label>
                    <input type="text" id="employeeName" name="employeeName" required><br><br>

                    <label for="employeeId">Employee ID:</label>
                    <input type="text" id="employeeId" name="employeeId" required><br><br>

                    <label for="startDate">Start Date:</label>
                    <input type="date" id="startDate" name="startDate" required><br><br>

                    <label for="startTime">Start Time:</label>
                    <input type="time" id="startTime" name="startTime" required><br><br>

                    <label for="endDate">End Date:</label>
                    <input type="date" id="endDate" name="endDate" required><br><br>

                    <label for="endTime">End Time:</label>
                    <input type="time" id="endTime" name="endTime" required><br><br>

                    <button type="submit">Generate PDF</button>
                </form>
            </body>
        </html>
    `);
});
// Function to draw the table in the PDF
function drawTable(doc, startX, startY, rows, cols, rowHeight, colWidths) {
    // Draw horizontal lines
    for (let i = 0; i <= rows; i++) {
        let y = startY + i * rowHeight;
        doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
    }

    // Draw vertical lines
    let currentX = startX;
    for (let i = 0; i <= cols; i++) {
        doc.moveTo(currentX, startY).lineTo(currentX, startY + rowHeight * rows).stroke();
        if (i < cols) currentX += colWidths[i];
    }
}

// Route to generate PDF based on form inputs
app.post('/download', (req, res) => {
    const employeeName = req.body.employeeName;
    const employeeId = req.body.employeeId;
    const startDate = req.body.startDate; // Start Date
    const startTime = req.body.startTime; // Start Time
    const endDate = req.body.endDate; // End Date
    const endTime = req.body.endTime; // End Time

    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const filePath = path.join(__dirname, 'attendance_report.pdf');
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title
    doc.fontSize(16).text("Your Company Name", { align: 'left' });
    doc.fontSize(12).text("Your Company Address", { align: 'left' });
    doc.moveDown();
    doc.fontSize(14).text(`Employee Name: ${employeeName}`, { align: 'left' });
    doc.text(`Employee ID: ${employeeId}`, { align: 'left' });
    doc.text(`Start Date: ${startDate}`, { align: 'left' });
    doc.text(`Start Time: ${startTime}`, { align: 'left' });
    doc.text(`End Date: ${endDate}`, { align: 'left' });
    doc.text(`End Time: ${endTime}`, { align: 'left' });
    doc.moveDown(2);

    // // Employee Details
    // doc.fontSize(12).text('Employee Name: ' + employeeName, 50, 150);
    // doc.text('Employee ID: ' + employeeId, 50, 180);
    // doc.text('Start Date: ' + startDate, 50, 210); // Show startDate
    // doc.text('Start Time: ' + startTime, 50, 240); // Show startTime
    // doc.text('End Date: ' + endDate, 50, 270); // Show endDate
    // doc.text('End Time: ' + endTime, 50, 300); // Show endTime
    
    // Table configuration
    const startY = 350; // Adjusted to provide space after end time
    const rowHeight = 30;
    const colWidths = [40, 100, 80, 80, 80]; // Adjusted widths for the new columns
    const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);
    const tableStartX = (doc.page.width - totalTableWidth) / 2;

    // Header
    const headers = ['Day', 'Date', 'In', 'Out', 'Status'];

    // Create table header
    let currentY = startY;
    const createHeader = () => {
        let currentX = tableStartX;
        headers.forEach((header, i) => {
            doc.fontSize(12).fillColor('black').text(header, currentX, currentY, { width: colWidths[i], align: 'center' });
            currentX += colWidths[i];
        });
        currentY += rowHeight; // Move down for the next row
    };

    // Add header
    createHeader();

    // Sample data for the entire month
    let sampleData = [];
    for (let day = 1; day <= 31; day++) {
        const date = moment().date(day).format('YYYY-MM-DD');
        const inTime = (day % 2 === 0) ? startTime : '-'; // Example data
        const outTime = (day % 2 === 0) ? endTime : '-'; // Example data
        const status = (day % 2 === 0) ? 'Present' : 'Absent'; // Example data
        sampleData.push([day, date, inTime, outTime, status]);
    }

    // Function to add data rows to the PDF
    const addDataRows = (data) => {
        data.forEach(row => {
            let currentX = tableStartX; // Centered X position
            row.forEach((cell, i) => {
                doc.fontSize(10).fillColor('black').text(cell, currentX + 5, currentY, { width: colWidths[i] - 10, align: 'center' }); // Added padding
                currentX += colWidths[i];
            });
            currentY += rowHeight;

            // Check if we need to start a new page
            if (currentY > doc.page.height - 100) { // 100 is the bottom margin
                doc.addPage();
                currentY = 50; // Reset y position after page break
                createHeader(); // Redraw the header on the new page
            }
        });
    };


    // Add data rows to the PDF
    addDataRows(sampleData);

   drawTable(doc, tableStartX, startY, sampleData.length + 1, headers.length, rowHeight, colWidths);

    doc.end();

    stream.on('finish', () => {
        res.download(filePath);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
