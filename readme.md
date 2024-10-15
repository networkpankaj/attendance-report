
// Route to generate PDF based on employee ID
app.post('/export', (req, res) => {
    const employeeId = req.body.employeeId; // Employee ID se details lene ke liye

    // Yahan aapko employee ki details ko database ya kisi source se lena hoga
    const employeeDetails = getEmployeeDetails(employeeId); // Yeh function aapko implement karna hoga

    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const filePath = path.join(__dirname, 'employee_report.pdf');
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title
    doc.fontSize(18).text('Employee Report for ' + employeeDetails.name, { align: 'center' });
    doc.moveDown(2);

    // Employee Details
    doc.fontSize(12).text('Employee Name: ' + employeeDetails.name, 50, 150);
    doc.text('Employee ID: ' + employeeDetails.id, 50, 180);
    doc.text('Position: ' + employeeDetails.position, 50, 210);
    doc.text('Department: ' + employeeDetails.department, 50, 240);
    
    // ... aap yahan aur details add kar sakte hain ...

    doc.end();

    stream.on('finish', () => {
        res.download(filePath);
    });
});