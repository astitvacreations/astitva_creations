/**
 * Progressive Quotation Versioning & Snapshot Manager
 * Supports: Quotation 1 (Initial Quote), Quotation 2, Quotation 3, up to the Final Quotation (Agreement).
 */

/**
 * Normalizes deliverables, complimentaries, or addOns into [{ name: String, price: Number }]
 */
export const normalizeItems = (items) => {
  if (!items || !Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === 'string') {
      return { name: item.trim(), price: 0 };
    }
    if (typeof item === 'object' && item !== null) {
      return {
        name: String(item.name || item.title || '').trim(),
        price: Number(item.price) || 0
      };
    }
    return { name: String(item).trim(), price: 0 };
  }).filter(item => Boolean(item.name));
};

/**
 * Normalizes sub-events & their services for consistent snapshot storage
 */
export const normalizeSubEvents = (subEvents) => {
  if (!subEvents || !Array.isArray(subEvents)) return [];
  return subEvents.map((se) => {
    const rawServices = se.services || se.serviceList || [];
    const normalizedServices = Array.isArray(rawServices)
      ? rawServices.map((s) => ({
          name: String(s.name || s.serviceName || 'Service').trim(),
          price: Number(s.price) || 0,
          quantity: Number(s.quantity) > 0 ? Number(s.quantity) : 1
        }))
      : [];

    return {
      name: String(se.name || 'Event').trim(),
      services: normalizedServices
    };
  });
};

/**
 * Calculates server-side itemized totals and pending balances
 */
export const calculateVersionFinancials = (versionData, existingPaidAmount = 0) => {
  const subEventList = normalizeSubEvents(versionData.subEventList || versionData.subEvents || []);
  const deliverables = normalizeItems(versionData.deliverables || []);
  const complimentries = normalizeItems(versionData.complimentries || versionData.complimentaries || []);
  const addOns = normalizeItems(versionData.addOns || []);

  const album = {
    enabled: Boolean(versionData.album?.enabled),
    numberOfAlbums: Number(versionData.album?.numberOfAlbums) || 1,
    sheets: Number(versionData.album?.sheets) || 0,
    pricePerSheet: Number(versionData.album?.pricePerSheet) || 500
  };

  // 1. Services sum: sum(price * quantity)
  const servicesSum = subEventList.reduce((acc, se) => {
    return acc + se.services.reduce((sAcc, s) => sAcc + (s.price * s.quantity), 0);
  }, 0);

  // 2. Deliverables sum
  const deliverablesSum = deliverables.reduce((acc, d) => acc + d.price, 0);

  // 3. Add-ons sum
  const addOnsSum = addOns.reduce((acc, a) => acc + a.price, 0);

  // 4. Album cost
  const albumCost = album.enabled ? (album.sheets * album.pricePerSheet * Math.max(1, album.numberOfAlbums)) : 0;

  // 5. Total gross before discount: prioritize explicit total if provided and exceeds itemized sum
  const itemizedTotal = servicesSum + deliverablesSum + addOnsSum + albumCost;
  const providedTotal = Number(versionData.totalAmount) || 0;
  const totalAmount = (providedTotal > itemizedTotal || itemizedTotal === 0) && providedTotal > 0
    ? providedTotal
    : (itemizedTotal > 0 ? itemizedTotal : 0);

  // 6. Discount calculation
  let discount = Number(versionData.discount || versionData.discountAmount || 0);
  let discountPercentage = Number(versionData.discountPercentage || 0);

  if (discountPercentage > 0 && discount === 0 && totalAmount > 0) {
    discount = Math.round(totalAmount * (discountPercentage / 100));
  } else if (discount > 0 && totalAmount > 0 && discountPercentage === 0) {
    discountPercentage = Math.round((discount / totalAmount) * 100 * 100) / 100;
  }

  // 7. Net total after discount
  const netTotal = Math.max(0, totalAmount - discount);

  // 8. Paid & Pending calculation
  const paidAmount = Number(existingPaidAmount !== undefined ? existingPaidAmount : (versionData.paidAmount || 0));
  const pendingAmount = Math.max(0, netTotal - paidAmount);

  return {
    subEventList,
    deliverables,
    complimentries,
    addOns,
    album,
    totalAmount,
    discount,
    discountPercentage,
    netTotal,
    paidAmount,
    pendingAmount
  };
};

/**
 * Auto-seeds Quotation 1 on new or legacy events without versions
 */
