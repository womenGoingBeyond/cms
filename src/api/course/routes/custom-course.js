module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/course/:id/register',
      handler: 'course.register',
    },
  ],
}
