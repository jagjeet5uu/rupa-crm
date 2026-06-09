const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const sequelize = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { getPagination, buildMeta } = require('../utils/pagination');
const { log } = require('../utils/audit');

const buildClientWhere = (query, userId, role) => {
  let where = 'c.deleted_at IS NULL';
  const replacements = [];

  if (role === 'sales_executive') {
    where += ' AND c.assigned_salesperson_id = ?';
    replacements.push(userId);
  } else if (role === 'sales_manager') {
    where += ' AND (c.assigned_manager_id = ? OR c.assigned_salesperson_id IN (SELECT id FROM users WHERE manager_id = ?))';
    replacements.push(userId, userId);
  }

  if (query.city) { where += ' AND c.city = ?'; replacements.push(query.city); }
  if (query.state) { where += ' AND c.state = ?'; replacements.push(query.state); }
  if (query.client_type) { where += ' AND c.client_type = ?'; replacements.push(query.client_type); }
  if (query.status) { where += ' AND c.status = ?'; replacements.push(query.status); }
  if (query.salesperson_id) { where += ' AND c.assigned_salesperson_id = ?'; replacements.push(query.salesperson_id); }
  if (query.search) {
    where += ' AND (c.company_name LIKE ? OR c.mobile LIKE ? OR c.email LIKE ? OR c.contact_person LIKE ?)';
    const s = `%${query.search}%`;
    replacements.push(s, s, s, s);
  }

  return { where, replacements };
};