export const ensureEventVersions = async (event) => {
  if (!event) return null;
  let modified = false;

  if (!event.versions || event.versions.length === 0) {
    const rawFinalTotal = Number(event.finalTotal || event.totalAmount || 0);
    const rawDiscount = Number(event.discountAmount || event.discount || 0);
    const rawPaid = Number(event.paidAmount || 0);

    const financials = calculateVersionFinancials({
      subEventList: event.subEvents || [],
      deliverables: event.deliverables || [],
      complimentries: event.complimentaries || event.complimentries || [],
      addOns: [],
      album: { enabled: false, numberOfAlbums: 1, sheets: 0, pricePerSheet: 500 },
      totalAmount: rawFinalTotal + rawDiscount,
      discount: rawDiscount,
      discountPercentage: Number(event.discountPercentage || 0),
      paidAmount: rawPaid
    }, rawPaid);

    const initialVersion = {
      versionNumber: 1,
      quotationNumber: '1',
      versionName: 'Quotation 1 (Initial Quote)',
      note: event.notes || 'Initial event quotation',
      isAgreement: false,
      createdAt: event.createdAt || new Date(),
      date: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
      subEventList: financials.subEventList,
      deliverables: financials.deliverables,
      complimentries: financials.complimentries,
      addOns: financials.addOns,
      album: financials.album,
      totalAmount: financials.totalAmount,
      discount: financials.discount,
      discountPercentage: financials.discountPercentage,
      paidAmount: financials.paidAmount,
      pendingAmount: financials.pendingAmount
    };

    event.versions = [initialVersion];
    event.activeVersionNumber = 1;
    event.activeQuotationNumber = '1';
    event.agreementVersionNumber = null;
    modified = true;
  } else {
    // Ensure all items have valid sequential numbers
    event.versions.forEach((v, idx) => {
      const seq = idx + 1;
      if (!v.versionNumber || v.versionNumber !== seq) {
        v.versionNumber = seq;
        modified = true;
      }
      if (!v.quotationNumber) {
        v.quotationNumber = String(seq);
        modified = true;
      }
      if (!v.versionName) {
        v.versionName = seq === 1 ? 'Quotation 1 (Initial Quote)' : `Quotation ${seq}`;
        modified = true;
      }
    });

    if (!event.activeVersionNumber) {
      const latest = event.versions[event.versions.length - 1];
      event.activeVersionNumber = latest.versionNumber;
      event.activeQuotationNumber = latest.quotationNumber;
      modified = true;
    }
  }

  if (modified && typeof event.save === 'function') {
    try {
      await event.save();
    } catch (err) {
      console.warn('[Quotation Versioning] ensureEventVersions save notice:', err.message);
    }
  }

  return event;
};

/**
 * Creates a new sequential immutable quotation snapshot (Quotation 2, Quotation 3, ...)
 * Supports progressive Agreement revisions (e.g., Final Agreement Version 2.0) when additional requirements are added.
 */
export const createNewVersion = async (event, versionPayload = {}) => {
  await ensureEventVersions(event);

  const nextVerNum = (event.versions?.length || 0) + 1;

  // Determine if this snapshot should be an Agreement
  // If explicitly requested, or if current active version was an agreement and not explicitly unset
  const hadAgreement = Boolean(event.agreementVersionNumber);
  const isAgreementRequested = versionPayload.isAgreement === true || (hadAgreement && versionPayload.isAgreement !== false);

  let agreementVerTag = '1.0';
  if (isAgreementRequested) {
    const existingAgreementCount = (event.versions || []).filter(v => 
      v.isAgreement || (v.versionName && v.versionName.toLowerCase().includes('agreement'))
    ).length;
    agreementVerTag = `${Math.max(1, existingAgreementCount) + 1}.0`;
  }

  const nextQuoteTag = versionPayload.quotationNumber || (isAgreementRequested ? agreementVerTag : String(nextVerNum));
  const defaultVersionName = isAgreementRequested 
    ? `Final Agreement Version ${nextQuoteTag}` 
    : `Quotation ${nextQuoteTag}`;
  const versionName = versionPayload.versionName || defaultVersionName;

  const currentPaid = Number(event.paidAmount || 0);
  const financials = calculateVersionFinancials(versionPayload, currentPaid);

  const snapshot = {
    versionNumber: nextVerNum,
    quotationNumber: nextQuoteTag,
    versionName,
    note: String(versionPayload.note || (isAgreementRequested ? 'Updated final agreement with additional requirements' : 'Revision snapshot')).trim(),
    isAgreement: isAgreementRequested,
    createdAt: new Date(),
    date: versionPayload.date || (event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : ''),
    subEventList: financials.subEventList,
    deliverables: financials.deliverables,
    complimentries: financials.complimentries,
    addOns: financials.addOns,
    album: financials.album,
    totalAmount: financials.totalAmount,
    discount: financials.discount,
    discountPercentage: financials.discountPercentage,
    paidAmount: financials.paidAmount,
    pendingAmount: financials.pendingAmount
  };

  if (isAgreementRequested) {
    // Single Agreement Rule: revoke agreement flag on earlier versions
    event.versions.forEach(v => {
      v.isAgreement = false;
    });
    event.agreementVersionNumber = nextVerNum;
  }

  event.versions.push(snapshot);

  // Update active pointers
  event.activeVersionNumber = nextVerNum;
  event.activeQuotationNumber = nextQuoteTag;

  // Overwrite parent event active fields so primary event record reflects the active quote / agreement
  event.finalTotal = financials.netTotal;
  event.discountAmount = financials.discount;
  event.discountPercentage = financials.discountPercentage;

  event.subEvents = financials.subEventList.map(se => ({
    name: se.name,
    services: (se.services || []).map(s => ({
      name: s.name,
      price: Number(s.price || 0)
    }))
  }));

  event.deliverables = financials.deliverables.map(d => (typeof d === 'string' ? d : d.name));
  event.complimentaries = financials.complimentries.map(c => (typeof c === 'string' ? c : c.name));

  // Append audit trail note
  if (!Array.isArray(event.followUps)) event.followUps = [];
  const logLabel = isAgreementRequested ? `Final Agreement Version ${nextQuoteTag}` : `Quotation ${nextQuoteTag}`;
  event.followUps.push({
    note: `Added ${logLabel}: ${snapshot.note} (Total: ₹${financials.netTotal})`,
    date: new Date()
  });

  await event.save();
  return snapshot;
};

