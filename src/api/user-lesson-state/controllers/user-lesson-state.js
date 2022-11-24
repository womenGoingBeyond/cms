'use strict';

/**
 *  user-lesson-state controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::user-lesson-state.user-lesson-state', ({ strapi }) => ({
    async getAllLessonStatesByUserIdAndCourseId(ctx) {
     
      const response = await strapi.db.query('api::user-lesson-state.user-lesson-state').findMany({
        where: {
            lesson: {
                course: ctx.params.courseId,
            },
            users_permissions_user: ctx.state.user.id
        }
    });

    return {
        data: response
    }
    },
  }))