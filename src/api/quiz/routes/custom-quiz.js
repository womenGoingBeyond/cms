module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/quizzes/:id/questions',
      handler: 'quiz.findManyQuestions',
    },
    {
      method: 'GET',
      path: '/quizzes/:id/progress',
      handler: 'quiz.getProgress',
    },
    {
      method: 'GET',
      path: '/quizzes/:quizId/questions/:questionId',
      handler: 'quiz.findOneQuestion'
    },
    {
      method: 'POST',
      path: '/quizzes/:quizId/questions/:questionId/validate',
      handler: 'quiz.validateSolution'
    }
  ],
}
