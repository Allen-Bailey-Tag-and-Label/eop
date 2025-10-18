import bwipjs from 'bwip-js';
import JSZip from 'jszip';
import PDFKit from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';

let controller: ReadableStreamDefaultController;
const encoder = new TextEncoder();

const sendMessage = (completed = 0, total = 0) => {
	// update current time
	time.current = new Date();

	// calculate elapsed time
	const elapsed = time.current.getTime() - time.start.getTime();

	// check if elapsed is larger than threshold
	if (elapsed >= time.threshold) {
		controller.enqueue(encoder.encode(JSON.stringify({ completed, total })));
		time.start = time.current;
	}
};
const time = { current: new Date(), start: new Date(), threshold: 100 };

export const config = {
	maxDuration: 300
};

export const GET = async ({ url }) => {
	console.log('yup');

	const readable = new ReadableStream({
		async start(c) {
			// update start time
			time.start = new Date();

			// initiate JSZip
			const jszip = new JSZip();

			// update global controller
			controller = c;

			// get searchParams
			const fileOutput = url.searchParams.get('fileOutput');
			const token = url.searchParams.get('token');

			// decode token
			const id = jsonwebtoken.verify(token, JSONWEBTOKEN_SECRET);

			// find order in database
			const order = await prisma.customerBarcodeOrder.findFirst({
				where: { id: +id },
				include: { quote: true }
			});

			// parse options
			const options = JSON.parse(order.quote.barcodeOptions);

			// initiate PDF options
			const pdfOptions = {
				margins: {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0
				},
				size: [parseFloat(order.quote.width) * 72, parseFloat(order.quote.height) * 72]
			};

			// initiate combined PDF
			const combinedPDFDoc = new PDFKit(pdfOptions);

			// send message with initial values
			sendMessage(0, order?.quote.values.length);
			await new Promise((res) => setTimeout(res, time.threshold));

			// loop over each barcode
			for (let i = 0; i < order.quote.values.length; i++) {
				const text = order.quote.values[i];

				// choose which doc to add svg to
				const fileOutputDoc = fileOutput === 'combined' ? combinedPDFDoc : new PDFKit(pdfOptions);

				// create svg
				const svg = await bwipjs.toSVG({
					...options,
					alttext: options?.includetext === true ? text : '',
					text
				});

				// add svg to the pdf doc
				SVGtoPDF(fileOutputDoc, svg);

				// fileOuput type logic
				if (fileOutput === 'combined' && i !== order.quote.values.length - 1) {
					fileOutputDoc.addPage();
				}

				if (fileOutput === 'individual') {
					// finalize / create pdf
					fileOutputDoc.end();

					// add file
					jszip.file(`${text}.pdf`, fileOutputDoc);
				}

				// send message to client
				sendMessage(i + 1, order.quote.values.length);
				// console.log(`${i + 1} / ${order?.quote.values.length}`);
				await new Promise((res) => setTimeout(res, time.threshold / 1000));
			}
			await new Promise((res) => setTimeout(res, time.threshold));

			// fileOuput type logic
			if (fileOutput === 'combined') {
				// finalize / create pdf
				combinedPDFDoc.end();

				// add file
				jszip.file(`${format.id(id)}.pdf`, combinedPDFDoc);
			}
			// send message with initial values
			sendMessage(order?.quote.values.length, order?.quote.values.length);
			await new Promise((res) => setTimeout(res, time.threshold));

			// create zip file
			const zip = await jszip.generateAsync({ type: 'uint8array' });
			controller.enqueue(zip);
			controller.close();
		}
	});

	return new Response(readable, {
		headers: {
			'content-type': 'text/event-stream'
		}
	});
};
