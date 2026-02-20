const { PDFDocument } = window.PDFLib;
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const el = {
  pdfFile: document.getElementById('pdfFile'),
  pdfUrl: document.getElementById('pdfUrl'),
  signFile: document.getElementById('signFile'),
  signUrl: document.getElementById('signUrl'),
  signWidth: document.getElementById('signWidth'),
  offsetX: document.getElementById('offsetX'),
  offsetY: document.getElementById('offsetY'),
  signButton: document.getElementById('signButton'),
  status: document.getElementById('status'),
};

function setStatus(message, type = '') {
  el.status.textContent = message;
  el.status.className = `status ${type}`.trim();
}

async function getInputBytes(fileInput, urlInput, label) {
  if (fileInput.files?.[0]) {
    return new Uint8Array(await fileInput.files[0].arrayBuffer());
  }

  const url = urlInput.value.trim();
  if (!url) {
    throw new Error(`${label} 파일 업로드 또는 URL 입력이 필요합니다.`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${label} URL을 불러오지 못했습니다. (${response.status})`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function findAgentAnchor(pdfBytes) {
  const doc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;

  for (let pageNo = 1; pageNo <= doc.numPages; pageNo += 1) {
    const page = await doc.getPage(pageNo);
    const textContent = await page.getTextContent();

    let bestMatch = null;

    for (const item of textContent.items) {
      const text = String(item.str || '');
      if (!text) continue;

      const hasMainToken = text.includes('보험모집인') || text.includes('조정국');
      if (!hasMainToken) continue;

      const score =
        (text.includes('보험모집인') ? 2 : 0) +
        (text.includes('조정국') ? 2 : 0) +
        (text.includes('서명') || text.includes('인') ? 1 : 0);

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          pageIndex: pageNo - 1,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width || 120,
          score,
        };
      }
    }

    if (bestMatch) return bestMatch;
  }

  return null;
}

function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function signPdf() {
  el.signButton.disabled = true;
  setStatus('파일을 불러오는 중입니다...');

  try {
    const pdfBytes = await getInputBytes(el.pdfFile, el.pdfUrl, 'PDF');
    const signBytes = await getInputBytes(el.signFile, el.signUrl, '서명 이미지');

    setStatus('서명 위치를 탐색하는 중입니다...');
    const anchor = await findAgentAnchor(pdfBytes);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const isPng = signBytes[0] === 137 && signBytes[1] === 80;
    const image = isPng
      ? await pdfDoc.embedPng(signBytes)
      : await pdfDoc.embedJpg(signBytes);

    const signWidth = Number(el.signWidth.value) || 64;
    const signHeight = (image.height / image.width) * signWidth;
    const dx = Number(el.offsetX.value) || 0;
    const dy = Number(el.offsetY.value) || 0;

    let pageIndex = pdfDoc.getPageCount() - 1;
    let x = 420 + dx;
    let y = 72 + dy;

    if (anchor) {
      pageIndex = anchor.pageIndex;
      x = anchor.x + anchor.width - signWidth - 8 + dx;
      y = anchor.y + dy;
    }

    const page = pdfDoc.getPage(pageIndex);
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    x = Math.max(0, Math.min(x, pageWidth - signWidth));
    y = Math.max(0, Math.min(y, pageHeight - signHeight));

    page.drawImage(image, {
      x,
      y,
      width: signWidth,
      height: signHeight,
      opacity: 1,
    });

    const output = await pdfDoc.save();
    downloadPdf(output, 'signed.pdf');

    setStatus(
      anchor
        ? '완료! 보험모집인 문구 기준으로 서명을 배치해 다운로드했습니다.'
        : '완료! 문구 탐색 실패로 기본 위치에 서명을 배치해 다운로드했습니다.',
      'success'
    );
  } catch (error) {
    setStatus(`실패: ${error.message}`, 'error');
  } finally {
    el.signButton.disabled = false;
  }
}

el.signButton.addEventListener('click', signPdf);
