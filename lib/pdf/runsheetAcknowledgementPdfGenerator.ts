import * as Print from 'expo-print';

interface RunsheetAcknowledgementPDFData {
    runsheetId: string;
    driverId: string;
    driverName: string;
    staffName: string;
    dateFrom: string;
    dateTo: string;
    totalBookings: number;
    totalPieces: number;
    signatureBase64: string;
    acknowledgedAt: Date;
}

function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatDateTime(date: Date): string {
    return date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

export async function generateRunsheetAcknowledgementPDF(data: RunsheetAcknowledgementPDFData): Promise<string> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
        .header { display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #ddd; }
        .logo { width: 30px; height: 30px; background: #ff6b00; margin-right: 10px; }
        .brand { font-size: 18px; font-weight: bold; }
        .brand-primary { color: #ff6b00; }
        .title { text-align: center; margin: 20px 0; }
        .title h1 { font-size: 22px; margin-bottom: 5px; }
        .title p { font-size: 12px; color: #666; }
        .section { margin: 15px 0; }
        .section-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ccc; }
        .info-table { width: 100%; margin: 10px 0; }
        .info-table tr { border-bottom: 1px solid #f0f0f0; }
        .info-table tr:nth-child(even) { background-color: #f9f9f9; }
        .info-table td { padding: 8px; font-size: 12px; }
        .info-table td:first-child { font-weight: bold; width: 150px; }
        .ack-text { background: #f9f9f9; padding: 12px; border-left: 3px solid #ff6b00; margin: 10px 0; font-size: 11px; line-height: 1.6; }
        .signature-img { max-width: 200px; max-height: 80px; margin: 10px 0; border: 1px solid #ddd; padding: 5px; }
        .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 9px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo"></div>
        <div class="brand">
            <span class="brand-primary">MilesXP</span> Daily
        </div>
    </div>
    
    <div class="title">
        <h1>Run-Sheet Acknowledgement</h1>
        <p>RS-ACK-${data.runsheetId.toUpperCase()}</p>
    </div>
    
    <div class="section">
        <div class="section-title">Run-Sheet Information</div>
        <table class="info-table">
            <tr><td>Run-Sheet ID</td><td>${data.runsheetId}</td></tr>
            <tr><td>Assigned To</td><td>${data.staffName}</td></tr>
            <tr><td>Date Range</td><td>${formatDate(data.dateFrom)} to ${formatDate(data.dateTo)}</td></tr>
            <tr><td>Total Bookings</td><td>${data.totalBookings}</td></tr>
            <tr><td>Total Pieces</td><td>${data.totalPieces}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">Acknowledgement Statement</div>
        <div class="ack-text">
            I understand and agree that I have the exact amount of pieces physically as described in the digital Run-Sheet, 
            and that this Acknowledgement will be used as the reference going forward.
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">Digital Signature</div>
        <img src="${data.signatureBase64}" class="signature-img" alt="Signature" />
        <div style="font-size: 10px; color: #666;">Authorized Driver Signature</div>
    </div>
    
    <div class="section">
        <div class="section-title">Confirmation Details</div>
        <table class="info-table">
            <tr><td>Driver Name</td><td>${data.driverName}</td></tr>
            <tr><td>Driver ID</td><td>${data.driverId}</td></tr>
            <tr><td>Acknowledged At</td><td>${formatDateTime(data.acknowledgedAt)}</td></tr>
        </table>
    </div>
    
    <div class="footer">
        <p>Miles Express Cargo Systems Limited | 42, The Office House, Timber Wharf, Marsa, MRS1440, Malta</p>
        <p>T: +356 21240877 | E: info@milesxp.com | Company Registration No C15848 / VAT No: MT10182704</p>
    </div>
</body>
</html>`;

    try {
        const { uri } = await Print.printToFileAsync({
            html,
            base64: false
        });
        return uri;
    } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
    }
}