/**
 * Restores any previous quotation version as the active quotation
 */
export const restoreVersion = async (event, vNum) => {
  await ensureEventVersions(event);

  const targetVer = event.versions.find(
    v => v.versionNumber === Number(vNum) || v.quotationNumber === String(vNum)
  );

  if (!targetVer) {
    throw new Error(`Quotation version ${vNum} not found.`);
  }

  // Update parent event active pointers
  event.activeVersionNumber = targetVer.versionNumber;
  event.activeQuotationNumber = targetVer.quotationNumber;

  // Sync services & deliverables back to parent event
  event.subEvents = (targetVer.subEventList || []).map(se => ({
    name: se.name,
    services: (se.services || []).map(s => ({
      name: s.name,
      price: Number(s.price || 0)
    }))
  }));

  event.deliverables = (targetVer.deliverables || []).map(d => (typeof d === 'string' ? d : d.name));
  event.complimentaries = (targetVer.complimentries || []).map(c => (typeof c === 'string' ? c : c.name));

  const targetNetTotal = Math.max(0, (targetVer.totalAmount || 0) - (targetVer.discount || 0));
  event.finalTotal = targetNetTotal;
  event.discountAmount = targetVer.discount || 0;
  event.discountPercentage = targetVer.discountPercentage || 0;

  // Recalculate pending balance based on real payments recorded to date
  const totalPaidSoFar = Number(event.paidAmount || 0);
  const pendingAmount = Math.max(0, targetNetTotal - totalPaidSoFar);

  targetVer.paidAmount = totalPaidSoFar;
  targetVer.pendingAmount = pendingAmount;

  // Log follow-up note
  if (!Array.isArray(event.followUps)) event.followUps = [];
  event.followUps.push({
    note: `Restored Quotation ${targetVer.quotationNumber} as active quotation.`,
    date: new Date()
  });

  await event.save();
  return targetVer;
};

/**
 * Enforces the Single-Agreement Rule: only one version can be the Agreement at any time
 */
export const setAgreement = async (event, vNum, unset = false) => {
  await ensureEventVersions(event);

  const targetVer = event.versions.find(
    v => v.versionNumber === Number(vNum) || v.quotationNumber === String(vNum)
  );

  if (!targetVer) {
    throw new Error(`Quotation version ${vNum} not found.`);
  }

  if (!Array.isArray(event.followUps)) event.followUps = [];

  const shouldUnset = unset === true || (event.agreementVersionNumber === targetVer.versionNumber && targetVer.isAgreement);

  if (shouldUnset) {
    event.agreementVersionNumber = null;
    event.versions.forEach(v => {
      v.isAgreement = false;
    });
    event.followUps.push({
      note: `Removed Agreement status from Quotation ${targetVer.quotationNumber}.`,
      date: new Date()
    });
  } else {
    event.agreementVersionNumber = targetVer.versionNumber;
    event.versions.forEach(v => {
      v.isAgreement = (v.versionNumber === targetVer.versionNumber);
    });
    event.followUps.push({
      note: `Quotation ${targetVer.quotationNumber} finalized and selected as the Agreement.`,
      date: new Date()
    });
  }

  await event.save();
  return event;
};
