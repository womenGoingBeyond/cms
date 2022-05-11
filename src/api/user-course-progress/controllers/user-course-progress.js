'use strict'

/**
 *  user-course-progress controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::user-course-progress.user-course-progress', ({ strapi }) => ({
  async findByUserIdAndCourseId(ctx) {
    let entry = await strapi.entityService.findMany('api::user-course-progress.user-course-progress', {
      filters: {
        $and: [
          { users_permissions_user: ctx.state.user.id },
          { course: ctx.params.courseId }
        ]
      },
      limit: 1
    })

    return {
      data: entry
    }
  }
}))
