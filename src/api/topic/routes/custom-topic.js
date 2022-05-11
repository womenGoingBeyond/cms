module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/topics/:id/complete',
      handler: 'topic.markTopicAsCompleted',
    },
    {
      method: 'GET',
      path: '/topics/:id/status',
      handler: 'topic.getStatus'
    }
  ]
}
