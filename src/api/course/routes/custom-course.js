module.exports = {
  routes: [
    {
      method: 'PUT',
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
