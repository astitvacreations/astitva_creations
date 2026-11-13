import { ZipArchive } from 'archiver';
import { getDriveFileStream } from './googleDriveService.js';

/**
 * 1. Adobe Lightroom / Capture One Search String Generator
 * Formats filenames into space-delimited and comma-delimited strings for filter bars.
 */
export const generateLightroomSearchString = (mediaItems) => {
  const selected = mediaItems.filter((m) => m.isSelected);
  
  // Strip common file extensions (.jpg, .jpeg, .png, .raw, .cr2, .cr3, .nef, .arw, .dng)
  const baseNames = selected.map((m) => {
    return m.name.replace(/\.[^/.]+$/, '').trim();
  });

  const fullFileNames = selected.map((m) => m.name.trim());

  return {
    totalSelected: selected.length,
    // Exact space-separated query for Lightroom Text Filter (Filename -> Contains Words)
    lightroomQuery: baseNames.join(' '),
    commaSeparated: baseNames.join(', '),
    fileNamesList: fullFileNames,
    rawTextSnippet: baseNames.join('\n')
  };
};

/**
 * 2. Selection CSV Report Generator
 */
export const generateCSVReport = (gallery, mediaItems) => {
  const selected = mediaItems.filter((m) => m.isSelected);

  // Map subEvents lookup
  const subEventMap = {};
  if (Array.isArray(gallery.subEvents)) {
    gallery.subEvents.forEach((s) => {
      subEventMap[s.id] = s.name;
    });
  }

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    'Sl No',
    'Sub-Event',
    'File Name',
    'Storage ID',
    'Rating',
    'Client Retouching Notes',
    'Selected At'
  ];

  const rows = selected.map((item, index) => {
    const subEventName = subEventMap[item.subEventId] || 'Main Event';
    const formattedDate = item.selectedAt ? new Date(item.selectedAt).toISOString() : '';
    return [
      index + 1,
      escapeCSV(subEventName),
      escapeCSV(item.name),
      escapeCSV(item.storageId),
      item.rating || 0,
      escapeCSV(item.clientComment || ''),
      escapeCSV(formattedDate)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
};

/**
 * 3. On-The-Fly Streaming ZIP Archive
 * Streams high-resolution selected images without buffering entire files to disk.
 */
export const streamSelectionsZIP = async (gallery, selectedMedia, res) => {
  const safeClient = (gallery.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeEvent = (gallery.eventName || 'Gallery').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeClient}_${safeEvent}_selected_photos.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const archive = new ZipArchive({
    zlib: { level: 5 } // Balanced compression
  });

  // Handle client socket disconnect gracefully
  let isClosed = false;
  res.on('close', () => {
    isClosed = true;
    archive.destroy();
  });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('[Archiver Warning]:', err);
    } else {
      console.error('[Archiver Warning Error]:', err);
    }
  });

  archive.on('error', (err) => {
    console.error('[Archiver Stream Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Archive generation error' });
    }
  });

  // Pipe archive stream directly to response
  archive.pipe(res);

  // Sub-event mapping
  const subEventMap = {};
  if (Array.isArray(gallery.subEvents)) {
    gallery.subEvents.forEach((s) => {
      subEventMap[s.id] = s.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    });
  }

  // Iterate and append each selected photo stream
  for (const media of selectedMedia) {
    if (isClosed) break;

    try {
      const folderName = media.subEventId && subEventMap[media.subEventId]
        ? subEventMap[media.subEventId]
        : 'Selections';
      const fileStream = await getDriveFileStream(media.storageId);

      archive.append(fileStream, {
        name: `${folderName}/${media.name}`
      });
    } catch (e) {
      console.error(`[ZIP Stream] Error fetching file ${media.name} (${media.storageId}):`, e.message);
      // Append a small placeholder text note for missing files so the ZIP doesn't break
      archive.append(Buffer.from(`Could not download file ${media.name}: ${e.message}`), {
        name: `ERROR_${media.name}.txt`
      });
    }
  }

  // Also include the Lightroom search string file and CSV report directly in the ZIP!
  const lrData = generateLightroomSearchString(selectedMedia);
  archive.append(Buffer.from(lrData.lightroomQuery, 'utf-8'), {
    name: `Lightroom_Search_String.txt`
  });

  const csvContent = generateCSVReport(gallery, selectedMedia);
  archive.append(Buffer.from(csvContent, 'utf-8'), {
    name: `${safeClient}_Selections_Report.csv`
  });

  await archive.finalize();
};

/**
 * 4. Multi-Client Bulk Selections Export ZIP
 */
export const streamBulkSubmittedZIP = async (galleriesWithMedia, res) => {
  const filename = `Astitva_Creations_Bulk_Selections_${Date.now()}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const archive = new ZipArchive({ zlib: { level: 4 } });

  let isClosed = false;
  res.on('close', () => {
    isClosed = true;
    archive.destroy();
  });

  archive.pipe(res);

  for (const { gallery, media } of galleriesWithMedia) {
    if (isClosed) break;

    const clientFolder = `${(gallery.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_')}_${(gallery.eventName || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    for (const item of media) {
      if (isClosed) break;
      try {
        const fileStream = await getDriveFileStream(item.storageId);
        archive.append(fileStream, {
          name: `${clientFolder}/${item.name}`
        });
      } catch (err) {
        console.warn(`[Bulk ZIP] Failed to pack ${item.name}:`, err.message);
      }
    }

    // Add Lightroom and CSV in client subfolder
    const lr = generateLightroomSearchString(media);
    archive.append(Buffer.from(lr.lightroomQuery, 'utf-8'), {
      name: `${clientFolder}/Lightroom_Filter.txt`
    });
  }

  await archive.finalize();
};

export default {
  generateLightroomSearchString,
  generateCSVReport,
  streamSelectionsZIP,
  streamBulkSubmittedZIP
};
