module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/user-course-progresses/:courseId',
      handler: 'user-course-progress.findByUserIdAndCourseId',
    },
  ],
}
