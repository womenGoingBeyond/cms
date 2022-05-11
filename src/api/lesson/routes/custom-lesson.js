module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/lessons/:id/quizzes',
      handler: 'lesson.getQuizzes',
    }
  ],
}
