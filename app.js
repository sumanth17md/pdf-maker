// ========================================================
// 1. DOM Elements
// ========================================================
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const statusText = document.getElementById('statusText');
const imageGrid = document.getElementById('imageGrid');
const convertBtn = document.getElementById('convertBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const compressionQualitySelect = document.getElementById('compressionQuality');
const pageOrientationSelect = document.getElementById('pageOrientation');

// Top Right Menu Elements
const menuBtn = document.getElementById('menuBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');

// Post-conversion Download Section Elements
const downloadSection = document.getElementById('downloadSection');
const pdfSizeNotice = document.getElementById('pdfSizeNotice');
const pdfFileNameInput = document.getElementById('pdfFileName');
const finalDownloadBtn = document.getElementById('finalDownloadBtn');
const previewPdfBtn = document.getElementById('previewPdfBtn');

// ========================================================
// 2. Document Filters Definition
// ========================================================
const DOCUMENT_FILTERS = {
    normal: { label: 'Original Photo', css: 'none' },
    enhance: { label: '✨ Auto-Enhance (Sharpen)', css: 'contrast(140%) brightness(105%)' },
    bw: { label: '📄 B&W Scanner (Xerox)', css: 'grayscale(100%) contrast(165%) brightness(105%)' },
    bright: { label: '☀️ Brighten (Remove Shadows)', css: 'brightness(125%) contrast(110%)' }
};

// Master list of selected documents: { file: File, rotation: 0, filter: 'normal' }
let selectedFilesList = [];

// Stored in-memory PDF data
let currentPdfBlob = null;
let currentBlobUrl = null;

// ========================================================
// 3. Top-Right Menu Event Handlers
// ========================================================
menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('open');
});

closeMenuBtn.addEventListener('click', () => {
    dropdownMenu.classList.remove('open');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!dropdownMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        dropdownMenu.classList.remove('open');
    }
});

// Close menu on Escape key press
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        dropdownMenu.classList.remove('open');
    }
});

// ========================================================
// 4. File Validation Helper
// ========================================================
function isImageFile(file) {
    if (file.type && file.type.startsWith('image/')) {
        return true;
    }
    return /\.(jpe?g|png|webp|bmp|gif|jfif)$/i.test(file.name);
}

// ========================================================
// 5. Option 1: File Input (Browse Button)
// ========================================================
imageInput.addEventListener('change', (event) => {
    if (event.target.files && event.target.files.length > 0) {
        handleIncomingFiles(event.target.files);
        imageInput.value = '';
    }
});

// ========================================================
// 6. Option 2: Drag & Drop Zone
// ========================================================
dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-active');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-active');
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-active');

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        handleIncomingFiles(event.dataTransfer.files);
    }
});

// ========================================================
// 7. File Processing & Array State Management
// ========================================================
function handleIncomingFiles(fileList) {
    const rawFiles = Array.from(fileList);
    const validImages = rawFiles.filter(isImageFile);

    if (validImages.length === 0) {
        alert("Please select or drop valid image files (PNG, JPG, WebP).");
        return;
    }

    const newItems = validImages.map(file => ({
        file: file,
        rotation: 0,
        filter: 'normal'
    }));

    selectedFilesList = selectedFilesList.concat(newItems);

    hideDownloadSection();
    renderThumbnails();
    updateUIState();
}

function removeImage(index) {
    selectedFilesList.splice(index, 1);
    hideDownloadSection();
    renderThumbnails();
    updateUIState();
}

function rotateImage(index) {
    selectedFilesList[index].rotation = (selectedFilesList[index].rotation + 90) % 360;
    hideDownloadSection();
    renderThumbnails();
}

function moveImage(index, offset) {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= selectedFilesList.length) return;

    [selectedFilesList[index], selectedFilesList[targetIndex]] = [
        selectedFilesList[targetIndex],
        selectedFilesList[index]
    ];

    hideDownloadSection();
    renderThumbnails();
}

clearAllBtn.addEventListener('click', () => {
    if (selectedFilesList.length === 0) return;
    if (confirm("Are you sure you want to remove all selected photos?")) {
        selectedFilesList = [];
        hideDownloadSection();
        renderThumbnails();
        updateUIState();
    }
});

function hideDownloadSection() {
    downloadSection.style.display = 'none';
}

function updateUIState() {
    const count = selectedFilesList.length;
    if (count === 0) {
        statusText.innerHTML = "No images selected yet.";
        convertBtn.disabled = true;
        clearAllBtn.style.display = 'none';
    } else {
        statusText.innerHTML = `✅ <strong>${count} image${count > 1 ? 's' : ''}</strong> ready. Customize filters/order or convert below!`;
        convertBtn.disabled = false;
        clearAllBtn.style.display = 'inline-block';
    }
}

