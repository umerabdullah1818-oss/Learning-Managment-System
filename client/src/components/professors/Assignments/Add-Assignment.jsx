import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  fetchAssignmentById,
  updateAssignment,
  createAssignment,
  clearError,
  clearSuccess
} from '../../../redux/slices/assignmentSlice';
import { fetchCoursesByProfessor } from '../../../redux/slices/courseSlice';
import '../../../css/dashboard.css';

const AddAssignment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, success } = useSelector((state) => state.assignment);
  const { courses = [], loading: courseLoading } = useSelector((state) => state.course);
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    status: 'Pending',
    courseId: '',
    assignmentFile: null,
  });

  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('id');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user?.uuid) {
      dispatch(fetchCoursesByProfessor(user.uuid));
    }
    if (assignmentId) {
      setIsEditing(true);
      dispatch(fetchAssignmentById(assignmentId)).unwrap().then((res) => {
        const data = res.data || res;
        if (data) {
          setFormData(prev => ({
            ...prev,
            title: data.title || '',
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0,16) : '',
            status: data.status || 'Pending',
            courseId: String(data.courseId || data.course_id || ''),
          }));
          if (data.filePath) setFilePreview(data.filePath);
        }
      }).catch(() => {});
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (success) {
      toast.success(isEditing ? 'Assignment updated successfully!' : 'Assignment created successfully!');
      navigate('/professor/assignments');
      dispatch(clearSuccess());
    }
  }, [success, navigate, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF and Word files are allowed!');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB!');
      return;
    }
    setFormData(prev => ({ ...prev, assignmentFile: file }));
    setFilePreview(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Assignment title is required');
    if (!formData.dueDate) return toast.error('Due date is required');
    if (!formData.courseId) return toast.error('Please select a course');

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('dueDate', formData.dueDate);
    formDataToSend.append('status', formData.status);
    formDataToSend.append('courseId', formData.courseId);
    if (formData.assignmentFile) formDataToSend.append('assignmentFile', formData.assignmentFile);

    try {
      if (isEditing && assignmentId) {
        await dispatch(updateAssignment({ id: assignmentId, assignmentData: formDataToSend })).unwrap();
      } else {
        await dispatch(createAssignment(formDataToSend)).unwrap();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create/update assignment');
    }
  };

  const handleReset = () => {
    setFormData({ title: '', dueDate: '', status: 'Pending', courseId: '', assignmentFile: null });
    setFilePreview(null);
  };

  return (
    <div className="add-assignment-container">
      <div className="form-wrapper">
        <div className="form-header">
          <h2 className="form-title">{isEditing ? 'Edit Assignment' : 'Add Assignment'}</h2>
          <button type="button" className="close-btn" onClick={() => navigate('/professor/assignments')} title="Close">×</button>
        </div>
        <p className="form-subtitle">{isEditing ? 'Update assignment details' : 'Create a new assignment for your students'}</p>

        <form onSubmit={handleSubmit} className="assignment-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">Assignment Title *</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter assignment title" className="form-input" required />
          </div>

          <div className="form-group">
            <label htmlFor="dueDate" className="form-label">Due Date *</label>
            <input type="datetime-local" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="form-input" required />
          </div>

          <div className="form-group">
            <label htmlFor="courseId" className="form-label">
              Select Course * {courseLoading && <span className="loading-text">(Loading...)</span>}
            </label>
            <select id="courseId" name="courseId" value={formData.courseId} onChange={handleInputChange} className="form-input" disabled={courseLoading} required>
              <option value="">-- Select a course --</option>
              {courses.length > 0 ? courses.map(course => (
                <option key={course.uuid} value={course.id || course.uuid}>{course.courseCode} - {course.courseName}</option>
              )) : <option value="" disabled>{courseLoading ? 'Loading courses...' : 'No courses available'}</option>}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status" className="form-label">Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="form-input">
              <option value="Pending">Pending</option>
              <option value="Submitted">Submitted</option>
              <option value="Late">Late</option>
              <option value="Graded">Graded</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="assignmentFile" className="form-label">Upload Assignment File (Optional)</label>
            <div className="file-input-wrapper" role="button" tabIndex={0} onClick={() => fileInputRef.current && fileInputRef.current.click()} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current && fileInputRef.current.click()}>
              <input ref={fileInputRef} type="file" id="assignmentFile" name="assignmentFile" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="file-input" />
              <span className="file-input-label">{filePreview ? `Selected: ${filePreview}` : 'Choose PDF or Word file'}</span>
            </div>
            <small className="form-helper">Allowed formats: PDF, Word (.doc, .docx) - Max size: 10MB</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Assignment' : 'Create Assignment')}</button>
            <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={loading}>Reset</button>
          </div>
        </form>
      </div>

      <style>{`
        .add-assignment-container { padding: 20px; background-color: #f5f5f5; min-height: 100vh; }
        .form-wrapper { background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px; max-width: 600px; margin: 0 auto; }
        .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; position: relative; }
        .close-btn { background: transparent; border: none; font-size: 28px; cursor: pointer; color: #666; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: all 0.2s; }
        .close-btn:hover { color: #333; background-color: #f0f0f0; }
        .form-title { font-size: 24px; font-weight: 600; color: #333; margin-bottom: 10px; }
        .form-subtitle { font-size: 14px; color: #666; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; display: flex; flex-direction: column; }
        .form-label { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 8px; }
        .form-input, .file-input { padding: 10px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; transition: border-color 0.3s; }
        .form-input:focus, .file-input:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 3px rgba(0,123,255,0.1); }
        .file-input-wrapper { position: relative; display: flex; align-items: center; border: 2px dashed #ddd; border-radius: 4px; padding: 10px; background-color: #fafafa; cursor: pointer; transition: all 0.3s; }
        .file-input-wrapper:hover { border-color: #007bff; background-color: #f0f8ff; }
        .file-input { display: none; }
        .file-input-label { flex: 1; font-size: 14px; color: #666; user-select: none; pointer-events: none; }
        .form-helper { font-size: 12px; color: #999; margin-top: 5px; }
        .form-actions { display: flex; gap: 10px; margin-top: 30px; justify-content: center; flex-wrap: wrap; }
        .btn { padding: 10px 20px; border: none; border-radius: 4px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s; min-width: 120px; }
        .btn-primary { background-color: #007bff; color: white; }
        .btn-primary:hover:not(:disabled) { background-color: #0056b3; box-shadow: 0 2px 5px rgba(0,86,179,0.3); }
        .btn-secondary { background-color: #6c757d; color: white; }
        .btn-secondary:hover:not(:disabled) { background-color: #545b62; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Responsive for mobile devices */
        @media (max-width: 600px) {
          .form-wrapper { padding: 20px; margin: 10px; }
          .form-title { font-size: 20px; }
          .form-subtitle { font-size: 12px; margin-bottom: 20px; }
          .form-actions { flex-direction: column; gap: 10px; }
          .btn { width: 100%; min-width: auto; }
        }
      `}</style>
    </div>
  );
};

export default AddAssignment;
