const crypto = require('crypto');

function bad(message) { const error = new Error(message); error.status = 400; throw error; }

// Build one assigned work order, its report, and an audit event. This does not
// record maintenance completion; results remain the technician's responsibility.
function buildWorkOrder(input, config) {
  if (!input || typeof input !== 'object') bad('Request body required');
  const { tmv, location, date, requestId } = input;
  if (typeof tmv !== 'string') bad('Select a configured TMV unit');
  if (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(requestId)) bad('Valid request ID required');
  const types = config.tmvVanMap && Object.hasOwn(config.tmvVanMap, tmv) && config.tmvVanMap[tmv];
  if (!Array.isArray(types)) bad('Select a configured TMV unit');
  const name = typeof input.technician === 'string' ? input.technician : input.technician?.name;
  const technician = (config.technicians || []).find(t => t.name === name);
  if (!technician) bad('Select a configured technician');
  if (!(config.locations || []).includes(location)) bad('Select a configured district');
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) bad('Valid date required');
  let definitions = (config.checklist || []).filter(s => s && s.include !== false && Array.isArray(s.appliesTo) && s.appliesTo.some(t => types.includes(t)));
  if (!definitions.length) bad('No checklist configured for this TMV');
  const selectedTitles = input.selectedSectionTitles;
  if (selectedTitles !== undefined) {
    if (!Array.isArray(selectedTitles) || !selectedTitles.length ||
        selectedTitles.some(title => typeof title !== 'string' || !definitions.some(s => s.title === title)) ||
        new Set(selectedTitles).size !== selectedTitles.length) bad('Select at least one valid checklist section');
    definitions = definitions.filter(s => selectedTitles.includes(s.title));
  }
  const submitted = input.sections === undefined ? [] : input.sections;
  if (!Array.isArray(submitted)) bad('Invalid checklist');
  for (const section of submitted) {
    const definition = definitions.find(s => s.title === section?.title);
    if (!definition || !Array.isArray(section.items)) bad('Invalid checklist section');
    for (const item of section.items) {
      if (!definition.items.some(i => i.label === item?.label) || typeof item.value !== 'string' || item.value.length > 4000) bad('Invalid checklist item');
    }
  }
  const sections = definitions.map(s => ({ title: s.title, items: s.items.map(item => {
    const supplied = submitted.find(x => x.title === s.title)?.items.find(x => x.label === item.label);
    return { ...item, value: supplied?.value || '' };
  }) }));
  const normalized = { tmv, location, date, technician: name, sections };
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  const id = crypto.createHash('sha256').update(requestId).digest('hex').slice(0, 24);
  const createdAt = Date.now();
  const ticketNumber = 'PM-' + date.replace(/-/g, '') + '-' + id.slice(0, 6).toUpperCase();
  const ticket = ['CUDD Energy Services — Maintenance Report', 'Ticket: ' + ticketNumber, 'Report / Assignment ID: ' + id,
    'TMV Unit: ' + tmv, 'Van Type: ' + types.join(' + '), 'District: ' + location,
    'Technician: ' + name, 'Scheduled date: ' + date, 'Status: Assigned — awaiting technician completion', '',
    ...sections.flatMap(s => [s.title, ...s.items.map(i => '• ' + i.label + (i.value ? ': ' + i.value : ''))]),
    '', 'Assignment and report creation logged. Maintenance is not marked completed.'].join('\n');
  const log = { selectedSectionTitles: sections.map(s => s.title), id, assignmentId: id, event: 'assignment_report_created', createdAt, tmv, technician: name, location, date };
  return { id, ticketNumber, tmv, vanType: types.join(' + '), location, technician: { ...technician }, date,
    createdAt, status: 'assigned', sections, results: null, completedAt: null, photos: [],
    ...(selectedTitles !== undefined ? { selectedSectionTitles: sections.map(s => s.title) } : {}),
    requestHash, report: { id, createdAt, text: ticket }, dispatchLog: log };
}

module.exports = { buildWorkOrder };
