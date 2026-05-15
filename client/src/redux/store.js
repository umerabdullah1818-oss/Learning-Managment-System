import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import studentReducer from './slices/studentSlice';
import professorReducer from './slices/professorSlice';
import courseReducer from './slices/courseSlice';
import assetsReducer from './slices/assetsSlice';
import departmentReducer from './slices/departmentSlice';
import enrollmentReducer from './slices/enrollmentSlice';
import assignmentReducer from './slices/assignmentSlice';
import gradingWeightsReducer from './slices/gradingWeightsSlice';
import gradesReducer from './slices/gradesSlice';
import studentCourseGradesReducer from './slices/studentCourseGradesSlice';
import allCoursesGradesReducer from './slices/allCoursesGradesSlice';
import coursesReducer from './slices/coursesSlice';
import enrolledStudentsReducer from './slices/enrolledStudentsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    student: studentReducer,
    professor: professorReducer,
    course: courseReducer,
    assets: assetsReducer,
    department: departmentReducer,
    enrollment: enrollmentReducer,
    assignment: assignmentReducer,
    gradingWeights: gradingWeightsReducer,
    grades: gradesReducer,
    studentCourseGrades: studentCourseGradesReducer,
    allCoursesGrades: allCoursesGradesReducer,
    courses: coursesReducer,
    enrolledStudents: enrolledStudentsReducer,
  },
});

export default store;
