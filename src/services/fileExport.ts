// src/services/fileExport.ts
import {Document} from '../types/document';
import {jsPDF} from 'jspdf';
import {marked} from 'marked';

/**
 * Export a document to a file
 * @param docToExport The document to export
 * @param format The format to export to
 * @returns Promise that resolves when the export is complete
 */
export const exportDocument = async (docToExport: Document, format: 'txt' | 'md' | 'html' | 'pdf' | 'json'): Promise<void> => {
    let content: string;
    let mimeType: string;
    let extension: string;
    const fileName = `${docToExport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

    switch (format) {
        case 'txt':
            content = docToExport.content;
            mimeType = 'text/plain';
            extension = 'txt';
            break;

        case 'md':
            content = docToExport.content;
            mimeType = 'text/markdown';
            extension = 'md';
            break;

        case 'html':
            if (docToExport.type.type === 'markdown') {
                // Convert markdown to HTML
                content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docToExport.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
    code {
      font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
    }
    th {
      background-color: #f2f2f2;
    }
    img {
      max-width: 100%;
    }
  </style>
</head>
<body>
  <h1>${docToExport.title}</h1>
  ${marked(docToExport.content)}
</body>
</html>`;
            } else {
                content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docToExport.title}</title>
</head>
<body>
  <pre>${docToExport.content}</pre>
</body>
</html>`;
            }
            mimeType = 'text/html';
            extension = 'html';
            break;

        case 'pdf':
            // Generate PDF using jsPDF
            const pdf = new jsPDF();

            if (docToExport.type.type === 'markdown') {
                const htmlContent = await marked(docToExport.content);
                pdf.html(htmlContent, {
                    callback: function (doc) {
                        doc.save(`${fileName}.pdf`);
                    }, x: 10, y: 10, width: 180, windowWidth: 800
                });
                return;
            } else {
                // Split the content into lines and add each line to the PDF
                const lines = docToExport.content.split('\n');
                let y = 10;

                pdf.text(docToExport.title, 10, y);
                y += 10;

                for (const line of lines) {
                    // Check if we need a new page
                    if (y > 280) {
                        pdf.addPage();
                        y = 10;
                    }

                    pdf.text(line, 10, y);
                    y += 7;
                }

                pdf.save(`${fileName}.pdf`);
                return;
            }

        case 'json':
            content = JSON.stringify(docToExport, null, 2);
            mimeType = 'application/json';
            extension = 'json';
            break;

        default:
            throw new Error(`Unsupported export format: ${format}`);
    }

    // Create a Blob and trigger download
    const blob = new Blob([content], {type: mimeType});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Export multiple documents as a ZIP file
 * @param documents The documents to export
 * @returns Promise that resolves when the export is complete
 */
export const exportMultipleDocuments = async (documents: Document[]): Promise<void> => {
    // In a real implementation, we would use JSZip or a similar library
    // For simplicity, we'll just export them one by one
    for (const doc of documents) {
        await exportDocument(doc, doc.type.type === 'markdown' ? 'md' : 'txt');
    }
};

/**
 * Export application settings
 * @param settings The settings to export
 * @returns Promise that resolves when the export is complete
 */
export const exportSettings = async (settings: any): Promise<void> => {
    const content = JSON.stringify(settings, null, 2);
    const blob = new Blob([content], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'engineers-notepad-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
