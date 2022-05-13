module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/courses/:id/register',
      handler: 'course.register',
    },
    {
      method: 'GET',
      path: '/courses/:id/meta',
      handler: 'course.getMetadata'
    }
  ],
}
