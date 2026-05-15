import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAssets, deleteAsset, clearError, clearSuccess } from '../../../redux/slices/assetsSlice';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../../../css/dashboard.css';

const LibraryAssets = () => {
  const dispatch = useDispatch();
  const { assets, loading, error, pagination } = useSelector(state => state.assets);

  // Local state for filters
  const initialFilters = {
    category: '',
    status: '',
    location: '',
    search: '',
    page: 1,
    limit: 10
  };

  const [filters, setFilters] = useState(initialFilters);

  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Fetch assets on component mount and when filters change
  useEffect(() => {
    dispatch(getAssets(filters));
  }, [dispatch, filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  // Handle search
  const handleSearch = (e) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value,
      page: 1
    }));
  };

  // Reset filters to initial defaults and refetch
  const handleRefresh = () => {
    setFilters(initialFilters);
    // explicit refetch to ensure UI updates immediately
    dispatch(getAssets(initialFilters));
    // optionally clear selection/modals
    setSelectedAsset(null);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle delete asset
  const handleDeleteAsset = async (id) => {
    setConfirmAction(() => async () => {
      try {
        await dispatch(deleteAsset(id)).unwrap();
        // Refresh the assets list
        dispatch(getAssets(filters));
        toast.success('Asset deleted successfully!');
      } catch (error) {
        console.error('Failed to delete asset:', error);
        toast.error('Failed to delete asset');
      }
    });
    setShowConfirmModal(true);
  };

  // Export assets to CSV
  const exportToCSV = (data = assets, filename = 'library-assets.csv') => {
    if (!data || data.length === 0) {
      toast.info('No data available to export');
      return;
    }

    const rows = data.map(a => ({
      'Title': a.title || '',
      'Category': a.category || '',
      'Authors': a.authors || '',
      'Publisher': a.publisher || '',
      'ISBN/ISSN': a.isbn_issn || '',
      'Edition': a.edition || '',
      'Publication Year': a.publication_year || '',
      'Pages': a.pages || '',
      'Copies': a.copies ?? 0,
      'Price': a.price ?? 0,
      'Location': (a.location || '').replace('-', ' ').toUpperCase(),
      'Status': (a.status || '').replace('-', ' ').toUpperCase(),
      'Barcode': a.barcode || '',
      'Call Number': a.call_number || '',
      'Acquisition Date': a.acquisition_date ? new Date(a.acquisition_date).toLocaleDateString() : ''
    }));

    const header = Object.keys(rows[0]);
    const csv = [header.join(',')].concat(
      rows.map(r => header.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'available': return 'bg-success-subtle text-success';
      case 'checked-out': return 'bg-warning-subtle text-warning';
      case 'reserved': return 'bg-info-subtle text-info';
      case 'maintenance': return 'bg-danger-subtle text-danger';
      case 'missing': return 'bg-secondary-subtle text-secondary';
      case 'damaged': return 'bg-danger-subtle text-danger';
      default: return 'bg-secondary-subtle text-secondary';
    }
  };

  // Get action buttons based on status
  const getActionButtons = (asset) => {
    const buttons = [
      <button
        key="view"
        className="btn btn-outline-primary btn-sm"
        title="View Details"
        onClick={() => {
          setSelectedAsset(asset);
          setShowModal(true);
        }}
      >
        <i className="bi bi-eye"></i>
      </button>,
      <Link
        key="edit"
        to={`/edit-library-assets/${asset.id}`}
        className="btn btn-outline-secondary btn-sm"
        title="Edit"
      >
        <i className="bi bi-pencil"></i>
      </Link>
    ];

    switch (asset.status) {
      case 'available':
        buttons.push(
          <button
            key="checkout"
            className="btn btn-outline-success btn-sm"
            title="Check Out"
          >
            <i className="bi bi-bookmark-check"></i>
          </button>
        );
        break;
      case 'checked-out':
        buttons.push(
          <button
            key="reserve"
            className="btn btn-outline-info btn-sm"
            title="Reserve"
          >
            <i className="bi bi-bookmark-plus"></i>
          </button>
        );
        break;
      case 'reserved':
        buttons.push(
          <button
            key="view-reservation"
            className="btn btn-outline-info btn-sm"
            title="View Reservation"
          >
            <i className="bi bi-bookmark-star"></i>
          </button>
        );
        break;
      case 'maintenance':
        buttons.push(
          <button
            key="maintenance"
            className="btn btn-outline-warning btn-sm"
            disabled
            title="Under Maintenance"
          >
            <i className="bi bi-tools"></i>
          </button>
        );
        break;
      default:
        break;
    }

    return buttons;
  };

  return (
    <div className="dashboard-content">
      <div className="container-fluid">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
            <i className="bi bi-exclamation-triangle me-2" />
            <strong>Error:</strong> {error}
            <button type="button" className="btn-close" onClick={() => { }} aria-label="Close"></button>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h1 className="h3 fw-bold mb-1">Library Assets</h1>
              <p className="text-muted mb-0">Manage and organize your library's digital and physical resources</p>
            </div>
            {/* Action Buttons: Uses flex-wrap for small screens */}
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-outline-primary" onClick={() => exportToCSV()}>
                <i className="bi bi-download me-1"></i>
                Export
              </button>
              <Link to="/add-library-assets" className="btn btn-primary">
                <i className="bi bi-plus-lg me-1"></i>
                Add Asset
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="dashboard-row">
          <div className="dashboard-card p-0">
            <div className="dashboard-card-header">
              <h5 className="dashboard-card-title">Filter Assets</h5>
            </div>
            <div className="dashboard-card-body">
              <div className="d-flex flex-wrap gap-3">
                <div >
                  <label htmlFor="categoryFilter" className="form-label">Category</label>
                  <select
                    className="form-select"
                    id="categoryFilter"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Categories</option>
                    <option value="books">Books</option>
                    <option value="journals">Journals</option>
                    <option value="digital">Digital Media</option>
                    <option value="reference">Reference Materials</option>
                    <option value="periodicals">Periodicals</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label htmlFor="statusFilter" className="form-label">Status</label>
                  <select
                    className="form-select"
                    id="statusFilter"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Status</option>
                    <option value="available">Available</option>
                    <option value="checked-out">Checked Out</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="missing">Missing</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label htmlFor="locationFilter" className="form-label">Location</label>
                  <select
                    className="form-select"
                    id="locationFilter"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Locations</option>
                    <option value="main-library">Main Library</option>
                    <option value="science-library">Science Library</option>
                    <option value="medical-library">Medical Library</option>
                    <option value="digital-archive">Digital Archive</option>
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <div className="d-flex gap-2 w-100">
                    <button className="btn btn-primary flex-grow-1">
                      <i className="bi bi-funnel me-1"></i>
                      Filter
                    </button>
                    <button className="btn btn-outline-secondary" onClick={handleRefresh} title="Reset filters">
                      <i className="bi bi-arrow-clockwise"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-12 d-flex justify-content-between align-items-center">
                  <div className="text-muted small">
                    Showing {assets.length} of {pagination.total} assets
                  </div>
                  <div className="view-toggle btn-group" role="group" aria-label="View options">
                    <input
                      type="radio"
                      className="btn-check"
                      name="viewMode"
                      id="gridView"
                      checked={viewMode === 'grid'}
                      onChange={() => setViewMode('grid')}
                    />
                    <label className="btn btn-outline-secondary btn-sm" htmlFor="gridView">
                      <i className="bi bi-grid-3x2"></i>
                    </label>
                    <input
                      type="radio"
                      className="btn-check"
                      name="viewMode"
                      id="listView"
                      checked={viewMode === 'list'}
                      onChange={() => setViewMode('list')}
                    />
                    <label className="btn btn-outline-secondary btn-sm" htmlFor="listView">
                      <i className="bi bi-list"></i>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assets Grid/List */}
        <div className="dashboard-row">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            viewMode === 'grid' ? (
              <div className="row g-3" id="assetsContainer">
                {assets.length === 0 ? (
                  <div className="col-12 text-center py-5">
                    <i className="bi bi-book display-4 text-muted mb-3"></i>
                    <h5 className="text-muted">No Assets Found</h5>
                    <p className="text-muted">There are no library assets in the database yet.</p>
                   
                  </div>
                ) : (
                  assets.map((asset) => (
                    <div key={asset.id} className="col-lg-4 col-md-6 col-sm-12">
                      <div className="asset-card h-100 shadow-sm hover-shadow" style={{
                        transition: 'all 0.3s ease',
                        border: '1px solid #e0e0e0',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        backgroundColor: 'white'
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-8px)';
                          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '';
                        }}>
                        <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#f5f5f5', height: '200px' }}>
                          <img
                            src={asset.cover_image ? `http://localhost:5000/images/${asset.cover_image}` : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=face'}
                            className="card-img-top asset-image"
                            alt={asset.title}
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            <small className={`asset-status ${getStatusBadgeClass(asset.status)}`} style={{ color: 'white' }}>
                              {asset.status.replace('-', ' ').toUpperCase()}
                            </small>
                          </div>
                        </div>
                        <div className="card-body p-3">
                          <h6 className="card-title mb-1" style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {asset.title}
                          </h6>
                          <p className="card-text text-muted small mb-2" style={{ height: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            by {asset.authors || 'Unknown Author'}
                          </p>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px',
                            marginBottom: '12px',
                            fontSize: '0.85rem'
                          }}>
                            <div>
                              <small className="text-muted d-block">ISBN</small>
                              <small style={{ color: '#333', fontWeight: '500' }}>{asset.isbn_issn ? asset.isbn_issn.substring(0, 10) + '...' : 'N/A'}</small>
                            </div>
                            <div>
                              <small className="text-muted d-block">Copies</small>
                              <small style={{ color: '#333', fontWeight: '500' }}>{asset.copies} available</small>
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '12px',
                            borderTop: '1px solid #f0f0f0'
                          }}>
                            <small className="text-muted">
                              <i className="bi bi-geo-alt me-1"></i>
                              {asset.location.replace('-', ' ').substring(0, 12)}
                            </small>
                          </div>

                          <div className="d-flex gap-2 mt-3">
                            {getActionButtons(asset).map((btn, idx) => (
                              <div key={idx} style={{ flex: '1' }}>
                                {btn}
                              </div>
                            ))}
                            <button
                              className="btn btn-outline-danger btn-sm flex-grow-1"
                              title="Delete"
                              onClick={() => handleDeleteAsset(asset.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="list-view" id="assetsContainer">
                {assets.length === 0 ? (
                  <div className="col-12 text-center py-5">
                    <i className="bi bi-book display-4 text-muted mb-3"></i>
                    <h5 className="text-muted">No Assets Found</h5>
                    <p className="text-muted">There are no library assets in the database yet.</p>
                   
                  </div>
                ) : (
                  assets.map((asset) => (
                    <div key={asset.id} className="col-12">
                      <div className="card shadow-sm asset-card">
                        <div className="card-body p-2 d-flex align-items-center">
                          {/* Image (Visible on all but extra small screens) */}
                          <div className="d-none d-sm-block me-3" style={{ width: '80px', height: '80px', overflow: 'hidden' }}>
                            <img
                              src={asset.cover_image ? `http://localhost:5000/images/${asset.cover_image}` : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop'}
                              alt={asset.title}
                              className="img-fluid rounded"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>

                          {/* Main Info */}
                          <div className="flex-grow-1 me-3">
                            <h6 className="mb-1 fw-bold text-truncate" title={asset.title}>
                              {asset.title}
                            </h6>
                            <p className="text-muted small mb-1 text-truncate d-none d-md-block">
                              by {asset.authors || 'Unknown Author'}
                            </p>
                            <p className="text-muted small mb-0 d-block d-md-none text-truncate">
                              <i className="bi bi-book me-1"></i> {asset.category} | {asset.copies} copies
                            </p>
                          </div>

                          {/* Status & Location (Hidden on XS, Visible on SM+) */}
                          <div className="d-none d-sm-block me-3 text-center" style={{ minWidth: '100px' }}>
                            <span className={`badge ${getStatusBadgeClass(asset.status)} text-uppercase fw-bold mb-1 d-block`}>
                              {asset.status.replace('-', ' ')}
                            </span>
                            <small className="text-muted text-truncate d-block">{asset.location.replace('-', ' ')}</small>
                          </div>

                          {/* Actions - Always grouped and visible */}
                          <div className="d-flex gap-2 flex-wrap justify-content-end" style={{ minWidth: '120px' }}>
                            {getActionButtons(asset).map((btn, idx) => (
                              <div key={idx} className="flex-fill">
                                {btn}
                              </div>
                            ))}
                            <button
                              className="btn btn-outline-danger btn-sm flex-fill"
                              title="Delete"
                              onClick={() => handleDeleteAsset(asset.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          )}
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="dashboard-row">
            <nav aria-label="Library assets pagination">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    aria-label="Previous"
                  >
                    <span aria-hidden="true">&laquo;</span>
                  </button>
                </li>
                {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => i + 1).map((page) => (
                  <li key={page} className={`page-item ${page === pagination.page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(page)}>
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${pagination.page === Math.ceil(pagination.total / pagination.limit) ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    aria-label="Next"
                  >
                    <span aria-hidden="true">&raquo;</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Asset Details Modal */}
        {showModal && selectedAsset && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-truncate" title={selectedAsset.title}>Asset Details: {selectedAsset.title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-4">

                    {/* 1. Asset Image (col-12 on mobile, col-md-5 on tablet, col-lg-4 on desktop) */}
                    <div className="col-12 col-md-5 col-lg-4 text-center">
                      <img
                        src={selectedAsset.cover_image ? `http://localhost:5000/images/${selectedAsset.cover_image}` : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=cover'}
                        className="img-fluid rounded mb-3"
                        alt={selectedAsset.title}
                        style={{ width: '100%', objectFit: 'cover' }}
                      />
                      <span className={`badge ${getStatusBadgeClass(selectedAsset.status)} fs-6`}>
                        {selectedAsset.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* 2. Asset Information (col-12 on mobile, col-md-7 on tablet, col-lg-8 on desktop) */}
                    <div className="col-12 col-md-7 col-lg-8">
                      {/* Inner row for details: Forces two fields per line (col-6) regardless of screen size, except for col-12 overrides. */}
                      <div className="row g-3 small">

                        {/* Row 1: Title & Category */}
                        <div className="col-12 col-sm-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Title</label>
                            <p className="mb-0 text-break">{selectedAsset.title}</p>
                          </div>
                        </div>
                        <div className="col-12 col-sm-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Category</label>
                            <p className="mb-0">{selectedAsset.category}</p>
                          </div>
                        </div>

                        {/* Row 2: Authors & Publisher */}
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Authors</label>
                            <p className="mb-0">{selectedAsset.authors || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Publisher</label>
                            <p className="mb-0">{selectedAsset.publisher || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Row 3: ISBN/ISSN & Edition */}
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">ISBN/ISSN</label>
                            <p className="mb-0">{selectedAsset.isbn_issn || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Edition</label>
                            <p className="mb-0">{selectedAsset.edition || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Row 4: Publication Year & Language */}
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Publication Year</label>
                            <p className="mb-0">{selectedAsset.publication_year || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Language</label>
                            <p className="mb-0">{selectedAsset.language || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Row 5: Pages & Copies */}
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Pages</label>
                            <p className="mb-0">{selectedAsset.pages || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Copies</label>
                            <p className="mb-0">{selectedAsset.copies}</p>
                          </div>
                        </div>

                        {/* Row 6: Price & Location */}
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Price</label>
                            <p className="mb-0">${selectedAsset.price}</p>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Location</label>
                            <p className="mb-0">{selectedAsset.location.replace('-', ' ').toUpperCase()}</p>
                          </div>
                        </div>

                        {/* Row 7: Call Number & Barcode */}
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Call Number</label>
                            <p className="mb-0">{selectedAsset.call_number || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Barcode</label>
                            <p className="mb-0">{selectedAsset.barcode || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Row 8: Acquisition Date (Full width on mobile/tablet) */}
                        <div className="col-12 col-md-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Acquisition Date</label>
                            <p className="mb-0">{selectedAsset.acquisition_date ? new Date(selectedAsset.acquisition_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>

                        {/* Full Width Sections: Subjects, Description, Notes */}
                        <div className="col-12">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Subjects</label>
                            <p className="mb-0">{selectedAsset.subjects || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Description</label>
                            <p className="mb-0">{selectedAsset.description || 'No description available.'}</p>
                          </div>
                        </div>
                        {selectedAsset.internal_notes && (
                          <div className="col-12">
                            <div className="mb-2">
                              <label className="form-label fw-bold mb-0">Internal Notes</label>
                              <p className="mb-0 text-muted">{selectedAsset.internal_notes}</p>
                            </div>
                          </div>
                        )}

                        {/* Audit Timestamps (col-6 on all screens) */}
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Created At</label>
                            <p className="mb-0">{new Date(selectedAsset.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold mb-0">Updated At</label>
                            <p className="mb-0">{new Date(selectedAsset.updated_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer d-flex flex-wrap">
                  <Link
                    to={`/edit-library-assets/${selectedAsset.id}`}
                    className="btn btn-outline-primary flex-fill flex-sm-grow-0"
                    onClick={() => setShowModal(false)}
                  >
                    <i className="bi bi-pencil me-1"></i> Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary flex-fill flex-sm-grow-0"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {/* Use modal-dialog-centered for vertical centering */}
          <div className="modal-dialog modal-sm modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-trash-fill me-2"></i> {/* Added Trash Icon */}
                  Confirm Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white" // Added btn-close-white for better contrast
                  onClick={() => setShowConfirmModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {/* Added warning icon to the body text */}
                <p className="d-flex align-items-start">
                  <i className="bi bi-exclamation-triangle-fill text-danger fs-5 me-3"></i>
                  <span>Are you sure you want to delete this asset? This action **cannot be undone**.</span>
                </p>
              </div>
              <div className="modal-footer d-flex flex-column flex-sm-row gap-2"> {/* Responsive button stacking */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm flex-fill" // Added flex-fill for mobile stretch
                  onClick={() => setShowConfirmModal(false)}
                >
                  <i className="bi bi-x-circle me-1"></i> Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm flex-fill" // Added flex-fill for mobile stretch
                  onClick={() => {
                    if (confirmAction) {
                      confirmAction();
                    }
                    setShowConfirmModal(false);
                  }}
                >
                  <i className="bi bi-check-lg me-1"></i> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryAssets;
