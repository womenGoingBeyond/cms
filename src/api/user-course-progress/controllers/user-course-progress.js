'use strict'

/**
 *  user-course-progress controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::user-course-progress.user-course-progress', ({ strapi }) => ({
  async findByUserIdAndCourseId(ctx) {
    let entry = await strapi.entityService.findMany('api::user-course-progress.user-course-progress', {
      populate: {
        filters: {
          $and: [
            {
              user: {
                filters: {
                  id: ctx.state.user.id
                }
              }
            },
            {
              course: {
                filters: {
                  id: ctx.params.courseId
                }
              }
            }
          ]
        }
      },
      limit: 1
    })

    ctx.send({
      data: {
        progress: entry[0].progress
      }
    }, 200)
  }
}))
