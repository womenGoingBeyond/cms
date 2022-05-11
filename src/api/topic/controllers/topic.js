'use strict'

/**
 *  topic controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::topic.topic', ({ strapi }) => ({
  async markTopicAsCompleted(ctx) {
    // check if entry already exists
    let entry = await strapi.entityService.findMany('api::user-topic-state.user-topic-state', {
      filters: {
        $and: [
          { users_permissions_user: ctx.state.user.id },
          { topic: ctx.params.id }
        ]
      },
      limit: 1
    })

    let response = null
    if (entry.length > 0) {
      response = await strapi.entityService.update('api::user-topic-state.user-topic-state', entry[0].id, {
        data: {
          done: true
        }
      })
    } else {
      response = await strapi.entityService.create('api::user-topic-state.user-topic-state', {
        data: {
          users_permissions_user: ctx.state.user.id,
          topic: ctx.params.id,
          done: true
        }
      })
    }

    return {
      data: response
    }
  },

  async getStatus(ctx) {
    let response = await strapi.entityService.findMany('api::user-topic-state.user-topic-state', {
      filters: {
        $and: [
          { users_permissions_user: ctx.state.user.id },
          { topic: ctx.params.id }
        ]
      },
      populate: {
        topic: {
          fields: ['id']
        }
      },
      limit: 1
    })

    return {
      data: response[0]
    }
  }
}))
