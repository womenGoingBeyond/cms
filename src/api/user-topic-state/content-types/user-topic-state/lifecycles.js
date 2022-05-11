module.exports = {
  async afterUpdate(event) {
    let topicState = await strapi.entityService.findOne('api::user-topic-state.user-topic-state', event.result.id, {
      populate: {
        topic: {
          fields: ['id']
        },
        users_permissions_user: {
          fields: ['id']
        }
      }
    })
    await setLessonState({ topicId: topicState.topic.id, userId: topicState.users_permissions_user.id })
  },

  async afterCreate(event) {
    await setLessonState({ topicId: +event.params.data.topic, userId: event.params.data.users_permissions_user })
  }
}


async function setLessonState({ topicId, userId }) {
  let allCourseSteps = 0, completedCourseSteps = 0

  let topic = await strapi.entityService.findOne('api::topic.topic', topicId, {
    populate: {
      lesson: {
        fields: ['id']
      }
    }
  })

  let lesson = await strapi.entityService.findOne('api::lesson.lesson', topic.lesson.id, {
    populate: {
      course: {
        fields: ['id']
      },
      topics: {
        fields: ['id']
      },
      quizzes: {
        fields: ['id'],
        populate: {
          questions: {
            fields: ['id']
          }
        }
      }
    }
  })

  let allQuestionIds = []
  for (let q of lesson.quizzes) {
    for (let question of q.questions) {
      allQuestionIds.push(question.id)
    }
  }
  allCourseSteps = allQuestionIds.length

  let questionStates = (await Promise.all(allQuestionIds.map(questionId => {
    return strapi.entityService.findMany('api::user-question-state.user-question-state', {
      filters: {
        $and: [
          { users_permissions_user: userId },
          { question: questionId }
        ]
      },
      fields: ['id', 'state'],
      limit: 1
    })
  }))).flat()

  let allQuizzesDone = []
  for (let questionState of questionStates) {
    allQuizzesDone.push(questionState.state)
    if (questionState.state) {
      completedCourseSteps++
    }
  }

  let topicStates = await Promise.all(lesson.topics.map(topic => {
    return strapi.entityService.findMany('api::user-topic-state.user-topic-state', {
      filters: {
        $and: [
          { users_permissions_user: userId },
          { topic: topic.id }
        ]
      },
      limit: 1
    })
  }))

  allCourseSteps += topicStates.length
  let allTopicsDone = []
  for (let state of topicStates) {
    allTopicsDone.push(state.length > 0 && state[0].done)
    if (state.length > 0 && state[0].done) {
      completedCourseSteps++
    }
  }

  // check if entry already exists
  let entry = await strapi.entityService.findMany('api::user-lesson-state.user-lesson-state', {
    filters: {
      $and: [
        { users_permissions_user: userId },
        { lesson: lesson.id }
      ]
    },
    limit: 1
  })

  if (entry.length > 0) {
    await strapi.entityService.update('api::user-lesson-state.user-lesson-state', entry[0].id, {
      data: {
        done: allTopicsDone.every(Boolean) && allQuizzesDone.every(Boolean)
      }
    })
  } else {
    await strapi.entityService.create('api::user-lesson-state.user-lesson-state', {
      data: {
        users_permissions_user: userId,
        lesson: lesson.id,
        done: allTopicsDone && allQuizzesDone
      }
    })
  }

  let courseProgress = await strapi.entityService.findMany('api::user-course-progress.user-course-progress', {
    filters: {
      $and: [
        { users_permissions_user: userId },
        { course: lesson.course.id }
      ]
    },
    limit: 1
  })

  await strapi.entityService.update('api::user-course-progress.user-course-progress', courseProgress[0].id, {
    data: {
      progress: completedCourseSteps / allCourseSteps
    }
  })
}
