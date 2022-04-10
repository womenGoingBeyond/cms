'use strict'

/**
 *  course controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::course.course', ({ strapi }) => ({
  async register(ctx) {
    let course = await strapi.entityService.findOne('api::course.course', ctx.params.id, {
      populate: {
        users: true,
        lessons: {
          populate: {
            topics: true
          }
        }
      }
    })

    let ids = course.users.map(user => user.id)
    if (ids.includes(ctx.state.user.id)) {
      return ctx.send({
        data: null,
        error: {
          status: 409,
          name: 'ConflictError',
          message: 'Entry exists already',
          details: {}
        }
      }, 409)
    }

    await strapi.entityService.update('api::course.course', ctx.params.id, {
      data: {
        users: [...ids, ctx.state.user.id],
      },
      populate: {
        users: true,
      }
    })

    let topicIds = []
    for (let lesson of course.lessons) {
      for (let topic of lesson.topics) {
        topicIds.push(topic.id)
      }
    }

    if (topicIds.length > 0) {
      Promise.allSettled(
        topicIds.map(topicId => {
          strapi.entityService.create('api::user-topic-state.user-topic-state', {
            data: {
              done: false,
              users_permissions_user: ctx.state.user.id,
              topic: topicId
            },
            populate: {
              users_permissions_user: true,
              topic: true
            }
          })
        })
      ).then(values => {
        for (const value of values) {
          if (value.status === 'rejected') {
            return ctx.send({
              data: null,
              error: {
                status: 500,
                name: 'InternalServerError',
                message: 'Some entries could not be created',
                details: {}
              }
            }, 500)
          }
        }
      }).catch(console.error)
    }

    await strapi.entityService.create('api::user-course-progress.user-course-progress', {
      data: {
        progress: 0,
        users_permissions_user: ctx.state.user.id,
        course: ctx.params.id
      },
      populate: {
        users_permissions_user: true,
        course: true
      }
    })

    ctx.send({
      data: {
        message: 'User registered successfully'
      },
    }, 201)
  }
}))
