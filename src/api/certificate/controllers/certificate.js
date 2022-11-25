'use strict';

/**
 *  certificate controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::certificate.certificate', ({ strapi }) => ({

    async getAllNestedInformation(ctx) {
  
      const response = await strapi.db.query('api::certificate.certificate').findMany({
        where: {
            users_permissions_user: ctx.state.user.id ,
        },
            populate: {
                users_permissions_user: {
                    populate: true
                },
                course: {
                    populate: true
                }
            }
    });
    
    return {
        data: response
    }
    },
  }))