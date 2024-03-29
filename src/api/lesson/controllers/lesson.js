'use strict'

/**
 *  lesson controller
 */

const { createCoreController } = require('@strapi/strapi').factories

module.exports = createCoreController('api::lesson.lesson', ({ strapi }) => ({
  async getQuizzes(ctx) {
    let response = await strapi.entityService.findOne('api::lesson.lesson', ctx.params.id, {
      fields: ['id'],
      populate: {
        quizzes: {
          fields: ['id', 'title'],
          populate: {
            questions: {
              fields: ['id']
            }
          }
        }
      }
    })

    return {
      data: response.quizzes
    }
  },
  async getAllLessonsByCourseId(ctx) {

    const response = await strapi.db.query('api::lesson.lesson').findMany({
      where: {
          course: ctx.params.courseId
      }
  });
  
  return {
      data: response
  }
  },
}))
