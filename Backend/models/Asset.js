const pool = require('../config/dbConnection');

const createAsset = async (assetData) => {
  const {
    title, category, authors, publisher, isbn_issn,
    edition, publication_year, description, cover_image,
    location, status, copies, price, acquisition_date,
    call_number, barcode, language, pages, subjects, internal_notes
  } = assetData;

  const query = `
    INSERT INTO assets (
      title, category, authors, publisher, isbn_issn, edition, publication_year,
      description, cover_image, location, status, copies, price, acquisition_date,
      call_number, barcode, language, pages, subjects, internal_notes
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
    ) RETURNING *;
  `;

  const values = [
    title, category, authors || null, publisher || null, isbn_issn || null,
    edition || null, publication_year || null, description || null,
    cover_image || null, location || null, status || 'available',
    copies != null ? parseInt(copies, 10) : 1,
    price != null ? parseFloat(price) : 0.0,
    acquisition_date || null, call_number || null, barcode || null,
    language || null, pages != null ? parseInt(pages, 10) : null,
    subjects || null, internal_notes || null
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

const getAllAssets = async (limit = 10, offset = 0, filters = {}) => {
  const clauses = [];
  const values = [];
  let idx = 1;

  if (filters.search) {
    clauses.push(`(lower(title) LIKE $${idx} OR lower(authors) LIKE $${idx} OR lower(subjects) LIKE $${idx})`);
    values.push(`%${filters.search.toLowerCase()}%`);
    idx++;
  }
  if (filters.category) {
    clauses.push(`category = $${idx}`);
    values.push(filters.category);
    idx++;
  }
  if (filters.status) {
    clauses.push(`status = $${idx}`);
    values.push(filters.status);
    idx++;
  }
  if (filters.location) {
    clauses.push(`location = $${idx}`);
    values.push(filters.location);
    idx++;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const countQuery = `SELECT COUNT(*)::int as total FROM assets ${where};`;
  const dataQuery = `
    SELECT * FROM assets
    ${where}
    ORDER BY created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1};
  `;
  values.push(limit, offset);

  const countRes = await pool.query(countQuery, values.slice(0, idx - 1));
  const total = countRes.rows[0] ? countRes.rows[0].total : 0;

  const dataRes = await pool.query(dataQuery, values);
  return { rows: dataRes.rows, total };
};

const findAssetById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM assets WHERE id = $1;', [id]);
  return rows[0] || null;
};

const updateAsset = async (id, updateData) => {
  // Build dynamic SET clause
  const keys = Object.keys(updateData);
  if (!keys.length) return findAssetById(id);

  const sets = [];
  const values = [];
  let idx = 1;

  for (const key of keys) {
    sets.push(`${key} = $${idx}`);
    values.push(updateData[key]);
    idx++;
  }
  // update updated_at
  sets.push(`updated_at = now()`);

  const query = `UPDATE assets SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *;`;
  values.push(id);

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
};

const deleteAsset = async (id) => {
  // Return deleted row for possibility of removing file
  const { rows } = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING *;', [id]);
  return rows[0] || null;
};

module.exports = {
  createAsset,
  getAllAssets,
  findAssetById,
  updateAsset,
  deleteAsset,
};
