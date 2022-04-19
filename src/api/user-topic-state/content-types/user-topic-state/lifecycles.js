module.exports = {
  async afterUpdate(event) {
    if (event.params.data.done) {
      let userTopicState = await strapi.entityService.findOne('api::user-topic-state.user-topic-state', event.result.id, {
        populate: {
          topic: true,
          users_permissions_user: true
        }
      })

      let course = await strapi.entityService.findMany('api::course.course', {
        filters: {
          lessons: {
            topics: {
              id: userTopicState.topic.id
            }
          }
        },
        populate: {
          lessons: {
            populate: {
              topics: true
            }
          }
        },
        limit: 1
      })

      let completeTopics = await strapi.entityService.count('api::user-topic-state.user-topic-state', {
        filters: {
          $and: [
            { users_permissions_user: userTopicState.users_permissions_user.id },
            { done: true }
          ]
        },
        populate: {
          users_permissions_user: true
        }
      })

      let userCourseProgress = await strapi.entityService.findMany('api::user-course-progress.user-course-progress', {
        filters: {
          $and: [
            { users_permissions_user: userTopicState.users_permissions_user.id },
            { course: course[0].id }
          ]
        },
        populate: {
          users_permissions_user: true,
          course: true
        },
        limit: 1
      })

      let topicIds = []
      for (let lesson of course[0].lessons) {
        for (let topic of lesson.topics) {
          topicIds.push(topic.id)
        }
      }

      strapi.entityService.update('api::user-course-progress.user-course-progress', userCourseProgress[0].id, {
        data: {
          progress: parseFloat((completeTopics / topicIds.length).toFixed(2))
        }
      }).catch(console.error)
    }
  }
}
