import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses, deleteCourse, clearError, clearSuccess } from '../../../redux/slices/courseSlice';
import { fetchDepartments } from '../../../redux/slices/departmentSlice';
import { toast } from 'react-toastify';
import '../../../css/dashboard.css';

const AllCourse = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { courses, loading, error, success, pagination } = useSelector(state => state.course);
	const { departments, loading: departmentsLoading } = useSelector(state => state.department);
	const [currentPage, setCurrentPage] = useState(pagination?.page ?? 1);
	const [limit, setLimit] = useState(pagination?.limit ?? 6);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
	const [filters, setFilters] = useState({
		department: '',
		semester: '',
		status: '',
	});
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [courseToDelete, setCourseToDelete] = useState(null);
	const [toastShown, setToastShown] = useState(false);

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500); // 500ms delay

		return () => clearTimeout(timer);
	}, [searchTerm]);

	// Handle success and error toasts
	useEffect(() => {
		if (success && !toastShown) {
			toast.success('Course deleted successfully!');
			setToastShown(true);
			// Delay clearing success to allow toast to display
			setTimeout(() => {
				dispatch(clearSuccess());
			}, 1000);
		}
	}, [success, toastShown, dispatch]);

	useEffect(() => {
		if (error) {
			toast.error(error);
			dispatch(clearError());
		}
	}, [error, dispatch]);

	// fetch courses when page, limit, or filters change
	useEffect(() => {
		const offset = (currentPage - 1) * limit;
		// Build query params with filters
		const params = {
			limit,
			offset,
			...(filters.department && { department: filters.department }),
			...(filters.semester && { semester: filters.semester }),
			...(filters.status && { status: filters.status }),
			...(debouncedSearchTerm && { search: debouncedSearchTerm }),
		};
		dispatch(fetchCourses(params));
	}, [dispatch, currentPage, limit, filters, debouncedSearchTerm]);

	// fetch departments once on mount so department filter is dynamic
	useEffect(() => {
		dispatch(fetchDepartments());
	}, [dispatch]);

	// DOM effects for lazy loading images and checkbox behavior when courses change
	useEffect(() => {
		// Lazy load images that are not immediately visible
		const images = document.querySelectorAll('img[src*="unsplash"], img[src*="ui-avatars"], img[src*="/images/"]');
		images.forEach(img => {
			if (!img.hasAttribute('loading')) {
				img.setAttribute('loading', 'lazy');
			}
		});



		// PerformanceObserver for LCP (non-critical)
		let observer;
		if ('PerformanceObserver' in window) {
			try {
				observer = new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						console.log('LCP:', entry.startTime, 'ms');
					}
				});
				observer.observe({ type: 'largest-contentful-paint', buffered: true });
			} catch (e) {
				// ignore
			}
		}

		return () => {
			if (observer && observer.disconnect) observer.disconnect();
		};
	}, [courses]);

	// Handle filter changes
	const handleFilterChange = (e) => {
		const { id, value } = e.target;
		setFilters(prev => ({
			...prev,
			[id.replace('Filter', '')]: value,
		}));
		// Reset to page 1 when filter changes
		setCurrentPage(1);
	};

	// Handle search
	const handleSearch = (e) => {
		setSearchTerm(e.target.value);
		// Reset to page 1 when search changes
		setCurrentPage(1);
	};

	// Handle clear filters
	const handleClearFilters = () => {
		setFilters({
			department: '',
			semester: '',
			status: '',
		});
		setSearchTerm('');
		setCurrentPage(1);
	};

	// Handle delete course (open confirmation modal)
	const handleDelete = (course) => {
		setCourseToDelete(course);
		setShowDeleteModal(true);
	};

	const confirmDelete = () => {
		if (courseToDelete) {
			dispatch(deleteCourse(courseToDelete.id));
			setToastShown(false); // Reset flag for next delete
		}
		setShowDeleteModal(false);
		setCourseToDelete(null);
	};

	const cancelDelete = () => {
		setShowDeleteModal(false);
		setCourseToDelete(null);
	};

	// Handle view course details
	const handleViewCourse = (course) => {
		setSelectedCourse(course);
		setShowModal(true);
	};

	// Close modal
	const closeModal = () => {
		setShowModal(false);
		setSelectedCourse(null);
	};

	// Export courses to CSV
	const exportToCSV = (data = courses, filename = 'courses.csv') => {
		if (!data || data.length === 0) {
			toast.info('No data available to export');
			return;
		}

		const rows = data.map(c => ({
			'Course Code': c.courseCode || '',
			'Course Name': c.courseName || '',
			'Department': c.department || '',
			'Professor': c.professorName || '',
			'Credits': c.credits ?? '',
			'Students': c.enrolledStudents ?? c.enrolled_students ?? 0,
			'Max Capacity': c.maxStudents ?? c.max_students ?? 0,
			'Semester': c.semester || '',
			'Status': c.courseStatus || '',
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
	};

	return (
		<div className="container-fluid">
			{/* Error Alert */}
			{error && (
				<div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
					<i className="bi bi-exclamation-triangle me-2" />
					<strong>Error:</strong> {error}
					<button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
				</div>
			)}

			{/* Page Header */}
			<div className="mb-3">
				
				<div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
					<div>
						<h1 className="h3 font-bold mb-1">All Courses</h1>
						<p className="text-muted mb-2 mb-md-0">Manage your institution's course catalog</p>
					</div>
					<div className="d-flex gap-2 flex-wrap">
						<button className="btn btn-primary" onClick={() => navigate('/add-course')}>
							<i className="bi bi-plus-circle me-2" /> Add Course
						</button>
						<button className="btn btn-outline-secondary" onClick={() => exportToCSV()}>
							<i className="bi bi-download me-2" /> Export
						</button>
					</div>
				</div>
			</div>

			{/* Stats Row (dynamic) */}
			{(() => {
				// Ensure courses is an array
				const courseArray = Array.isArray(courses) ? courses : [];
				const totalCourses = pagination?.total ?? courseArray.length;
				const activeCourses = courseArray.filter(c => (c.courseStatus || '').toLowerCase() === 'active').length;

				return (
					<div className="dashboard-grid grid-cols-2 mb-3">
						<div className="stats-card">
							<div className="stats-card-label">Total Courses</div>
							<div className="stats-card-value">{totalCourses}</div>

						</div>
						<div className="stats-card">
							<div className="stats-card-label">Active Courses</div>
							<div className="stats-card-value">{activeCourses}</div>

						</div>

					</div>
				);
			})()}
			{/* Filters Row */}
			<div className="dashboard-card mb-3 p-3">
				{/* d-flex flex-wrap: Ensures elements wrap onto the next line on mobile */}
				{/* gap-3: Provides consistent spacing between wrapped elements */}
				<div className="d-flex flex-wrap gap-3 align-items-end">

					{/* Department Filter */}
					<div className="flex-grow-1" style={{ minWidth: '120px', maxWidth: '300px' }}>
						<label htmlFor="departmentFilter" className="form-label small">Department</label>
						<select className="form-select" id="departmentFilter" value={filters.department} onChange={handleFilterChange}>
							<option value="">{departmentsLoading ? 'Loading departments...' : 'All Departments'}</option>
							{Array.isArray(departments) && departments.map((dept) => (
								<option key={dept.id} value={dept.departmentName}>{dept.departmentName}</option>
							))}
						</select>
					</div>

					{/* Semester Filter */}
					<div className="flex-grow-1" style={{ minWidth: '120px', maxWidth: '300px' }}>
						<label htmlFor="semesterFilter" className="form-label small">Semester</label>
						<select className="form-select" id="semesterFilter" value={filters.semester} onChange={handleFilterChange}>
							<option value="">All Semesters</option>
							<option value="fall2025">Fall 2025</option>
							<option value="spring2025">Spring 2025</option>
							<option value="summer2025">Summer 2025</option>
						</select>
					</div>

					{/* Status Filter */}
					<div className="flex-grow-1" style={{ minWidth: '120px', maxWidth: '300px' }}>
						<label htmlFor="statusFilter" className="form-label small">Status</label>
						<select className="form-select" id="statusFilter" value={filters.status} onChange={handleFilterChange}>
							<option value="">All Status</option>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
							<option value="completed">Completed</option>
						</select>
					</div>

					{/* Search Field with Clear Button (flexible width) */}
					<div className="flex-grow-1">
						<label htmlFor="searchFilter" className="form-label small">Search</label>
						<div className="input-group">
							<input
								type="text"
								className="form-control"
								id="searchFilter"
								placeholder="Search courses..."
								value={searchTerm}
								onChange={handleSearch}
							/>
							{/* Clear button now clears all filters/search, making it highly valuable */}
							<button className="btn btn-outline-secondary" type="button" onClick={handleClearFilters}>
								<i className="bi bi-x-circle" />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Courses Table */}
			{/* prof-dir-container bg-white p-1 rounded-3 shadow-sm */}
			<div className="dashboard-card"> 
				<div className="table-responsive">
					<table className="table table-hover align-middle">
						<thead>
							<tr>
								<th scope="col">Course Code</th>
								<th scope="col">Course Name</th>
								<th scope="col">Department</th>
								<th scope="col">Professor</th>
								<th scope="col">Credits</th>
								<th scope="col">Students</th>
								<th scope="col">Status</th>
								<th scope="col">Actions</th>
							</tr>
						</thead>
						<tbody>
							{/* Dynamic rows from Redux store */}
							{loading ? (
								<tr>
									<td colSpan={8} className="text-center py-4">
										<div className="spinner-border text-primary" role="status">
											<span className="visually-hidden">Loading...</span>
										</div>
									</td>
								</tr>
							) : error ? (
								<tr>
									<td colSpan={8} className="text-center text-danger py-4">{error}</td>
								</tr>
							) : (courses && courses.length > 0) ? (
								courses.map(course => {
									let imgSrc;
									if (course.courseImage) {
										const ci = String(course.courseImage).trim();
										if (/^https?:\/\//i.test(ci) || /^\/\//.test(ci)) {
											imgSrc = ci;
										} else if (ci.startsWith('/')) {
											imgSrc = ci;
										} else {
											imgSrc = `http://localhost:5000/images/${ci}`;
										}
									} else {
										imgSrc = `https://images.unsplash.com/photo-1522227802361-1a7a9d6f0f6b?w=50&h=50&fit=crop`;
									}
									const professorName = course.professorName || 'Unknown';
									const studentsCount = Number(course.enrolledStudents ?? course.enrolled_students ?? 0);
									const capacity = Number(course.maxStudents ?? course.max_students ?? 0);
									const progressPct = capacity > 0 ? Math.round((studentsCount / capacity) * 100) : 0;
									const status = (course.courseStatus || '').toLowerCase();
									const statusClass = status === 'active' ? 'bg-success' : status === 'full' ? 'bg-warning' : status === 'inactive' ? 'bg-secondary' : 'bg-secondary';

									return (
										<tr key={course.id}>

											<td className="fw-semibold">{course.courseCode}</td>
											<td>
												<div className="d-flex align-items-center">
													<img src={imgSrc} alt="Course" className="rounded me-3" width="40" height="40" loading="lazy" />
													<div>
														<div className="fw-semibold">{course.courseName}</div>
														<small className="text-muted">
															{(() => {
																try {
																	const cd = course.classDays;
																	if (Array.isArray(cd)) return cd.join(', ');
																	if (typeof cd === 'string') {
																		// try parse JSON string
																		const parsed = JSON.parse(cd);
																		if (Array.isArray(parsed)) return parsed.join(', ');
																	}
																} catch (e) {
																	// ignore parse errors
																}
																return course.semester || '';
															})()}
														</small>
													</div>
												</div>
											</td>
											<td>{course.department}</td>
											<td>
												<div className="d-flex align-items-center">
													<img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(professorName)}&background=6366f1&color=fff`} alt="Professor" className="rounded-circle me-2" width="30" height="30" loading="lazy" />
													<span>{professorName}</span>
												</div>
											</td>
											<td>{course.credits}</td>
											<td>
												<div className="d-flex align-items-center">
													<span>{studentsCount}</span>
													<div className="progress ms-2" style={{ width: 60, height: 6 }}>
														<div className={`progress-bar bg-success`} role="progressbar" style={{ width: `${progressPct}%` }} aria-valuenow={progressPct} aria-valuemin="0" aria-valuemax="100" />
													</div>
												</div>
											</td>
											<td><span className={`badge ${statusClass}`}>{course.courseStatus || 'N/A'}</span></td>
											<td>
												<div className="dropdown">
													<button className="btn btn-sm btn-light" data-bs-toggle="dropdown">
														<i className="bi bi-three-dots-vertical" />
													</button>
													<ul className="dropdown-menu">
														<li><button className="dropdown-item" onClick={() => handleViewCourse(course)}><i className="bi bi-eye me-2" /> View</button></li>
														<li><button className="dropdown-item" onClick={() => navigate(`/edit-course/${course.id}`)}><i className="bi bi-pencil me-2" /> Edit</button></li>
														{/* <li><a className="dropdown-item" href="#"><i className="bi bi-people me-2" /> Students</a></li> */}
														<li><hr className="dropdown-divider" /></li>
														<li><button className="dropdown-item text-danger" type="button" onClick={() => handleDelete(course)}><i className="bi bi-trash me-2" /> Delete</button></li>
													</ul>
												</div>
											</td>
										</tr>
									);
								})
							) : (
								<tr>
									<td colSpan={8} className="text-center py-4">No courses found.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-3 gap-2">
					{/* Pagination Info */}
					<div>
						{(() => {
							const total = pagination?.total ?? (courses ? courses.length : 0);
							const offset = (currentPage - 1) * limit;
							const start = total === 0 ? 0 : offset + 1;
							const end = Math.min(offset + (courses ? courses.length : 0), total);
							return <p className="text-muted mb-0">Showing {start} to {end} of {total} entries</p>;
						})()}
					</div>
					{/* Pagination Links */}
					<nav aria-label="Page navigation">
						{/* Pagination component uses a smaller size on mobile by default */}
						<ul className="pagination pagination-sm mb-0">
							{(() => {
								const total = pagination?.total ?? (courses ? courses.length : 0);
								const totalPages = Math.max(1, Math.ceil(total / limit));
								const pages = [];
								// Simplified page display for mobile (e.g., show only a few pages around the current one)
								const startPage = Math.max(1, currentPage - 1);
								const endPage = Math.min(totalPages, currentPage + 1);

								for (let p = startPage; p <= endPage; p++) pages.push(p);

								const goto = (p) => (e) => {
									e.preventDefault();
									if (p < 1 || p > totalPages) return;
									setCurrentPage(p);
								};

								return (
									<>
										<li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
											<a className="page-link" href="#" onClick={goto(currentPage - 1)} aria-label="Previous">
												<span aria-hidden="true">&laquo;</span>
											</a>
										</li>
										{pages.map(p => (
											<li key={p} className={`page-item ${p === currentPage ? 'active' : ''}`} aria-current={p === currentPage ? 'page' : undefined}>
												<a className="page-link" href="#" onClick={goto(p)}>{p}</a>
											</li>
										))}
										<li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
											<a className="page-link" href="#" onClick={goto(currentPage + 1)} aria-label="Next">
												<span aria-hidden="true">&raquo;</span>
											</a>
										</li>
									</>
								);
							})()}
						</ul>
					</nav>
				</div>
			</div>

			{/* Course Details Modal (Remains the same, Modal components are responsive by design) */}
			{showModal && selectedCourse && (
				// ... Modal content ... (using row/col-md-4/col-md-8 makes it responsive)
				<div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<div className="modal-dialog modal-lg">
						<div className="modal-content">
							{/* ... modal header/body/footer content ... */}
							<div className="modal-header">
								<h5 className="modal-title">Course Details</h5>
								<button type="button" className="btn-close" onClick={closeModal}></button>
							</div>
							<div className="modal-body">
								{/* Use responsive columns: stacks image above details on small screens */}
								<div className="row">
									<div className="col-12 col-md-4">
										<img
											src={selectedCourse.courseImage ? (
												/^https?:\/\//i.test(selectedCourse.courseImage) || /^\/\//.test(selectedCourse.courseImage) ?
													selectedCourse.courseImage :
													selectedCourse.courseImage.startsWith('/') ?
														selectedCourse.courseImage :
														`http://localhost:5000/images/${selectedCourse.courseImage}`
											) : 'https://images.unsplash.com/photo-1522227802361-1a7a9d6f0f6b?w=200&h=200&fit=crop'}
											alt="Course"
											className="img-fluid rounded mb-3"
											style={{ width: '100%', height: '200px', objectFit: 'cover' }}
										/>
									</div>
									<div className="col-12 col-md-8">
										<h4>{selectedCourse.courseName}</h4>
										<p className="text-muted">{selectedCourse.courseCode}</p>
										<div className="row">
											<div className="col-12 col-sm-6">
												<p><strong>Department:</strong> {selectedCourse.department}</p>
												<p><strong>Professor:</strong> {selectedCourse.professorName || 'Unknown'}</p>
												<p><strong>Credits:</strong> {selectedCourse.credits}</p>
											</div>
											<div className="col-12 col-sm-6">
												<p><strong>Semester:</strong> {selectedCourse.semester}</p>
												<p><strong>Status:</strong> <span className={`badge ${selectedCourse.courseStatus?.toLowerCase() === 'active' ? 'bg-success' : selectedCourse.courseStatus?.toLowerCase() === 'inactive' ? 'bg-secondary' : 'bg-warning'}`}>{selectedCourse.courseStatus || 'N/A'}</span></p>
												<p><strong>Max Students:</strong> {selectedCourse.maxStudents || 0}</p>
											</div>
										</div>
										{selectedCourse.classDays && (
											<p><strong>Class Days:</strong> {(() => {
												try {
													const cd = selectedCourse.classDays;
													if (Array.isArray(cd)) return cd.join(', ');
													if (typeof cd === 'string') {
														const parsed = JSON.parse(cd);
														if (Array.isArray(parsed)) return parsed.join(', ');
													}
												} catch (e) { }
												return 'N/A';
											})()}</p>
										)}
										{selectedCourse.description && (
											<div>
												<strong>Description:</strong>
												<p>{selectedCourse.description}</p>
											</div>
										)}
									</div>
								</div>
							</div>
							<div className="modal-footer">
								<button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
								<button type="button" className="btn btn-primary" onClick={() => { closeModal(); navigate(`/edit-course/${selectedCourse.id}`); }}>Edit Course</button>
							</div>
						</div>
					</div>
				</div>
			)}


			{/* Course Details Modal */}
			{showModal && selectedCourse && (
				// ... Modal content ... (using row/col-md-4/col-md-8 makes it responsive)
				<div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
					<div className="modal-dialog modal-lg">
						<div className="modal-content">
							{/* ... modal header/body/footer content ... */}
							<div className="modal-header">
								<h5 className="modal-title">Course Details</h5>
								<button type="button" className="btn-close" onClick={closeModal}></button>
							</div>
							<div className="modal-body">
								{/* Use responsive columns: stacks image above details on small screens */}
								<div className="row">
									<div className="col-12 col-md-4">
										<img
											src={selectedCourse.courseImage ? (
												/^https?:\/\//i.test(selectedCourse.courseImage) || /^\/\//.test(selectedCourse.courseImage) ?
													selectedCourse.courseImage :
													selectedCourse.courseImage.startsWith('/') ?
														selectedCourse.courseImage :
														`http://localhost:5000/images/${selectedCourse.courseImage}`
											) : 'https://images.unsplash.com/photo-1522227802361-1a7a9d6f0f6b?w=200&h=200&fit=crop'}
											alt="Course"
											className="img-fluid rounded mb-3"
											style={{ width: '100%', height: '200px', objectFit: 'cover' }}
										/>
									</div>
									<div className="col-12 col-md-8">
										<h4>{selectedCourse.courseName}</h4>
										<p className="text-muted">{selectedCourse.courseCode}</p>
										<div className="row">
											<div className="col-12 col-sm-6">
												<p><strong>Department:</strong> {selectedCourse.department}</p>
												<p><strong>Professor:</strong> {selectedCourse.professorName || 'Unknown'}</p>
												<p><strong>Credits:</strong> {selectedCourse.credits}</p>
											</div>
											<div className="col-12 col-sm-6">
												<p><strong>Semester:</strong> {selectedCourse.semester}</p>
												<p><strong>Status:</strong> <span className={`badge ${selectedCourse.courseStatus?.toLowerCase() === 'active' ? 'bg-success' : selectedCourse.courseStatus?.toLowerCase() === 'inactive' ? 'bg-secondary' : 'bg-warning'}`}>{selectedCourse.courseStatus || 'N/A'}</span></p>
												<p><strong>Max Students:</strong> {selectedCourse.maxStudents || 0}</p>
											</div>
										</div>
										{selectedCourse.classDays && (
											<p><strong>Class Days:</strong> {(() => {
												try {
													const cd = selectedCourse.classDays;
													if (Array.isArray(cd)) return cd.join(', ');
													if (typeof cd === 'string') {
														const parsed = JSON.parse(cd);
														if (Array.isArray(parsed)) return parsed.join(', ');
													}
												} catch (e) { }
												return 'N/A';
											})()}</p>
										)}
										{selectedCourse.description && (
											<div>
												<strong>Description:</strong>
												<p>{selectedCourse.description}</p>
											</div>
										)}
									</div>
								</div>
							</div>
							<div className="modal-footer">
								<button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
								<button type="button" className="btn btn-primary" onClick={() => { closeModal(); navigate(`/edit-course/${selectedCourse.id}`); }}>Edit Course</button>
							</div>
						</div>
					</div>
				</div>
			)}

		{/* Delete Confirmation Modal */}
		{showDeleteModal && courseToDelete && (
			<div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
				<div className="modal-dialog modal-md modal-dialog-centered">
					<div className="modal-content">
						<div className="modal-header bg-danger">
							<h5 className="modal-title text-white"><i className="bi bi-exclamation-triangle-fill me-2"></i>Confirm Delete</h5>
							<button type="button" className="btn-close btn-close-white" onClick={cancelDelete}></button>
						</div>
						<div className="modal-body">
							<p className="text-center">Are you sure you want to delete the course <strong>{courseToDelete.courseName || courseToDelete.courseCode}</strong>?</p>
							<p className="text-muted small text-center mb-0"><i className="bi bi-info-circle me-1"></i>This action cannot be undone.</p>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-secondary" onClick={cancelDelete}><i className="bi bi-x-circle me-2"></i>Cancel</button>
							<button type="button" className="btn btn-danger" onClick={confirmDelete}><i className="bi bi-trash me-2"></i>Delete</button>
						</div>
					</div>
				</div>
			</div>
		)}			<style>{`
				/* Scoped table borders for All Courses table */
				.dashboard-card .table {
					width: 100%;
					border-collapse: collapse;
					min-width: 900px;
					border: 1px solid #e6e6e6;
				}

				.dashboard-card .table th {
					background: #f9f9f9;
					padding: 12px;
					text-align: left;
					font-weight: 700;
					border: 1px solid #e6e6e6;
					color: #333;
				}

				.dashboard-card .table td {
					padding: 12px;
					border: 1px solid #e6e6e6;
				}
			`}</style>
		</div>
	);
};

export default AllCourse;
