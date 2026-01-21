import { supabase } from './supabase';
import { generateRunsheetAcknowledgementPDF } from './pdf/runsheetAcknowledgementPdfGenerator';

interface AcknowledgementData {
    runsheetId: string;
    driverId: string;
    driverName: string;
    signatureBase64: string;
    runsheetDetails: {
        staffName: string;
        dateFrom: string;
        dateTo: string;
        totalBookings: number;
        totalPieces: number;
    };
}

export async function checkAcknowledgementExists(runsheetId: string, driverId: string): Promise<boolean> {
    try {
        const pdfPath = `${runsheetId}_${driverId}_acknowledgement.pdf`;

        const { data, error } = await supabase
            .storage
            .from('runsheet-acknowledgement-app')
            .list('', {
                search: pdfPath
            });

        if (error) {
            console.error('Error checking acknowledgement:', error);
            return false;
        }

        return data && data.length > 0;
    } catch (error) {
        console.error('Error checking acknowledgement:', error);
        return false;
    }
}

async function readFileAsBase64(uri: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
            const reader = new FileReader();
            reader.onloadend = function () {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(xhr.response);
        };
        xhr.onerror = reject;
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send();
    });
}

export async function saveAcknowledgement(data: AcknowledgementData): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('Starting acknowledgement save...');

        const signaturePath = `${data.runsheetId}_${data.driverId}_signature.png`;

        const base64Data = data.signatureBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        console.log('Uploading signature...');
        const { error: uploadError } = await supabase
            .storage
            .from('runsheet-acknowledgement-app')
            .upload(signaturePath, buffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (uploadError) {
            console.error('Error uploading signature:', uploadError);
            return { success: false, error: uploadError.message };
        }

        console.log('Generating PDF...');
        const pdfUri = await generateRunsheetAcknowledgementPDF({
            runsheetId: data.runsheetId,
            driverId: data.driverId,
            driverName: data.driverName,
            staffName: data.runsheetDetails.staffName,
            dateFrom: data.runsheetDetails.dateFrom,
            dateTo: data.runsheetDetails.dateTo,
            totalBookings: data.runsheetDetails.totalBookings,
            totalPieces: data.runsheetDetails.totalPieces,
            signatureBase64: data.signatureBase64,
            acknowledgedAt: new Date()
        });

        console.log('PDF generated at:', pdfUri);

        console.log('Reading PDF file...');
        const pdfBase64 = await readFileAsBase64(pdfUri);
        const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

        console.log('PDF size:', pdfBuffer.length);

        if (pdfBuffer.length === 0) {
            throw new Error('Generated PDF is empty');
        }

        const pdfPath = `${data.runsheetId}_${data.driverId}_acknowledgement.pdf`;

        console.log('Uploading PDF to Supabase...');
        const { error: pdfUploadError } = await supabase
            .storage
            .from('runsheet-acknowledgement-app')
            .upload(pdfPath, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (pdfUploadError) {
            console.error('Error uploading PDF:', pdfUploadError);
            return { success: false, error: pdfUploadError.message };
        }

        console.log('PDF uploaded successfully');

        return { success: true };
    } catch (error: any) {
        console.error('Error saving acknowledgement:', error);
        return { success: false, error: error.message || 'Failed to save acknowledgement' };
    }
}

export async function downloadAcknowledgementPDF(runsheetId: string, driverId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const pdfPath = `${runsheetId}_${driverId}_acknowledgement.pdf`;

        const { data, error } = await supabase
            .storage
            .from('runsheet-acknowledgement-app')
            .createSignedUrl(pdfPath, 3600);

        if (error) {
            console.error('Error getting PDF URL:', error);
            return { success: false, error: error.message };
        }

        return { success: true, url: data.signedUrl };
    } catch (error: any) {
        console.error('Error downloading PDF:', error);
        return { success: false, error: error.message || 'Failed to download PDF' };
    }
}