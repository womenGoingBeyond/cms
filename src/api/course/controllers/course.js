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

    let topicIds = [], lessonIds = []
    for (let lesson of course.lessons) {
      lessonIds.push(lesson.id)
      for (let topic of lesson.topics) {
        topicIds.push(topic.id)
      }
    }

    if (lessonIds.length > 0) {
      Promise.allSettled(lessonIds.map((lessonId) => {
        strapi.entityService.create('api::user-lesson-state.user-lesson-state', {
          data: {
            done: false,
            users_permissions_user: ctx.state.user.id,
            lesson: lessonId
          },
          populate: {
            users_permissions_user: true,
            lesson: true
          }
        })
      }))
        .then(values => {
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
        })
        .catch(console.error)
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
  },

  async getMetadata(ctx) {
    try {
      let course = await strapi.entityService.findOne('api::course.course', ctx.params.id, {
        fields: ['id'],
        populate: {
          lessons: {
            fields: ['id'],
            populate: {
              Content: {
                populate: {
                  Content: {
                    fields: ['id']
                  },
                  Media: {
                    fields: ['url']
                  }
                }
              },

              topics: {
                fields: ['id'],
                populate: {
                  Content: {
                    populate: {
                      Content: {
                        fields: ['id']
                      },
                      Media: {
                        fields: ['url']
                      }
                    }
                  }
                }
              }
            }
          },
          Content: {
            populate: {
              Media: {
                fields: ['url']
              }
            }
          }
        }
      })

      const requests = []
      requests.push(course.Content[0].URL ? course.Content[0].URL : course.Content[0].Media.url)
      requests.push(`/api/courses/${ctx.params.id}?populate[Content][populate][Media][fields][0]=url&populate[lessons][fields][0]=id&populate[lessons][fields][1]=title`)
      requests.push(`/api/user-course-progresses?filters[$and][0][users_permissions_user][id][$eq]=${ctx.state.user.id}&filters[$and][1][course][id][$eq]=${ctx.params.id}`)

      for (const lesson of course.lessons) {
        requests.push(`/api/lessons/${lesson.id}?populate[Content][populate][Media][fields][0]=url`)
        requests.push(`/api/lessons/${lesson.id}?fields[0]=Title&fields[1]=Description&populate[Content][populate][Media][fields][0]=url&populate[topics][fields][0]=id&populate[topics][fields][0]=Title`)
        requests.push(`/api/user-lesson-states?filters[$and][0][users_permissions_user][id][$eq]=${ctx.state.user.id}&filters[$and][1][lesson][id][$eq]=${lesson.id}`)

        // get the media url from Content dynamicZone element
        for (const content of lesson.Content) {
          // check for descriptive media in lesson
          if (content.__component.includes('media')) {
            if (content.URL) requests.push(content.URL)
            else requests.push(content.Media.url)
          }
        }

        for (const topic of lesson.topics) {
          requests.push(`/api/topics/${topic.id}?populate[Content][populate][Media][fields][0]=url`)
          requests.push(`/api/user-topic-states?filters[$and][0][users_permissions_user][id][$eq]=${ctx.state.user.id}&filters[$and][1][topic][id][$eq]=${topic.id}`)

          // get the media url from Content dynamicZone element
          for (const content of topic.Content) {
            if (content.__component.includes('media')) {
              if (content.URL) requests.push(content.URL)
              else requests.push(content.Media.url)
            }
          }
        }
      }

      ctx.send({
        data: {
          requests: requests
        }
      }, 200)
    } catch (e) {
      return ctx.send({
        data: null,
        error: {
          status: 500,
          name: 'InternalServerError',
          message: e.message,
          details: {}
        }
      }, 500)
    }
  }
}))