const listClients = async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { where, replacements } = buildClientWhere(req.query, req.user.id, req.user.role);

  try {
    const [[{ total }]] = await sequelize.query(
      `SELECT COUNT(*) as total FROM clients c WHERE ${where}`,
      { replacements }
    );

    const [clients] = await sequelize.query(
      `SELECT c.id, c.uuid, c.company_name, c.contact_person, c.mobile, c.email,
              c.city, c.state, c.client_type, c.status, c.created_at,
              sp.full_name as salesperson_name, m.full_name as manager_name
       FROM clients c
       LEFT JOIN users sp ON c.assigned_salesperson_id = sp.id
       LEFT JOIN users m ON c.assigned_manager_id = m.id
       WHERE ${where}
       ORDER BY c.company_name ASC LIMIT ? OFFSET ?`,
      { replacements: [...replacements, limit, offset] }
    );

    return sendPaginated(res, 'Clients fetched', clients, buildMeta(total, page, limit));
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

const createClient = async (req, res) => {
  const {
    company_name, contact_person, designation, mobile, alternate_mobile, email,
    address, city, state, pincode, latitude, longitude, gps_address,
    industry_type, client_type, assigned_salesperson_id, assigned_manager_id,
    notes, brands, categories,
  } = req.body;

  try {
    const [existing] = await sequelize.query(
      `SELECT id FROM clients WHERE (company_name = ? OR mobile = ? OR email = ?) AND deleted_at IS NULL LIMIT 1`,
      { replacements: [company_name, mobile || '', email || ''] }
    );
    if (existing[0]) return sendError(res, 'Client may already exist (duplicate name, mobile, or email)', 409);

    const uuid = uuidv4();
    const [result] = await sequelize.query(
      `INSERT INTO clients (uuid, company_name, contact_person, designation, mobile, alternate_mobile, email,
       address, city, state, pincode, latitude, longitude, gps_address, industry_type, client_type,
       assigned_salesperson_id, assigned_manager_id, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          uuid, company_name, contact_person || null, designation || null,
          mobile || null, alternate_mobile || null, email || null,
          address || null, city || null, state || null, pincode || null,
          latitude || null, longitude || null, gps_address || null,
          industry_type || null, client_type || 'new_prospect',
          assigned_salesperson_id || req.user.id, assigned_manager_id || null,
          notes || null, req.user.id,
        ],
      }
    );

    const clientId = result.insertId;

    if (brands && brands.length) {
      for (const brandId of brands) {
        await sequelize.query('INSERT IGNORE INTO client_brands (client_id, brand_id) VALUES (?, ?)', {
          replacements: [clientId, brandId],
        });
      }
    }

    if (categories && categories.length) {
      for (const catId of categories) {
        await sequelize.query('INSERT IGNORE INTO client_categories (client_id, category_id) VALUES (?, ?)', {
          replacements: [clientId, catId],
        });
      }
    }

    await log({ action: 'CLIENT_CREATED', module: 'clients', recordId: clientId, newValue: { company_name }, performedBy: req.user.id, req });

    return sendSuccess(res, 'Client created successfully', { id: clientId, uuid }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

const getClient = async (req, res) => {
  try {
    const [clients] = await sequelize.query(
      `SELECT c.*, sp.full_name as salesperson_name, m.full_name as manager_name
       FROM clients c
       LEFT JOIN users sp ON c.assigned_salesperson_id = sp.id
       LEFT JOIN users m ON c.assigned_manager_id = m.id
       WHERE c.id = ? AND c.deleted_at IS NULL LIMIT 1`,
      { replacements: [req.params.id] }
    );
    if (!clients[0]) return sendError(res, 'Client not found', 404);

    const [brands] = await sequelize.query(
      'SELECT b.id, b.name FROM brands b JOIN client_brands cb ON b.id = cb.brand_id WHERE cb.client_id = ?',
      { replacements: [req.params.id] }
    );
    const [cats] = await sequelize.query(
      'SELECT c.id, c.name FROM categories c JOIN client_categories cc ON c.id = cc.category_id WHERE cc.client_id = ?',
      { replacements: [req.params.id] }
    );

    return sendSuccess(res, 'Client fetched', { ...clients[0], brands, categories: cats });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

const updateClient = async (req, res) => {
  const {
    company_name, contact_person, designation, mobile, alternate_mobile, email,
    address, city, state, pincode, latitude, longitude, gps_address,
    industry_type, client_type, assigned_salesperson_id, assigned_manager_id,
    status, notes, brands, categories,
  } = req.body;

  try {
    await sequelize.query(
      `UPDATE clients SET company_name=?, contact_person=?, designation=?, mobile=?, alternate_mobile=?,
       email=?, address=?, city=?, state=?, pincode=?, latitude=?, longitude=?, gps_address=?,
       industry_type=?, client_type=?, assigned_salesperson_id=?, assigned_manager_id=?,
       status=?, notes=?, updated_at=NOW() WHERE id = ? AND deleted_at IS NULL`,
      {
        replacements: [
          company_name, contact_person || null, designation || null, mobile || null,
          alternate_mobile || null, email || null, address || null, city || null,
          state || null, pincode || null, latitude || null, longitude || null, gps_address || null,
          industry_type || null, client_type, assigned_salesperson_id || null,
          assigned_manager_id || null, status, notes || null, req.params.id,
        ],
      }
    );

    if (brands !== undefined) {
      await sequelize.query('DELETE FROM client_brands WHERE client_id = ?', { replacements: [req.params.id] });
      for (const brandId of (brands || [])) {
        await sequelize.query('INSERT IGNORE INTO client_brands (client_id, brand_id) VALUES (?, ?)', {
          replacements: [req.params.id, brandId],
        });
      }
    }

    if (categories !== undefined) {
      await sequelize.query('DELETE FROM client_categories WHERE client_id = ?', { replacements: [req.params.id] });
      for (const catId of (categories || [])) {
        await sequelize.query('INSERT IGNORE INTO client_categories (client_id, category_id) VALUES (?, ?)', {
          replacements: [req.params.id, catId],
        });
      }
    }

    await log({ action: 'CLIENT_UPDATED', module: 'clients', recordId: req.params.id, performedBy: req.user.id, req });
    return sendSuccess(res, 'Client updated successfully');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

const getClientProfile = async (req, res) => {
  const clientId = req.params.id;
  try {
    const [clients] = await sequelize.query(
      `SELECT c.*, sp.full_name as salesperson_name, m.full_name as manager_name
       FROM clients c
       LEFT JOIN users sp ON c.assigned_salesperson_id = sp.id
       LEFT JOIN users m ON c.assigned_manager_id = m.id
       WHERE c.id = ? AND c.deleted_at IS NULL LIMIT 1`,
      { replacements: [clientId] }
    );
    if (!clients[0]) return sendError(res, 'Client not found', 404);

    const [[{ visit_count }]] = await sequelize.query(
      'SELECT COUNT(*) as visit_count FROM visits WHERE client_id = ? AND deleted_at IS NULL',
      { replacements: [clientId] }
    );
    const [[{ opp_count }]] = await sequelize.query(
      'SELECT COUNT(*) as opp_count FROM opportunities WHERE client_id = ? AND deleted_at IS NULL',
      { replacements: [clientId] }
    );
    const [[{ pending_followups }]] = await sequelize.query(
      "SELECT COUNT(*) as pending_followups FROM followups WHERE client_id = ? AND status IN ('pending','overdue') AND deleted_at IS NULL",
      { replacements: [clientId] }
    );

    return sendSuccess(res, 'Client profile fetched', {
      ...clients[0],
      stats: { visit_count, opp_count, pending_followups },
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

const exportClients = async (req, res) => {
  const { where, replacements } = buildClientWhere(req.query, req.user.id, req.user.role);
  try {
    const [clients] = await sequelize.query(
      `SELECT c.company_name, c.contact_person, c.designation, c.mobile, c.alternate_mobile,
              c.email, c.address, c.city, c.state, c.pincode, c.industry_type, c.client_type,
              c.status, sp.full_name as salesperson, m.full_name as manager, c.created_at
       FROM clients c
       LEFT JOIN users sp ON c.assigned_salesperson_id = sp.id
       LEFT JOIN users m ON c.assigned_manager_id = m.id
       WHERE ${where} ORDER BY c.company_name`,
      { replacements }
    );

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Clients');
    ws.addRow(['Company', 'Contact Person', 'Designation', 'Mobile', 'Alt Mobile', 'Email',
      'Address', 'City', 'State', 'Pincode', 'Industry', 'Type', 'Status', 'Salesperson', 'Manager', 'Created']);
    clients.forEach(c => ws.addRow(Object.values(c)));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=clients.xlsx');
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

const importClients = async (req, res) => {
  if (!req.file) return sendError(res, 'No file uploaded', 400);
  const summary = { total: 0, imported: 0, skipped: 0, errors: [] };
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer);
    const ws = wb.worksheets[0];
    if (!ws) return sendError(res, 'Excel file has no worksheets', 400);

    const rows = [];
    ws.eachRow((row, rowNumber) => { if (rowNumber > 1) rows.push({ rowNumber, values: row.values }); });
    summary.total = rows.length;

    for (const { rowNumber, values } of rows) {
      // Cols: Company Name | Contact Person | Mobile | Email | City | State | Pincode | Client Type | Industry | Salesperson Email
      const company_name      = (values[1] || '').toString().trim();
      const contact_person    = (values[2] || '').toString().trim() || null;
      const mobile            = (values[3] || '').toString().trim() || null;
      const email             = (values[4] || '').toString().trim() || null;
      const city              = (values[5] || '').toString().trim() || null;
      const state             = (values[6] || '').toString().trim() || null;
      const pincode           = (values[7] || '').toString().trim() || null;
      const client_type       = (values[8] || '').toString().trim() || 'new_prospect';
      const industry_type     = (values[9] || '').toString().trim() || null;
      const salesperson_email = (values[10] || '').toString().trim() || null;

      if (!company_name) { summary.errors.push({ row: rowNumber, error: 'Company Name required' }); summary.skipped++; continue; }

      try {
        let assigned_salesperson_id = req.user.id;
        if (salesperson_email) {
          const [spRows] = await sequelize.query('SELECT id FROM users WHERE email=? AND deleted_at IS NULL LIMIT 1', { replacements: [salesperson_email] });
          if (spRows[0]) assigned_salesperson_id = spRows[0].id;
        }
        const [result] = await sequelize.query(
          `INSERT IGNORE INTO clients (uuid, company_name, contact_person, mobile, email, city, state, pincode, client_type, industry_type, assigned_salesperson_id, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          { replacements: [uuidv4(), company_name, contact_person, mobile, email, city, state, pincode, client_type, industry_type, assigned_salesperson_id, req.user.id] }
        );
        result.affectedRows === 0 ? summary.skipped++ : summary.imported++;
      } catch (rowErr) { summary.errors.push({ row: rowNumber, error: rowErr.message }); summary.skipped++; }
    }
    return sendSuccess(res, 'Import complete', summary);
  } catch (err) { return sendError(res, err.message, 500); }
};

module.exports = { listClients, createClient, getClient, updateClient, getClientProfile, exportClients, importClients };