// ========================================================
// 8. Thumbnail Card Rendering
// ========================================================
function renderThumbnails() {
    imageGrid.innerHTML = '';

    selectedFilesList.forEach((item, index) => {
        const file = item.file;
        const tempUrl = URL.createObjectURL(file);

        const card = document.createElement('div');
        card.className = 'thumbnail-card';

        // Rotate & Delete Action Buttons
        const topActions = document.createElement('div');
        topActions.className = 'card-top-actions';

        const rotateBtn = document.createElement('button');
        rotateBtn.className = 'btn-card-action btn-rotate';
        rotateBtn.innerHTML = '🔄';
        rotateBtn.title = 'Rotate 90° clockwise';
        rotateBtn.addEventListener('click', () => rotateImage(index));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-card-action btn-delete';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Remove page';
        deleteBtn.addEventListener('click', () => removeImage(index));

        topActions.appendChild(rotateBtn);
        topActions.appendChild(deleteBtn);

        // Image Preview with CSS rotation and real-time filter applied
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'img-wrapper';

        const img = document.createElement('img');
        img.src = tempUrl;
        img.alt = file.name;
        img.style.transform = `rotate(${item.rotation}deg)`;
        img.style.filter = DOCUMENT_FILTERS[item.filter].css;

        imgWrapper.appendChild(img);

        // Info & Controls Footer
        const info = document.createElement('div');
        info.className = 'thumbnail-info';

        const badgeRow = document.createElement('div');
        badgeRow.className = 'thumbnail-badge-row';

        const badge = document.createElement('span');
        badge.className = 'thumbnail-badge';
        badge.innerText = `Page ${index + 1}`;

        const rotBadge = document.createElement('span');
        rotBadge.style.fontSize = '0.7rem';
        rotBadge.style.color = '#64748b';
        rotBadge.innerText = item.rotation > 0 ? `${item.rotation}°` : '';

        badgeRow.appendChild(badge);
        badgeRow.appendChild(rotBadge);

        const name = document.createElement('span');
        name.className = 'thumbnail-name';
        name.title = file.name;
        name.innerText = file.name;

        // Document Filter Dropdown
        const filterSelect = document.createElement('select');
        filterSelect.className = 'card-filter-select';
        filterSelect.title = 'Enhance image readability';

        for (const [key, filterObj] of Object.entries(DOCUMENT_FILTERS)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.innerText = filterObj.label;
            if (key === item.filter) opt.selected = true;
            filterSelect.appendChild(opt);
        }

        filterSelect.addEventListener('change', (e) => {
            item.filter = e.target.value;
            img.style.filter = DOCUMENT_FILTERS[item.filter].css;
            hideDownloadSection();
        });

        // Reordering Buttons Row
        const reorderRow = document.createElement('div');
        reorderRow.className = 'reorder-row';

        const moveLeftBtn = document.createElement('button');
        moveLeftBtn.className = 'btn-reorder';
        moveLeftBtn.innerHTML = '◀ Left';
        moveLeftBtn.disabled = (index === 0);
        moveLeftBtn.addEventListener('click', () => moveImage(index, -1));

        const moveRightBtn = document.createElement('button');
        moveRightBtn.className = 'btn-reorder';
        moveRightBtn.innerHTML = 'Right ▶';
        moveRightBtn.disabled = (index === selectedFilesList.length - 1);
        moveRightBtn.addEventListener('click', () => moveImage(index, 1));

        reorderRow.appendChild(moveLeftBtn);
        reorderRow.appendChild(moveRightBtn);

        info.appendChild(badgeRow);
        info.appendChild(name);
        info.appendChild(filterSelect);
        info.appendChild(reorderRow);

        card.appendChild(topActions);
        card.appendChild(imgWrapper);
        card.appendChild(info);

        imageGrid.appendChild(card);
    });
}

