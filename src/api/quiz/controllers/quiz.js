'use strict'

/**
 *  quiz controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::quiz.quiz', ({ strapi }) => ({
  async findOne(ctx) {
    let { data, meta } = await super.findOne(ctx)

    // Remove private field State from answer attribute of a quiz response
    if (data.attributes.answers && data.attributes.answers.length > 0) {
      for (let answer of data.attributes.answers) {
        // Check for private field State in an answer. It could be fixed later by strapi team.
        if ('State' in answer) delete answer['State']
      }
    }
    delete data.attributes.lesson

    return { data, meta }
  }
}))
