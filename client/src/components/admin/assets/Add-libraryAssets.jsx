import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createAsset, clearError, clearSuccess } from '../../../redux/slices/assetsSlice';
import { toast } from 'react-toastify';
import '../../../css/dashboard.css';

const AddLibraryAssets = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector(state => state.assets);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    author: '',
    publisher: '',
    isbn: '',
    edition: '',
    year: '',
    description: '',
    location: '',
    status: 'available',
    copies: 1,
    price: 0,
    acquisitionDate: '',
    callNumber: '',
    barcode: '',
    language: 'english',
    pages: '',
    subjects: '',
    notes: ''
  });

  const [coverImage, setCoverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [validated, setValidated] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Handle success and error toasts
  useEffect(() => {
    if (success) {
      toast.success('Asset created successfully!');
      dispatch(clearSuccess());
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file input
  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image input change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setCoverImage(null);
    setImagePreview(null);
  };

  // Auto-generate barcode when title changes
  const handleTitleBlur = () => {
    if (!formData.barcode && formData.title) {
      const timestamp = Date.now();
      const titleCode = formData.title.substring(0, 3).toUpperCase();
      const generatedBarcode = `LIB${titleCode}${timestamp}`.slice(-12);
      setFormData(prev => ({
        ...prev,
        barcode: generatedBarcode
      }));
    }
  };

  // Fill sample data
  const handleFillSampleData = () => {
    setFormData({
      title: 'Introduction to Computer Science',
      category: 'books',
      author: 'Thomas H. Cormen, Charles E. Leiserson',
      publisher: 'MIT Press',
      isbn: '978-0-262-03384-8',
      edition: '4th',
      year: '2022',
      description: 'A comprehensive introduction to computer algorithms and data structures.',
      location: 'main-library',
      status: 'available',
      copies: 3,
      price: 89.99,
      acquisitionDate: '',
      callNumber: 'QA76.6.C662',
      barcode: '',
      language: 'english',
      pages: 1312,
      subjects: 'Computer Science, Algorithms, Data Structures, Programming',
      notes: ''
    });
  };

  // Unconditional helper to reset the form
  const clearForm = () => {
    setFormData({
      title: '',
      category: '',
      author: '',
      publisher: '',
      isbn: '',
      edition: '',
      year: '',
      description: '',
      location: '',
      status: 'available',
      copies: 1,
      price: 0,
      acquisitionDate: '',
      callNumber: '',
      barcode: '',
      language: 'english',
      pages: '',
      subjects: '',
      notes: ''
    });
    setCoverImage(null);
    setImagePreview(null);
    setValidated(false);
  };

  // Triggered by Clear button: clear form immediately
  const handleClearForm = () => {
    clearForm();
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.currentTarget.checkValidity()) {
      setValidated(true);
      return;
    }

    setSubmitLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append image if selected
      if (coverImage) {
        formDataToSend.append('coverImage', coverImage);
      }

      // Dispatch Redux action
      const result = await dispatch(createAsset(formDataToSend)).unwrap();

      if (result.success) {
        toast.success('Asset added successfully!');
        navigate('/library-assets');
      }
    } catch (err) {
      toast.error(err.message || 'Error creating asset');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Save and add another
  const handleSaveAndAddAnother = async (e) => {
    e.preventDefault();

    if (!document.getElementById('addAssetForm').checkValidity()) {
      setValidated(true);
      return;
    }

    setSubmitLoading(true);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (coverImage) {
        formDataToSend.append('coverImage', coverImage);
      }

      const result = await dispatch(createAsset(formDataToSend)).unwrap();

      if (result.success) {
        // Reset form for new entry (no confirmation)
        clearForm();
        setValidated(false);
        toast.success('Asset saved! Ready to add another.');
      }
    } catch (err) {
      toast.error(err.message || 'Error creating asset');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="container-fluid">


        {/* Page Header */}
        <div className="dashboard-card mb-3">
          <div className="dashboard-card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-1">Add Library Asset</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    {/* <li className="breadcrumb-item"><a href="/">Dashboard</a></li> */}
                    {/* <li className="breadcrumb-item"><a href="#library">Library</a></li> */}
                    <li className="breadcrumb-item"><a href="/library-assets">Assets</a></li>
                    <li className="breadcrumb-item active" aria-current="page">Add Asset</li>
                  </ol>
                </nav>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate('/library-assets')}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to Assets
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alert for Form Instructions */}
        <div className="alert alert-info mb-4" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          Fill in the required fields marked with <span className="text-danger">*</span> to add a new library asset. You can always edit this information later.
        </div>

        {/* Add Asset Form */}
        <form
          id="addAssetForm"
          onSubmit={handleSubmit}
          noValidate
          className={validated ? 'was-validated' : ''}
        >
          <div className="row g-3">
            <div className="">
              {/* Basic Information */}
              <div className="dashboard-card">
                <div className="dashboard-card-header">
                  <h5 className="dashboard-card-title">
                    <i className="bi bi-info-circle me-2"></i>
                    Basic Information
                  </h5>
                </div>
                <div className="dashboard-card-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label htmlFor="assetTitle" className="form-label">
                        Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="assetTitle"
                        name="title"
                        placeholder="Enter asset title"
                        value={formData.title}
                        onChange={handleInputChange}
                        onBlur={handleTitleBlur}
                        required
                        aria-describedby="titleHelp"
                      />
                      <div className="invalid-feedback">
                        Please provide a valid title.
                      </div>
                      <small id="titleHelp" className="form-text text-muted">
                        The main title of the book, journal, or media.
                      </small>
                    </div>
                    <div className="col-12 ">
                      <label htmlFor="assetCategory" className="form-label">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="assetCategory"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select category</option>
                        <option value="books">Books</option>
                        <option value="journals">Journals</option>
                        <option value="digital">Digital Media</option>
                        <option value="reference">Reference Materials</option>
                        <option value="periodicals">Periodicals</option>
                        <option value="audio">Audio Materials</option>
                        <option value="video">Video Materials</option>
                      </select>
                      <div className="invalid-feedback">
                        Please select a category.
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12">
                      <label htmlFor="assetAuthor" className="form-label">Author(s)</label>
                      <input
                        type="text"
                        className="form-control"
                        id="assetAuthor"
                        name="author"
                        placeholder="Enter author name(s)"
                        value={formData.author}
                        onChange={handleInputChange}
                        aria-describedby="authorHelp"
                      />
                      <small id="authorHelp" className="form-text text-muted">
                        Separate multiple authors with commas.
                      </small>
                    </div>
                    <div className="col-12">
                      <label htmlFor="assetPublisher" className="form-label">Publisher</label>
                      <input
                        type="text"
                        className="form-control"
                        id="assetPublisher"
                        name="publisher"
                        placeholder="Enter publisher name"
                        value={formData.publisher}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <label htmlFor="assetISBN" className="form-label">ISBN/ISSN</label>
                      <input
                        type="text"
                        className="form-control"
                        id="assetISBN"
                        name="isbn"
                        placeholder="978-0-123456-78-9"
                        value={formData.isbn}
                        onChange={handleInputChange}
                        aria-describedby="isbnHelp"
                      />
                      <small id="isbnHelp" className="form-text text-muted">
                        International Standard Book/Serial Number.
                      </small>
                    </div>
                    <div className="col-12 col-md-4">
                      <label htmlFor="assetEdition" className="form-label">Edition</label>
                      <input
                        type="text"
                        className="form-control"
                        id="assetEdition"
                        name="edition"
                        placeholder="1st, 2nd, etc."
                        value={formData.edition}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label htmlFor="assetYear" className="form-label">Publication Year</label>
                      <input
                        type="number"
                        className="form-control"
                        id="assetYear"
                        name="year"
                        placeholder="2025"
                        min="1900"
                        max="2030"
                        value={formData.year}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="assetDescription" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="assetDescription"
                      name="description"
                      rows="4"
                      placeholder="Enter a brief description of the asset..."
                      value={formData.description}
                      onChange={handleInputChange}
                      aria-describedby="descHelp"
                    ></textarea>
                    <small id="descHelp" className="form-text text-muted">
                      Provide a summary, table of contents, or key topics covered.
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-4">
              {/* Cover Image */}
              <div className="card mb-4">
  <div className="card-header d-flex align-items-center justify-content-between">
    <h5 className="card-title mb-0">
      <i className="bi bi-image me-2"></i>Cover Image
    </h5>
    {imagePreview && (
      <button
        type="button"
        className="btn btn-outline-danger btn-sm"
        onClick={handleRemoveImage}
      >
        <i className="bi bi-trash me-1"></i> Remove
      </button>
    )}
  </div>

  <div className="card-body d-flex justify-content-center">
    {imagePreview ? (
      <img
        src={imagePreview}
        alt="Cover preview"
        className="img-fluid rounded preview-image"
        style={{ maxHeight: '250px', width: 'auto', objectFit: 'contain' }}
      />
    ) : (
      <div
        className="border border-dashed rounded p-4 d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: '200px', cursor: 'pointer' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('coverImageInput').click()}
      >
        <i className="bi bi-cloud-upload fs-1 text-muted mb-3"></i>
        <p className="mb-2 text-center">
          Drop image here or{' '}
          <span className="text-primary" style={{ textDecoration: 'underline', cursor: 'pointer' }}>
            browse files
          </span>
        </p>
        <small className="text-muted text-center">
          Recommended: 300x400px, JPG or PNG, max 5MB
        </small>
        <input
          type="file"
          id="coverImageInput"
          name="coverImage"
          accept="image/*"
          className="d-none"
          onChange={handleImageChange}
        />
      </div>
    )}
  </div>
</div>

            </div>
          </div>

          {/* Library Details */}
          <div className="dashboard-card mb-3 mt-4">
            <div className="dashboard-card-header">
              <h5 className="dashboard-card-title">
                <i className="bi bi-building me-2"></i>
                Library Details
              </h5>
            </div>
            <div className="dashboard-card-body">
              <div className="row g-3 mb-3">
                <div className="col-12 ">
                  <label htmlFor="assetLocation" className="form-label">
                    Location <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="assetLocation"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select location</option>
                    <option value="main-library">Main Library</option>
                    <option value="science-library">Science Library</option>
                    <option value="medical-library">Medical Library</option>
                    <option value="digital-archive">Digital Archive</option>
                    <option value="reference-section">Reference Section</option>
                    <option value="periodicals-section">Periodicals Section</option>
                  </select>
                  <div className="invalid-feedback">
                    Please select a location.
                  </div>
                </div>
                <div className="col-12 ">
                  <label htmlFor="assetStatus" className="form-label">
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="assetStatus"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select status</option>
                    <option value="available">Available</option>
                    <option value="checked-out">Checked Out</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="missing">Missing</option>
                    <option value="damaged">Damaged</option>
                  </select>
                  <div className="invalid-feedback">
                    Please select a status.
                  </div>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-md-4">
                  <label htmlFor="assetCopies" className="form-label">Number of Copies</label>
                  <input
                    type="number"
                    className="form-control"
                    id="assetCopies"
                    name="copies"
                    placeholder="1"
                    min="1"
                    value={formData.copies}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label htmlFor="assetPrice" className="form-label">Purchase Price</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className="form-control"
                      id="assetPrice"
                      name="price"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-12">
                  <label htmlFor="assetAcquisition" className="form-label">Acquisition Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="assetAcquisition"
                    name="acquisitionDate"
                    value={formData.acquisitionDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <label htmlFor="assetCallNumber" className="form-label">Call Number</label>
                  <input
                    type="text"
                    className="form-control"
                    id="assetCallNumber"
                    name="callNumber"
                    placeholder="e.g., QA76.73.P98"
                    value={formData.callNumber}
                    onChange={handleInputChange}
                    aria-describedby="callHelp"
                  />
                  <small id="callHelp" className="form-text text-muted">
                    Library classification number for shelving.
                  </small>
                </div>
                <div className="col-12">
                  <label htmlFor="assetBarcode" className="form-label">Barcode</label>
                  <input
                    type="text"
                    className="form-control"
                    id="assetBarcode"
                    name="barcode"
                    placeholder="Auto-generated if empty"
                    value={formData.barcode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h5 className="dashboard-card-title">
                <i className="bi bi-plus-circle me-2"></i>
                Additional Information
              </h5>
            </div>
            <div className="dashboard-card-body">
              <div className="row g-3 mb-3">
                <div className="col-12">
                  <label htmlFor="assetLanguage" className="form-label">Language</label>
                  <select
                    className="form-select"
                    id="assetLanguage"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                  >
                    <option value="">Select language</option>
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="chinese">Chinese</option>
                    <option value="japanese">Japanese</option>
                    <option value="arabic">Arabic</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-12">
                  <label htmlFor="assetPages" className="form-label">Number of Pages</label>
                  <input
                    type="number"
                    className="form-control"
                    id="assetPages"
                    name="pages"
                    placeholder="e.g., 350"
                    min="1"
                    value={formData.pages}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="assetSubjects" className="form-label">Subject Keywords</label>
                <input
                  type="text"
                  className="form-control"
                  id="assetSubjects"
                  name="subjects"
                  placeholder="Enter keywords separated by commas"
                  value={formData.subjects}
                  onChange={handleInputChange}
                  aria-describedby="subjectsHelp"
                />
                <small id="subjectsHelp" className="form-text text-muted">
                  e.g., Computer Science, Programming, Algorithms, Data Structures
                </small>
              </div>

              <div className="mb-3">
                <label htmlFor="assetNotes" className="form-label">Internal Notes</label>
                <textarea
                  className="form-control"
                  id="assetNotes"
                  name="notes"
                  rows="3"
                  placeholder="Any special notes for library staff..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  aria-describedby="notesHelp"
                ></textarea>
                <small id="notesHelp" className="form-text text-muted">
                  Private notes visible only to library staff.
                </small>
              </div>
            </div>
          </div>

          {/* Actions Section - At the Bottom */}
          <div className="dashboard-card mt-4" >
            <div className="dashboard-card-header">
              <h5 className="dashboard-card-title">
                <i className="bi bi-gear me-2"></i>
                Actions
              </h5>
            </div>
            <div className="dashboard-card-body" style={{ padding: '12px' }}>
              <div className="d-grid gap-1">
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Save Asset
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={handleSaveAndAddAnother}
                  disabled={submitLoading}
                >
                  <i className="bi bi-plus-lg me-2"></i>
                  Save & Add Another
                </button>
                {/* <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-sm"
                  disabled={submitLoading}
                >
                  <i className="bi bi-eye me-2"></i>
                  Preview
                </button> */}
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => navigate('/library-assets')}
                  disabled={submitLoading}
                >
                  <i className="bi bi-x-lg me-2"></i>
                  Cancel
                </button>
                {/* <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleFillSampleData}
                  disabled={submitLoading}
                >
                  <i className="bi bi-magic me-1"></i>
                  Fill Sample Data
                </button> */}
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleClearForm}
                  disabled={submitLoading}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Clear Form
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLibraryAssets;