// ========================================================
// 9. Image Preprocessor (Rotation, Filter & Compression)
// ========================================================
function processImage(item, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const rawDataUrl = e.target.result;
            const img = new Image();

            img.onload = () => {
                const rotation = item.rotation;
                const isSideways = (rotation === 90 || rotation === 270);

                const canvas = document.createElement('canvas');
                canvas.width = isSideways ? img.naturalHeight : img.naturalWidth;
                canvas.height = isSideways ? img.naturalWidth : img.naturalHeight;

                const ctx = canvas.getContext('2d');

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const filterDef = DOCUMENT_FILTERS[item.filter] || DOCUMENT_FILTERS.normal;
                ctx.filter = filterDef.css;

                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

                ctx.filter = 'none';

                const finalDataUrl = canvas.toDataURL('image/jpeg', quality);

                resolve({
                    dataUrl: finalDataUrl,
                    width: canvas.width,
                    height: canvas.height
                });
            };

            img.onerror = () => reject(new Error(`Could not load: ${item.file.name}`));
            img.src = rawDataUrl;
        };

        reader.onerror = () => reject(new Error(`Could not read: ${item.file.name}`));
        reader.readAsDataURL(item.file);
    });
}

// ========================================================
// 10. PDF Generation Engine (With Auto-Orientation)
// ========================================================
convertBtn.addEventListener('click', async () => {
    if (selectedFilesList.length === 0) {
        alert("Please select at least one image first!");
        return;
    }

    const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFClass) {
        alert("Error: jsPDF library not found. Please verify jspdf.umd.min.js is in the folder.");
        return;
    }

    const selectedQuality = parseFloat(compressionQualitySelect.value) || 0.7;
    const orientationSetting = pageOrientationSelect.value;

    convertBtn.innerText = "⏳ Generating PDF...";
    convertBtn.disabled = true;
    hideDownloadSection();

    try {
        const processedPages = [];
        for (let i = 0; i < selectedFilesList.length; i++) {
            const item = selectedFilesList[i];
            statusText.innerText = `⏳ Processing Page ${i + 1} of ${selectedFilesList.length} (${item.file.name})...`;

            const imgData = await processImage(item, selectedQuality);

            let isLandscape = false;
            if (orientationSetting === 'landscape') {
                isLandscape = true;
            } else if (orientationSetting === 'portrait') {
                isLandscape = false;
            } else {
                isLandscape = (imgData.width > imgData.height);
            }

            processedPages.push({
                ...imgData,
                orientation: isLandscape ? 'landscape' : 'portrait'
            });
        }

        const pdf = new jsPDFClass({
            orientation: processedPages[0].orientation,
            unit: 'mm',
            format: 'a4'
        });

        const margin = 10;

        for (let i = 0; i < processedPages.length; i++) {
            const page = processedPages[i];
            const isLandscape = (page.orientation === 'landscape');

            if (i > 0) {
                pdf.addPage('a4', page.orientation);
            }

            const pageWidth = isLandscape ? 297 : 210;
            const pageHeight = isLandscape ? 210 : 297;
            const maxContentWidth = pageWidth - (margin * 2);
            const maxContentHeight = pageHeight - (margin * 2);

            const scale = Math.min(maxContentWidth / page.width, maxContentHeight / page.height);
            const renderWidth = page.width * scale;
            const renderHeight = page.height * scale;

            const x = (pageWidth - renderWidth) / 2;
            const y = (pageHeight - renderHeight) / 2;

            pdf.addImage(page.dataUrl, 'JPEG', x, y, renderWidth, renderHeight);
        }

        statusText.innerText = "⏳ Finalizing PDF file...";

        currentPdfBlob = pdf.output('blob');
        if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
        currentBlobUrl = URL.createObjectURL(currentPdfBlob);

        const pdfSizeKB = (currentPdfBlob.size / 1024).toFixed(1);

        pdfSizeNotice.innerText = `${selectedFilesList.length} page(s) compiled successfully • ~${pdfSizeKB} KB`;
        downloadSection.style.display = 'block';
        downloadSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        statusText.innerHTML = `🎉 <strong>PDF Ready!</strong> Set your filename below and click download.`;
    } catch (err) {
        console.error("PDF generation failed:", err);
        statusText.innerHTML = `<span style="color: #dc2626;">❌ Error: ${err.message}</span>`;
        alert("PDF creation failed: " + err.message);
    } finally {
        convertBtn.innerHTML = "<span>📄 Convert to PDF</span>";
        convertBtn.disabled = false;
    }
});

// ========================================================
// 11. Post-Conversion Download & Preview Handlers
// ========================================================
function getCleanFileName() {
    let name = pdfFileNameInput.value.trim() || 'scholarship_documents';
    name = name.replace(/\.pdf$/i, '');
    return `${name}.pdf`;
}

finalDownloadBtn.addEventListener('click', () => {
    if (!currentBlobUrl) return;

    const fileName = getCleanFileName();
    const downloadLink = document.createElement('a');
    downloadLink.href = currentBlobUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

previewPdfBtn.addEventListener('click', () => {
    if (!currentBlobUrl) return;
    window.open(currentBlobUrl, '_blank');
});
