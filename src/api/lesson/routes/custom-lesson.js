module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/lessons/:id/quizzes',
      handler: 'lesson.getQuizzes',
    },
    {
      method: 'GET',
      path: '/lessons/:courseId/allLessons',
      handler: 'lesson.getAllLessonsByCourseId',
    }
  ],
}
