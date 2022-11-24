module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/user-lesson-states/:courseId',
      handler: 'user-lesson-state.getAllLessonStatesByUserIdAndCourseId',
      auth: {
        scope: ['find']
      }
    },
  ],
}
